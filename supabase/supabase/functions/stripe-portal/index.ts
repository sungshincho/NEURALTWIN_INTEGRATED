/**
 * stripe-portal/index.ts
 * Stripe Customer Portal 세션 생성 — 구독 관리 (결제 수단, 취소, 변경)
 */

import { corsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseWithAuth } from "../_shared/supabase-client.ts";
import { errorResponse } from "../_shared/error.ts";
import { requireEnv } from "../_shared/env.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Unauthorized', 401);

    const supabase = createSupabaseWithAuth(authHeader);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const { org_id, return_url } = await req.json();
    if (!org_id) return errorResponse('org_id required', 400);

    // 조직의 Stripe customer ID 조회
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('org_id', org_id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single();

    if (!sub?.stripe_customer_id) {
      return errorResponse('No active subscription found', 404);
    }

    // Stripe Customer Portal 세션 생성
    const stripeKey = requireEnv('STRIPE_SECRET_KEY');
    const siteUrl = Deno.env.get('SITE_URL') || 'https://neuraltwin.io';

    const params = new URLSearchParams({
      customer: sub.stripe_customer_id,
      return_url: return_url || `${siteUrl}/dashboard/settings`,
    });

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await res.json();

    if (session.error) {
      return errorResponse(session.error.message, 400);
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[stripe-portal] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
});
