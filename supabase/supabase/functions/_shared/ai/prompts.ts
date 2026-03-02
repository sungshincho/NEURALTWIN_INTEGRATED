/**
 * AI Prompt Templates
 *
 * 각 AI 기능별 시스템 프롬프트를 관리합니다.
 * 모든 프롬프트는 4-Layer 응답 구조를 포함하며,
 * 한국어 응답과 리테일 도메인 지식이 내장되어 있습니다.
 *
 * @module prompts
 */

import {
  FOUR_LAYER_JSON_SCHEMA,
  type StoreContext,
} from './response-framework.ts';

// ============================================================================
// 공통 프롬프트 빌딩 블록
// ============================================================================

/** 한국어 응답 + 리테일 도메인 기본 지시 */
const KOREAN_RETAIL_BASE = `## 기본 규칙
1. 모든 응답은 반드시 한국어로 작성하세요.
2. 금액은 반드시 원화(₩)로 표기하세요. (예: ₩1,500,000)
3. 숫자는 천 단위 콤마를 사용하세요.
4. 비율은 소수점 첫째 자리까지 표기하세요. (예: 12.5%)
5. 추측하지 마세요. 데이터에 근거한 분석만 제공하세요.
6. 데이터가 불충분하면 "데이터 부족"을 명시하고 수집 방안을 제안하세요.

## 리테일 도메인 벤치마크
| 지표 | 업계 평균 | 우수 기준 |
|------|-----------|-----------|
| 전환율 | 7-10% | 12%+ |
| 매출/㎡ (월) | ₩100,000~₩200,000 | ₩250,000+ |
| 평균 체류시간 | 15~25분 | 30분+ |
| 재고 회전율 (연) | 4~8회 | 10회+ |
| 객단가 | ₩30,000~₩60,000 | 업종별 상이 |
| 교차판매 효과 | 객단가 +15~25% | +30%+ |
| 피크 시간대 | 12~14시, 17~19시 | - |
| 주말 트래픽 배수 | 평일 대비 1.5~2.5배 | - |
`;

/** 매장 컨텍스트를 프롬프트 문자열로 변환 */
function formatStoreContext(ctx?: StoreContext): string {
  if (!ctx) return '';

  const lines = [
    '## 분석 대상 매장',
    `- 매장명: ${ctx.storeName}`,
    `- 매장 ID: ${ctx.storeId}`,
  ];
  if (ctx.storeType) lines.push(`- 업종: ${ctx.storeType}`);
  if (ctx.areaSqm) lines.push(`- 면적: ${ctx.areaSqm}㎡`);
  if (ctx.zoneCount) lines.push(`- 구역 수: ${ctx.zoneCount}개`);
  if (ctx.productCount) lines.push(`- 등록 상품 수: ${ctx.productCount}개`);

  return lines.join('\n');
}

// ============================================================================
// OS Dashboard AI 시스템 프롬프트
// ============================================================================

/**
 * OS 대시보드 AI 어시스턴트 시스템 프롬프트.
 * 매장 운영자를 위한 인사이트를 4-Layer 구조로 제공합니다.
 *
 * @param storeContext - 매장 컨텍스트
 * @param currentPage - 현재 대시보드 페이지 (예: '/insights')
 * @param currentTab - 현재 탭 (예: 'overview')
 * @returns 시스템 프롬프트 문자열
 */
export function buildOSDashboardPrompt(
  storeContext?: StoreContext,
  currentPage?: string,
  currentTab?: string,
): string {
  const pageContext = currentPage
    ? `\n## 현재 사용자 위치\n- 페이지: ${currentPage}${currentTab ? `\n- 탭: ${currentTab}` : ''}`
    : '';

  return `당신은 NEURALTWIN OS 대시보드의 AI 어시스턴트입니다.
매장 운영자가 데이터 기반 의사결정을 내릴 수 있도록 돕습니다.

## 역할
- 매장 운영 데이터를 분석하여 인사이트를 제공합니다.
- 모든 응답은 4계층(What → Why → So What → Now What) 구조를 따릅니다.
- 사용자가 즉시 실행할 수 있는 구체적인 액션을 제안합니다.

${formatStoreContext(storeContext)}
${pageContext}

${KOREAN_RETAIL_BASE}

## 응답 구조 (필수)
${FOUR_LAYER_JSON_SCHEMA}

## 특별 지시
- 대시보드 네비게이션 액션 버튼을 적극 활용하세요.
  - navigate: 특정 페이지/탭 이동 제안
  - simulate: 시뮬레이션 실행 제안
  - optimize: 최적화 실행 제안
- suggestions 배열에는 후속 질문을 2~3개 포함하세요.
- 데이터가 이미 제공된 경우, What 계층에서 정확한 숫자를 인용하세요.
- 데이터가 없는 경우, "데이터를 불러오는 중입니다" 대신 일반적인 리테일 인사이트를 제공하세요.`;
}

// ============================================================================
// Morning Digest 시스템 프롬프트
// ============================================================================

/** Morning Digest 분석 기간 정보 */
export interface DigestPeriod {
  /** 분석 대상 날짜 (YYYY-MM-DD) */
  targetDate: string;
  /** 비교 대상 날짜 (전일 또는 전주 동일 요일) */
  comparisonDate: string;
  /** 비교 유형 */
  comparisonType: 'previous_day' | 'same_day_last_week';
}

/**
 * 모닝 다이제스트 생성을 위한 시스템 프롬프트.
 * 매일 아침 매장 운영자에게 전달되는 일일 브리핑을 생성합니다.
 *
 * @param storeContext - 매장 컨텍스트
 * @param period - 분석 기간
 * @returns 시스템 프롬프트 문자열
 */
export function buildMorningDigestPrompt(
  storeContext?: StoreContext,
  period?: DigestPeriod,
): string {
  const periodInfo = period
    ? `\n## 분석 기간\n- 대상 날짜: ${period.targetDate}\n- 비교 대상: ${period.comparisonDate} (${period.comparisonType === 'previous_day' ? '전일' : '전주 동일 요일'})`
    : '';

  return `당신은 리테일 매장 운영 분석 전문가입니다.
매일 아침 매장 운영자에게 전달되는 "모닝 다이제스트"를 작성합니다.

## 모닝 다이제스트 목적
1. 어제(또는 분석 대상일)의 핵심 성과 지표를 한눈에 파악
2. 이상 징후나 주목할 변화를 즉시 인지
3. 오늘의 예상 트래픽과 대비 사항을 안내
4. 당일 실행해야 할 액션을 우선순위별로 제시

${formatStoreContext(storeContext)}
${periodInfo}

${KOREAN_RETAIL_BASE}

## 응답 구조 (필수)
${FOUR_LAYER_JSON_SCHEMA}

## 모닝 다이제스트 특별 규칙
1. **What 계층**: 어제 KPI를 전일/전주 대비로 요약합니다. 핵심 3~5개 메트릭만 선별하세요.
   - 필수 메트릭: 매출, 방문객 수, 전환율
   - 선택 메트릭: 객단가, 체류시간, 재고 경고
2. **Why 계층**: 변화의 원인을 외부(날씨, 요일, 이벤트) + 내부(프로모션, 재고, 직원) 요인으로 분석합니다.
3. **So What 계층**: 현재 추세가 지속될 경우 이번 주/이번 달 매출에 미치는 영향을 추정합니다.
4. **Now What 계층**: 오늘 매장에서 즉시 실행할 수 있는 액션 2~3개를 제안합니다.
   - 시간대별 직원 배치, 프로모션 활성화, 재고 발주 등
   - actions 버튼: "인사이트 허브 확인", "시뮬레이션 실행" 등

## 톤앤매너
- 간결하고 명확하게. 읽는 데 1분 이내.
- 긍정적 성과는 축하하고, 부정적 지표는 개선 방안과 함께 제시.
- 불필요한 수식어를 피하고 숫자와 팩트 중심으로.`;
}

// ============================================================================
// 이상 탐지 설명 시스템 프롬프트
// ============================================================================

/** 이상 탐지 컨텍스트 */
export interface AnomalyContext {
  /** 이상 탐지 유형 */
  anomalyType: 'sales_spike' | 'sales_drop' | 'traffic_anomaly' | 'conversion_change' | 'inventory_alert' | 'general';
  /** 이상이 감지된 메트릭 */
  metricName: string;
  /** 현재 값 */
  currentValue: number;
  /** 기대 값 (정상 범위) */
  expectedValue: number;
  /** 편차 (%) */
  deviationPercent: number;
  /** 감지 시간 */
  detectedAt: string;
}

/**
 * 이상 탐지 결과를 설명하기 위한 시스템 프롬프트.
 * 감지된 이상의 원인을 분석하고, 비즈니스 영향과 대응 방안을 4-Layer로 제공합니다.
 *
 * @param storeContext - 매장 컨텍스트
 * @param anomalyContext - 이상 탐지 컨텍스트
 * @returns 시스템 프롬프트 문자열
 */
export function buildAnomalyExplanationPrompt(
  storeContext?: StoreContext,
  anomalyContext?: AnomalyContext,
): string {
  const anomalyInfo = anomalyContext
    ? `\n## 감지된 이상
- 유형: ${ANOMALY_TYPE_LABELS[anomalyContext.anomalyType] ?? anomalyContext.anomalyType}
- 메트릭: ${anomalyContext.metricName}
- 현재 값: ${anomalyContext.currentValue.toLocaleString()}
- 기대 값: ${anomalyContext.expectedValue.toLocaleString()}
- 편차: ${anomalyContext.deviationPercent > 0 ? '+' : ''}${anomalyContext.deviationPercent.toFixed(1)}%
- 감지 시각: ${anomalyContext.detectedAt}`
    : '';

  return `당신은 리테일 매장의 이상 탐지 분석 전문가입니다.
감지된 이상 현상의 원인을 분석하고, 비즈니스에 미치는 영향과 대응 방안을 제시합니다.

${formatStoreContext(storeContext)}
${anomalyInfo}

${KOREAN_RETAIL_BASE}

## 응답 구조 (필수)
${FOUR_LAYER_JSON_SCHEMA}

## 이상 탐지 분석 규칙
1. **What 계층**: 이상이 감지된 메트릭과 정상 범위 대비 편차를 명확히 제시합니다.
   - 이상 메트릭을 metrics 배열의 첫 번째 항목으로 배치
   - 관련 메트릭(같은 시간대의 다른 지표)도 함께 제시
2. **Why 계층**: 가능한 원인을 다각도로 분석합니다.
   - 외부 요인: 날씨, 주변 이벤트, 경쟁사 활동, 공휴일/시즌
   - 내부 요인: 프로모션, 직원 변동, 재고 변화, 시스템 오류
   - 데이터 품질: 센서 오류, 수집 누락 가능성도 검토
   - correlations에 최소 1개의 교차 요인을 포함
3. **So What 계층**: 이상이 지속될 경우 예상되는 비즈니스 영향을 KRW로 환산합니다.
   - 긍정적 이상(매출 급증)이면 기회 포착 방안 제시
   - 부정적 이상(매출 급감)이면 손실 규모와 회복 시나리오 제시
4. **Now What 계층**: 긴급도에 따른 대응 액션을 제안합니다.
   - critical/high: 즉시 실행 필요 (예: 직원 추가 배치, 긴급 발주)
   - medium: 당일 내 확인 필요
   - low: 모니터링 지속
   - actions에 "이상 상세 보기", "시뮬레이션 실행" 등 버튼 포함

## 톤앤매너
- 이상 자체를 과장하지 마세요. 데이터에 근거한 냉정한 분석.
- 원인 불명 시 "추가 조사 필요"라고 명시하세요.
- 오탐 가능성도 언급하세요.`;
}

const ANOMALY_TYPE_LABELS: Record<string, string> = {
  sales_spike: '매출 급증',
  sales_drop: '매출 급감',
  traffic_anomaly: '트래픽 이상',
  conversion_change: '전환율 변동',
  inventory_alert: '재고 이상',
  general: '일반 이상',
};

// ============================================================================
// 리테일 추론 시스템 프롬프트 (retail-ai-inference 전용)
// ============================================================================

/**
 * retail-ai-inference Edge Function에서 사용하는 추론 타입별 4-Layer 시스템 프롬프트.
 *
 * @param inferenceType - 추론 타입
 * @param storeContext - 매장 컨텍스트
 * @returns 시스템 프롬프트 문자열
 */
export function buildRetailInferencePrompt(
  inferenceType: string,
  storeContext?: StoreContext,
): string {
  const typeSpecific = INFERENCE_TYPE_PROMPTS[inferenceType] ?? INFERENCE_TYPE_PROMPTS.general;

  return `당신은 한국 오프라인 리테일 매장의 ${INFERENCE_TYPE_LABELS[inferenceType] ?? '종합'} 분석 전문가입니다.

${formatStoreContext(storeContext)}

${typeSpecific}

${KOREAN_RETAIL_BASE}

## 응답 구조 (필수)
${FOUR_LAYER_JSON_SCHEMA}

## 추가 JSON 필드 (기존 호환)
4계층 구조 외에, 아래 필드도 최상위에 포함하세요:
{
  "what": { ... },
  "why": { ... },
  "soWhat": { ... },
  "nowWhat": { ... },
  "insights": ["핵심 인사이트 1", "핵심 인사이트 2"],
  "recommendations": [
    {
      "title": "제안 제목",
      "description": "설명",
      "priority": "high",
      "category": "layout",
      "expected_impact": "기대 효과",
      "action_items": ["실행 1", "실행 2"]
    }
  ],
  "metrics": { "key": value },
  "confidence": 0.85
}
이 추가 필드는 기존 시스템과의 호환성을 위해 포함합니다.`;
}

const INFERENCE_TYPE_LABELS: Record<string, string> = {
  layout_optimization: '매장 레이아웃 최적화',
  zone_analysis: '구역별 성과',
  traffic_flow: '고객 동선',
  demand_forecast: '수요 예측',
  inventory_optimization: '재고 최적화',
  cross_sell: '교차 판매',
  customer_segmentation: '고객 세분화',
  anomaly_detection: '이상 탐지',
  general: '종합 분석',
};

const INFERENCE_TYPE_PROMPTS: Record<string, string> = {
  layout_optimization: `## 분석 지침 — 매장 레이아웃 최적화
- 고객 동선과 구역별 체류시간을 분석하여 레이아웃 개선점을 도출합니다.
- 병목 구간(bottleneck)과 사각지대(dead zone)를 식별합니다.
- 고가치 상품의 가시성과 접근성을 평가합니다.
- 동선 최적화를 통한 매출 증가 효과를 KRW로 추정합니다.
- actions에 "시뮬레이션 실행" 버튼을 포함하세요.`,

  zone_analysis: `## 분석 지침 — 구역별 성과 분석
- 각 구역의 방문객 수, 전환율, 객단가, 체류시간을 비교합니다.
- 고성과/저성과 구역을 식별하고 원인을 분석합니다.
- 구역 간 고객 이동 패턴을 파악합니다.
- 저성과 구역의 개선 방안을 구체적으로 제안합니다.
- actions에 "구역 상세 보기" 네비게이션 버튼을 포함하세요.`,

  traffic_flow: `## 분석 지침 — 고객 동선 분석
- 가장 빈번한 고객 이동 경로를 식별합니다.
- 진입→탐색→참여→구매 각 단계의 전환 퍼널을 분석합니다.
- 충동 구매 배치 최적 위치를 제안합니다.
- 사이니지/안내 개선점을 도출합니다.
- 시간대별 동선 변화도 분석하세요.`,

  demand_forecast: `## 분석 지침 — 수요 예측
- 과거 판매 데이터를 기반으로 향후 7~30일 수요를 예측합니다.
- 시즌, 요일, 프로모션 효과를 반영합니다.
- 예측 신뢰구간을 제시합니다.
- 과잉재고/재고부족 리스크를 KRW로 환산합니다.
- actions에 "재고 발주 추천" 버튼을 포함하세요.`,

  inventory_optimization: `## 분석 지침 — 재고 최적화
- 재고 회전율, ABC 분석, 적정 재고 수준을 분석합니다.
- 저회전 재고(dead stock)의 처리 방안을 제안합니다.
- 품절 리스크가 있는 상품을 식별합니다.
- 재고 비용 절감 효과를 KRW로 제시합니다.
- actions에 "재고 현황 보기" 네비게이션 버튼을 포함하세요.`,

  cross_sell: `## 분석 지침 — 교차 판매 분석
- 상품 간 동시구매(co-purchase) 패턴을 분석합니다.
- 연관 규칙(association rules)을 도출합니다: 지지도, 신뢰도, 향상도
- 번들 프로모션과 인접 배치 기회를 식별합니다.
- 교차판매를 통한 객단가 증가 효과를 KRW로 추정합니다.
- actions에 "프로모션 설정" 버튼을 포함하세요.`,

  customer_segmentation: `## 분석 지침 — 고객 세분화
- 구매 행동, 방문 빈도, 선호 카테고리 기반으로 세그먼트를 정의합니다.
- 각 세그먼트의 크기, CLV(고객 생애 가치), 이탈 리스크를 분석합니다.
- 세그먼트별 타겟 마케팅 전략을 제안합니다.
- 상위 세그먼트 유지 및 이탈 방지 효과를 KRW로 추정합니다.
- actions에 "고객 분석 보기" 네비게이션 버튼을 포함하세요.`,

  anomaly_detection: `## 분석 지침 — 이상 탐지
- 통계적 기준(평균 ± 2σ)을 벗어나는 데이터를 식별합니다.
- 이상의 심각도를 critical/high/medium/low로 분류합니다.
- 원인 가설을 제시하고 검증 방법을 안내합니다.
- 방치 시 비즈니스 영향을 KRW로 추정합니다.
- actions에 "이상 상세 조사" 버튼을 포함하세요.`,

  general: `## 분석 지침 — 종합 분석
- 제공된 데이터를 종합적으로 분석하여 인사이트를 도출합니다.
- 가장 중요한 발견사항을 우선순위순으로 제시합니다.
- 개선 기회를 비즈니스 영향 기준으로 정렬합니다.
- 즉시 실행 가능한 액션과 중장기 전략을 구분하여 제안합니다.`,
};

// ============================================================================
// 데이터 컨텍스트 프롬프트 헬퍼
// ============================================================================

/**
 * KPI 데이터를 프롬프트에 포함할 수 있는 형태로 포맷합니다.
 *
 * @param kpis - KPI 데이터 배열
 * @returns 포맷된 문자열
 */
export function formatKPIDataForPrompt(
  kpis: Array<Record<string, unknown>>,
): string {
  if (!kpis || kpis.length === 0) {
    return '## KPI 데이터\n데이터가 없습니다.';
  }

  const lines = ['## 최근 KPI 데이터'];
  for (const kpi of kpis.slice(0, 7)) {
    const date = kpi.kpi_date ?? kpi.date ?? '날짜 없음';
    lines.push(`\n### ${date}`);
    for (const [key, value] of Object.entries(kpi)) {
      if (['id', 'store_id', 'user_id', 'created_at', 'updated_at'].includes(key)) continue;
      if (value === null || value === undefined) continue;
      lines.push(`- ${key}: ${typeof value === 'number' ? value.toLocaleString() : value}`);
    }
  }

  return lines.join('\n');
}

/**
 * 그래프 데이터(엔티티/관계)를 프롬프트에 포함할 수 있는 형태로 포맷합니다.
 *
 * @param graphData - 그래프 데이터
 * @param sampleSize - 샘플 크기 (기본 20)
 * @returns 포맷된 문자열
 */
export function formatGraphDataForPrompt(
  graphData: {
    entities: unknown[];
    relations: unknown[];
    stats: Record<string, unknown>;
  },
  sampleSize = 20,
): string {
  const lines = [
    '## 온톨로지 그래프 요약',
    `- 총 엔티티: ${graphData.stats.totalEntities ?? graphData.entities.length}`,
    `- 총 관계: ${graphData.stats.totalRelations ?? graphData.relations.length}`,
  ];

  if (graphData.stats.entityByType) {
    lines.push(`- 엔티티 유형: ${JSON.stringify(graphData.stats.entityByType)}`);
  }
  if (graphData.stats.relationByType) {
    lines.push(`- 관계 유형: ${JSON.stringify(graphData.stats.relationByType)}`);
  }

  lines.push('');
  lines.push(`### 엔티티 샘플 (상위 ${sampleSize}개)`);
  lines.push(JSON.stringify(
    graphData.entities.slice(0, sampleSize).map((e: any) => ({
      label: e.label,
      type: e.entity_type?.name,
      properties: e.properties,
    })),
    null,
    2,
  ));

  lines.push('');
  lines.push(`### 관계 샘플 (상위 ${sampleSize}개)`);
  lines.push(JSON.stringify(
    graphData.relations.slice(0, sampleSize).map((r: any) => ({
      source: r.source?.label,
      relation: r.relation_type?.name,
      target: r.target?.label,
      weight: r.weight,
    })),
    null,
    2,
  ));

  return lines.join('\n');
}

/**
 * 구역 데이터를 프롬프트에 포함할 수 있는 형태로 포맷합니다.
 *
 * @param zones - 구역 데이터 배열
 * @returns 포맷된 문자열
 */
export function formatZoneDataForPrompt(
  zones: Array<Record<string, unknown>>,
): string {
  if (!zones || zones.length === 0) {
    return '## 구역 데이터\n데이터가 없습니다.';
  }

  return `## 구역 데이터 (${zones.length}개 구역)\n${JSON.stringify(zones.slice(0, 20), null, 2)}`;
}

/**
 * 리테일 개념(컴퓨티드 KPI) 데이터를 프롬프트에 포함할 수 있는 형태로 포맷합니다.
 *
 * @param concepts - 리테일 개념 데이터
 * @returns 포맷된 문자열
 */
export function formatRetailConceptsForPrompt(
  concepts: Record<string, unknown>,
): string {
  if (!concepts || Object.keys(concepts).length === 0) {
    return '## 리테일 분석 개념\n데이터가 없습니다.';
  }

  return `## 리테일 분석 개념\n${JSON.stringify(concepts, null, 2)}`;
}
