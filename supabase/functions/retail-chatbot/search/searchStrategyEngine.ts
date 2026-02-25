/**
 * Search Strategy Engine — Phase 2 (Layer 2)
 *
 * queryRouter 기반 확장: 벡터 검색 결과 수를 반영하여
 * 웹 검색 필요 여부 및 최적 검색 쿼리를 결정
 *
 * 판단 로직:
 * - vectorResultCount >= 5 → 웹 검색 생략 (벡터 지식 매우 충분)
 * - vectorResultCount >= 3 + 고급 질문 → 다양성 보충 검색
 * - vectorResultCount < 2 + 고급 질문 → 웹 검색 강화
 * - queryRouter 엔티티 감지 → 무조건 웹 검색
 * - 최신 정보 요청 패턴 → 무조건 웹 검색
 * - 다양성 키워드 감지 → 벡터 충분해도 웹 검색
 */

import { routeQuery, type QueryRouteResult, type AugmentationType } from '../queryRouter.ts';
import type { QuestionDepth } from '../questionDepthAnalyzer.ts';
import type { ConversationSearchContext, ContextualSearchQuery } from './conversationSearchContext.ts';
import { generateContextualQueries } from './conversationSearchContext.ts';

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export interface SearchStrategyInput {
  message: string;
  topicId: string;
  questionDepth: QuestionDepth;
  turnCount: number;
  vectorResultCount: number;
  conversationHistory?: string[];
  /** PI: 대화 컨텍스트 기반 점진적 검색 강화 */
  conversationSearchContext?: ConversationSearchContext;
}

export interface SearchQuery {
  query: string;
  type: 'web' | 'sns' | 'news';
  priority: number;       // 1 = 최우선, 3 = 낮음
}

export interface SearchStrategy {
  shouldSearch: boolean;
  queries: SearchQuery[];
  reason: string;
  queryRouteResult: QueryRouteResult;  // 원본 queryRouter 결과 보존
}

// ═══════════════════════════════════════════
//  벡터 결과 기반 검색 필요도 판단
// ═══════════════════════════════════════════

const VECTOR_SUFFICIENT_THRESHOLD = 5;  // 이 이상이면 검색 생략 (기존 3→5 상향)
const VECTOR_DIVERSE_THRESHOLD = 3;     // 이 이상이면 다양성 보충 검색 (고급 질문 시)
const VECTOR_WEAK_THRESHOLD = 1;        // 이 이하면 검색 강화

// 고급 질문자가 벡터 결과가 부족할 때 추가 검색을 위한 패턴
const ADVANCED_SEARCH_BOOST_PATTERNS = [
  /(벤치마크|benchmark|기준\s*수치|업계\s*평균)/i,
  /(사례|케이스\s*스터디|case\s*study)/i,
  /(글로벌|해외|미국|유럽|일본)\s*(사례|트렌드|현황)/,
  /(리서치|조사|검색)(\s*해)?/,  // "해" 없이도 매칭
  /(데이터|통계|수치|근거)/,
  /(전략|사례)\s*(분석|리서치|비교)/,
  /오프라인\s*(매장|전략|현황)/,
];

// 뉴스 검색 트리거 — 최신 정보/트렌드 요청 시
const NEWS_TRIGGER_PATTERNS = [
  /(최신|최근|올해|이번\s*달|금주|이번\s*주)/,
  /(뉴스|기사|보도|언론|미디어)/,
  /(트렌드|전망|예측|동향)/,
  /(출시|오픈|론칭|발표|공개)/,
  /(2024|2025|2026)/,
];

// 다양성 보충 검색 트리거 — 벡터 충분해도 외부 관점 보충
const DIVERSITY_SEARCH_PATTERNS = [
  /(다른\s*브랜드|다른\s*사례|다양한|비교|대안)/,
  /(어떤\s*브랜드|어디|누가|어느\s*매장)/,
  /(최신|최근|트렌드|2024|2025|2026)/,
  /(국내|한국|로컬)\s*(사례|브랜드|매장)/,
  /(중소|소규모|스타트업|신규)\s*(브랜드|매장|업체)/,
];

// ═══════════════════════════════════════════
//  메인 전략 빌더
// ═══════════════════════════════════════════

export function buildSearchStrategy(input: SearchStrategyInput): SearchStrategy {
  const {
    message,
    topicId,
    questionDepth,
    turnCount,
    vectorResultCount,
    conversationHistory,
    conversationSearchContext: ctx,
  } = input;

  // 1. 기존 queryRouter 호출 (엔티티 감지 + 트리거 패턴)
  const queryRoute = routeQuery(message, conversationHistory);

  // PI: 대화 진행 단계에 따른 검색 임계값 동적 조정
  // deepening/cross_referencing 단계에서는 벡터만으론 부족 → 웹 검색 적극 활용
  const phaseThresholdBoost = ctx?.searchPhase === 'cross_referencing' ? 3
    : ctx?.searchPhase === 'deepening' ? 1 : 0;
  const effectiveSufficientThreshold = VECTOR_SUFFICIENT_THRESHOLD + phaseThresholdBoost;

  // 2. queryRouter가 검색 필요하다고 판단한 경우 → 무조건 검색
  if (queryRoute.augmentation === 'web_search') {
    const queries = buildQueriesFromRoute(message, queryRoute);
    // PI: 대화 컨텍스트 기반 추가 쿼리 병합
    if (ctx) {
      const contextQueries = generateContextualQueries(ctx, message, topicId);
      appendContextualQueries(queries, contextQueries);
    }
    return {
      shouldSearch: true,
      queries,
      reason: queryRoute.searchReason || 'entity_or_trigger_detected',
      queryRouteResult: queryRoute,
    };
  }

  // 3. 다양성 보충 검색 — 벡터 결과가 있어도 다양한 관점이 필요한 경우
  const needsDiversity = DIVERSITY_SEARCH_PATTERNS.some(p => p.test(message));
  if (needsDiversity && vectorResultCount >= 1) {
    const queries = buildAdvancedSupplementQueries(message, topicId);
    if (ctx) {
      const contextQueries = generateContextualQueries(ctx, message, topicId);
      appendContextualQueries(queries, contextQueries);
    }
    return {
      shouldSearch: true,
      queries,
      reason: `diversity_supplement (${vectorResultCount} vector + web diversity)`,
      queryRouteResult: queryRoute,
    };
  }

  // PI: deepening/cross_referencing 단계에서 정보 갭이 있으면 검색 트리거
  if (ctx && ctx.searchPhase !== 'discovery' && ctx.informationGaps.length > 0 && vectorResultCount < effectiveSufficientThreshold) {
    const queries: SearchQuery[] = [];
    // 프로필 힌트 기반 심화 검색
    const profileHint = ctx.profileSearchHints[0] || '';
    if (ctx.accumulatedEntities.length > 0) {
      queries.push({
        query: `${ctx.accumulatedEntities[0]} ${profileHint} ${message.slice(0, 40)}`.trim(),
        type: 'web',
        priority: 1,
      });
    }
    const contextQueries = generateContextualQueries(ctx, message, topicId);
    appendContextualQueries(queries, contextQueries);
    if (queries.length > 0) {
      return {
        shouldSearch: true,
        queries,
        reason: `progressive_${ctx.searchPhase} (gaps=${ctx.informationGaps.length}, entities=${ctx.accumulatedEntities.length})`,
        queryRouteResult: queryRoute,
      };
    }
  }

  // 4. 벡터 결과가 매우 충분하면 검색 생략
  if (vectorResultCount >= effectiveSufficientThreshold) {
    return {
      shouldSearch: false,
      queries: [],
      reason: `vector_sufficient (${vectorResultCount} results, threshold=${effectiveSufficientThreshold})`,
      queryRouteResult: queryRoute,
    };
  }

  // 5. 고급 질문 + 벡터 중간 수준 → 다양성 보충 검색
  if (questionDepth === 'advanced' && vectorResultCount >= VECTOR_DIVERSE_THRESHOLD) {
    const queries = buildAdvancedSupplementQueries(message, topicId);
    if (ctx) {
      const contextQueries = generateContextualQueries(ctx, message, topicId);
      appendContextualQueries(queries, contextQueries);
    }
    return {
      shouldSearch: true,
      queries,
      reason: `advanced_with_vector_diversity (${vectorResultCount} results, supplementing)`,
      queryRouteResult: queryRoute,
    };
  }

  // 6. 고급 질문 + 벡터 결과 부족 → 검색 강화
  if (questionDepth === 'advanced' && vectorResultCount <= VECTOR_WEAK_THRESHOLD) {
    const needsBoost = ADVANCED_SEARCH_BOOST_PATTERNS.some(p => p.test(message));
    if (needsBoost) {
      const queries = buildAdvancedSupplementQueries(message, topicId);
      if (ctx) {
        const contextQueries = generateContextualQueries(ctx, message, topicId);
        appendContextualQueries(queries, contextQueries);
      }
      return {
        shouldSearch: true,
        queries,
        reason: `advanced_question_with_weak_vector (${vectorResultCount} results)`,
        queryRouteResult: queryRoute,
      };
    }
  }

  // PI: 파일 키워드가 있고 discovery 단계이면 파일 관련 검색 추가
  if (ctx && ctx.fileKeywords.length > 0 && vectorResultCount < VECTOR_DIVERSE_THRESHOLD) {
    const fileQuery = ctx.fileKeywords.slice(0, 3).join(' ') + ' ' + message.slice(0, 30);
    return {
      shouldSearch: true,
      queries: [{ query: fileQuery.trim(), type: 'web', priority: 2 }],
      reason: `file_context_search (${ctx.fileKeywords.length} keywords)`,
      queryRouteResult: queryRoute,
    };
  }

  // 7. 기본: 검색 불필요
  return {
    shouldSearch: false,
    queries: [],
    reason: vectorResultCount > 0
      ? `vector_partially_sufficient (${vectorResultCount} results)`
      : 'no_search_triggers',
    queryRouteResult: queryRoute,
  };
}

// ═══════════════════════════════════════════
//  쿼리 빌더: queryRouter 결과 기반
// ═══════════════════════════════════════════

function buildQueriesFromRoute(
  message: string,
  queryRoute: QueryRouteResult
): SearchQuery[] {
  const queries: SearchQuery[] = [];
  const entities = queryRoute.detectedEntities;

  if (entities.length > 0) {
    // 한글 엔티티 우선
    const koreanEntity = entities.find(e => /[가-힣]/.test(e));
    const longEnglishEntity = entities
      .filter(e => !/[가-힣]/.test(e))
      .sort((a, b) => b.length - a.length)[0];
    const entity = koreanEntity || longEnglishEntity || entities[0];

    const msgLower = message.toLowerCase();

    // SNS 맥락 감지
    const isSnsQuery = /인스타|instagram|페이스북|facebook|유튜브|youtube|틱톡|tiktok|sns|소셜|블로그/i.test(message);

    // 웹 검색 쿼리: 유저 메시지 핵심 키워드 반영
    const coreKeywords = extractQueryKeywords(message, entity);
    if (coreKeywords.length > 2) {
      // 엔티티 + 유저 핵심 키워드 (예: "올리브영 오프라인 매장 전략")
      queries.push({ query: `${entity} ${coreKeywords}`, type: 'web', priority: 1 });
    } else if (msgLower.includes('팝업') || msgLower.includes('popup')) {
      queries.push({ query: `${entity} 브랜드 공식 사이트 제품 카테고리`, type: 'web', priority: 1 });
    } else if (/매장|공간|인테리어|동선/.test(msgLower)) {
      queries.push({ query: `${entity} 매장 공간 인테리어 컨셉`, type: 'web', priority: 1 });
    } else {
      queries.push({ query: `${entity} 브랜드 소개 제품`, type: 'web', priority: 1 });
    }

    // 리서치/분석 맥락 → 산업 분석 보충 쿼리 추가
    if (/전략|분석|리서치|사례/.test(message)) {
      queries.push({ query: `${entity} 리테일 전략 성공 사례 분석 2025`, type: 'web', priority: 2 });
    }

    // SNS 검색 (엔티티가 있으면 항상 병렬)
    if (isSnsQuery) {
      if (/인스타|instagram/i.test(message)) {
        queries.push({ query: `${entity} 인스타그램 공식 계정`, type: 'sns', priority: 1 });
      } else {
        queries.push({ query: `${entity} SNS 소셜미디어 공식 계정`, type: 'sns', priority: 2 });
      }
    } else {
      // SNS 검색은 낮은 우선순위로 항상 추가
      queries.push({ query: `${entity} 인스타그램 리뷰 후기`, type: 'sns', priority: 3 });
    }

    // 뉴스 검색 (최신/트렌드 패턴 감지 시)
    const isNewsQuery = NEWS_TRIGGER_PATTERNS.some(p => p.test(message));
    if (isNewsQuery) {
      queries.push({ query: `${entity} 리테일 최신 뉴스`, type: 'news', priority: 2 });
    }
  } else {
    // 엔티티 없이 트리거 패턴만 매칭
    queries.push({ query: message.slice(0, 100), type: 'web', priority: 1 });

    // 뉴스 검색 (엔티티 없이도 최신 패턴 감지 시)
    const isNewsQuery = NEWS_TRIGGER_PATTERNS.some(p => p.test(message));
    if (isNewsQuery) {
      queries.push({ query: `${message.slice(0, 60)} 리테일 뉴스`, type: 'news', priority: 2 });
    }
  }

  return queries;
}

// ═══════════════════════════════════════════
//  쿼리 빌더: 고급 질문 보충 검색
// ═══════════════════════════════════════════

// 토픽 → 검색 보충 키워드 매핑
const TOPIC_SEARCH_HINTS: Record<string, string> = {
  layout_flow: '매장 동선 레이아웃 사례 데이터',
  vmd_display: 'VMD 진열 벤치마크 ROI',
  sales_conversion: '리테일 전환율 객단가 벤치마크',
  customer_analytics: '고객 분석 RFM CLV 사례',
  data_kpi: '리테일 KPI 벤치마크 데이터',
  staff_productivity: '매장 인력 생산성 SPLH',
  digital_twin: '디지털 트윈 리테일 사례',
  retail_tech: '리테일 테크 도입 사례 ROI',
  neuraltwin_solution: 'NEURALTWIN 리테일 솔루션',
};

// ═══════════════════════════════════════════
//  PI: 컨텍스트 쿼리 병합 유틸리티
// ═══════════════════════════════════════════

function appendContextualQueries(
  target: SearchQuery[],
  contextQueries: ContextualSearchQuery[]
): void {
  for (const cq of contextQueries) {
    // 중복 방지: 같은 타입의 비슷한 쿼리가 이미 있으면 스킵
    const isDuplicate = target.some(
      t => t.type === cq.type && t.query.slice(0, 15) === cq.query.slice(0, 15)
    );
    if (!isDuplicate && target.length < 6) {
      target.push({
        query: cq.query,
        type: cq.type,
        priority: cq.priority,
      });
    }
  }
}

/**
 * 메시지에서 엔티티와 일반 조사를 제거하고 핵심 키워드만 추출
 * "올리브영 오프라인 매장 전략 리서치 및 분석" → "오프라인 매장 전략 리서치 및 분석"
 */
function extractQueryKeywords(message: string, entity: string): string {
  return message
    .replace(new RegExp(entity, 'gi'), '')
    .replace(/[?？!！.,~\n]/g, '')
    .replace(/(해줘|알려줘|분석해|조사해|리서치해)/g, '')
    .trim()
    .slice(0, 40);
}

function buildAdvancedSupplementQueries(
  message: string,
  topicId: string
): SearchQuery[] {
  const hint = TOPIC_SEARCH_HINTS[topicId] || '리테일 사례 데이터';

  // 메시지에서 핵심 키워드 추출 (앞 50자)
  const shortMessage = message.slice(0, 50).replace(/[?？]/g, '').trim();

  return [
    { query: `${shortMessage} ${hint}`, type: 'web', priority: 2 },
  ];
}
