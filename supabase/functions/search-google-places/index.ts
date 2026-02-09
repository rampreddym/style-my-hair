import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Search query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    
    if (!apiKey) {
      // Return mock results when API key is not configured
      console.log("Google Places API key not configured, returning mock results");
      return new Response(
        JSON.stringify({
          results: [
            {
              place_id: "mock_place_1",
              name: `${query} - Sample Salon`,
              formatted_address: "123 Main Street, City, State 12345",
              rating: 4.5,
              user_ratings_total: 42,
            },
            {
              place_id: "mock_place_2",
              name: `${query} Beauty Studio`,
              formatted_address: "456 Oak Avenue, City, State 12345",
              rating: 4.8,
              user_ratings_total: 128,
            },
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Search for places using Google Places API
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query + " salon OR barbershop OR hair"
    )}&type=hair_care|beauty_salon|barber&key=${apiKey}`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", data);
      throw new Error(data.error_message || "Google Places API error");
    }

    const results = (data.results || []).slice(0, 5).map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
    }));

    return new Response(
      JSON.stringify({ results }),
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
