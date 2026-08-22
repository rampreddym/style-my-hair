import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BookingSmsRequest {
  appointmentId: string;
  customerPhone: string;
  customerName: string;
  stylistPhone: string;
  stylistName: string;
  serviceName: string;
  appointmentDate: string;
  price: number;
}

const sendSms = async (
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate phone number format
    if (!to || to.length < 10) {
      console.log(`Skipping SMS - invalid phone number: ${to}`);
      return { success: false, error: "Invalid phone number" };
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to.startsWith("+") ? to : `+${to}`,
          From: from,
          Body: body,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio API error:", data);
      return { success: false, error: data.message || "Failed to send SMS" };
    }

    console.log("SMS sent successfully:", data.sid);
    return { success: true };
  } catch (error: unknown) {
    console.error("Error sending SMS:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error("Missing Twilio configuration");
      return new Response(
        JSON.stringify({ success: false, error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      appointmentId,
      customerPhone,
      customerName,
      stylistPhone,
      stylistName,
      serviceName,
      appointmentDate,
      price,
    }: BookingSmsRequest = await req.json();

    const formattedDate = formatDate(appointmentDate);
    const formattedTime = formatTime(appointmentDate);
    const results = { customer: false, stylist: false, errors: [] as string[] };

    // Message for Customer
    const customerMessage = `✅ Booking Confirmed!

Hi ${customerName},

Your appointment has been scheduled:
📅 ${formattedDate}
🕐 ${formattedTime}
💇 Service: ${serviceName}
💰 Price: $${price}
👤 Stylist: ${stylistName}

We look forward to seeing you!

- Mirra Team`;

    // Message for Stylist
    const stylistMessage = `📅 New Booking Alert!

Hi ${stylistName},

You have a new appointment:
📅 ${formattedDate}
🕐 ${formattedTime}
💇 Service: ${serviceName}
💰 Price: $${price}
👤 Customer: ${customerName}

Please check your app for details.

- Mirra`;

    // Send SMS to Customer
    if (customerPhone) {
      const customerResult = await sendSms(
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_PHONE_NUMBER,
        customerPhone,
        customerMessage
      );
      results.customer = customerResult.success;
      if (!customerResult.success && customerResult.error) {
        results.errors.push(`Customer SMS: ${customerResult.error}`);
      }
    } else {
      results.errors.push("Customer SMS: No phone number provided");
    }

    // Send SMS to Stylist
    if (stylistPhone) {
      const stylistResult = await sendSms(
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_PHONE_NUMBER,
        stylistPhone,
        stylistMessage
      );
      results.stylist = stylistResult.success;
      if (!stylistResult.success && stylistResult.error) {
        results.errors.push(`Stylist SMS: ${stylistResult.error}`);
      }
    } else {
      results.errors.push("Stylist SMS: No phone number provided");
    }

    console.log("SMS notification results:", results);

    return new Response(
      JSON.stringify({
        success: results.customer || results.stylist,
        customerNotified: results.customer,
        stylistNotified: results.stylist,
        errors: results.errors.length > 0 ? results.errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-booking-sms function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
