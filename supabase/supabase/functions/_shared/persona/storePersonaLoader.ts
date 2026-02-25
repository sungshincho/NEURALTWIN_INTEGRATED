/**
 * storePersonaLoader.ts
 *
 * Sprint 3 Task: S3-4
 *
 * Store Persona 로드 및 AI 프롬프트 컨텍스트 생성 모듈
 *
 * 작성일: 2026-01-12
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// ============================================================================
// 타입 정의
// ============================================================================

/** Store Persona */
export interface StorePersona {
  id: string;
  store_id: string;
  store_style: StoreStyle;
  target_demographic: TargetDemographic;
  preference_weights: PreferenceWeights;
  vmd_preferences: VMDPreferences;
  learned_context: LearnedContext;
  confidence_adjustments: ConfidenceAdjustments;
  feedback_stats: FeedbackStats;
  last_learning_at: string | null;
  learning_version: number;
}

export type StoreStyle = 'premium' | 'standard' | 'budget' | 'outlet' | 'flagship' | 'pop_up';
export type TargetDemographic = 'young' | 'family' | 'senior' | 'professional' | 'general';

export interface PreferenceWeights {
  revenue: number;
  conversion: number;
  dwell_time: number;
  traffic_flow: number;
}

export interface VMDPreferences {
  prefer_rules: string[];  // 선호하는 VMD 룰 코드
  avoid_rules: string[];   // 회피하는 VMD 룰 코드
  custom_thresholds: Record<string, number>;
}

export interface LearnedContext {
  success_patterns: SuccessPattern[];
  failure_patterns: FailurePattern[];
  seasonal_adjustments: Record<string, number>;
  custom_instructions: string;
}

export interface SuccessPattern {
  target_type: string;
  vmd_rules: string[];
  confidence: number;
}

export interface FailurePattern {
  target_type: string;
  vmd_rules: string[];
  reason: string;
}

export interface ConfidenceAdjustments {
  layout: number;
  flow: number;
  staffing: number;
  pricing: number;
}

export interface FeedbackStats {
  total_recommendations: number;
  accepted: number;
  rejected: number;
  modified: number;
  acceptance_rate: number;
}

/** 프롬프트에 주입할 페르소나 컨텍스트 */
export interface PersonaPromptContext {
  hasPersona: boolean;
  promptText: string;
  adjustedConfidence: number;
  preferenceWeights: PreferenceWeights;
  vmdPreferences: VMDPreferences;
  metadata: {
    storeStyle: StoreStyle;
    targetDemographic: TargetDemographic;
    feedbackStats: FeedbackStats;
    learningVersion: number;
    loadedAt: string;
  };
}

// ============================================================================
// 상수
// ============================================================================

const STORE_STYLE_DESCRIPTIONS: Record<StoreStyle, string> = {
  premium: '프리미엄 매장 - 고급 고객층 대상, 품질과 경험 중시',
  standard: '표준 매장 - 일반 고객층 대상, 균형잡힌 접근',
  budget: '가성비 매장 - 가격 민감 고객층 대상, 효율성 중시',
  outlet: '아울렛 매장 - 할인 상품 중심, 대량 판매 지향',
  flagship: '플래그십 매장 - 브랜드 경험 중심, 프리미엄 진열',
  pop_up: '팝업 매장 - 단기 운영, 임팩트 있는 디스플레이 필요',
};

const DEMOGRAPHIC_DESCRIPTIONS: Record<TargetDemographic, string> = {
  young: '젊은 고객층 (20-30대) - 트렌드에 민감, SNS 공유 가치 중시',
  family: '가족 고객층 - 실용성, 안전성, 가성비 중시',
  senior: '시니어 고객층 (50대+) - 접근성, 가독성, 편의성 중시',
  professional: '전문직 고객층 - 효율성, 품질, 시간 절약 중시',
  general: '일반 고객층 - 다양한 니즈를 균형있게 고려',
};

// ============================================================================
// Supabase 클라이언트 생성
// ============================================================================

function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[storePersonaLoader] Supabase credentials not found');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

// ============================================================================
// 페르소나 로드 함수
// ============================================================================

/**
 * Store ID로 페르소나 로드
 */
export async function loadStorePersona(storeId: string): Promise<StorePersona | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('store_personas')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - 새 페르소나 생성
        console.log(`[loadStorePersona] No persona found for store ${storeId}, creating default`);
        return await createDefaultPersona(supabase, storeId);
      }
      throw error;
    }

    return data as StorePersona;
  } catch (error) {
    console.error('[loadStorePersona] Error:', error);
    return null;
  }
}

/**
 * 기본 페르소나 생성
 */
async function createDefaultPersona(supabase: SupabaseClient, storeId: string): Promise<StorePersona | null> {
  try {
    const { data, error } = await supabase
      .from('store_personas')
      .insert({ store_id: storeId })
      .select()
      .single();

    if (error) {
      console.error('[createDefaultPersona] Error:', error);
      return null;
    }

    return data as StorePersona;
  } catch (error) {
    console.error('[createDefaultPersona] Error:', error);
    return null;
  }
}

/**
 * DB RPC 함수를 통해 페르소나 컨텍스트 조회
 */
export async function loadPersonaContext(storeId: string): Promise<Record<string, any> | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .rpc('get_store_persona_context', { p_store_id: storeId });

    if (error) {
      console.warn('[loadPersonaContext] RPC not available:', error);
      // RPC 없으면 직접 로드
      const persona = await loadStorePersona(storeId);
      if (!persona) return null;
      return {
        has_persona: true,
        store_style: persona.store_style,
        target_demographic: persona.target_demographic,
        preference_weights: persona.preference_weights,
        vmd_preferences: persona.vmd_preferences,
        confidence_adjustments: persona.confidence_adjustments,
        feedback_stats: persona.feedback_stats,
        success_patterns: persona.learned_context?.success_patterns || [],
        failure_patterns: persona.learned_context?.failure_patterns || [],
        custom_instructions: persona.learned_context?.custom_instructions || '',
        learning_version: persona.learning_version,
      };
    }

    return data;
  } catch (error) {
    console.error('[loadPersonaContext] Error:', error);
    return null;
  }
}

// ============================================================================
// 프롬프트 생성 함수
// ============================================================================

/**
 * Store Persona를 AI 프롬프트용 텍스트로 변환
 */
export function buildPersonaPrompt(persona: StorePersona | null): string {
  if (!persona) {
    return '';
  }

  const storeDesc = STORE_STYLE_DESCRIPTIONS[persona.store_style];
  const demoDesc = DEMOGRAPHIC_DESCRIPTIONS[persona.target_demographic];

  let prompt = `
## 매장 페르소나 (반드시 참조하여 최적화)

### 매장 특성
- **매장 유형**: ${persona.store_style} - ${storeDesc}
- **주요 고객층**: ${persona.target_demographic} - ${demoDesc}

### 최적화 우선순위 (가중치)
`;

  // 선호도 가중치 정렬
  const weights = Object.entries(persona.preference_weights)
    .sort(([, a], [, b]) => b - a);

  for (const [key, value] of weights) {
    const label = {
      revenue: '매출',
      conversion: '전환율',
      dwell_time: '체류시간',
      traffic_flow: '동선 효율',
    }[key] || key;
    prompt += `- ${label}: ${(value * 100).toFixed(0)}%\n`;
  }

  // VMD 선호도
  if (persona.vmd_preferences.prefer_rules.length > 0) {
    prompt += `\n### 선호 VMD 규칙 (우선 적용)\n`;
    prompt += persona.vmd_preferences.prefer_rules.map(r => `- ${r}`).join('\n');
    prompt += '\n';
  }

  if (persona.vmd_preferences.avoid_rules.length > 0) {
    prompt += `\n### 회피 VMD 규칙 (적용 자제)\n`;
    prompt += persona.vmd_preferences.avoid_rules.map(r => `- ${r}`).join('\n');
    prompt += '\n';
  }

  // 과거 피드백 통계
  if (persona.feedback_stats.total_recommendations > 0) {
    prompt += `\n### 과거 피드백 통계\n`;
    prompt += `- 총 추천: ${persona.feedback_stats.total_recommendations}건\n`;
    prompt += `- 수용률: ${persona.feedback_stats.acceptance_rate.toFixed(0)}%\n`;
    prompt += `- (수용: ${persona.feedback_stats.accepted}, 거부: ${persona.feedback_stats.rejected}, 수정: ${persona.feedback_stats.modified})\n`;
  }

  // 학습된 패턴
  if (persona.learned_context.success_patterns.length > 0) {
    prompt += `\n### 과거 성공 패턴 (참고)\n`;
    for (const pattern of persona.learned_context.success_patterns.slice(0, 3)) {
      prompt += `- ${pattern.target_type}: VMD ${pattern.vmd_rules.join(', ')} (신뢰도 ${(pattern.confidence * 100).toFixed(0)}%)\n`;
    }
  }

  if (persona.learned_context.failure_patterns.length > 0) {
    prompt += `\n### 과거 거부 패턴 (피해야 할 접근)\n`;
    for (const pattern of persona.learned_context.failure_patterns.slice(0, 3)) {
      prompt += `- ${pattern.target_type}: ${pattern.reason} (관련 규칙: ${pattern.vmd_rules.join(', ')})\n`;
    }
  }

  // 커스텀 지시사항
  if (persona.learned_context.custom_instructions) {
    prompt += `\n### 매장 특별 지시사항\n`;
    prompt += persona.learned_context.custom_instructions;
    prompt += '\n';
  }

  prompt += `\n---\n**중요**: 위 페르소나를 반영하여 이 매장에 맞춤화된 추천을 생성하세요.\n`;

  return prompt;
}

/**
 * 전체 페르소나 프롬프트 컨텍스트 생성
 */
export async function buildPersonaPromptContext(
  storeId: string,
  baseConfidence: number = 0.75
): Promise<PersonaPromptContext> {
  const persona = await loadStorePersona(storeId);
  const promptText = buildPersonaPrompt(persona);

  // 신뢰도 조정
  let adjustedConfidence = baseConfidence;
  if (persona) {
    const adjustment = persona.confidence_adjustments.layout || 0;
    adjustedConfidence = Math.max(0, Math.min(1, baseConfidence + adjustment / 100));
  }

  // 기본값
  const defaultWeights: PreferenceWeights = {
    revenue: 0.4,
    conversion: 0.25,
    dwell_time: 0.2,
    traffic_flow: 0.15,
  };

  const defaultVmdPrefs: VMDPreferences = {
    prefer_rules: [],
    avoid_rules: [],
    custom_thresholds: {},
  };

  const defaultStats: FeedbackStats = {
    total_recommendations: 0,
    accepted: 0,
    rejected: 0,
    modified: 0,
    acceptance_rate: 0,
  };

  return {
    hasPersona: !!persona,
    promptText,
    adjustedConfidence,
    preferenceWeights: persona?.preference_weights || defaultWeights,
    vmdPreferences: persona?.vmd_preferences || defaultVmdPrefs,
    metadata: {
      storeStyle: persona?.store_style || 'standard',
      targetDemographic: persona?.target_demographic || 'general',
      feedbackStats: persona?.feedback_stats || defaultStats,
      learningVersion: persona?.learning_version || 1,
      loadedAt: new Date().toISOString(),
    },
  };
}

// ============================================================================
// 페르소나 업데이트 함수
// ============================================================================

/**
 * 페르소나 선호도 업데이트
 */
export async function updatePersonaPreferences(
  storeId: string,
  updates: {
    preferenceWeights?: Partial<PreferenceWeights>;
    vmdPreferences?: Partial<VMDPreferences>;
    customInstructions?: string;
  }
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    // 현재 페르소나 로드
    const persona = await loadStorePersona(storeId);
    if (!persona) return false;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.preferenceWeights) {
      updateData.preference_weights = {
        ...persona.preference_weights,
        ...updates.preferenceWeights,
      };
    }

    if (updates.vmdPreferences) {
      updateData.vmd_preferences = {
        ...persona.vmd_preferences,
        ...updates.vmdPreferences,
      };
    }

    if (updates.customInstructions !== undefined) {
      updateData.learned_context = {
        ...persona.learned_context,
        custom_instructions: updates.customInstructions,
      };
    }

    const { error } = await supabase
      .from('store_personas')
      .update(updateData)
      .eq('id', persona.id);

    if (error) throw error;

    console.log(`[updatePersonaPreferences] Updated persona for store ${storeId}`);
    return true;
  } catch (error) {
    console.error('[updatePersonaPreferences] Error:', error);
    return false;
  }
}

/**
 * 피드백 기반 페르소나 학습 (신뢰도 조정)
 */
export async function learnFromFeedback(
  storeId: string,
  feedbackAction: 'accept' | 'reject' | 'modify',
  optimizationType: 'layout' | 'flow' | 'staffing' = 'layout'
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const persona = await loadStorePersona(storeId);
    if (!persona) return;

    // 신뢰도 조정값 계산
    const adjustmentDelta = {
      accept: 0.5,   // 수용하면 신뢰도 상향
      reject: -1.0,  // 거부하면 신뢰도 하향
      modify: -0.3,  // 수정하면 약간 하향
    }[feedbackAction];

    const currentAdjustment = persona.confidence_adjustments[optimizationType] || 0;
    const newAdjustment = Math.max(-20, Math.min(20, currentAdjustment + adjustmentDelta));

    const { error } = await supabase
      .from('store_personas')
      .update({
        confidence_adjustments: {
          ...persona.confidence_adjustments,
          [optimizationType]: newAdjustment,
        },
        last_learning_at: new Date().toISOString(),
        learning_version: persona.learning_version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', persona.id);

    if (error) throw error;

    console.log(`[learnFromFeedback] Adjusted ${optimizationType} confidence by ${adjustmentDelta} for store ${storeId}`);
  } catch (error) {
    console.error('[learnFromFeedback] Error:', error);
  }
}

// ============================================================================
// Export
// ============================================================================

export default {
  loadStorePersona,
  loadPersonaContext,
  buildPersonaPrompt,
  buildPersonaPromptContext,
  updatePersonaPreferences,
  learnFromFeedback,
};
