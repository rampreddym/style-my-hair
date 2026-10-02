import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const adminClient = (): SupabaseClient =>
  createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

export async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new HttpError(401, "Unauthorized");
  const client = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
  const { data, error } = await client.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error || !data.user) throw new HttpError(401, "Unauthorized");
  return data.user;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Loads an appointment and verifies it belongs to the signed-in customer. Amounts come from the database. */
export async function loadOwnedAppointment(admin: SupabaseClient, appointmentId: unknown, userId: string) {
  if (typeof appointmentId !== "string" || !UUID_RE.test(appointmentId)) {
    throw new HttpError(400, "Invalid appointment");
  }
  const { data, error } = await admin
    .from("appointments")
    .select("id, price, tip_amount, payment_status, stripe_payment_intent_id, customer:customers!inner(user_id)")
    .eq("id", appointmentId)
    .maybeSingle();
  // deno-lint-ignore no-explicit-any
  const owner = (data as any)?.customer?.user_id;
  if (error || !data || owner !== userId) throw new HttpError(404, "Appointment not found");
  if (data.payment_status === "paid") throw new HttpError(409, "Appointment is already paid");
  const price = Number(data.price) || 0;
  const tip = Math.max(0, Number(data.tip_amount) || 0);
  const totalCents = Math.round((price + tip) * 100);
  if (totalCents < 50) throw new HttpError(400, "Invalid appointment amount");
  return { appointment: data, price, tip, totalCents };
}

const ALLOWED_ORIGINS = [
  "https://mirra-hair.lovable.app",
  "https://id-preview--ab421e65-65f0-45e2-8418-14113c15faa5.lovable.app",
  "http://localhost:8080",
];

export function safeOrigin(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (/^https:\/\/[a-z0-9-]+--ab421e65-65f0-45e2-8418-14113c15faa5\.lovable\.app$/.test(origin)) return origin;
  return ALLOWED_ORIGINS[0];
}

export function errorResponse(error: unknown, tag: string) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  console.error(`[${tag}]`, error);
  return json({ error: "Payment could not be processed. Please try again." }, 500);
}
