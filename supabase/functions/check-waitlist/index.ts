import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 requests per minute per user

// In-memory rate limit store (per isolate instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Check rate limit for a user
function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  cleanupRateLimitStore();
  
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // First request or window expired - create new entry
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    // Rate limit exceeded
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: userLimit.resetTime - now 
    };
  }
  
  // Increment counter
  userLimit.count++;
  rateLimitStore.set(userId, userLimit);
  
  return { 
    allowed: true, 
    remaining: MAX_REQUESTS_PER_WINDOW - userLimit.count, 
    resetIn: userLimit.resetTime - now 
  };
}

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authentication check - require Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth token for verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the JWT token and get claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("JWT verification failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log("Authenticated user:", userId);

    // Check rate limit
    const rateLimit = checkRateLimit(userId);
    
    if (!rateLimit.allowed) {
      console.warn("Rate limit exceeded for user:", userId);
      return new Response(
        JSON.stringify({ 
          error: "Too many requests", 
          retryAfter: Math.ceil(rateLimit.resetIn / 1000) 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000))
          } 
        }
      );
    }

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

    // Use service role client for database operations (after auth verified)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authorized to trigger waitlist check
    // They must either be the stylist OR have a cancelled appointment for this service
    const { data: stylist } = await supabase
      .from("stylists")
      .select("id, user_id")
      .eq("id", stylistId)
      .single();

    const { data: customer } = await supabase
      .from("customers")
      .select("id, user_id")
      .eq("user_id", userId)
      .single();

    // Check if user is the stylist
    const isStylist = stylist?.user_id === userId;

    // Check if user is a customer with an appointment for this service
    let isAuthorizedCustomer = false;
    if (customer) {
      const { data: appointment } = await supabase
        .from("appointments")
        .select("id")
        .eq("customer_id", customer.id)
        .eq("stylist_id", stylistId)
        .eq("service_id", serviceId)
        .in("status", ["cancelled", "pending", "confirmed"])
        .limit(1)
        .single();
      
      isAuthorizedCustomer = !!appointment;
    }

    if (!isStylist && !isAuthorizedCustomer) {
      console.error("User not authorized to trigger waitlist check for this stylist/service");
      return new Response(
        JSON.stringify({ error: "Forbidden - not authorized for this action" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authorization passed:", { isStylist, isAuthorizedCustomer });
    
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
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": String(rateLimit.remaining)
          } 
        }
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

    console.log("Waitlist check completed:", { found: matchingEntries.length, notified: notifiedCount });

    return new Response(
      JSON.stringify({ 
        message: "Waitlist checked", 
        found: matchingEntries.length,
        notified: notifiedCount 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": String(rateLimit.remaining)
        } 
      }
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
