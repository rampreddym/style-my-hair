import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const WaitlistCheckSchema = z.object({
  stylistId: z.string().uuid("Invalid stylist ID format"),
  serviceId: z.string().uuid("Invalid service ID format"),
  appointmentDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: "Invalid date format" }
  ),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate input
    const body = await req.json();
    const validationResult = WaitlistCheckSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { stylistId, serviceId, appointmentDate } = validationResult.data;
    
    const cancelledDate = new Date(appointmentDate);
    const dateOnly = cancelledDate.toISOString().split('T')[0];
    const timeOnly = cancelledDate.toTimeString().slice(0, 5);

    // Find matching waitlist entries
    const { data: waitlistEntries, error: waitlistError } = await supabase
      .from("waitlist")
      .select(`
        *,
        customers (id, user_id, name, email)
      `)
      .eq("stylist_id", stylistId)
      .eq("service_id", serviceId)
      .eq("status", "active")
      .eq("preferred_date", dateOnly);

    if (waitlistError) {
      throw waitlistError;
    }

    if (!waitlistEntries || waitlistEntries.length === 0) {
      return new Response(
        JSON.stringify({ message: "No waitlist entries found", notified: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter by time preference if set
    const matchingEntries = waitlistEntries.filter((entry) => {
      if (!entry.preferred_time_start || entry.preferred_time_start === "any") return true;
      if (!entry.preferred_time_end || entry.preferred_time_end === "any") return true;
      return timeOnly >= entry.preferred_time_start && timeOnly <= entry.preferred_time_end;
    });

    // Send push notifications to matching customers
    let notifiedCount = 0;
    for (const entry of matchingEntries) {
      if (!entry.customers?.user_id) continue;

      // Get push subscription
      const { data: subscription } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", entry.customers.user_id)
        .single();

      if (subscription) {
        // Call send-push-notification function
        try {
          await supabase.functions.invoke("send-push-notification", {
            body: {
              action: "send-reminder",
              userId: entry.customers.user_id,
              title: "Slot Available!",
              body: `A slot just opened up on ${dateOnly} at ${timeOnly}. Book now before it's gone!`,
            },
          });

          // Mark as notified
          await supabase
            .from("waitlist")
            .update({ notified_at: new Date().toISOString(), status: "notified" })
            .eq("id", entry.id);

          notifiedCount++;
        } catch (notifyError) {
          console.error("Error sending notification:", notifyError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Waitlist checked", 
        found: matchingEntries.length,
        notified: notifiedCount 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error checking waitlist:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
