/**
 * Insight Accumulator — Phase 2 (Layer 3)
 *
 * 턴별 대화 인사이트를 축적하여 멀티턴 맥락 유지
 * 규칙 기반 (AI 호출 없음, 레이턴시 0)
 *
 * 축적 내용:
 * - 각 턴의 핵심 토픽
 * - 사용자 의도 분류 (learning, problem_solving, comparison, planning)
 * - 핵심 키포인트 요약
 * - 언급된 엔티티
 */

import type { ConversationInsight, InsightInput } from './types.ts';

// ═══════════════════════════════════════════
//  상수
// ═══════════════════════════════════════════

const MAX_INSIGHTS = 10;          // 최대 보관 인사이트 수 (오래된 것부터 제거)
const MAX_KEYPOINT_LENGTH = 100;  // 키포인트 최대 길이

// ═══════════════════════════════════════════
//  사용자 의도 감지 패턴
// ═══════════════════════════════════════════

type UserIntent = 'learning' | 'problem_solving' | 'comparison' | 'planning';

const INTENT_PATTERNS: Array<{ patterns: RegExp[]; intent: UserIntent }> = [
  {
    intent: 'comparison',
    patterns: [
      /(.+)\s*vs\.?\s*(.+)/i,
      /(비교|차이|뭐가 다|어떤 게|장단점)/,
      /(이거|이것|이쪽).*(저거|저것|저쪽).*비교/,
    ],
  },
  {
    intent: 'problem_solving',
    patterns: [
      /(문제|이슈|고민|어려움|힘들|고충|해결)/,
      /(어떻게\s*해|방법|해결\s*방안|개선)/,
      /(우리\s*(매장|가게)|저희\s*(매장|가게))/,
    ],
  },
  {
    intent: 'planning',
    patterns: [
      /(계획|준비|시작|오픈|리뉴얼|기획)/,
      /(예산|투자|비용|견적)/,
      /(일정|타임라인|스케줄|단계)/,
      /(체크리스트|절차|프로세스)/,
    ],
  },
  {
    intent: 'learning',
    patterns: [
      /(알려|설명|뭔가요|뭐야|무엇|what|how)/i,
      /(트렌드|최신|동향|현황)/,
      /(기본|기초|입문|원칙|개념)/,
    ],
  },
];

// ═══════════════════════════════════════════
//  키포인트 추출
// ═══════════════════════════════════════════

/**
 * 메시지에서 핵심 내용 1줄 요약 추출
 * 규칙 기반: 질문 문장 추출 → 핵심 명사구 추출 → 축약
 */
function extractKeyPoint(message: string): string {
  // 1. 질문 문장이 있으면 우선 사용
  const questionMatch = message.match(/[^.!?\n]*[?？][^.!?\n]*/);
  if (questionMatch) {
    return questionMatch[0].trim().slice(0, MAX_KEYPOINT_LENGTH);
  }

  // 2. 핵심 요청 패턴
  const requestMatch = message.match(/(.*(?:알려|설명|비교|분석|추천|제안|조언)[^.!?\n]*)/);
  if (requestMatch) {
    return requestMatch[1].trim().slice(0, MAX_KEYPOINT_LENGTH);
  }

  // 3. 첫 문장 사용
  const firstSentence = message.split(/[.!?\n]/)[0]?.trim();
  if (firstSentence) {
    return firstSentence.slice(0, MAX_KEYPOINT_LENGTH);
  }

  return message.slice(0, MAX_KEYPOINT_LENGTH);
}

// ═══════════════════════════════════════════
//  의도 감지
// ═══════════════════════════════════════════

function detectIntent(message: string): UserIntent {
  for (const { patterns, intent } of INTENT_PATTERNS) {
    if (patterns.some(p => p.test(message))) {
      return intent;
    }
  }
  return 'learning'; // 기본값
}

// ═══════════════════════════════════════════
//  메인 함수: 인사이트 추가
// ═══════════════════════════════════════════

/**
 * 새 메시지의 인사이트를 추출하고 기존 목록에 추가
 * 최대 MAX_INSIGHTS 개로 제한 (오래된 것부터 제거)
 */
export function accumulateInsight(
  existingInsights: ConversationInsight[],
  input: InsightInput
): ConversationInsight[] {
  const { message, topicId, turnCount, detectedEntities } = input;

  const newInsight: ConversationInsight = {
    turn: turnCount,
    topicId,
    keyPoint: extractKeyPoint(message),
    userIntent: detectIntent(message),
    mentionedEntities: detectedEntities?.length ? detectedEntities : undefined,
    timestamp: new Date().toISOString(),
  };

  // 같은 턴의 인사이트가 이미 있으면 교체
  const filtered = existingInsights.filter(i => i.turn !== turnCount);
  const updated = [...filtered, newInsight];

  // 최대 개수 제한 (오래된 것부터 제거)
  if (updated.length > MAX_INSIGHTS) {
    return updated.slice(updated.length - MAX_INSIGHTS);
  }

  return updated;
}

// ═══════════════════════════════════════════
//  대화 요약 생성
// ═══════════════════════════════════════════

/**
 * 인사이트 목록에서 대화 요약 텍스트 생성
 * 주요 토픽, 반복 패턴, 진행 방향 요약
 */
export function generateConversationSummary(
  insights: ConversationInsight[]
): string {
  if (insights.length === 0) return '';

  // 토픽 빈도 집계
  const topicCounts = new Map<string, number>();
  for (const insight of insights) {
    topicCounts.set(insight.topicId, (topicCounts.get(insight.topicId) || 0) + 1);
  }

  const sortedTopics = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // 의도 빈도 집계
  const intentCounts = new Map<string, number>();
  for (const insight of insights) {
    if (insight.userIntent) {
      intentCounts.set(insight.userIntent, (intentCounts.get(insight.userIntent) || 0) + 1);
    }
  }
  const primaryIntent = [...intentCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'learning';

  // 최근 3턴 키포인트
  const recentKeyPoints = insights
    .slice(-3)
    .map(i => i.keyPoint)
    .filter(kp => kp.length > 10);

  const parts: string[] = [];
  parts.push(`주요 관심: ${sortedTopics.map(([t, c]) => `${t}(${c}회)`).join(', ')}`);
  parts.push(`대화 성격: ${translateIntent(primaryIntent)}`);
  if (recentKeyPoints.length > 0) {
    parts.push(`최근 논의: ${recentKeyPoints.join(' → ')}`);
  }

  return parts.join(' | ');
}

function translateIntent(intent: string): string {
  const map: Record<string, string> = {
    learning: '학습/탐색',
    problem_solving: '문제 해결',
    comparison: '비교/평가',
    planning: '계획/준비',
  };
  return map[intent] || intent;
}

// ═══════════════════════════════════════════
//  인사이트 → 프롬프트 텍스트 변환
// ═══════════════════════════════════════════

/**
 * 축적된 인사이트를 시스템 프롬프트에 주입할 텍스트로 변환
 * 3턴 이상 대화가 진행된 경우에만 생성
 */
export function formatInsightsForPrompt(
  insights: ConversationInsight[],
  summary: string
): string {
  if (insights.length < 3 || !summary) return '';

  const recentInsights = insights.slice(-5);
  const parts: string[] = [
    '\n[대화 맥락 메모리]',
    `이 대화는 ${insights.length}턴 진행되었습니다. ${summary}`,
    '',
    '최근 대화 흐름:',
  ];

  for (const insight of recentInsights) {
    const intentLabel = insight.userIntent ? ` (${translateIntent(insight.userIntent)})` : '';
    parts.push(`- [턴${insight.turn}/${insight.topicId}${intentLabel}] ${insight.keyPoint}`);
  }

  parts.push('');
  parts.push('위 맥락을 반영하여 자연스럽게 이전 논의를 참조하세요. "앞서 말씀드린~", "앞서 논의한~" 등의 표현을 적절히 사용하세요.');

  return parts.join('\n');
}
