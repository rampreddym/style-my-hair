import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { adminClient, corsHeaders, errorResponse, json, requireUser, HttpError } from "../_shared/payments.ts";

// Marks an appointment as paid only after Stripe confirms the charge.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await requireUser(req);
    const { appointmentId } = await req.json();
    if (typeof appointmentId !== "string") throw new HttpError(400, "Invalid appointment");

    const admin = adminClient();
    const { data } = await admin
      .from("appointments")
      .select("id, payment_status, stripe_payment_intent_id, customer:customers!inner(user_id)")
      .eq("id", appointmentId)
      .maybeSingle();
    // deno-lint-ignore no-explicit-any
    if (!data || (data as any).customer?.user_id !== user.id) throw new HttpError(404, "Appointment not found");
    if (data.payment_status === "paid") return json({ paid: true });

    const ref = data.stripe_payment_intent_id;
    if (!ref) return json({ paid: false });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    let paid = false;
    if (ref.startsWith("pi_")) {
      const pi = await stripe.paymentIntents.retrieve(ref);
      paid = pi.status === "succeeded" && pi.metadata?.appointment_id === appointmentId;
    } else if (ref.startsWith("cs_")) {
      const s = await stripe.checkout.sessions.retrieve(ref);
      paid = s.payment_status === "paid" && s.metadata?.appointment_id === appointmentId;
    }

    if (paid) {
      await admin.from("appointments").update({ payment_status: "paid" }).eq("id", appointmentId);
    }
    return json({ paid });
  } catch (error) {
    return errorResponse(error, "CONFIRM-PAYMENT");
  }
});
