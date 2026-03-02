/**
 * stripe-checkout/index.ts
 * Stripe Checkout 세션 생성 — 구독 결제 시작점
 */

import { corsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseWithAuth } from "../_shared/supabase-client.ts";
import { errorResponse } from "../_shared/error.ts";
import { requireEnv } from "../_shared/env.ts";

const STRIPE_SECRET_KEY = () => requireEnv('STRIPE_SECRET_KEY');

// Stripe 가격 ID → tier 매핑 (Stripe Dashboard에서 생성 후 설정)
const TIER_PRICE_MAP: Record<string, { price_id: string; tier: string }> = {
  starter_monthly: {
    price_id: Deno.env.get('STRIPE_PRICE_STARTER_MONTHLY') || '',
    tier: 'starter',
  },
  starter_annual: {
    price_id: Deno.env.get('STRIPE_PRICE_STARTER_ANNUAL') || '',
    tier: 'starter',
  },
  growth_monthly: {
    price_id: Deno.env.get('STRIPE_PRICE_GROWTH_MONTHLY') || '',
    tier: 'growth',
  },
  growth_annual: {
    price_id: Deno.env.get('STRIPE_PRICE_GROWTH_ANNUAL') || '',
    tier: 'growth',
  },
  enterprise_monthly: {
    price_id: Deno.env.get('STRIPE_PRICE_ENTERPRISE_MONTHLY') || '',
    tier: 'enterprise',
  },
  enterprise_annual: {
    price_id: Deno.env.get('STRIPE_PRICE_ENTERPRISE_ANNUAL') || '',
    tier: 'enterprise',
  },
};

async function stripeRequest(path: string, body: Record<string, string>) {
  const params = new URLSearchParams(body);
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  return res.json();
}

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Unauthorized', 401);

    const supabase = createSupabaseWithAuth(authHeader);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse('Unauthorized', 401);

    const { plan_key, org_id, success_url, cancel_url } = await req.json();

    if (!plan_key || !org_id) {
      return errorResponse('plan_key and org_id required', 400);
    }

    const plan = TIER_PRICE_MAP[plan_key];
    if (!plan || !plan.price_id) {
      return errorResponse(`Invalid plan: ${plan_key}`, 400);
    }

    // 조직 멤버십 확인
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', org_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return errorResponse('Not a member of this organization', 403);
    }

    // 기존 Stripe customer 확인
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('org_id', org_id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    // Stripe customer 생성 (없는 경우)
    if (!customerId) {
      const customer = await stripeRequest('/customers', {
        email: user.email || '',
        'metadata[org_id]': org_id,
        'metadata[user_id]': user.id,
      });
      customerId = customer.id;
    }

    // Checkout 세션 생성
    const siteUrl = Deno.env.get('SITE_URL') || 'https://neuraltwin.io';
    const session = await stripeRequest('/checkout/sessions', {
      'customer': customerId,
      'mode': 'subscription',
      'line_items[0][price]': plan.price_id,
      'line_items[0][quantity]': '1',
      'success_url': success_url || `${siteUrl}/dashboard?checkout=success`,
      'cancel_url': cancel_url || `${siteUrl}/pricing?checkout=cancelled`,
      'subscription_data[metadata][org_id]': org_id,
      'subscription_data[metadata][tier]': plan.tier,
      'subscription_data[metadata][user_id]': user.id,
      'allow_promotion_codes': 'true',
    });

    if (session.error) {
      console.error('[stripe-checkout] Stripe error:', session.error);
      return errorResponse(session.error.message, 400);
    }

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[stripe-checkout] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
});
