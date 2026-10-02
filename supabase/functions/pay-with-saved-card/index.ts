import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { adminClient, corsHeaders, errorResponse, json, loadOwnedAppointment, requireUser, HttpError } from "../_shared/payments.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await requireUser(req);
    if (!user.email) throw new HttpError(400, "Account email required");
    const { appointmentId, serviceName, stylistName, paymentMethodId } = await req.json();
    if (typeof paymentMethodId !== "string" || !paymentMethodId.startsWith("pm_")) {
      throw new HttpError(400, "Invalid payment method");
    }

    const admin = adminClient();
    const { totalCents } = await loadOwnedAppointment(admin, appointmentId, user.id);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) throw new HttpError(400, "No saved payment methods found");
    const customerId = customers.data[0].id;

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.customer !== customerId) throw new HttpError(400, "Invalid payment method");

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        appointment_id: appointmentId,
        user_id: user.id,
        service_name: String(serviceName ?? "").slice(0, 200),
        stylist_name: String(stylistName ?? "").slice(0, 200),
      },
    });

    await admin.from("appointments").update({
      stripe_payment_intent_id: paymentIntent.id,
      payment_status: paymentIntent.status === "succeeded" ? "paid" : "processing",
    }).eq("id", appointmentId);

    return json({ success: paymentIntent.status === "succeeded", status: paymentIntent.status });
  } catch (error) {
    return errorResponse(error, "PAY-WITH-SAVED-CARD");
  }
});
