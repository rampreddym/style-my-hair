import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirectUri, stylistId } = await req.json();

    if (!code || !redirectUri || !stylistId) {
      return new Response(
        JSON.stringify({ error: "code, redirectUri, and stylistId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) {
      throw new Error(`Token exchange failed: ${tokens.error_description || tokens.error}`);
    }

    const accessToken = tokens.access_token;

    // List Google Business accounts
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const accountsData = await accountsRes.json();

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No Google Business accounts found. Make sure you have a Google Business Profile." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const account = accountsData.accounts[0];
    const accountName = account.name; // e.g. "accounts/123456"

    // List locations for this account
    const locationsRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const locationsData = await locationsRes.json();

    const locations = (locationsData.locations || []).map((loc: any) => ({
      name: loc.name,
      title: loc.title,
      address: loc.storefrontAddress
        ? [
            loc.storefrontAddress.addressLines?.join(", "),
            loc.storefrontAddress.locality,
            loc.storefrontAddress.administrativeArea,
          ]
            .filter(Boolean)
            .join(", ")
        : "",
    }));

    // If there are locations, try to fetch reviews from the first one
    let reviewsImported = 0;
    if (locations.length > 0) {
      const locationName = locations[0].name;

      const reviewsRes = await fetch(
        `https://mybusiness.googleapis.com/v4/${locationName}/reviews`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const reviewsData = await reviewsRes.json();

      if (reviewsData.reviews && reviewsData.reviews.length > 0) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Create system customer for imported reviews
        const systemEmail = "google-reviews@system.internal";
        let { data: systemCustomer } = await supabase
          .from("customers")
          .select("id")
          .eq("email", systemEmail)
          .maybeSingle();

        if (!systemCustomer) {
          const { data: newCustomer } = await supabase
            .from("customers")
            .insert({ email: systemEmail, name: "Google Reviews", gender: "other" })
            .select("id")
            .single();
          systemCustomer = newCustomer;
        }

        for (const review of reviewsData.reviews) {
          const googleReviewId = `gbp_${review.reviewId || review.name}`;
          const ratingMap: Record<string, number> = {
            ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
          };
          const rating = ratingMap[review.starRating] || 5;

          const { data: existing } = await supabase
            .from("reviews")
            .select("id")
            .eq("google_review_id", googleReviewId)
            .maybeSingle();

          if (!existing && systemCustomer) {
            const { error: insertError } = await supabase.from("reviews").insert({
              stylist_id: stylistId,
              customer_id: systemCustomer.id,
              rating,
              comment: review.comment || "",
              is_google_review: true,
              google_review_id: googleReviewId,
            });

            if (!insertError) reviewsImported++;
          }
        }

        // Update stylist rating
        const { data: allReviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("stylist_id", stylistId);

        if (allReviews && allReviews.length > 0) {
          const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
          await supabase
            .from("stylists")
            .update({
              rating: Math.round(avgRating * 10) / 10,
              total_reviews: allReviews.length,
            })
            .eq("id", stylistId);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reviewsImported,
        locations,
        accountName: account.accountName || account.name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
