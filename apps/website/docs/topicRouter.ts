/**
 * NEURALTWIN Topic Router
 * 
 * 사용자 질문을 분석하여 관련 토픽을 분류하고,
 * 해당 토픽의 심화 도메인 지식을 시스템 프롬프트에 주입합니다.
 * 
 * 작동 흐름:
 * 1. 사용자 메시지에서 키워드 추출
 * 2. 키워드 매칭으로 primary topic + secondary topics 결정
 * 3. retailKnowledge.ts에서 해당 토픽의 context 조회
 * 4. systemPrompt.ts의 기본 프롬프트에 토픽별 심화 지식 추가
 * 
 * 토큰 예산:
 * - 기본 시스템 프롬프트: ~3,500 tokens
 * - 토픽별 심화 지식: ~500~800 tokens × 최대 2개 = ~1,000~1,600 tokens
 * - 총 시스템 프롬프트: ~4,500~5,100 tokens
 */

import { RETAIL_KNOWLEDGE, getKnowledgeById, combineKnowledgeContexts, type DomainKnowledge } from './retailKnowledge.ts';
import { SYSTEM_PROMPT, TOPIC_INJECTION_PREFIX } from './systemPrompt.ts';

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export interface TopicClassification {
  primaryTopic: string;       // 메인 토픽 ID
  secondaryTopic?: string;    // 보조 토픽 ID (연관성 높을 때)
  confidence: number;         // 분류 신뢰도 (0~1)
  detectedKeywords: string[]; // 매칭된 키워드 목록
}

export interface EnrichedPrompt {
  systemPrompt: string;       // 도메인 지식이 주입된 최종 시스템 프롬프트
  classification: TopicClassification;
}

// ═══════════════════════════════════════════
//  키워드 매칭 엔진
// ═══════════════════════════════════════════

/**
 * 텍스트를 정규화합니다 (소문자, 특수문자 제거)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 각 토픽의 키워드 매칭 점수를 계산합니다.
 * 
 * 점수 산정 방식:
 * - 정확한 키워드 매칭: 2점
 * - 부분 키워드 매칭: 1점
 * - 제목/첫 문장의 키워드: 1.5배 가중치
 */
function scoreTopics(message: string): Map<string, { score: number; keywords: string[] }> {
  const normalized = normalizeText(message);
  const scores = new Map<string, { score: number; keywords: string[] }>();

  for (const topic of RETAIL_KNOWLEDGE) {
    let score = 0;
    const matchedKeywords: string[] = [];

    // 영문 키워드 매칭
    for (const keyword of topic.keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      if (normalized.includes(normalizedKeyword)) {
        // 정확한 단어 매칭인지 부분 매칭인지 판단
        const regex = new RegExp(`\\b${escapeRegex(normalizedKeyword)}\\b`, 'i');
        if (regex.test(normalized) || normalizedKeyword.length >= 4) {
          score += 2;
        } else {
          score += 1;
        }
        matchedKeywords.push(keyword);
      }
    }

    // 한국어 키워드 매칭
    for (const keyword of topic.keywordsKo) {
      if (normalized.includes(keyword.toLowerCase())) {
        score += 2;  // 한국어 키워드는 보통 더 구체적이므로 2점
        matchedKeywords.push(keyword);
      }
    }

    if (score > 0) {
      scores.set(topic.id, { score, keywords: matchedKeywords });
    }
  }

  return scores;
}

/**
 * 정규식 특수문자를 이스케이프합니다.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════
//  토픽 분류 메인 로직
// ═══════════════════════════════════════════

/**
 * 사용자 메시지를 분석하여 토픽을 분류합니다.
 * 
 * @param message - 사용자 입력 메시지
 * @param conversationHistory - 이전 대화 내역 (컨텍스트 파악용, 선택적)
 * @returns TopicClassification
 */
export function classifyTopic(
  message: string,
  conversationHistory?: string[]
): TopicClassification {
  // 1. 현재 메시지 점수 산정
  const scores = scoreTopics(message);

  // 2. 대화 히스토리가 있으면 보조 점수 추가 (최근 2턴만)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-2).join(' ');
    const historyScores = scoreTopics(recentHistory);
    
    for (const [topicId, { score }] of historyScores) {
      const existing = scores.get(topicId);
      if (existing) {
        existing.score += score * 0.3; // 히스토리는 30% 가중치
      } else {
        scores.set(topicId, { score: score * 0.3, keywords: [] });
      }
    }
  }

  // 3. 점수 순 정렬
  const sorted = Array.from(scores.entries())
    .sort((a, b) => b[1].score - a[1].score);

  // 4. 결과 없으면 일반 리테일로 분류
  if (sorted.length === 0) {
    return {
      primaryTopic: 'general_retail',
      confidence: 0.3,
      detectedKeywords: []
    };
  }

  const [primaryId, primaryData] = sorted[0];
  const maxPossibleScore = 20; // 대략적인 최대 점수
  const confidence = Math.min(primaryData.score / maxPossibleScore, 1);

  // 5. 보조 토픽 결정 (점수가 primary의 50% 이상이면)
  let secondaryTopic: string | undefined;
  if (sorted.length > 1) {
    const [secondaryId, secondaryData] = sorted[1];
    if (secondaryData.score >= primaryData.score * 0.5) {
      secondaryTopic = secondaryId;
    }
  }

  // 6. 보조 토픽이 없으면 relatedTopics에서 후보 탐색
  if (!secondaryTopic) {
    const primaryKnowledge = getKnowledgeById(primaryId);
    if (primaryKnowledge && primaryKnowledge.relatedTopics.length > 0) {
      // 관련 토픽 중 점수가 있는 것 선택
      for (const relatedId of primaryKnowledge.relatedTopics) {
        if (scores.has(relatedId)) {
          secondaryTopic = relatedId;
          break;
        }
      }
    }
  }

  return {
    primaryTopic: primaryId,
    secondaryTopic,
    confidence,
    detectedKeywords: primaryData.keywords
  };
}

// ═══════════════════════════════════════════
//  프롬프트 조립
// ═══════════════════════════════════════════

/**
 * 토픽 분류 결과를 바탕으로 도메인 지식이 주입된
 * 최종 시스템 프롬프트를 조립합니다.
 * 
 * @param message - 사용자 입력 메시지
 * @param conversationHistory - 이전 대화 내역
 * @returns EnrichedPrompt (최종 시스템 프롬프트 + 분류 결과)
 */
export function buildEnrichedPrompt(
  message: string,
  conversationHistory?: string[]
): EnrichedPrompt {
  // 1. 토픽 분류
  const classification = classifyTopic(message, conversationHistory);

  // 2. 주입할 토픽 컨텍스트 수집
  const topicIds: string[] = [classification.primaryTopic];
  if (classification.secondaryTopic) {
    topicIds.push(classification.secondaryTopic);
  }

  // 3. 컨텍스트 조합
  const topicContext = combineKnowledgeContexts(topicIds);

  // 4. 최종 시스템 프롬프트 조립
  let finalPrompt = SYSTEM_PROMPT;

  if (topicContext && classification.confidence > 0.2) {
    finalPrompt += '\n' + TOPIC_INJECTION_PREFIX + '\n' + topicContext;
  }

  return {
    systemPrompt: finalPrompt,
    classification
  };
}

// ═══════════════════════════════════════════
//  유틸리티 & 디버그
// ═══════════════════════════════════════════

/**
 * 토픽 분류 결과를 사람이 읽기 쉬운 형태로 반환합니다.
 * (디버깅 및 로깅용)
 */
export function formatClassification(classification: TopicClassification): string {
  const primary = getKnowledgeById(classification.primaryTopic);
  const secondary = classification.secondaryTopic 
    ? getKnowledgeById(classification.secondaryTopic) 
    : null;

  return [
    `Primary: ${primary?.nameKo || classification.primaryTopic} (${(classification.confidence * 100).toFixed(0)}%)`,
    secondary ? `Secondary: ${secondary.nameKo}` : null,
    `Keywords: [${classification.detectedKeywords.join(', ')}]`
  ].filter(Boolean).join(' | ');
}

/**
 * 모든 토픽과 키워드 목록을 반환합니다.
 * (디버깅용)
 */
export function listAllTopics(): { id: string; name: string; nameKo: string; keywordCount: number }[] {
  return RETAIL_KNOWLEDGE.map(k => ({
    id: k.id,
    name: k.name,
    nameKo: k.nameKo,
    keywordCount: k.keywords.length + k.keywordsKo.length
  }));
}
