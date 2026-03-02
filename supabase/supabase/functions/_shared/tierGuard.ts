/**
 * SaaS Tier Gating Middleware
 * Edge Functions에서 기능별 티어 접근 제어
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionTier = 'trial' | 'starter' | 'growth' | 'enterprise';

export type TierFeature =
  | 'realtime_heatmap'
  | 'pos_integration'
  | 'anomaly_alerts'
  | 'digital_twin_3d'
  | 'layout_simulation'
  | 'api_connector'
  | 'ai_query';

export interface TierCheckResult {
  allowed: boolean;
  tier: SubscriptionTier;
  requiredTier?: SubscriptionTier;
  reason?: string;
}

// Feature → minimum required tier
const FEATURE_TIER_MAP: Record<TierFeature, SubscriptionTier> = {
  realtime_heatmap: 'growth',
  pos_integration: 'growth',
  anomaly_alerts: 'growth',
  digital_twin_3d: 'enterprise',
  layout_simulation: 'enterprise',
  api_connector: 'enterprise',
  ai_query: 'growth',
};

const TIER_ORDER: Record<SubscriptionTier, number> = {
  trial: 0,
  starter: 1,
  growth: 2,
  enterprise: 3,
};

/**
 * 조직의 구독 티어가 특정 기능에 접근 가능한지 확인
 */
export async function checkTierAccess(
  supabase: SupabaseClient,
  orgId: string,
  feature: TierFeature,
): Promise<TierCheckResult> {
  // DB에서 조직 티어 조회
  const { data, error } = await supabase
    .rpc('get_org_tier', { p_org_id: orgId });

  const tier: SubscriptionTier = error || !data ? 'trial' : data;
  const requiredTier = FEATURE_TIER_MAP[feature];

  if (TIER_ORDER[tier] >= TIER_ORDER[requiredTier]) {
    // AI 쿼리의 경우 사용량 체크 추가
    if (feature === 'ai_query') {
      const { data: allowed } = await supabase
        .rpc('use_ai_query', { p_org_id: orgId });
      if (!allowed) {
        return {
          allowed: false,
          tier,
          reason: '이번 달 AI 쿼리 한도에 도달했습니다. 플랜을 업그레이드하세요.',
        };
      }
    }
    return { allowed: true, tier };
  }

  return {
    allowed: false,
    tier,
    requiredTier,
    reason: `이 기능은 ${requiredTier} 플랜 이상에서 사용 가능합니다. 현재: ${tier}`,
  };
}

/**
 * 티어 접근 거부 시 403 Response 생성
 */
export function tierDeniedResponse(result: TierCheckResult): Response {
  return new Response(
    JSON.stringify({
      error: 'TIER_UPGRADE_REQUIRED',
      currentTier: result.tier,
      requiredTier: result.requiredTier,
      message: result.reason,
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
