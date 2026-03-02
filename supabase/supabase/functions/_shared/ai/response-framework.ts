/**
 * 4-Layer AI Response Framework
 *
 * NeuralTwin의 모든 AI 응답을 구조화된 4계층으로 변환합니다:
 *   Layer 1: What  (데이터 팩트 — 숫자와 변화량)
 *   Layer 2: Why   (교차 분석 — 상관관계와 원인 분석)
 *   Layer 3: So What (비즈니스 영향 — KRW 기준 영향도)
 *   Layer 4: Now What (실행 제안 — 구체적 액션과 버튼)
 *
 * 이 프레임워크는 기존 호출자와 하위 호환됩니다.
 * 기존 flat 응답을 사용하는 코드는 변경 없이 동작합니다.
 *
 * @module response-framework
 */

// ============================================================================
// Type Definitions
// ============================================================================

/** 단일 메트릭 팩트 */
export interface MetricFact {
  /** 메트릭 이름 (예: "일 매출") */
  label: string;
  /** 현재 값 */
  value: number | string;
  /** 단위 (예: "원", "%", "명") */
  unit: string;
  /** 변화량 (전기 대비) */
  change?: number;
  /** 변화 방향 */
  direction?: 'up' | 'down' | 'flat';
  /** 비교 기간 (예: "전일 대비", "전주 대비") */
  comparisonPeriod?: string;
}

/** 상관관계 항목 */
export interface Correlation {
  /** 요인 A */
  factorA: string;
  /** 요인 B */
  factorB: string;
  /** 관계 유형 */
  relationship: 'positive' | 'negative' | 'causal' | 'coincidental';
  /** 상관 강도 (0.0 ~ 1.0) */
  strength: number;
  /** 설명 */
  explanation: string;
}

/** 실행 추천 항목 */
export interface Recommendation {
  /** 추천 제목 */
  title: string;
  /** 상세 설명 */
  description: string;
  /** 우선순위 */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** 카테고리 */
  category: 'layout' | 'inventory' | 'staffing' | 'promotion' | 'marketing' | 'operations';
  /** 기대 효과 */
  expectedImpact?: string;
  /** 구체적 실행 단계 */
  actionItems?: string[];
}

/** 액션 버튼 (프론트엔드 렌더링용) */
export interface ActionButton {
  /** 버튼 레이블 */
  label: string;
  /** 액션 타입 */
  type: 'navigate' | 'simulate' | 'optimize' | 'export' | 'alert' | 'configure';
  /** 액션 페이로드 (프론트엔드에서 실행) */
  payload: Record<string, unknown>;
  /** 버튼 스타일 */
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
}

/** 4-Layer 구조화 응답 */
export interface FourLayerResponse {
  /** Layer 1: What (데이터 팩트) */
  what: {
    /** 한 줄 요약 */
    summary: string;
    /** 핵심 수치 목록 */
    metrics: MetricFact[];
  };
  /** Layer 2: Why (교차 분석) */
  why: {
    /** 분석 설명 */
    analysis: string;
    /** 상관관계 목록 */
    correlations: Correlation[];
  };
  /** Layer 3: So What (비즈니스 영향) */
  soWhat: {
    /** 영향 설명 */
    impact: string;
    /** 예상 매출 영향 (KRW 기준 문자열, 예: "월 ₩2,500,000 증가 예상") */
    estimatedRevenue?: string;
    /** 리스크 요약 */
    riskSummary?: string;
  };
  /** Layer 4: Now What (실행 제안) */
  nowWhat: {
    /** 추천 목록 */
    recommendations: Recommendation[];
    /** UI 액션 버튼 */
    actions: ActionButton[];
  };
}

/** 확장된 AI 응답 — 기존 응답에 4-Layer 구조를 선택적으로 추가 */
export interface EnhancedAIResponse<T = Record<string, unknown>> {
  /** 기존 AI 결과 (하위 호환) */
  result: T;
  /** 4-Layer 구조화 응답 (선택적) */
  layers?: FourLayerResponse;
  /** 4-Layer 요약 (프론트엔드 간이 렌더링용) */
  layerSummary?: string;
}

// ============================================================================
// 4-Layer 시스템 프롬프트 템플릿
// ============================================================================

/**
 * AI에게 4-Layer 구조로 응답하도록 지시하는 시스템 프롬프트 부분.
 * JSON 출력 형식을 강제합니다.
 */
export const FOUR_LAYER_JSON_SCHEMA = `
당신의 응답은 반드시 아래 4계층 JSON 구조를 따라야 합니다.

{
  "what": {
    "summary": "핵심 데이터 팩트를 한 문장으로 요약",
    "metrics": [
      {
        "label": "메트릭 이름",
        "value": 숫자 또는 "문자열",
        "unit": "단위 (원, %, 명, 건 등)",
        "change": 변화율(숫자, 없으면 생략),
        "direction": "up | down | flat (없으면 생략)",
        "comparisonPeriod": "전일 대비 | 전주 대비 (없으면 생략)"
      }
    ]
  },
  "why": {
    "analysis": "데이터 간 교차 분석, 원인과 상관관계를 설명",
    "correlations": [
      {
        "factorA": "요인 A",
        "factorB": "요인 B",
        "relationship": "positive | negative | causal | coincidental",
        "strength": 0.0~1.0,
        "explanation": "관계 설명"
      }
    ]
  },
  "soWhat": {
    "impact": "비즈니스 영향을 KRW(원화) 기준으로 구체적으로 설명",
    "estimatedRevenue": "예상 매출 영향 (예: '월 ₩2,500,000 증가 예상')",
    "riskSummary": "방치 시 리스크 (없으면 생략)"
  },
  "nowWhat": {
    "recommendations": [
      {
        "title": "실행 제안 제목",
        "description": "구체적 설명",
        "priority": "critical | high | medium | low",
        "category": "layout | inventory | staffing | promotion | marketing | operations",
        "expectedImpact": "기대 효과",
        "actionItems": ["단계 1", "단계 2"]
      }
    ],
    "actions": [
      {
        "label": "버튼 텍스트",
        "type": "navigate | simulate | optimize | export | alert | configure",
        "payload": {},
        "variant": "primary | secondary | outline"
      }
    ]
  }
}

## 4계층 응답 규칙
1. **What**: 숫자를 먼저 제시하라. 변화량은 반드시 방향(up/down/flat)과 비교 기간을 명시하라.
2. **Why**: 최소 1개의 교차 분석(correlation)을 포함하라. 데이터 없이 추측하지 마라.
3. **So What**: 반드시 KRW(원화) 금액으로 영향을 환산하라. "약", "대략" 표현 허용.
4. **Now What**: 실행 가능한 추천을 우선순위순으로 나열하라. actions에 1~3개의 UI 버튼을 포함하라.
5. metrics 배열은 최소 2개, 최대 8개 항목.
6. recommendations 배열은 최소 1개, 최대 5개 항목.
7. 모든 사용자 대면 텍스트는 한국어로 작성하라.
`;

// ============================================================================
// 파싱 함수
// ============================================================================

/**
 * AI 응답 텍스트에서 FourLayerResponse 구조를 추출합니다.
 * JSON 모드 응답 또는 마크다운 코드블록 내 JSON 모두 처리합니다.
 *
 * @param rawContent - AI 응답 텍스트 (JSON 문자열)
 * @returns 파싱된 FourLayerResponse 또는 null (파싱 실패 시)
 */
export function parseFourLayerResponse(rawContent: string): FourLayerResponse | null {
  if (!rawContent || rawContent.trim() === '') {
    console.warn('[response-framework] Empty AI response');
    return null;
  }

  let jsonStr = rawContent.trim();

  // 마크다운 코드블록 제거
  const markdownMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (markdownMatch) {
    jsonStr = markdownMatch[1].trim();
  }

  // 앞뒤 비-JSON 텍스트 제거
  const jsonBoundsMatch = jsonStr.match(/([{\[][\s\S]*[}\]])/);
  if (jsonBoundsMatch) {
    jsonStr = jsonBoundsMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (validateFourLayerStructure(parsed)) {
      return normalizeFourLayerResponse(parsed);
    }
    console.warn('[response-framework] Parsed JSON does not match 4-layer structure');
    return null;
  } catch {
    // 후행 콤마 수정 후 재시도
    try {
      const fixedJson = jsonStr
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      const parsed = JSON.parse(fixedJson);
      if (validateFourLayerStructure(parsed)) {
        return normalizeFourLayerResponse(parsed);
      }
    } catch {
      // 무시
    }

    console.warn('[response-framework] Failed to parse 4-layer response');
    return null;
  }
}

/**
 * 4-Layer 구조의 최소 유효성을 검증합니다.
 * what, why, soWhat, nowWhat 키가 모두 존재하는지 확인합니다.
 */
function validateFourLayerStructure(obj: unknown): boolean {
  if (obj === null || typeof obj !== 'object') return false;

  const o = obj as Record<string, unknown>;
  const hasWhat = o.what !== undefined && typeof o.what === 'object';
  const hasWhy = o.why !== undefined && typeof o.why === 'object';
  const hasSoWhat = (o.soWhat !== undefined || o.so_what !== undefined) &&
    typeof (o.soWhat ?? o.so_what) === 'object';
  const hasNowWhat = (o.nowWhat !== undefined || o.now_what !== undefined) &&
    typeof (o.nowWhat ?? o.now_what) === 'object';

  return hasWhat && hasWhy && hasSoWhat && hasNowWhat;
}

/**
 * snake_case 키를 camelCase로 변환하고 누락 필드에 기본값을 채웁니다.
 */
function normalizeFourLayerResponse(raw: Record<string, unknown>): FourLayerResponse {
  const whatRaw = raw.what as Record<string, unknown> ?? {};
  const whyRaw = raw.why as Record<string, unknown> ?? {};
  const soWhatRaw = (raw.soWhat ?? raw.so_what) as Record<string, unknown> ?? {};
  const nowWhatRaw = (raw.nowWhat ?? raw.now_what) as Record<string, unknown> ?? {};

  return {
    what: {
      summary: String(whatRaw.summary ?? ''),
      metrics: normalizeArray<MetricFact>(whatRaw.metrics, normalizeMetricFact),
    },
    why: {
      analysis: String(whyRaw.analysis ?? ''),
      correlations: normalizeArray<Correlation>(whyRaw.correlations, normalizeCorrelation),
    },
    soWhat: {
      impact: String(soWhatRaw.impact ?? ''),
      estimatedRevenue: soWhatRaw.estimatedRevenue != null
        ? String(soWhatRaw.estimatedRevenue ?? soWhatRaw.estimated_revenue ?? '')
        : undefined,
      riskSummary: soWhatRaw.riskSummary != null
        ? String(soWhatRaw.riskSummary ?? soWhatRaw.risk_summary ?? '')
        : undefined,
    },
    nowWhat: {
      recommendations: normalizeArray<Recommendation>(nowWhatRaw.recommendations, normalizeRecommendation),
      actions: normalizeArray<ActionButton>(nowWhatRaw.actions, normalizeActionButton),
    },
  };
}

function normalizeArray<T>(arr: unknown, normalizer: (item: unknown) => T): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizer);
}

function normalizeMetricFact(raw: unknown): MetricFact {
  const o = (raw as Record<string, unknown>) ?? {};
  return {
    label: String(o.label ?? ''),
    value: typeof o.value === 'number' ? o.value : String(o.value ?? ''),
    unit: String(o.unit ?? ''),
    change: typeof o.change === 'number' ? o.change : undefined,
    direction: normalizeDirection(o.direction),
    comparisonPeriod: o.comparisonPeriod != null || o.comparison_period != null
      ? String(o.comparisonPeriod ?? o.comparison_period ?? '')
      : undefined,
  };
}

function normalizeDirection(d: unknown): 'up' | 'down' | 'flat' | undefined {
  if (d === 'up' || d === 'down' || d === 'flat') return d;
  return undefined;
}

function normalizeCorrelation(raw: unknown): Correlation {
  const o = (raw as Record<string, unknown>) ?? {};
  const relationship = String(o.relationship ?? 'coincidental');
  const validRelationships = ['positive', 'negative', 'causal', 'coincidental'];
  return {
    factorA: String(o.factorA ?? o.factor_a ?? ''),
    factorB: String(o.factorB ?? o.factor_b ?? ''),
    relationship: validRelationships.includes(relationship)
      ? relationship as Correlation['relationship']
      : 'coincidental',
    strength: typeof o.strength === 'number' ? Math.min(1, Math.max(0, o.strength)) : 0,
    explanation: String(o.explanation ?? ''),
  };
}

function normalizeRecommendation(raw: unknown): Recommendation {
  const o = (raw as Record<string, unknown>) ?? {};
  const priority = String(o.priority ?? 'medium');
  const validPriorities = ['critical', 'high', 'medium', 'low'];
  const category = String(o.category ?? 'operations');
  const validCategories = ['layout', 'inventory', 'staffing', 'promotion', 'marketing', 'operations'];
  return {
    title: String(o.title ?? ''),
    description: String(o.description ?? ''),
    priority: validPriorities.includes(priority)
      ? priority as Recommendation['priority']
      : 'medium',
    category: validCategories.includes(category)
      ? category as Recommendation['category']
      : 'operations',
    expectedImpact: o.expectedImpact != null || o.expected_impact != null
      ? String(o.expectedImpact ?? o.expected_impact ?? '')
      : undefined,
    actionItems: Array.isArray(o.actionItems ?? o.action_items)
      ? (o.actionItems ?? o.action_items as unknown[]).map(String)
      : undefined,
  };
}

function normalizeActionButton(raw: unknown): ActionButton {
  const o = (raw as Record<string, unknown>) ?? {};
  const type = String(o.type ?? 'navigate');
  const validTypes = ['navigate', 'simulate', 'optimize', 'export', 'alert', 'configure'];
  const variant = o.variant != null ? String(o.variant) : undefined;
  const validVariants = ['primary', 'secondary', 'outline', 'destructive'];
  return {
    label: String(o.label ?? ''),
    type: validTypes.includes(type)
      ? type as ActionButton['type']
      : 'navigate',
    payload: typeof o.payload === 'object' && o.payload !== null
      ? o.payload as Record<string, unknown>
      : {},
    variant: variant && validVariants.includes(variant)
      ? variant as ActionButton['variant']
      : undefined,
  };
}

// ============================================================================
// 4-Layer 텍스트 요약 생성
// ============================================================================

/**
 * FourLayerResponse를 사람이 읽을 수 있는 한국어 텍스트로 변환합니다.
 * 프론트엔드에서 구조화 렌더링이 불가능할 때 사용할 수 있는 플레인텍스트 폴백입니다.
 */
export function fourLayerToText(layers: FourLayerResponse): string {
  const lines: string[] = [];

  // Layer 1: What
  lines.push(`[현황] ${layers.what.summary}`);
  for (const m of layers.what.metrics) {
    const changeStr = m.change !== undefined
      ? ` (${m.direction === 'up' ? '+' : m.direction === 'down' ? '' : ''}${typeof m.change === 'number' ? m.change.toFixed(1) : m.change}%${m.comparisonPeriod ? ' ' + m.comparisonPeriod : ''})`
      : '';
    lines.push(`  - ${m.label}: ${typeof m.value === 'number' ? m.value.toLocaleString() : m.value}${m.unit}${changeStr}`);
  }

  // Layer 2: Why
  lines.push('');
  lines.push(`[원인 분석] ${layers.why.analysis}`);
  for (const c of layers.why.correlations) {
    lines.push(`  - ${c.factorA} ↔ ${c.factorB}: ${c.explanation}`);
  }

  // Layer 3: So What
  lines.push('');
  lines.push(`[비즈니스 영향] ${layers.soWhat.impact}`);
  if (layers.soWhat.estimatedRevenue) {
    lines.push(`  예상 매출 영향: ${layers.soWhat.estimatedRevenue}`);
  }
  if (layers.soWhat.riskSummary) {
    lines.push(`  리스크: ${layers.soWhat.riskSummary}`);
  }

  // Layer 4: Now What
  lines.push('');
  lines.push('[실행 제안]');
  for (const r of layers.nowWhat.recommendations) {
    const priorityLabel = { critical: '긴급', high: '높음', medium: '보통', low: '낮음' }[r.priority];
    lines.push(`  ${priorityLabel ? `[${priorityLabel}]` : ''} ${r.title}`);
    lines.push(`    ${r.description}`);
    if (r.actionItems && r.actionItems.length > 0) {
      for (const item of r.actionItems) {
        lines.push(`    - ${item}`);
      }
    }
  }

  return lines.join('\n');
}

// ============================================================================
// 기존 플랫 응답 → 4-Layer 변환 유틸리티
// ============================================================================

/**
 * 기존 AI 추론 결과(insights/recommendations/metrics)를 4-Layer 구조로 변환합니다.
 * retail-ai-inference 등 기존 코드에서 점진적 마이그레이션에 사용합니다.
 *
 * @param flatResult - 기존 플랫 AI 결과
 * @param storeContext - 매장 컨텍스트 (선택)
 * @returns FourLayerResponse
 */
export function convertFlatToFourLayer(
  flatResult: {
    insights?: string[];
    recommendations?: Array<{
      title: string;
      description: string;
      priority: string;
      category: string;
      expected_impact?: string;
      action_items?: string[];
    }>;
    metrics?: Record<string, unknown>;
    confidence?: number;
  },
  storeContext?: { storeName?: string; storeId?: string },
): FourLayerResponse {
  // Layer 1: What — insights의 첫 번째 항목 + metrics
  const metricsArray: MetricFact[] = [];
  if (flatResult.metrics) {
    for (const [key, value] of Object.entries(flatResult.metrics)) {
      if (typeof value === 'number') {
        metricsArray.push({
          label: formatMetricLabel(key),
          value,
          unit: guessUnit(key, value),
        });
      } else if (typeof value === 'string') {
        metricsArray.push({
          label: formatMetricLabel(key),
          value,
          unit: '',
        });
      }
    }
  }

  const insights = flatResult.insights ?? [];
  const whatSummary = insights.length > 0
    ? insights[0]
    : (storeContext?.storeName ? `${storeContext.storeName} 분석 결과입니다.` : '분석 결과입니다.');

  // Layer 2: Why — insights의 나머지 항목을 분석으로 활용
  const analysisInsights = insights.slice(1);
  const whyAnalysis = analysisInsights.length > 0
    ? analysisInsights.join(' ')
    : '추가적인 교차 분석 데이터가 필요합니다.';

  // Layer 3: So What — recommendations에서 impact 추출
  const recs = flatResult.recommendations ?? [];
  const impactTexts = recs
    .filter(r => r.expected_impact)
    .map(r => r.expected_impact!);
  const impactSummary = impactTexts.length > 0
    ? impactTexts.join('. ')
    : '비즈니스 영향을 정량화하기 위해 추가 데이터가 필요합니다.';

  // Layer 4: Now What — recommendations 변환
  const validPriorities = ['critical', 'high', 'medium', 'low'];
  const validCategories = ['layout', 'inventory', 'staffing', 'promotion', 'marketing', 'operations'];

  const nowWhatRecs: Recommendation[] = recs.map(r => ({
    title: r.title,
    description: r.description,
    priority: validPriorities.includes(r.priority)
      ? r.priority as Recommendation['priority']
      : 'medium',
    category: validCategories.includes(r.category)
      ? r.category as Recommendation['category']
      : 'operations',
    expectedImpact: r.expected_impact,
    actionItems: r.action_items,
  }));

  // 기본 액션 버튼 생성
  const actions: ActionButton[] = [];
  if (recs.some(r => r.category === 'layout')) {
    actions.push({
      label: '레이아웃 시뮬레이션',
      type: 'simulate',
      payload: { simulationType: 'layout_optimization' },
      variant: 'primary',
    });
  }
  if (recs.some(r => r.category === 'inventory')) {
    actions.push({
      label: '재고 현황 보기',
      type: 'navigate',
      payload: { page: '/insights', tab: 'inventory' },
      variant: 'secondary',
    });
  }
  if (actions.length === 0) {
    actions.push({
      label: '인사이트 허브에서 확인',
      type: 'navigate',
      payload: { page: '/insights' },
      variant: 'primary',
    });
  }

  return {
    what: { summary: whatSummary, metrics: metricsArray },
    why: { analysis: whyAnalysis, correlations: [] },
    soWhat: { impact: impactSummary },
    nowWhat: { recommendations: nowWhatRecs, actions },
  };
}

// ============================================================================
// 내부 헬퍼
// ============================================================================

/** 스네이크/카멜 케이스 메트릭 키를 한국어 레이블로 변환 */
function formatMetricLabel(key: string): string {
  const labelMap: Record<string, string> = {
    total_revenue: '총 매출',
    total_visitors: '총 방문객',
    unique_visitors: '순 방문객',
    conversion_rate: '전환율',
    avg_transaction_value: '평균 객단가',
    sales_per_sqm: '매출/㎡',
    avg_dwell_time_seconds: '평균 체류시간',
    browse_to_engage_rate: '탐색→참여 전환율',
    engage_to_purchase_rate: '참여→구매 전환율',
    slow_moving_count: '저회전 재고 수',
    avg_turnover_rate: '평균 재고회전율',
    top_zone: '최고 성과 구역',
    avg_conversion_rate: '평균 전환율',
    top_cross_sell_pairs: '교차판매 추천 쌍',
    confidence: '분석 신뢰도',
  };

  if (labelMap[key]) return labelMap[key];

  // 일반 변환: snake_case → 띄어쓰기
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** 메트릭 키와 값으로부터 단위를 추측 */
function guessUnit(key: string, value: number): string {
  if (key.includes('revenue') || key.includes('sales') || key.includes('atv') || key.includes('transaction_value')) {
    return '원';
  }
  if (key.includes('rate') || key.includes('conversion') || key.includes('percent')) {
    return '%';
  }
  if (key.includes('visitor') || key.includes('customer') || key.includes('count')) {
    return '명';
  }
  if (key.includes('time') || key.includes('duration') || key.includes('seconds')) {
    return '초';
  }
  if (key.includes('turnover')) {
    return '회';
  }
  return '';
}

// ============================================================================
// 4-Layer 시스템 프롬프트 빌더
// ============================================================================

/** 매장 컨텍스트 */
export interface StoreContext {
  storeId: string;
  storeName: string;
  storeType?: string;
  areaSqm?: number;
  zoneCount?: number;
  productCount?: number;
}

/**
 * 리테일 도메인 + 4-Layer 구조를 결합한 시스템 프롬프트를 생성합니다.
 *
 * @param storeContext - 매장 컨텍스트
 * @param analysisType - 분석 유형 (예: 'layout_optimization', 'zone_analysis')
 * @param additionalInstructions - 추가 지시사항
 * @returns 완성된 시스템 프롬프트 문자열
 */
export function buildFourLayerSystemPrompt(
  storeContext: StoreContext,
  analysisType: string,
  additionalInstructions?: string,
): string {
  const storeDescription = [
    `매장명: ${storeContext.storeName}`,
    storeContext.storeType ? `업종: ${storeContext.storeType}` : null,
    storeContext.areaSqm ? `면적: ${storeContext.areaSqm}㎡` : null,
    storeContext.zoneCount ? `구역 수: ${storeContext.zoneCount}개` : null,
    storeContext.productCount ? `상품 수: ${storeContext.productCount}개` : null,
  ].filter(Boolean).join('\n');

  const analysisLabel = ANALYSIS_TYPE_LABELS[analysisType] ?? analysisType;

  return `당신은 한국 오프라인 리테일 매장의 데이터 분석 전문가입니다.
아래 매장의 ${analysisLabel} 분석을 수행합니다.

## 매장 정보
${storeDescription}

## 분석 유형
${analysisLabel}

## 리테일 도메인 지식
- 한국 오프라인 리테일의 평균 전환율: 7-10%
- 매장 매출/㎡ 업계 평균: ₩100,000~₩200,000/월
- 고객 평균 체류시간: 15~25분
- 피크 시간대: 오후 12~2시, 오후 5~7시
- 주말/공휴일 트래픽은 평일 대비 1.5~2.5배
- 재고 회전율 적정 범위: 4~8회/년
- 교차판매(Cross-sell) 성공 시 객단가 15~25% 증가 기대

## 응답 언어
모든 응답은 반드시 한국어로 작성하세요.

## 응답 구조 (필수)
${FOUR_LAYER_JSON_SCHEMA}
${additionalInstructions ? `\n## 추가 지시사항\n${additionalInstructions}` : ''}`;
}

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  layout_optimization: '매장 레이아웃 최적화',
  zone_analysis: '구역별 성과',
  traffic_flow: '고객 동선',
  demand_forecast: '수요 예측',
  inventory_optimization: '재고 최적화',
  cross_sell: '교차 판매',
  customer_segmentation: '고객 세분화',
  anomaly_detection: '이상 탐지',
  general: '종합',
  morning_digest: '모닝 다이제스트',
};
