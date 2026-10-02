import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { adminClient, corsHeaders, errorResponse, json, loadOwnedAppointment, requireUser, safeOrigin, HttpError } from "../_shared/payments.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await requireUser(req);
    if (!user.email) throw new HttpError(400, "Account email required");
    const { appointmentId, serviceName, stylistName } = await req.json();

    const admin = adminClient();
    const { price, tip } = await loadOwnedAppointment(admin, appointmentId, user.id);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;
    const origin = safeOrigin(req);
    const name = String(serviceName || "Salon service").slice(0, 200);
    const stylist = String(stylistName || "").slice(0, 200);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name, description: stylist ? `Service by ${stylist}` : undefined },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
        ...(tip > 0
          ? [{ price_data: { currency: "usd", product_data: { name: "Tip" }, unit_amount: Math.round(tip * 100) }, quantity: 1 }]
          : []),
      ],
      mode: "payment" as const,
      success_url: `${origin}/payment-success?appointment_id=${appointmentId}`,
      cancel_url: `${origin}/customer/booking`,
      metadata: { appointment_id: appointmentId, user_id: user.id },
    });

    await admin.from("appointments").update({
      stripe_payment_intent_id: session.id,
      payment_status: "processing",
    }).eq("id", appointmentId);

    return json({ url: session.url });
  } catch (error) {
    return errorResponse(error, "CREATE-PAYMENT");
  }
});
