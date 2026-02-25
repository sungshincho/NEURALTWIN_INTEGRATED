/**
 * vmdRulesetLoader.ts
 *
 * VMD 룰셋 동적 로드 및 프롬프트 주입 모듈
 *
 * Sprint 2 Task: S2-4
 * 작성일: 2026-01-12
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// ============================================================================
// 타입 정의
// ============================================================================

/** VMD 룰셋 */
export interface VMDRule {
  id: string;
  rule_code: string;
  rule_name: string;
  rule_name_ko: string;
  rule_category: VMDRuleCategory;
  description: string;
  description_ko: string;
  trigger_conditions: Record<string, any>;
  recommended_action: string;
  recommended_action_ko: string;
  expected_impact: VMDExpectedImpact;
  evidence_source: string | null;
  confidence_level: number;
  priority: number;
  is_active: boolean;
}

/** VMD 룰 카테고리 */
export type VMDRuleCategory =
  | 'traffic_flow'
  | 'product_placement'
  | 'visual_merchandising'
  | 'customer_psychology'
  | 'space_optimization';

/** 예상 효과 */
export interface VMDExpectedImpact {
  sales_lift?: number;
  traffic_increase?: number;
  conversion_lift?: number;
  dwell_time_increase?: number;
  visibility_increase?: number;
  basket_size_increase?: number;
  [key: string]: number | undefined;
}

/** 룰셋 로드 옵션 */
export interface RulesetLoadOptions {
  category?: VMDRuleCategory;
  zoneType?: string;
  minConfidence?: number;
  maxRules?: number;
  priorityRules?: string[];  // 우선 적용할 rule_code 목록
  excludedRules?: string[];  // 제외할 rule_code 목록
}

/** 룰셋 컨텍스트 (프롬프트에 주입할 형태) */
export interface VMDRulesetContext {
  rules: VMDRule[];
  promptText: string;
  metadata: {
    totalRules: number;
    categories: VMDRuleCategory[];
    avgConfidence: number;
    loadedAt: string;
  };
}

// ============================================================================
// 상수
// ============================================================================

/** 카테고리별 한국어 이름 */
const CATEGORY_NAMES_KO: Record<VMDRuleCategory, string> = {
  traffic_flow: '고객 동선',
  product_placement: '상품 배치',
  visual_merchandising: '비주얼 머천다이징',
  customer_psychology: '고객 심리',
  space_optimization: '공간 최적화',
};

/** 기본 룰셋 (DB 연결 실패 시 폴백) */
const DEFAULT_RULES: Partial<VMDRule>[] = [
  {
    rule_code: 'VMD-001',
    rule_name_ko: '부딪힘 효과',
    rule_category: 'traffic_flow',
    description_ko: '통로가 좁으면 고객이 상품을 만지다가 다른 사람과 부딪힐 때 불편함을 느껴 이탈합니다.',
    recommended_action_ko: '통로 폭 확보를 위해 가구 재배치',
    confidence_level: 0.85,
    priority: 80,
  },
  {
    rule_code: 'VMD-003',
    rule_name_ko: '골든존 배치',
    rule_category: 'product_placement',
    description_ko: '눈높이(120-150cm)에 배치된 상품은 가장 높은 가시성과 판매율을 보입니다.',
    recommended_action_ko: '고마진 상품을 눈높이 선반에 배치',
    confidence_level: 0.90,
    priority: 90,
  },
  {
    rule_code: 'VMD-006',
    rule_name_ko: '감압 구역',
    rule_category: 'customer_psychology',
    description_ko: '입구 직후 3-4m는 고객이 매장에 적응하는 구간입니다.',
    recommended_action_ko: '입구 직후는 환영 디스플레이만 배치, 주력 상품은 4m 이후',
    confidence_level: 0.78,
    priority: 85,
  },
];

// ============================================================================
// Supabase 클라이언트 생성
// ============================================================================

function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[vmdRulesetLoader] Supabase credentials not found');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

// ============================================================================
// 룰셋 로드 함수
// ============================================================================

/**
 * DB에서 VMD 룰셋 로드
 */
export async function loadVMDRulesets(
  options: RulesetLoadOptions = {}
): Promise<VMDRule[]> {
  const {
    category,
    zoneType,
    minConfidence = 0.5,
    maxRules = 10,
    priorityRules = [],
    excludedRules = [],
  } = options;

  const supabase = getSupabaseClient();

  if (!supabase) {
    console.warn('[loadVMDRulesets] Using default fallback rules');
    return DEFAULT_RULES as VMDRule[];
  }

  try {
    let query = supabase
      .from('vmd_rulesets')
      .select('*')
      .eq('is_active', true)
      .gte('confidence_level', minConfidence)
      .order('priority', { ascending: false })
      .order('confidence_level', { ascending: false })
      .limit(maxRules);

    // 카테고리 필터
    if (category) {
      query = query.eq('rule_category', category);
    }

    // 제외 룰 필터
    if (excludedRules.length > 0) {
      query = query.not('rule_code', 'in', `(${excludedRules.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[loadVMDRulesets] DB error:', error);
      return DEFAULT_RULES as VMDRule[];
    }

    let rules = data as VMDRule[];

    // Zone 타입 필터 (trigger_conditions 기반)
    if (zoneType) {
      rules = rules.filter(rule => {
        const conditions = rule.trigger_conditions;
        if (!conditions?.zone_type) return true; // 조건 없으면 모두 적용
        return conditions.zone_type.includes(zoneType);
      });
    }

    // 우선 적용 룰을 맨 앞으로
    if (priorityRules.length > 0) {
      const prioritized = rules.filter(r => priorityRules.includes(r.rule_code));
      const others = rules.filter(r => !priorityRules.includes(r.rule_code));
      rules = [...prioritized, ...others];
    }

    console.log(`[loadVMDRulesets] Loaded ${rules.length} rules`);
    return rules;

  } catch (error) {
    console.error('[loadVMDRulesets] Error:', error);
    return DEFAULT_RULES as VMDRule[];
  }
}

/**
 * 특정 Zone 타입에 적용 가능한 룰셋 조회
 */
export async function getRulesForZone(zoneType: string): Promise<VMDRule[]> {
  return loadVMDRulesets({
    zoneType,
    minConfidence: 0.6,
    maxRules: 5,
  });
}

/**
 * 카테고리별 룰셋 조회
 */
export async function getRulesByCategory(
  category: VMDRuleCategory
): Promise<VMDRule[]> {
  return loadVMDRulesets({
    category,
    minConfidence: 0.5,
    maxRules: 10,
  });
}

// ============================================================================
// 프롬프트 생성 함수
// ============================================================================

/**
 * VMD 룰셋을 AI 프롬프트용 텍스트로 변환
 */
export function buildRulesetPrompt(rules: VMDRule[]): string {
  if (rules.length === 0) {
    return '';
  }

  // 카테고리별 그룹화
  const byCategory = rules.reduce((acc, rule) => {
    const cat = rule.rule_category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(rule);
    return acc;
  }, {} as Record<VMDRuleCategory, VMDRule[]>);

  let prompt = `
## VMD 규칙 (반드시 참조하여 추천 생성)

아래 VMD(Visual Merchandising) 규칙들을 반드시 참조하여 최적화 추천을 생성하세요.
각 추천에는 적용된 규칙 코드를 명시해야 합니다.

`;

  for (const [category, catRules] of Object.entries(byCategory)) {
    const categoryName = CATEGORY_NAMES_KO[category as VMDRuleCategory] || category;
    prompt += `### ${categoryName}\n\n`;

    for (const rule of catRules) {
      const impact = formatExpectedImpact(rule.expected_impact);
      prompt += `**[${rule.rule_code}] ${rule.rule_name_ko}** (신뢰도: ${(rule.confidence_level * 100).toFixed(0)}%)
- 설명: ${rule.description_ko}
- 권장 액션: ${rule.recommended_action_ko}
- 예상 효과: ${impact}
- 근거: ${rule.evidence_source || 'VMD Best Practices'}

`;
    }
  }

  prompt += `
---
**중요**: 추천 생성 시 위 규칙 중 적용 가능한 규칙을 찾아 \`vmd_rule_applied\` 필드에 규칙 코드를 명시하세요.
예: "vmd_rule_applied": ["VMD-003", "VMD-005"]
`;

  return prompt;
}

/**
 * 예상 효과 포맷팅
 */
function formatExpectedImpact(impact: VMDExpectedImpact): string {
  const parts: string[] = [];

  if (impact.sales_lift) parts.push(`매출 +${(impact.sales_lift * 100).toFixed(0)}%`);
  if (impact.traffic_increase) parts.push(`트래픽 +${(impact.traffic_increase * 100).toFixed(0)}%`);
  if (impact.conversion_lift) parts.push(`전환율 +${(impact.conversion_lift * 100).toFixed(0)}%`);
  if (impact.dwell_time_increase) parts.push(`체류시간 +${(impact.dwell_time_increase * 100).toFixed(0)}%`);
  if (impact.visibility_increase) parts.push(`가시성 +${(impact.visibility_increase * 100).toFixed(0)}%`);
  if (impact.basket_size_increase) parts.push(`객단가 +${(impact.basket_size_increase * 100).toFixed(0)}%`);

  return parts.length > 0 ? parts.join(', ') : '효과 미정';
}

/**
 * 전체 VMD 컨텍스트 생성 (룰셋 로드 + 프롬프트 생성)
 */
export async function buildVMDRulesetContext(
  options: RulesetLoadOptions = {}
): Promise<VMDRulesetContext> {
  const rules = await loadVMDRulesets(options);
  const promptText = buildRulesetPrompt(rules);

  const categories = [...new Set(rules.map(r => r.rule_category))];
  const avgConfidence = rules.length > 0
    ? rules.reduce((sum, r) => sum + r.confidence_level, 0) / rules.length
    : 0;

  return {
    rules,
    promptText,
    metadata: {
      totalRules: rules.length,
      categories,
      avgConfidence,
      loadedAt: new Date().toISOString(),
    },
  };
}

// ============================================================================
// 룰 매칭 함수
// ============================================================================

/**
 * 주어진 조건에 매칭되는 룰 찾기
 */
export function findMatchingRules(
  rules: VMDRule[],
  context: {
    zoneType?: string;
    heightZone?: string;
    congestionScore?: number;
    visitRate?: number;
    aisleWidth?: number;
    hasAssociation?: boolean;
  }
): VMDRule[] {
  return rules.filter(rule => {
    const conditions = rule.trigger_conditions;
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // 조건 없으면 항상 적용
    }

    // zone_type 체크
    if (conditions.zone_type && context.zoneType) {
      if (!conditions.zone_type.includes(context.zoneType)) {
        return false;
      }
    }

    // height_zone 체크
    if (conditions.height_zone && context.heightZone) {
      if (conditions.height_zone !== context.heightZone) {
        return false;
      }
    }

    // 수치 조건 체크
    if (conditions.congestion_score && context.congestionScore !== undefined) {
      if (!checkNumericCondition(context.congestionScore, conditions.congestion_score)) {
        return false;
      }
    }

    if (conditions.visit_rate && context.visitRate !== undefined) {
      if (!checkNumericCondition(context.visitRate, conditions.visit_rate)) {
        return false;
      }
    }

    if (conditions.aisle_width && context.aisleWidth !== undefined) {
      if (!checkNumericCondition(context.aisleWidth, conditions.aisle_width)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 수치 조건 체크 헬퍼
 */
function checkNumericCondition(
  value: number,
  condition: { '>': number } | { '<': number } | { '>=': number } | { '<=': number } | { '=': number }
): boolean {
  if ('>' in condition) return value > condition['>'];
  if ('<' in condition) return value < condition['<'];
  if ('>=' in condition) return value >= condition['>='];
  if ('<=' in condition) return value <= condition['<='];
  if ('=' in condition) return value === condition['='];
  return true;
}

// ============================================================================
// 룰 적용 기록
// ============================================================================

/**
 * 룰 적용 이력 저장
 */
export async function recordRuleApplication(
  ruleCode: string,
  storeId: string,
  context: {
    optimizationId?: string;
    zoneId?: string;
    fixtureId?: string;
    productId?: string;
    wasAccepted?: boolean;
    feedback?: string;
  }
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    // 룰 ID 조회
    const { data: rule } = await supabase
      .from('vmd_rulesets')
      .select('id')
      .eq('rule_code', ruleCode)
      .single();

    if (!rule) {
      console.warn(`[recordRuleApplication] Rule not found: ${ruleCode}`);
      return;
    }

    await supabase
      .from('vmd_rule_applications')
      .insert({
        rule_id: rule.id,
        store_id: storeId,
        optimization_id: context.optimizationId,
        applied_to_zone_id: context.zoneId,
        applied_to_fixture_id: context.fixtureId,
        applied_to_product_id: context.productId,
        was_accepted: context.wasAccepted,
        user_feedback: context.feedback,
      });

    console.log(`[recordRuleApplication] Recorded application of ${ruleCode}`);
  } catch (error) {
    console.error('[recordRuleApplication] Error:', error);
  }
}

// ============================================================================
// Export
// ============================================================================

export default {
  loadVMDRulesets,
  getRulesForZone,
  getRulesByCategory,
  buildRulesetPrompt,
  buildVMDRulesetContext,
  findMatchingRules,
  recordRuleApplication,
  CATEGORY_NAMES_KO,
};
