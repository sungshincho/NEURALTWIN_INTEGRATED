/**
 * Suggestion Generator - TASK 7
 *
 * 토픽, Pain Point, 대화 단계에 기반한 후속 질문 생성
 * 사용자 engagement 유지 및 세일즈 전환 유도
 */

import { type PainPointCategory } from './painPointExtractor.ts';
import { type ConversationStage } from './salesBridge.ts';
import { type QuestionDepth } from './questionDepthAnalyzer.ts';

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export interface SuggestionContext {
  topicCategory: string;
  painPointCategory: PainPointCategory | null;
  conversationStage: ConversationStage;
  detectedKeywords: string[];
  turnCount: number;
  hasRecentVizDirective?: boolean;  // VizDirective가 최근에 생성되었는지 여부
  questionDepth?: QuestionDepth;    // 질문 깊이 (beginner/advanced)
}

export interface SuggestionResult {
  suggestions: string[];  // 2-3개
}

// ═══════════════════════════════════════════
//  토픽별 후속 질문 템플릿
// ═══════════════════════════════════════════

const TOPIC_TEMPLATES: Record<string, string[]> = {
  layout_flow: [
    '레이아웃 변경 시 예상 매출 효과는 어느 정도인가요?',
    '감압 구역(Decompression Zone) 최적화 사례가 있나요?',
    '우리 매장 동선 분석은 어떻게 하나요?',
    '히트맵 분석으로 무엇을 알 수 있나요?',
    '매장 레이아웃 A/B 테스트 방법이 궁금해요'
  ],
  vmd_display: [
    '골든존 진열 우선순위는 어떻게 정하나요?',
    'VMD 성과 측정 방법이 궁금해요',
    '시즌 VMD 교체 주기 추천해 주세요',
    '엔드캡 진열 효과는 어느 정도인가요?',
    'POP 배치 최적화 방법이 있나요?'
  ],
  sales_conversion: [
    '전환율 목표 설정 기준은 무엇인가요?',
    '피팅룸 전환율 개선 방법이 있나요?',
    '업셀링 스크립트 예시가 있나요?',
    '객단가 높이는 실질적인 방법은?',
    '결제 전환율 개선 포인트가 궁금해요'
  ],
  inventory_supply: [
    '재고 회전율 최적화 방법이 궁금해요',
    '안전 재고 수준 계산 방법은?',
    '사입 타이밍 최적화는 어떻게 하나요?',
    'SKU별 재고 관리 전략이 있나요?',
    '시즌 재고 처리 전략을 알려주세요'
  ],
  customer_analytics: [
    '고객 세그먼트 분류 기준이 궁금해요',
    'RFM 분석 활용 방법을 알려주세요',
    '충성 고객 유지 전략이 있나요?',
    '고객 이탈 예측은 어떻게 하나요?',
    '개인화 마케팅 시작 방법이 궁금해요'
  ],
  staff_productivity: [
    '직원 생산성 측정 지표는 무엇인가요?',
    '피크 타임 인력 배치 최적화 방법은?',
    '직원 교육 효과 측정 방법이 있나요?',
    '이직률 낮추는 실질적 방법이 궁금해요',
    '인센티브 설계 모범 사례가 있나요?'
  ],
  data_kpi: [
    'KPI 대시보드 핵심 지표 추천해 주세요',
    '데이터 기반 의사결정 시작 방법은?',
    '매장별 성과 비교 기준이 궁금해요',
    '실시간 모니터링이 필요한 지표는?',
    '데이터 수집 우선순위를 알려주세요'
  ],
  pricing_promotion: [
    '다이나믹 프라이싱 적용 방법이 궁금해요',
    '프로모션 효과 측정 방법은?',
    '할인율 최적화 전략이 있나요?',
    '번들 상품 가격 책정 기준은?',
    '가격 탄력성 분석 방법을 알려주세요'
  ],
  retail_tech: [
    '매장 디지털화 단계별 로드맵이 궁금해요',
    'POS 시스템 현대화 방법은?',
    'IoT 센서 도입 효과가 궁금해요',
    'RFID 도입 ROI 계산 방법은?',
    '옴니채널 통합 시작점이 궁금해요'
  ],
  digital_twin: [
    '디지털 트윈으로 무엇을 시뮬레이션할 수 있나요?',
    '시뮬레이션 정확도는 어느 정도인가요?',
    '디지털 트윈 구축 기간이 궁금해요',
    '실제 도입 사례가 있나요?',
    '데모를 볼 수 있나요?'
  ],
  neuraltwin_solution: [
    'NEURALTWIN 주요 기능이 궁금해요',
    '도입 비용은 어느 정도인가요?',
    '유사 업종 도입 사례가 있나요?',
    '도입 절차는 어떻게 되나요?',
    '데모 또는 상담을 요청하고 싶어요'
  ],
  general_retail: [
    '리테일 트렌드 중 주목해야 할 것은?',
    '매출 향상을 위한 첫 단계가 궁금해요',
    '성공적인 매장 운영 핵심 요소는?',
    '고객 경험 개선 방법이 궁금해요',
    '경쟁력 강화 전략을 알려주세요'
  ]
};

// ═══════════════════════════════════════════
//  고급 질문자용 심화 후속 질문 템플릿
// ═══════════════════════════════════════════

const ADVANCED_TOPIC_TEMPLATES: Record<string, string[]> = {
  layout_flow: [
    '레이아웃 변경 전후 전환율 차이를 수치로 비교해줘',
    '소형 매장 vs 대형 매장에서 동선 설계 원칙이 어떻게 달라져?',
    '동선 최적화 실패 사례와 원인을 알려줘',
    '히트맵 데이터 기반 레이아웃 A/B 테스트 방법론은?',
  ],
  vmd_display: [
    '골든존 전략의 업종별 ROI 차이를 비교해줘',
    'VMD 교체 주기별 매출 임팩트 데이터가 있나요?',
    '엔드캡 vs 파워월 진열의 전환율 차이는?',
    'VMD 투자 대비 수익률 계산 프레임워크를 알려줘',
  ],
  sales_conversion: [
    '전환율 목표를 업종·규모별로 세분화해서 알려줘',
    '피팅룸 전환율과 매장 크기의 상관관계가 있나요?',
    '객단가와 전환율의 트레이드오프는 어떻게 관리해?',
    '업셀링 전략의 실패 패턴과 대응법은?',
  ],
  customer_analytics: [
    'RFM 세그먼트별 CLV 차이를 정량적으로 분석해줘',
    '고객 이탈 예측 모델의 정확도 벤치마크는?',
    '개인화 마케팅의 ROI를 측정하는 프레임워크가 있나요?',
    '오프라인 고객 데이터와 온라인 행동 데이터를 어떻게 통합해?',
  ],
  data_kpi: [
    'KPI 간 상관관계와 인과관계를 구분하는 방법은?',
    '매장별 성과 비교 시 정규화 기준은 어떻게 잡나요?',
    '데이터 기반 의사결정의 흔한 함정과 바이어스는?',
    'GMROI와 재고 회전율의 최적 밸런스 포인트는?',
  ],
  general_retail: [
    '한국 리테일 시장만의 특수한 성공 패턴이 있나요?',
    '글로벌 트렌드 중 한국에서 실패한 사례와 원인은?',
    '오프라인 매장의 온라인 대비 경쟁 우위를 정량화할 수 있나요?',
    '리테일 테크 도입 ROI를 업종별로 비교해줘',
  ],
};

// ═══════════════════════════════════════════
//  Pain Point별 후속 질문 템플릿 (우선순위 높음)
// ═══════════════════════════════════════════

const PAIN_POINT_TEMPLATES: Record<PainPointCategory, string[]> = {
  cost_pressure: [
    'ROI가 높은 개선 영역은 어디인가요?',
    '비용 대비 효과가 좋은 시작점은?',
    '투자 회수 기간은 보통 얼마나 되나요?',
    '마진 개선에 가장 효과적인 방법은?'
  ],
  efficiency_gap: [
    '자동화로 개선 가능한 영역은 어디인가요?',
    '생산성 측정 방법이 궁금해요',
    '효율 개선 우선순위 설정 방법은?',
    '프로세스 병목 진단 방법이 있나요?'
  ],
  staffing_challenge: [
    '최적 인력 배치 계산 방법이 궁금해요',
    '직원 교육 효율화 방법이 있나요?',
    '이직률 분석 및 개선 방법은?',
    '인력 예측 모델이 가능한가요?'
  ],
  technology_barrier: [
    '단계적 디지털화 로드맵이 궁금해요',
    '레거시 시스템 연동 방법이 있나요?',
    '기술 도입 리스크 최소화 방법은?',
    '성공적인 기술 도입 사례가 있나요?'
  ],
  data_insight_lack: [
    '데이터 수집 시작 방법이 궁금해요',
    '의미 있는 인사이트 추출 방법은?',
    'KPI 대시보드 구축 방법이 있나요?',
    '데이터 기반 의사결정 첫 단계는?'
  ],
  compliance_risk: [
    '규정 준수 체크리스트가 있나요?',
    '리스크 모니터링 자동화 방법은?',
    '안전 관리 우선순위가 궁금해요',
    'ESG 대응 시작점을 알려주세요'
  ],
  competition_threat: [
    '경쟁사 분석 방법이 궁금해요',
    '차별화 전략 수립 방법은?',
    '온라인과의 경쟁 전략이 있나요?',
    '시장 변화 대응 방법을 알려주세요'
  ]
};

// ═══════════════════════════════════════════
//  대화 단계별 특수 템플릿
// ═══════════════════════════════════════════

const STAGE_TEMPLATES: Record<ConversationStage, string[]> = {
  awareness: [
    '어떤 부분이 가장 궁금하세요?',
    '현재 매장 운영에서 가장 큰 고민은?',
    '더 자세히 알고 싶은 주제가 있나요?'
  ],
  interest: [
    '이 부분을 더 깊이 살펴볼까요?',
    '실제 적용 사례가 궁금하세요?',
    '구체적인 수치나 벤치마크가 필요하세요?'
  ],
  consideration: [
    'NEURALTWIN 데모를 볼 수 있나요?',
    '유사 업종 도입 사례가 있나요?',
    '도입 절차는 어떻게 되나요?',
    '비용과 기대 효과를 알려주세요'
  ],
  decision: [
    '데모 신청 방법이 궁금해요',
    '담당자와 상담할 수 있나요?',
    '도입 비용은 어느 정도인가요?',
    '계약 및 시작 절차를 알려주세요'
  ]
};

// ═══════════════════════════════════════════
//  시각화(Viz) 관련 후속 질문 템플릿
// ═══════════════════════════════════════════

const VIZ_SUGGESTION_TEMPLATES: string[] = [
  '매장 레이아웃을 3D로 보여줘',
  '다른 업종 매장도 비교해줘',
  '동선 분석을 시각화해줘',
  '히트맵으로 고객 동선을 확인해줘',
  '시뮬레이션 결과를 시각적으로 보여줘',
  '매장 구역별 성과를 차트로 보여줘',
];

// Viz 제안이 유효한 토픽 목록
const VIZ_RELEVANT_TOPICS = [
  'layout_flow',
  'vmd_display',
  'customer_analytics',
  'digital_twin',
  'data_kpi',
  'retail_tech',
];

// ═══════════════════════════════════════════
//  세일즈 브릿지 후속 질문 템플릿
//  consideration/decision 단계에서 리드 전환 유도
// ═══════════════════════════════════════════

const SALES_BRIDGE_TEMPLATES: string[] = [
  '우리 매장에 맞는 컨설팅 받아보고 싶어',
  '구체적인 개선 제안서를 받아볼 수 있나요?',
  '무료 매장 진단을 신청할 수 있나요?',
  '도입 전 ROI 시뮬레이션을 해볼 수 있나요?',
  '담당 컨설턴트와 직접 상담할 수 있나요?',
];

// ═══════════════════════════════════════════
//  Pain Point 직접 대응 후속 질문 (followup)
//  Pain Point가 감지되면 해당 고충을 직접 해결하는 제안
// ═══════════════════════════════════════════

const PAIN_POINT_FOLLOWUP_TEMPLATES: Record<PainPointCategory, string[]> = {
  cost_pressure: [
    '우리 매장 비용 구조를 진단받아볼 수 있나요?',
    '마진 개선 시뮬레이션을 돌려볼 수 있나요?',
  ],
  efficiency_gap: [
    '운영 효율 개선 포인트를 자동으로 분석해줘',
    '우리 매장의 병목 구간을 진단해줘',
  ],
  staffing_challenge: [
    '최적 인력 배치 시뮬레이션을 해줄 수 있나요?',
    '직원 생산성 벤치마크를 비교해줘',
  ],
  technology_barrier: [
    '우리 매장에 맞는 디지털화 로드맵을 제안해줘',
    '기술 도입 ROI를 계산해줄 수 있나요?',
  ],
  data_insight_lack: [
    '우리 매장 데이터를 자동 분석해줄 수 있나요?',
    '핵심 KPI 대시보드를 구성해줘',
  ],
  compliance_risk: [
    '매장 안전/규정 체크리스트를 만들어줘',
    '리스크 모니터링 방안을 제안해줘',
  ],
  competition_threat: [
    '경쟁 매장 대비 우리의 강점을 분석해줘',
    '차별화 전략 시뮬레이션을 해볼 수 있나요?',
  ],
};

// ═══════════════════════════════════════════
//  메인 생성 함수
// ═══════════════════════════════════════════

export function generateSuggestions(context: SuggestionContext): SuggestionResult {
  const candidates: string[] = [];
  const reservedSuggestions: string[] = [];  // 반드시 포함될 제안 슬롯

  // ── 1. Pain Point followup: 감지 시 반드시 1개 확보 ──
  if (context.painPointCategory && PAIN_POINT_FOLLOWUP_TEMPLATES[context.painPointCategory]) {
    const followups = PAIN_POINT_FOLLOWUP_TEMPLATES[context.painPointCategory];
    const filtered = filterSuggestions(followups, context.detectedKeywords);
    if (filtered.length > 0) {
      // 예약 슬롯에 1개 확보 (나머지는 일반 후보에 추가)
      const shuffledFollowups = shuffleArray(filtered);
      reservedSuggestions.push(shuffledFollowups[0]);
      // 기존 Pain Point 템플릿도 후보에 추가
      candidates.push(...PAIN_POINT_TEMPLATES[context.painPointCategory]);
    }
  }

  // ── 2. 세일즈 브릿지: consideration/decision 단계에서 리드 전환 유도 ──
  if (context.conversationStage === 'consideration' || context.conversationStage === 'decision') {
    // 기존 단계 템플릿도 포함
    candidates.push(...STAGE_TEMPLATES[context.conversationStage]);
    // 세일즈 브릿지 제안 중 1개를 예약 (아직 예약 슬롯에 여유가 있을 때)
    const bridgeFiltered = filterSuggestions(SALES_BRIDGE_TEMPLATES, context.detectedKeywords);
    if (bridgeFiltered.length > 0 && reservedSuggestions.length < 2) {
      const shuffledBridge = shuffleArray(bridgeFiltered);
      reservedSuggestions.push(shuffledBridge[0]);
    } else {
      // 여유 없으면 일반 후보에 추가
      candidates.push(...SALES_BRIDGE_TEMPLATES);
    }
  }

  // ── 3. Viz 관련 제안: 관련 토픽이고, 최근 VizDirective가 없을 때 ──
  if (
    VIZ_RELEVANT_TOPICS.includes(context.topicCategory) &&
    !context.hasRecentVizDirective
  ) {
    const vizFiltered = filterSuggestions(VIZ_SUGGESTION_TEMPLATES, context.detectedKeywords);
    if (vizFiltered.length > 0) {
      candidates.push(...vizFiltered);
    }
  }

  // ── 4. Pain Point 일반 템플릿 (감지된 경우 우선) ──
  if (context.painPointCategory && PAIN_POINT_TEMPLATES[context.painPointCategory]) {
    // followup에서 이미 추가했으면 중복 방지 (Set으로 처리됨)
    candidates.push(...PAIN_POINT_TEMPLATES[context.painPointCategory]);
  }

  // ── 5. 토픽별 템플릿 (깊이 인식) ──
  if (context.questionDepth === 'advanced') {
    const advancedTemplates = ADVANCED_TOPIC_TEMPLATES[context.topicCategory] || ADVANCED_TOPIC_TEMPLATES['general_retail'];
    if (advancedTemplates) candidates.push(...advancedTemplates);
  }
  const topicTemplates = TOPIC_TEMPLATES[context.topicCategory] || TOPIC_TEMPLATES['general_retail'];
  candidates.push(...topicTemplates);

  // ── 6. awareness/interest 단계 템플릿 (후순위) ──
  if (context.conversationStage === 'awareness' || context.conversationStage === 'interest') {
    candidates.push(...STAGE_TEMPLATES[context.conversationStage]);
  }

  // ── 7. 중복 제거 및 키워드 유사도 필터링 ──
  const uniqueCandidates = filterSuggestions(candidates, context.detectedKeywords);

  // ── 8. 예약 슬롯 제외 후 나머지 셔플 ──
  const reservedSet = new Set(reservedSuggestions);
  const remainingCandidates = uniqueCandidates.filter(c => !reservedSet.has(c));
  const shuffled = shuffleArray(remainingCandidates);

  // ── 9. 최종 조합: 예약 슬롯 + 나머지에서 채움 ──
  const totalCount = context.conversationStage === 'decision' ? 2 : 3;
  const remainingSlots = totalCount - reservedSuggestions.length;
  const fillers = shuffled.slice(0, Math.max(0, remainingSlots));
  const suggestions = [...reservedSuggestions, ...fillers].slice(0, totalCount);

  return { suggestions };
}

// ═══════════════════════════════════════════
//  유틸리티 함수
// ═══════════════════════════════════════════

// 역질문 / 되묻기 패턴 (사용자가 하지 않을 법한 형태)
const REVERSE_QUESTION_PATTERNS = [
  /어떤\s*(부분|주제|분야|점).*궁금/,
  /가장\s*큰\s*(고민|어려움|문제|과제)/,
  /더\s*자세히\s*알고\s*싶은/,
  /어떤\s*(업종|매장|분야).*관심/,
  /무엇.*도움.*드릴/,
  /어떤.*도움.*필요/,
  /궁금.*있으세요/,
  /알려드릴까요/,
  /말씀해\s*주세요/,
  /어떠세요\?$/,
];

function filterSuggestions(candidates: string[], detectedKeywords: string[]): string[] {
  // 중복 제거
  const unique = [...new Set(candidates)];

  return unique.filter(suggestion => {
    const suggestionLower = suggestion.toLowerCase();

    // 1. 역질문 패턴 필터링 — 되묻는 형태의 프리셋 제거
    if (REVERSE_QUESTION_PATTERNS.some(p => p.test(suggestion))) {
      return false;
    }

    // 2. 이미 대화에서 언급된 키워드와 너무 유사한 제안 필터링
    if (detectedKeywords.length === 0) return true;
    const matchCount = detectedKeywords.filter(kw =>
      suggestionLower.includes(kw.toLowerCase())
    ).length;
    return matchCount < 2;
  });
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ═══════════════════════════════════════════
//  특수 상황용 고정 제안
// ═══════════════════════════════════════════

export function getWelcomeSuggestions(): string[] {
  return [
    '매장 운영 효율화 방법이 궁금해요',
    '매출 향상 전략을 알려주세요',
    'NEURALTWIN은 어떤 서비스인가요?'
  ];
}

export function getErrorRecoverySuggestions(): string[] {
  return [
    '다른 질문을 해볼게요',
    '처음부터 다시 시작할게요',
    '상담원과 연결해 주세요'
  ];
}
