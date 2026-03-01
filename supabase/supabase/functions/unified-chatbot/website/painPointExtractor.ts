/**
 * Pain Point Extractor - TASK 7
 *
 * 사용자 메시지에서 Pain Point를 자동으로 추출
 * topicRouter.ts 패턴을 따라 키워드 매칭 기반 분류
 */

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export type PainPointCategory =
  | 'cost_pressure'        // 비용 압박, 마진, 인건비
  | 'efficiency_gap'       // 생산성, 운영 효율
  | 'staffing_challenge'   // 인력 부족, 이직, 교육
  | 'technology_barrier'   // 기술 도입, 디지털화
  | 'data_insight_lack'    // 데이터 분석, KPI
  | 'compliance_risk'      // 규정, 안전, ESG
  | 'competition_threat';  // 경쟁, 시장 변화, 이커머스

export interface PainPointSignal {
  category: PainPointCategory;
  keywords: string[];
  keywordsKo: string[];
  weight: number;  // 1-3, 리드 스코어링 가중치
}

export interface PainPointResult {
  painPoints: PainPointCategory[];
  primaryPain: PainPointCategory | null;
  confidence: number;          // 0-1
  matchedKeywords: string[];
  summary: string;             // DB 저장용 요약
}

// ═══════════════════════════════════════════
//  Pain Point 시그널 정의
// ═══════════════════════════════════════════

const PAIN_POINT_SIGNALS: PainPointSignal[] = [
  {
    category: 'cost_pressure',
    keywords: [
      'cost', 'expensive', 'budget', 'margin', 'profit', 'savings', 'roi',
      'price', 'spend', 'investment', 'affordable', 'cheap', 'overpriced'
    ],
    keywordsKo: [
      '비용', '마진', '수익', '절감', '예산', '인건비', '비싸', '투자',
      '가격', '지출', '손익', '원가', '이익', '적자', '흑자'
    ],
    weight: 3
  },
  {
    category: 'efficiency_gap',
    keywords: [
      'efficiency', 'productivity', 'slow', 'bottleneck', 'time-consuming',
      'manual', 'waste', 'streamline', 'automate', 'optimize'
    ],
    keywordsKo: [
      '효율', '생산성', '느림', '병목', '시간', '낭비', '비효율',
      '수작업', '자동화', '최적화', '개선', '프로세스'
    ],
    weight: 2
  },
  {
    category: 'staffing_challenge',
    keywords: [
      'staffing', 'turnover', 'hiring', 'training', 'shortage', 'retention',
      'employee', 'workforce', 'talent', 'recruit', 'onboarding'
    ],
    keywordsKo: [
      '인력', '이직', '채용', '교육', '부족', '직원', '인원',
      '퇴사', '구인', '알바', '아르바이트', '스태프', '근무'
    ],
    weight: 2
  },
  {
    category: 'technology_barrier',
    keywords: [
      'technology', 'digital', 'legacy', 'outdated', 'integration', 'system',
      'software', 'upgrade', 'modern', 'innovation'
    ],
    keywordsKo: [
      '기술', '디지털', '레거시', '구식', '연동', '자동화',
      '시스템', '소프트웨어', '업그레이드', '혁신', 'IT'
    ],
    weight: 2
  },
  {
    category: 'data_insight_lack',
    keywords: [
      'data', 'analytics', 'insight', 'visibility', 'measurement', 'metrics',
      'report', 'dashboard', 'tracking', 'analysis'
    ],
    keywordsKo: [
      '데이터', '분석', '인사이트', '측정', '가시성', 'KPI',
      '리포트', '대시보드', '추적', '지표', '통계'
    ],
    weight: 2
  },
  {
    category: 'compliance_risk',
    keywords: [
      'compliance', 'regulation', 'safety', 'audit', 'risk', 'legal',
      'security', 'policy', 'standard', 'certification'
    ],
    keywordsKo: [
      '규정', '컴플라이언스', '안전', '감사', '리스크', '법규',
      '보안', '정책', '기준', '인증', 'ESG'
    ],
    weight: 1
  },
  {
    category: 'competition_threat',
    keywords: [
      'competition', 'competitor', 'market', 'threat', 'ecommerce', 'online',
      'amazon', 'coupang', 'disrupt', 'survive'
    ],
    keywordsKo: [
      '경쟁', '경쟁사', '시장', '위협', '이커머스', '온라인',
      '쿠팡', '아마존', '네이버', '오프라인', '생존'
    ],
    weight: 2
  }
];

// 부정적 표현 감지 (Pain Point 신뢰도 부스트)
const NEGATIVE_INDICATORS = [
  // English
  'problem', 'issue', 'challenge', 'difficult', 'hard', 'struggle',
  'pain', 'frustrat', 'worry', 'concern', 'fail', 'loss',
  // Korean
  '문제', '어려움', '고민', '힘들', '어렵', '걱정', '우려',
  '실패', '손실', '골치', '고충', '불만', '불편'
];

// ═══════════════════════════════════════════
//  유틸리티 함수
// ═══════════════════════════════════════════

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasNegativeIndicator(text: string): boolean {
  const normalized = normalizeText(text);
  return NEGATIVE_INDICATORS.some(indicator =>
    normalized.includes(indicator.toLowerCase())
  );
}

// ═══════════════════════════════════════════
//  메인 추출 함수
// ═══════════════════════════════════════════

export function extractPainPoints(
  message: string,
  conversationHistory: string[] = []
): PainPointResult {
  // 현재 메시지 + 최근 히스토리 결합 (히스토리는 30% 가중치)
  const normalizedMessage = normalizeText(message);
  const historyText = conversationHistory.slice(-2).join(' ');
  const normalizedHistory = normalizeText(historyText);

  const scores = new Map<PainPointCategory, { score: number; keywords: string[] }>();

  // 각 Pain Point 시그널에 대해 점수 계산
  for (const signal of PAIN_POINT_SIGNALS) {
    let score = 0;
    const matchedKeywords: string[] = [];

    // 영문 키워드 매칭
    for (const keyword of signal.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(normalizedMessage)) {
        score += 2 * signal.weight;
        matchedKeywords.push(keyword);
      } else if (normalizedMessage.includes(keyword.toLowerCase())) {
        score += 1 * signal.weight;
        matchedKeywords.push(keyword);
      }
      // 히스토리에서 발견 (30% 가중치)
      if (regex.test(normalizedHistory) || normalizedHistory.includes(keyword.toLowerCase())) {
        score += 0.3 * signal.weight;
      }
    }

    // 한글 키워드 매칭 (더 높은 점수 - 한글이 더 specific)
    for (const keyword of signal.keywordsKo) {
      if (normalizedMessage.includes(keyword)) {
        score += 2.5 * signal.weight;
        matchedKeywords.push(keyword);
      }
      // 히스토리에서 발견
      if (normalizedHistory.includes(keyword)) {
        score += 0.5 * signal.weight;
      }
    }

    if (score > 0) {
      scores.set(signal.category, { score, keywords: matchedKeywords });
    }
  }

  // 부정적 표현 감지 시 전체 점수 부스트
  const hasNegative = hasNegativeIndicator(message);
  if (hasNegative) {
    for (const [category, data] of scores) {
      scores.set(category, { ...data, score: data.score * 1.3 });
    }
  }

  // 점수순 정렬
  const sortedScores = Array.from(scores.entries())
    .sort((a, b) => b[1].score - a[1].score);

  // 결과 구성
  if (sortedScores.length === 0) {
    return {
      painPoints: [],
      primaryPain: null,
      confidence: 0,
      matchedKeywords: [],
      summary: ''
    };
  }

  const [primaryCategory, primaryData] = sortedScores[0];
  const maxPossibleScore = 20; // 대략적인 최대 점수
  const confidence = Math.min(primaryData.score / maxPossibleScore, 1);

  // 상위 2-3개 카테고리 선택 (점수가 1차의 40% 이상인 경우만)
  const painPoints: PainPointCategory[] = sortedScores
    .filter(([_, data]) => data.score >= primaryData.score * 0.4)
    .slice(0, 3)
    .map(([category]) => category);

  // 모든 매칭된 키워드 수집
  const allKeywords = sortedScores
    .flatMap(([_, data]) => data.keywords)
    .filter((v, i, a) => a.indexOf(v) === i); // 중복 제거

  // 요약 생성
  const summary = generateSummary(primaryCategory, allKeywords, hasNegative);

  return {
    painPoints,
    primaryPain: primaryCategory,
    confidence,
    matchedKeywords: allKeywords,
    summary
  };
}

// ═══════════════════════════════════════════
//  요약 생성
// ═══════════════════════════════════════════

const CATEGORY_NAMES: Record<PainPointCategory, string> = {
  cost_pressure: '비용/마진 압박',
  efficiency_gap: '운영 효율성 과제',
  staffing_challenge: '인력 관리 어려움',
  technology_barrier: '기술 도입 장벽',
  data_insight_lack: '데이터 인사이트 부족',
  compliance_risk: '규정/리스크 우려',
  competition_threat: '경쟁 위협'
};

function generateSummary(
  category: PainPointCategory,
  keywords: string[],
  hasNegative: boolean
): string {
  const categoryName = CATEGORY_NAMES[category];
  const keywordStr = keywords.slice(0, 3).join(', ');
  const negativeNote = hasNegative ? ' (명시적 고충 표현)' : '';

  return `${categoryName}: ${keywordStr}${negativeNote}`;
}

// ═══════════════════════════════════════════
//  가중치 조회 (salesBridge에서 사용)
// ═══════════════════════════════════════════

export function getPainPointWeight(category: PainPointCategory | null): number {
  if (!category) return 0;
  const signal = PAIN_POINT_SIGNALS.find(s => s.category === category);
  return signal?.weight || 0;
}
