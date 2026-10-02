import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { adminClient, corsHeaders, errorResponse, json, loadOwnedAppointment, requireUser, HttpError } from "../_shared/payments.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await requireUser(req);
    if (!user.email) throw new HttpError(400, "Account email required");
    const { appointmentId, serviceName, stylistName } = await req.json();

    const admin = adminClient();
    const { totalCents } = await loadOwnedAppointment(admin, appointmentId, user.id);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id ?? (await stripe.customers.create({ email: user.email })).id;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      customer: customerId,
      setup_future_usage: "off_session",
      metadata: {
        appointment_id: appointmentId,
        user_id: user.id,
        service_name: String(serviceName ?? "").slice(0, 200),
        stylist_name: String(stylistName ?? "").slice(0, 200),
      },
      automatic_payment_methods: { enabled: true },
    });

    await admin.from("appointments").update({
      stripe_payment_intent_id: paymentIntent.id,
      payment_status: "processing",
    }).eq("id", appointmentId);

    return json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    return errorResponse(error, "CREATE-PAYMENT-INTENT");
  }
});
