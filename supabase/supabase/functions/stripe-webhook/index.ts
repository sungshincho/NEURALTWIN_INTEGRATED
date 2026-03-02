/**
 * stripe-webhook/index.ts
 * Stripe Webhook 이벤트 처리 — 구독 생성/갱신/취소
 * 배포: --no-verify-jwt (Stripe에서 직접 호출)
 */

import { corsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { createSupabaseAdmin } from "../_shared/supabase-client.ts";
import { errorResponse } from "../_shared/error.ts";

const STRIPE_WEBHOOK_SECRET = () =>
  Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const STRIPE_SECRET_KEY = () =>
  Deno.env.get('STRIPE_SECRET_KEY') || '';

// ─── Stripe signature verification ───
async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const parts = signature.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.slice(2);
  const v1Sig = parts.find(p => p.startsWith('v1='))?.slice(3);

  if (!timestamp || !v1Sig) return false;

  // Tolerance check (5 minutes)
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp));
  if (age > 300) return false;

  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const computed = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === v1Sig;
}

// ─── Stripe API helper ───
async function stripeGet(path: string) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY()}` },
  });
  return res.json();
}

Deno.serve(async (req: Request): Promise<Response> => {
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const supabase = createSupabaseAdmin();

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    const webhookSecret = STRIPE_WEBHOOK_SECRET();
    if (webhookSecret) {
      const valid = await verifyStripeSignature(body, signature, webhookSecret);
      if (!valid) {
        console.error('[stripe-webhook] Invalid signature');
        return errorResponse('Invalid signature', 400);
      }
    }

    const event = JSON.parse(body);

    // Idempotency check
    const { data: existing } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('id', event.id)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log event
    await supabase.from('stripe_events').insert({
      id: event.id,
      type: event.type,
      data: event.data,
    });

    console.log(`[stripe-webhook] Processing: ${event.type}`);

    switch (event.type) {
      // ─── 구독 생성 완료 ───
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;

        const stripeSubId = session.subscription;
        const customerId = session.customer;

        // Stripe에서 구독 상세 조회
        const stripeSub = await stripeGet(`/subscriptions/${stripeSubId}`);
        const orgId = stripeSub.metadata?.org_id;
        const tier = stripeSub.metadata?.tier || 'starter';

        if (!orgId) {
          console.error('[stripe-webhook] Missing org_id in subscription metadata');
          break;
        }

        // 기존 구독 업데이트 또는 새로 생성
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('org_id', orgId)
          .single();

        if (existingSub) {
          await supabase
            .from('subscriptions')
            .update({
              tier,
              status: 'active',
              stripe_customer_id: customerId,
              stripe_subscription_id: stripeSubId,
              start_date: new Date(stripeSub.current_period_start * 1000).toISOString(),
              end_date: new Date(stripeSub.current_period_end * 1000).toISOString(),
              current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString().split('T')[0],
              current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString().split('T')[0],
              billing_cycle: stripeSub.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSub.id);
        } else {
          await supabase.from('subscriptions').insert({
            org_id: orgId,
            tier,
            status: 'active',
            plan_type: tier,
            stripe_customer_id: customerId,
            stripe_subscription_id: stripeSubId,
            subscription_type: 'LICENSE_BASED',
            start_date: new Date(stripeSub.current_period_start * 1000).toISOString(),
            end_date: new Date(stripeSub.current_period_end * 1000).toISOString(),
            billing_cycle: stripeSub.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
          });
        }

        console.log(`[stripe-webhook] Subscription activated: org=${orgId}, tier=${tier}`);
        break;
      }

      // ─── 구독 갱신 (자동 결제 성공) ───
      case 'invoice.paid': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const stripeSub = await stripeGet(`/subscriptions/${invoice.subscription}`);
        const orgId = stripeSub.metadata?.org_id;
        if (!orgId) break;

        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString().split('T')[0],
            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString().split('T')[0],
            end_date: new Date(stripeSub.current_period_end * 1000).toISOString(),
            ai_queries_used: 0,
            ai_queries_reset_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId)
          .eq('status', 'active');

        console.log(`[stripe-webhook] Subscription renewed: org=${orgId}`);
        break;
      }

      // ─── 결제 실패 ───
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const stripeSub = await stripeGet(`/subscriptions/${invoice.subscription}`);
        const orgId = stripeSub.metadata?.org_id;
        if (!orgId) break;

        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId)
          .eq('status', 'active');

        // 관리자에게 알림 생성
        await supabase.from('user_alerts').insert({
          org_id: orgId,
          alert_type: 'billing',
          severity: 'critical',
          title: '결제 실패',
          message: '구독 갱신 결제가 실패했습니다. 결제 수단을 확인해주세요.',
          action_url: '/settings/billing',
          action_label: '결제 수단 관리',
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        });

        console.log(`[stripe-webhook] Payment failed: org=${orgId}`);
        break;
      }

      // ─── 구독 취소 ───
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;

        await supabase
          .from('subscriptions')
          .update({
            tier: 'trial',
            status: 'cancelled',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId)
          .eq('stripe_subscription_id', sub.id);

        console.log(`[stripe-webhook] Subscription cancelled: org=${orgId}`);
        break;
      }

      // ─── 구독 변경 (업/다운그레이드) ───
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const orgId = sub.metadata?.org_id;
        const tier = sub.metadata?.tier;
        if (!orgId) break;

        await supabase
          .from('subscriptions')
          .update({
            tier: tier || undefined,
            status: sub.status === 'active' ? 'active' : sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString().split('T')[0],
            current_period_end: new Date(sub.current_period_end * 1000).toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          })
          .eq('org_id', orgId)
          .eq('stripe_subscription_id', sub.id);

        console.log(`[stripe-webhook] Subscription updated: org=${orgId}, tier=${tier}`);
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[stripe-webhook] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Webhook error', 500);
  }
});
