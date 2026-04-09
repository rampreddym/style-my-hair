import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PushNotificationSchema = z.object({
  action: z.enum(['send-reminder', 'check-reminders'], {
    errorMap: () => ({ message: "Action must be 'send-reminder' or 'check-reminders'" })
  }),
  userId: z.string().uuid("Invalid user ID format").optional(),
  title: z.string().max(100, "Title too long").optional(),
  body: z.string().max(500, "Body too long").optional(),
  data: z.record(z.unknown()).optional(),
});

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}

// Rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createVapidJwt(audience: string, subject: string, privateKeyBase64: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 60 * 60, sub: subject };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;
  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey('pkcs8', privateKeyBytes, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, new TextEncoder().encode(unsignedToken));
  return `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function sendPushNotification(
  subscription: PushSubscription, payload: PushPayload,
  vapidPublicKey: string, vapidPrivateKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const jwt = await createVapidJwt(audience, 'mailto:notifications@hairsalon.app', vapidPrivateKey);
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Push failed: ${response.status}`);
      return { success: false, error: `${response.status}` };
    }
    return { success: true };
  } catch (error) {
    console.error(`Push error:`, error);
    return { success: false, error: 'Send failed' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    // Validate input
    const body = await req.json();
    const validationResult = PushNotificationSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, userId, title, body: notificationBody, data } = validationResult.data;

    // Authenticate for send-reminder (user-facing action)
    if (action === 'send-reminder') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const authenticatedUserId = claimsData.claims.sub;

      // Users can only send notifications to themselves
      if (!userId || userId !== authenticatedUserId) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rate limit
      if (!checkRateLimit(authenticatedUserId)) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (subError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch subscriptions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const payload: PushPayload = {
        title: title || 'Appointment Reminder',
        body: notificationBody || 'You have an upcoming appointment',
        icon: '/favicon.ico',
        data: data || {},
      };

      const results = await Promise.all(
        subscriptions.map(sub => sendPushNotification(sub, payload, vapidPublicKey, vapidPrivateKey))
      );

      const successCount = results.filter(r => r.success).length;
      return new Response(
        JSON.stringify({ success: true, sent: successCount, total: subscriptions.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check-reminders') {
      // This action is for cron/service-role only - verify service role key
      const authHeader = req.headers.get('Authorization');
      const isServiceRole = authHeader?.includes(supabaseServiceKey);
      
      if (!isServiceRole) {
        return new Response(
          JSON.stringify({ error: 'This action is restricted to automated jobs' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select(`
          id, appointment_date, customer_id,
          customers!appointments_customer_id_fkey(user_id, name),
          stylists!appointments_stylist_id_fkey(name, business_name),
          stylist_services!appointments_service_id_fkey(name)
        `)
        .gte('appointment_date', oneHourLater.toISOString())
        .lte('appointment_date', twoHoursLater.toISOString())
        .eq('status', 'confirmed');

      if (aptError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch appointments' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const notifications = [];
      for (const apt of appointments || []) {
        const customer = apt.customers as any;
        const stylist = apt.stylists as any;
        const service = apt.stylist_services as any;
        if (!customer?.user_id) continue;

        const aptDate = new Date(apt.appointment_date);
        const timeStr = aptDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', customer.user_id);

        if (!subs || subs.length === 0) continue;

        const payload: PushPayload = {
          title: '⏰ Appointment Reminder',
          body: `Your ${service?.name || 'appointment'} with ${stylist?.business_name || stylist?.name || 'your stylist'} is at ${timeStr}`,
          icon: '/favicon.ico',
          data: { appointmentId: apt.id },
        };

        for (const sub of subs) {
          const result = await sendPushNotification(sub, payload, vapidPublicKey, vapidPrivateKey);
          notifications.push({ appointmentId: apt.id, ...result });
        }
      }

      return new Response(
        JSON.stringify({ success: true, checked: appointments?.length || 0, notificationsSent: notifications.filter(n => n.success).length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
