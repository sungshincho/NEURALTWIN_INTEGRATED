/**
 * Question Depth Analyzer — Phase 0
 *
 * 사용자 질문의 수준(beginner / advanced)을 감지하여
 * 시스템 프롬프트에서 응답 깊이를 조절하는 독립 모듈.
 *
 * 6가지 고급 신호 패턴:
 * 1. 비교/트레이드오프 질문 (A vs B, 장단점)
 * 2. 조건부/시나리오 질문 (만약~, ~일 때)
 * 3. 수치/데이터 요청 (ROI, 전환율, 벤치마크)
 * 4. 복합 조건 (소형 매장 + 패션 + 낮은 예산)
 * 5. 전문 용어 사용 (VMD, Planogram, GMROI 등)
 * 6. 반론/심화 요청 (근거가 뭔가요, 실패 사례는)
 */

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export type QuestionDepth = 'beginner' | 'advanced';

export interface DepthSignal {
  type: string;
  matched: string;
  weight: number;
}

export interface DepthAnalysis {
  depth: QuestionDepth;
  confidence: number;      // 0.0 ~ 1.0
  signals: DepthSignal[];
  score: number;           // 원점수 (디버깅용)
}

// ═══════════════════════════════════════════
//  고급 신호 패턴
// ═══════════════════════════════════════════

// 1. 비교/트레이드오프
const COMPARISON_PATTERNS = [
  /(.+)\s*vs\.?\s*(.+)/i,
  /(.+)(이랑|하고|과|와)\s*(.+)\s*(비교|차이|뭐가 다|뭐가 나|어떤 게)/,
  /(장단점|트레이드오프|trade-?off|pros\s*(?:and|&)\s*cons)/i,
  /(뭐가 나아|뭐가 더 좋|어느 쪽|어떤 게 맞)/,
  /(차이점|차이가|다른 점|구분)/,
];

// 2. 조건부/시나리오
const CONDITIONAL_PATTERNS = [
  /(만약|만일|~라면|~하면|~일 때|~인 경우|~할 경우)/,
  /(우리 매장|우리 가게|저희 매장|저희 가게|우리 브랜드)/,
  /(\d+평|\d+㎡|\d+m²|\d+제곱)/,
  /(상권|역세권|주택가|오피스|대학가|관광지)/,
  /(예산이?\s*(없|적|부족|한정|제한))/,
  /(인력이?\s*(없|적|부족)|1인\s*운영|혼자)/,
];

// 3. 수치/데이터 요청
const DATA_REQUEST_PATTERNS = [
  /(ROI|투자\s*수익|투자\s*대비|투자\s*회수)/i,
  /(전환율|CR|conversion)/i,
  /(객단가|ATV|UPT|평균\s*구매)/i,
  /(벤치마크|benchmark|기준\s*수치|업계\s*평균)/i,
  /(몇\s*%|몇\s*퍼센트|몇\s*프로|얼마나\s*(오|올|늘|증가|감소|줄))/,
  /(데이터|수치|통계|근거|출처)/,
];

// 4. 복합 조건 (2개 이상 조건 결합)
const COMPOUND_CONDITION_MARKERS = [
  /(소형|중형|대형)\s*(매장|가게|점포)/,
  /(패션|F&B|카페|편의점|드럭스토어|백화점|뷰티|화장품)/,
  /(저예산|고예산|예산\s*\d+|비용\s*\d+)/,
  /(리뉴얼|오픈|신규|기존|리모델링)/,
  /(온라인|오프라인|옴니채널|멀티채널)/,
];

// 5. 전문 용어
const EXPERT_TERMS = [
  /VMD/i, /planogram/i, /GMROI/i, /SPLH/i, /SKU/i,
  /골든존|golden\s*zone/i, /감압\s*구간|decompression/i,
  /히트맵|heat\s*map/i, /동선\s*분석/,
  /RFM/i, /CLV|LTV/i, /CAC/i, /NPS/i,
  /카니발리제이션|cannibalization/i,
  /크로스\s*머천다이징|cross[\s-]*merchandising/i,
  /페이스아웃|face[\s-]*out/i, /슬리브아웃|sleeve[\s-]*out/i,
  /엔드캡|end[\s-]*cap/i, /곤돌라|gondola/i,
  /파워\s*월|power\s*wall/i, /앵커|anchor/i,
  /디지털\s*트윈|digital\s*twin/i,
  /옴니채널|omnichannel/i,
  /리테일\s*미디어|retail\s*media/i,
  /유니파이드\s*커머스|unified\s*commerce/i,
  /에이전틱|agentic/i,
  /shrinkage|재고\s*손실/i,
  /ORC|조직적\s*소매/i,
  /ESL|전자\s*가격표/i,
  /BOPIS|BORIS/i,
  /CDP|퍼스트파티/i,
];

// 6. 반론/심화 요청
const DEEP_DIVE_PATTERNS = [
  /(근거|출처|소스|레퍼런스|reference|source)/i,
  /(왜|왜\s*그런|이유가\s*뭐|원인이\s*뭐)/,
  /(실패\s*사례|실패\s*원인|안\s*되는\s*이유|리스크|위험)/,
  /(반대\s*의견|반론|다른\s*관점|비판|한계|단점만)/,
  /(심화|더\s*깊|구체적으로|상세하게|자세히|디테일)/,
  /(실무|현장|실전|현실|실제로|실질적)/,
  /(고급|어드밴스|advanced|expert|전문가\s*수준)/i,
];

// ═══════════════════════════════════════════
//  대화 히스토리 기반 신호
// ═══════════════════════════════════════════

// 멀티턴 심화 요청 감지 (3턴 이상 + 같은 토픽)
function detectMultiTurnDepth(historyTexts: string[]): number {
  if (historyTexts.length < 4) return 0; // 최소 4턴(2라운드) 필요
  // 최근 4개 메시지에서 심화 패턴 등장 횟수
  const recentMsgs = historyTexts.slice(-4);
  let deepCount = 0;
  for (const msg of recentMsgs) {
    if (DEEP_DIVE_PATTERNS.some(p => p.test(msg))) deepCount++;
    if (DATA_REQUEST_PATTERNS.some(p => p.test(msg))) deepCount++;
  }
  return deepCount >= 2 ? 0.3 : 0;
}

// ═══════════════════════════════════════════
//  메인 분석 함수
// ═══════════════════════════════════════════

export function analyzeQuestionDepth(
  message: string,
  historyTexts: string[] = []
): DepthAnalysis {
  const signals: DepthSignal[] = [];
  let score = 0;

  // 1. 비교/트레이드오프 (가중치 0.3)
  for (const pattern of COMPARISON_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      signals.push({ type: 'comparison', matched: match[0].slice(0, 40), weight: 0.3 });
      score += 0.3;
      break;
    }
  }

  // 2. 조건부/시나리오 (가중치 0.25)
  let conditionalCount = 0;
  for (const pattern of CONDITIONAL_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      conditionalCount++;
      if (conditionalCount <= 2) {
        signals.push({ type: 'conditional', matched: match[0].slice(0, 30), weight: 0.25 });
        score += 0.25;
      }
    }
  }

  // 3. 수치/데이터 요청 (가중치 0.2)
  for (const pattern of DATA_REQUEST_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      signals.push({ type: 'data_request', matched: match[0].slice(0, 30), weight: 0.2 });
      score += 0.2;
      break;
    }
  }

  // 4. 복합 조건 (2개 이상 매칭 시 가중치 0.3)
  let compoundCount = 0;
  for (const pattern of COMPOUND_CONDITION_MARKERS) {
    if (pattern.test(message)) compoundCount++;
  }
  if (compoundCount >= 2) {
    signals.push({ type: 'compound_condition', matched: `${compoundCount}개 조건 결합`, weight: 0.3 });
    score += 0.3;
  }

  // 5. 전문 용어 (개당 0.15, 최대 0.45)
  let termCount = 0;
  for (const pattern of EXPERT_TERMS) {
    const match = message.match(pattern);
    if (match && termCount < 3) {
      signals.push({ type: 'expert_term', matched: match[0], weight: 0.15 });
      score += 0.15;
      termCount++;
    }
  }

  // 6. 반론/심화 요청 (가중치 0.3)
  for (const pattern of DEEP_DIVE_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      signals.push({ type: 'deep_dive', matched: match[0].slice(0, 30), weight: 0.3 });
      score += 0.3;
      break;
    }
  }

  // 7. 대화 히스토리 보너스
  const historyBonus = detectMultiTurnDepth(historyTexts);
  if (historyBonus > 0) {
    signals.push({ type: 'multi_turn_depth', matched: '멀티턴 심화 패턴', weight: historyBonus });
    score += historyBonus;
  }

  // 8. 메시지 길이 보너스 (100자 이상이면 약간의 가중)
  if (message.length > 100) {
    score += 0.1;
  }

  // ── 판정: 0.5 이상이면 advanced ──
  const depth: QuestionDepth = score >= 0.5 ? 'advanced' : 'beginner';
  const confidence = Math.min(1.0, score / 1.5); // 1.5를 최대 신뢰도 기준

  return { depth, confidence, signals, score };
}

// ═══════════════════════════════════════════
//  깊이별 시스템 프롬프트 주입 텍스트
// ═══════════════════════════════════════════

export function getDepthInstruction(depth: QuestionDepth): string {
  if (depth === 'advanced') {
    return `
[질문 수준: 고급 — 실무자/전문가 수준의 깊은 답변 필요]

이 사용자는 리테일 실무 경험이 있거나 전문적인 질문을 하고 있습니다.
다음 원칙으로 답변하세요:

1) "교과서적 원칙" → "현장에서 실제로 다른 점" 구조로 답변
   - 먼저 일반적인 원칙을 간단히 언급하고
   - "하지만 현장에서는..." 또는 "실제로는..." 으로 실무 관점 전환
   - 한국 시장 특수성 반드시 반영

2) 구체적 수치와 조건을 명시
   - "매출이 오릅니다" 대신 "SPA 업종 기준 전환율 8~15% 개선 사례가 있습니다"
   - "효과적입니다" 대신 "20평 이하 매장에서 객단가 25% 상승 데이터가 있습니다"

3) 흔한 실수나 실패 사례를 함께 언급
   - "이렇게 하면 됩니다"로 끝내지 말고
   - "단, 이런 실수를 하면 역효과입니다" 또는 "실패한 사례로는..."도 포함

4) 글로벌 vs 한국 비교 관점
   - 해외 사례를 인용할 때 한국에서 적용 가능한지 현실적 판단 추가
   - "이 전략은 미국 대형 매장에서는 효과적이지만, 한국 소형 매장에서는..."

5) 조건별 차등 제안
   - 매장 규모, 업종, 예산에 따라 다른 접근법을 제시
   - "50평 이상이라면 A, 30평 이하라면 B가 더 적합합니다"`;
  }

  // beginner — 기본 (추가 지시 없음, 기존 프롬프트대로)
  return '';
}
