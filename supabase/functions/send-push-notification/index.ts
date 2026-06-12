import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return new Response(JSON.stringify({ error: 'OneSignal not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { category, title, url, test } = await req.json();
    if (!category || typeof category !== 'string') {
      return new Response(JSON.stringify({ error: 'category required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: tpl, error } = await admin
      .from('notification_templates')
      .select('*')
      .eq('category', category)
      .single();

    if (error || !tpl) {
      return new Response(JSON.stringify({ error: 'template not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!tpl.enabled && !test) {
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const safeTitle = String(title ?? '');
    const headings = tpl.title.replaceAll('{title}', safeTitle);
    const contents = tpl.message.replaceAll('{title}', safeTitle);

    // Collect known player IDs from our DB (more reliable than OneSignal segments)
    const { data: subs } = await admin
      .from('profiles')
      .select('onesignal_player_id')
      .eq('push_enabled', true)
      .not('onesignal_player_id', 'is', null);

    const playerIds = Array.from(
      new Set(
        (subs ?? [])
          .map((r: any) => r.onesignal_player_id)
          .filter((id: string | null) => typeof id === 'string' && id.length > 0)
      )
    );

    const payload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: headings, fr: headings },
      contents: { en: contents, fr: contents },
    };

    if (playerIds.length > 0) {
      // OneSignal v16 expects subscription IDs (not legacy player IDs). Sending both is rejected.
      payload.include_subscription_ids = playerIds;
    } else {
      // Fallback: broadcast to OneSignal's default segment
      payload.included_segments = ['Subscribed Users', 'All'];
    }

    if (url) payload.url = url;

    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    return new Response(
      JSON.stringify({
        ok: res.ok && !body?.errors,
        status: res.status,
        targeted: playerIds.length,
        body,
      }),
      {
        status: res.ok ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
