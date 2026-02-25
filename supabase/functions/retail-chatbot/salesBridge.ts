/**
 * Sales Bridge - TASK 7
 *
 * 대화 맥락을 분석하여 리드 점수 계산 및 리드 폼 표시 결정
 * 대화 단계 (Awareness → Interest → Consideration → Decision) 추적
 */

import { type PainPointCategory, getPainPointWeight } from './painPointExtractor.ts';

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export type ConversationStage =
  | 'awareness'      // 초기 탐색, 일반 질문
  | 'interest'       // 특정 토픽 관심, 반복 방문
  | 'consideration'  // Pain Point 표현, 솔루션 비교
  | 'decision';      // 데모/연락 준비, 명시적 관심

export interface SalesBridgeSignals {
  turnCount: number;
  painPointDetected: boolean;
  primaryPainCategory: PainPointCategory | null;
  topicCategory: string;
  hasExplicitInterest: boolean;
  repeatTopics: boolean;
}

export interface SalesBridgeResult {
  showLeadForm: boolean;
  leadScore: number;            // 0-100
  stage: ConversationStage;
  triggerReason: string;        // 이벤트 로깅용
}

// ═══════════════════════════════════════════
//  상수 정의
// ═══════════════════════════════════════════

// 높은 가치 토픽 (NEURALTWIN 솔루션과 직결)
const HIGH_VALUE_TOPICS = [
  'digital_twin',
  'retail_tech',
  'neuraltwin_solution',
  'data_kpi'
];

// 명시적 관심 표현 키워드
const EXPLICIT_INTEREST_KEYWORDS = [
  // English
  'demo', 'pricing', 'price', 'cost', 'contact', 'trial', 'quote',
  'meeting', 'call', 'schedule', 'interested', 'buy', 'purchase',
  // Korean
  '데모', '가격', '견적', '문의', '연락', '상담', '미팅',
  '구매', '도입', '계약', '비용', '투자', '관심있', '알고싶'
];

// ═══════════════════════════════════════════
//  명시적 관심 감지
// ═══════════════════════════════════════════

export function checkExplicitInterest(message: string): boolean {
  const normalized = message.toLowerCase();
  return EXPLICIT_INTEREST_KEYWORDS.some(keyword =>
    normalized.includes(keyword.toLowerCase())
  );
}

// ═══════════════════════════════════════════
//  리드 점수 계산
// ═══════════════════════════════════════════

function calculateLeadScore(signals: SalesBridgeSignals): number {
  let score = 0;

  // 1. 대화 턴 수 기반 점수 (engagement depth)
  if (signals.turnCount >= 3) score += 20;
  if (signals.turnCount >= 5) score += 10;
  if (signals.turnCount >= 7) score += 10;

  // 2. Pain Point 감지 시 부스트
  if (signals.painPointDetected) {
    score += 25;
    // 가중치가 높은 Pain Point (cost_pressure = 3)
    const painWeight = getPainPointWeight(signals.primaryPainCategory);
    if (painWeight >= 2) score += 10;
    if (painWeight >= 3) score += 5;
  }

  // 3. 고가치 토픽 점수
  if (HIGH_VALUE_TOPICS.includes(signals.topicCategory)) {
    score += 20;
    // NEURALTWIN 솔루션 토픽은 추가 점수
    if (signals.topicCategory === 'neuraltwin_solution') {
      score += 15;
    }
  }

  // 4. 명시적 관심 표현
  if (signals.hasExplicitInterest) {
    score += 30;
  }

  // 5. 토픽 반복 (같은 주제 지속 관심)
  if (signals.repeatTopics) {
    score += 10;
  }

  return Math.min(score, 100);
}

// ═══════════════════════════════════════════
//  대화 단계 결정
// ═══════════════════════════════════════════

function determineStage(score: number, signals: SalesBridgeSignals): ConversationStage {
  // 명시적 관심 표현은 바로 decision
  if (signals.hasExplicitInterest) {
    return 'decision';
  }

  // 점수 기반 단계 결정
  if (score >= 70) return 'decision';
  if (score >= 50) return 'consideration';
  if (score >= 30) return 'interest';
  return 'awareness';
}

// ═══════════════════════════════════════════
//  리드 폼 표시 결정
// ═══════════════════════════════════════════

function shouldShowLeadForm(
  score: number,
  stage: ConversationStage,
  signals: SalesBridgeSignals
): { show: boolean; reason: string } {
  // 1. decision 단계 = 무조건 표시
  if (stage === 'decision') {
    return {
      show: true,
      reason: signals.hasExplicitInterest
        ? 'explicit_interest_detected'
        : 'high_engagement_score'
    };
  }

  // 2. consideration 단계 + Pain Point 감지
  if (stage === 'consideration' && signals.painPointDetected) {
    return {
      show: true,
      reason: 'pain_point_in_consideration'
    };
  }

  // 3. 점수가 65 이상이면 표시
  if (score >= 65) {
    return {
      show: true,
      reason: 'threshold_score_reached'
    };
  }

  // 4. 고가치 토픽 + 3턴 이상
  if (HIGH_VALUE_TOPICS.includes(signals.topicCategory) && signals.turnCount >= 3) {
    return {
      show: true,
      reason: 'high_value_topic_engagement'
    };
  }

  return {
    show: false,
    reason: 'below_threshold'
  };
}

// ═══════════════════════════════════════════
//  메인 평가 함수
// ═══════════════════════════════════════════

export function evaluateSalesBridge(signals: SalesBridgeSignals): SalesBridgeResult {
  const leadScore = calculateLeadScore(signals);
  const stage = determineStage(leadScore, signals);
  const { show: showLeadForm, reason: triggerReason } = shouldShowLeadForm(
    leadScore,
    stage,
    signals
  );

  return {
    showLeadForm,
    leadScore,
    stage,
    triggerReason
  };
}

// ═══════════════════════════════════════════
//  유틸리티 함수
// ═══════════════════════════════════════════

export function isHighValueTopic(topicCategory: string): boolean {
  return HIGH_VALUE_TOPICS.includes(topicCategory);
}

export function getStageLabel(stage: ConversationStage): string {
  const labels: Record<ConversationStage, string> = {
    awareness: '탐색',
    interest: '관심',
    consideration: '검토',
    decision: '결정'
  };
  return labels[stage];
}
