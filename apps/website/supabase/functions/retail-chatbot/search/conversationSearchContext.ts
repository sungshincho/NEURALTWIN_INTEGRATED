/**
 * Conversation Search Context — Progressive Intelligence (PI-1)
 *
 * 대화 누적 데이터(인사이트, 프로필, 엔티티)를 검색 전략에 연결하는 브릿지
 *
 * 핵심 기능:
 * 1. 대화 진행도에 따른 검색 깊이 단계 결정 (discovery → deepening → cross-referencing)
 * 2. 누적 엔티티 & 토픽에서 검색 힌트 추출
 * 3. 파일 컨텍스트에서 검색 키워드 추출
 * 4. 프로필 기반 검색 필터 생성
 */

import type { UserProfile, ConversationInsight } from '../memory/types.ts';

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

/** 대화 진행 단계에 따른 검색 깊이 */
export type SearchPhase = 'discovery' | 'deepening' | 'cross_referencing';

/** 검색 전략에 주입할 대화 컨텍스트 */
export interface ConversationSearchContext {
  /** 현재 검색 깊이 단계 */
  searchPhase: SearchPhase;

  /** 대화 전체에서 누적된 엔티티 (브랜드, 매장명 등) */
  accumulatedEntities: string[];

  /** 대화 전체에서 누적된 토픽 ID (빈도순) */
  topicFrequency: Array<{ topicId: string; count: number }>;

  /** 사용자 주요 의도 (가장 빈번한 의도) */
  primaryIntent: string | null;

  /** 프로필 기반 검색 힌트 */
  profileSearchHints: string[];

  /** 파일 컨텍스트에서 추출된 키워드 */
  fileKeywords: string[];

  /** 이전 턴에서 이미 검색된 쿼리 패턴 (중복 방지) */
  previousSearchTopics: string[];

  /** 정보 갭 — 아직 검색하지 않은 관련 주제 */
  informationGaps: string[];
}

// ═══════════════════════════════════════════
//  검색 깊이 단계 결정
// ═══════════════════════════════════════════

/**
 * 대화 턴 수와 엔티티 누적에 따라 검색 깊이 결정
 *
 * discovery (1-2턴): 넓게 탐색, 다양한 소스
 * deepening (3-5턴): 특정 주제 심화, 벤치마크/사례 추가
 * cross_referencing (6+턴): 교차 검증, 경쟁사 비교, 갭 채우기
 */
function determineSearchPhase(
  turnCount: number,
  entityCount: number,
  topicCount: number
): SearchPhase {
  // 엔티티가 많고 토픽이 집중되면 빠르게 심화 단계로
  if (turnCount >= 6 || (turnCount >= 4 && entityCount >= 3)) {
    return 'cross_referencing';
  }
  if (turnCount >= 3 || (turnCount >= 2 && (entityCount >= 2 || topicCount >= 2))) {
    return 'deepening';
  }
  return 'discovery';
}

// ═══════════════════════════════════════════
//  메인 컨텍스트 빌더
// ═══════════════════════════════════════════

export function buildConversationSearchContext(
  insights: ConversationInsight[],
  profile: UserProfile,
  turnCount: number,
  fileContext?: string,
  previousSearchQueries?: string[]
): ConversationSearchContext {
  // 1. 누적 엔티티 수집 (중복 제거, 최근 우선)
  const entitySet = new Set<string>();
  for (let i = insights.length - 1; i >= 0; i--) {
    const entities = insights[i].mentionedEntities || [];
    for (const e of entities) {
      entitySet.add(e);
    }
  }
  const accumulatedEntities = Array.from(entitySet);

  // 2. 토픽 빈도 집계
  const topicCounts = new Map<string, number>();
  for (const insight of insights) {
    topicCounts.set(insight.topicId, (topicCounts.get(insight.topicId) || 0) + 1);
  }
  const topicFrequency = Array.from(topicCounts.entries())
    .map(([topicId, count]) => ({ topicId, count }))
    .sort((a, b) => b.count - a.count);

  // 3. 주요 의도 판별
  const intentCounts = new Map<string, number>();
  for (const insight of insights) {
    if (insight.userIntent) {
      intentCounts.set(insight.userIntent, (intentCounts.get(insight.userIntent) || 0) + 1);
    }
  }
  let primaryIntent: string | null = null;
  let maxIntentCount = 0;
  for (const [intent, count] of intentCounts) {
    if (count > maxIntentCount) {
      primaryIntent = intent;
      maxIntentCount = count;
    }
  }

  // 4. 프로필 기반 검색 힌트
  const profileSearchHints = buildProfileSearchHints(profile);

  // 5. 파일 컨텍스트에서 키워드 추출
  const fileKeywords = fileContext ? extractFileKeywords(fileContext) : [];

  // 6. 이전 검색 토픽 (중복 방지)
  const previousSearchTopics = (previousSearchQueries || [])
    .map(q => q.toLowerCase().slice(0, 30));

  // 7. 정보 갭 분석
  const informationGaps = identifyInformationGaps(
    topicFrequency,
    accumulatedEntities,
    profile,
    insights
  );

  // 8. 검색 깊이 결정
  const searchPhase = determineSearchPhase(
    turnCount,
    accumulatedEntities.length,
    topicFrequency.length
  );

  return {
    searchPhase,
    accumulatedEntities,
    topicFrequency,
    primaryIntent,
    profileSearchHints,
    fileKeywords,
    previousSearchTopics,
    informationGaps,
  };
}

// ═══════════════════════════════════════════
//  프로필 → 검색 힌트 변환
// ═══════════════════════════════════════════

function buildProfileSearchHints(profile: UserProfile): string[] {
  const hints: string[] = [];

  // 업종별 검색 키워드
  if (profile.industry) {
    const industryHints: Record<string, string> = {
      fashion: '패션 리테일 의류',
      fnb: 'F&B 카페 레스토랑 외식',
      beauty: '뷰티 화장품 코스메틱',
      grocery: '식품 마트 편의점 그로서리',
      general: '리테일 유통',
    };
    const hint = industryHints[profile.industry];
    if (hint) hints.push(hint);
  }
  if (profile.industryDetail) {
    hints.push(profile.industryDetail);
  }

  // 역할별 관점
  if (profile.role) {
    const roleHints: Record<string, string> = {
      owner: '매장 경영 운영 수익성',
      manager: '매장 관리 운영 효율',
      md: '상품 기획 MD 전략',
      vmd: 'VMD 비주얼 머천다이징 진열',
      marketer: '마케팅 프로모션 캠페인',
      staff: '매장 운영 실무',
    };
    const hint = roleHints[profile.role];
    if (hint) hints.push(hint);
  }

  // 지역 정보
  if (profile.location) {
    hints.push(`${profile.location} 상권`);
  }

  // 매장 규모
  if (profile.storeSize) {
    const sizeHints: Record<string, string> = {
      small: '소형 매장 소규모',
      medium: '중형 매장',
      large: '대형 매장 플래그십',
    };
    const hint = sizeHints[profile.storeSize];
    if (hint) hints.push(hint);
  }

  return hints;
}

// ═══════════════════════════════════════════
//  파일 컨텍스트 → 검색 키워드 추출
// ═══════════════════════════════════════════

/** 파일 텍스트에서 검색에 유용한 핵심 키워드 추출 (규칙 기반) */
function extractFileKeywords(fileContext: string): string[] {
  const keywords: string[] = [];

  // 브랜드명 추출 (영문 대문자 시작 단어)
  const brandPattern = /\b[A-Z][a-zA-Z]{2,15}\b/g;
  const brands = fileContext.match(brandPattern) || [];
  const commonWords = new Set(['The', 'This', 'That', 'What', 'How', 'Why', 'For', 'And', 'But', 'Not', 'All', 'New', 'Our']);
  for (const b of brands) {
    if (!commonWords.has(b) && keywords.length < 5) {
      keywords.push(b);
    }
  }

  // 한국어 핵심 명사 추출 (2~6글자 한글 단어 + 조사 제거)
  const koreanPattern = /[가-힣]{2,8}(?=[은는이가을를의에서와과도로]|[\s,.])/g;
  const koreanWords = fileContext.match(koreanPattern) || [];
  const stopWords = new Set(['이것', '저것', '그것', '하는', '있는', '없는', '되는', '것이', '수는', '때문', '이런', '그런']);
  for (const w of koreanWords) {
    if (!stopWords.has(w) && keywords.length < 10) {
      keywords.push(w);
    }
  }

  // 수치 + 단위 패턴 (맥락적 키워드로 활용)
  const metricPattern = /(\d[\d,]*)\s*(평|㎡|m²|억|만원|%|배)/g;
  let match;
  while ((match = metricPattern.exec(fileContext)) !== null && keywords.length < 12) {
    keywords.push(`${match[1]}${match[2]}`);
  }

  // 중복 제거
  return [...new Set(keywords)];
}

// ═══════════════════════════════════════════
//  정보 갭 분석 — 아직 다루지 않은 관련 주제
// ═══════════════════════════════════════════

/** 대화 맥락에서 아직 탐색하지 않은 관련 주제 식별 */
function identifyInformationGaps(
  topicFrequency: Array<{ topicId: string; count: number }>,
  entities: string[],
  profile: UserProfile,
  insights: ConversationInsight[]
): string[] {
  const gaps: string[] = [];

  // 토픽에 따른 관련 미탐색 주제
  const TOPIC_RELATED_GAPS: Record<string, string[]> = {
    layout_flow: ['고객 동선 최적화 사례', '매장 레이아웃 벤치마크'],
    sales_conversion: ['전환율 업계 평균', '객단가 향상 사례'],
    vmd_display: ['VMD 트렌드', '진열 ROI 데이터'],
    popup_event: ['팝업스토어 성공 사례', '팝업 ROI 데이터'],
    branding: ['브랜드 포지셔닝 사례', '리브랜딩 전략'],
    customer_experience: ['CX 벤치마크', '고객 만족도 데이터'],
    digital_retail: ['옴니채널 사례', '리테일테크 트렌드'],
    store_ops: ['운영 효율화 사례', '인건비 최적화'],
  };

  const discussedTopics = new Set(topicFrequency.map(t => t.topicId));
  const discussedGaps = new Set(
    insights.map(i => i.keyPoint.toLowerCase())
  );

  for (const { topicId } of topicFrequency.slice(0, 2)) {
    const relatedGaps = TOPIC_RELATED_GAPS[topicId] || [];
    for (const gap of relatedGaps) {
      // 이미 논의된 내용인지 간단 체크
      const isDiscussed = [...discussedGaps].some(d => d.includes(gap.slice(0, 4)));
      if (!isDiscussed && gaps.length < 4) {
        gaps.push(gap);
      }
    }
  }

  // 엔티티 기반 갭: 언급된 브랜드의 경쟁사/비교 정보
  if (entities.length >= 2) {
    gaps.push(`${entities.slice(0, 2).join(' vs ')} 비교 분석`);
  } else if (entities.length === 1) {
    gaps.push(`${entities[0]} 경쟁사 비교`);
  }

  // 프로필 기반 갭: 업종 특화 데이터
  if (profile.industry && !discussedTopics.has('industry_benchmark')) {
    const industryNames: Record<string, string> = {
      fashion: '패션', fnb: 'F&B', beauty: '뷰티', grocery: '그로서리',
    };
    const name = industryNames[profile.industry];
    if (name) {
      gaps.push(`${name} 업계 최신 트렌드`);
    }
  }

  return gaps.slice(0, 5);
}

// ═══════════════════════════════════════════
//  검색 쿼리 확장 — 대화 컨텍스트 기반 추가 쿼리 생성
// ═══════════════════════════════════════════

export interface ContextualSearchQuery {
  query: string;
  type: 'web' | 'sns' | 'news';
  priority: number;
  reason: string; // 왜 이 쿼리가 생성되었는지
}

/**
 * 대화 컨텍스트 기반 추가 검색 쿼리 생성
 * searchStrategyEngine의 기본 쿼리에 보충 쿼리를 추가
 */
export function generateContextualQueries(
  ctx: ConversationSearchContext,
  currentMessage: string,
  currentTopicId: string
): ContextualSearchQuery[] {
  const queries: ContextualSearchQuery[] = [];

  // Phase별 쿼리 전략
  switch (ctx.searchPhase) {
    case 'discovery': {
      // 넓게 탐색 — 파일 키워드와 프로필 힌트 활용
      if (ctx.fileKeywords.length > 0) {
        const fileHint = ctx.fileKeywords.slice(0, 3).join(' ');
        queries.push({
          query: `${fileHint} ${currentMessage.slice(0, 30)}`,
          type: 'web',
          priority: 2,
          reason: 'file_context_search',
        });
      }
      // SNS 트렌드 탐색
      if (ctx.accumulatedEntities.length > 0) {
        queries.push({
          query: `${ctx.accumulatedEntities[0]} 인스타그램 후기 반응`,
          type: 'sns',
          priority: 3,
          reason: 'entity_sns_discovery',
        });
      }
      break;
    }

    case 'deepening': {
      // 심화 — 벤치마크/사례/경쟁사 검색
      const mainEntity = ctx.accumulatedEntities[0];
      const profileHint = ctx.profileSearchHints[0] || '리테일';

      if (mainEntity) {
        queries.push({
          query: `${mainEntity} ${profileHint} 성과 데이터 벤치마크`,
          type: 'web',
          priority: 1,
          reason: 'entity_deepening',
        });
        // 뉴스 검색
        queries.push({
          query: `${mainEntity} 최신 뉴스 2024 2025 2026`,
          type: 'news',
          priority: 2,
          reason: 'entity_latest_news',
        });
      }

      // 정보 갭 채우기
      if (ctx.informationGaps.length > 0) {
        queries.push({
          query: ctx.informationGaps[0],
          type: 'web',
          priority: 2,
          reason: 'information_gap_fill',
        });
      }

      // 의도 기반 검색
      if (ctx.primaryIntent === 'comparison' && ctx.accumulatedEntities.length >= 2) {
        queries.push({
          query: `${ctx.accumulatedEntities.slice(0, 3).join(' ')} 비교 분석`,
          type: 'web',
          priority: 1,
          reason: 'comparison_intent_search',
        });
      }
      break;
    }

    case 'cross_referencing': {
      // 교차 검증 — 다각도 검색
      const mainEntity = ctx.accumulatedEntities[0];

      // 업계 데이터 교차 검증
      if (ctx.topicFrequency.length > 0) {
        const mainTopic = ctx.topicFrequency[0].topicId;
        queries.push({
          query: `${mainTopic.replace(/_/g, ' ')} 업계 평균 통계 데이터 2024 2025`,
          type: 'web',
          priority: 1,
          reason: 'cross_reference_benchmark',
        });
      }

      // 남은 정보 갭 채우기
      for (const gap of ctx.informationGaps.slice(0, 2)) {
        // 이전에 비슷한 검색을 했는지 체크
        const isDuplicate = ctx.previousSearchTopics.some(
          prev => prev.includes(gap.slice(0, 6).toLowerCase())
        );
        if (!isDuplicate) {
          queries.push({
            query: gap,
            type: 'web',
            priority: 2,
            reason: 'gap_fill_cross_ref',
          });
        }
      }

      // 경쟁사 SNS 검색
      if (mainEntity) {
        queries.push({
          query: `${mainEntity} 경쟁사 리뷰 비교 SNS`,
          type: 'sns',
          priority: 3,
          reason: 'competitor_sns_cross_ref',
        });
      }

      // 파일에서 추출한 수치 검증
      if (ctx.fileKeywords.some(k => /\d/.test(k))) {
        const numericKeywords = ctx.fileKeywords.filter(k => /\d/.test(k)).slice(0, 2);
        queries.push({
          query: `리테일 ${numericKeywords.join(' ')} 업계 평균 비교`,
          type: 'web',
          priority: 2,
          reason: 'file_metric_verification',
        });
      }
      break;
    }
  }

  // 중복 제거: 이전 검색과 비슷한 쿼리 필터
  return queries.filter(q => {
    const qLower = q.query.toLowerCase().slice(0, 20);
    return !ctx.previousSearchTopics.some(prev => prev.includes(qLower.slice(0, 10)));
  }).slice(0, 4); // 최대 4개 추가 쿼리
}

// ═══════════════════════════════════════════
//  점진적 품질 향상 지시문 생성 (시스템 프롬프트 주입)
// ═══════════════════════════════════════════

/**
 * 대화 진행 단계에 따라 AI가 답변 품질을 점진적으로 높이도록
 * 시스템 프롬프트에 주입할 지시문 생성
 */
export function buildProgressiveInstruction(ctx: ConversationSearchContext): string {
  if (ctx.searchPhase === 'discovery') {
    return ''; // 초기 단계에서는 추가 지시 불필요
  }

  const parts: string[] = ['\n[대화 진행 품질 강화 지시]'];

  // 누적 엔티티 활용 지시
  if (ctx.accumulatedEntities.length > 0) {
    parts.push(`이 대화에서 다뤄진 주요 엔티티: ${ctx.accumulatedEntities.slice(0, 5).join(', ')}`);
    parts.push('이전 턴에서 언급한 내용과 자연스럽게 연결하여 답변하세요. 반복 설명 대신 심화된 관점을 제시하세요.');
  }

  // 주요 의도 기반 지시
  if (ctx.primaryIntent) {
    const intentGuide: Record<string, string> = {
      comparison: '사용자가 비교 분석을 원하므로, 구체적 비교표나 대조 분석을 포함하세요.',
      problem_solving: '사용자가 문제 해결을 원하므로, 단계별 실행 방안과 예상 효과를 제시하세요.',
      learning: '사용자가 학습 중이므로, 핵심 개념을 체계적으로 설명하되 실무 사례를 곁들이세요.',
      planning: '사용자가 계획을 세우고 있으므로, 타임라인과 우선순위가 포함된 실행 로드맵을 제안하세요.',
    };
    const guide = intentGuide[ctx.primaryIntent];
    if (guide) parts.push(guide);
  }

  // 단계별 품질 강화
  if (ctx.searchPhase === 'deepening') {
    parts.push('대화 심화 단계: 이전 턴의 맥락을 바탕으로 더 구체적인 데이터, 벤치마크, 사례를 인용하세요.');
    parts.push('이전 답변에서 다루지 못한 측면이나 예외 사항도 보충하세요.');
  } else if (ctx.searchPhase === 'cross_referencing') {
    parts.push('대화 교차검증 단계: 여러 소스의 데이터를 교차 비교하여 신뢰도 높은 인사이트를 제공하세요.');
    parts.push('이전 턴들의 정보를 종합하여, 패턴이나 트렌드를 도출하세요.');
    if (ctx.informationGaps.length > 0) {
      parts.push(`아직 다루지 않은 관련 주제: ${ctx.informationGaps.slice(0, 3).join(', ')}. 자연스럽게 언급하거나 추가 분석하세요.`);
    }
  }

  // 프로필 기반 맞춤화
  if (ctx.profileSearchHints.length > 0) {
    parts.push(`사용자 맥락(${ctx.profileSearchHints.slice(0, 2).join(', ')})에 맞춰 답변을 커스터마이징하세요.`);
  }

  // 파일 키워드 활용
  if (ctx.fileKeywords.length > 0) {
    parts.push(`사용자가 제공한 파일에서 추출된 키워드: ${ctx.fileKeywords.slice(0, 5).join(', ')}. 이 맥락을 답변에 반영하세요.`);
  }

  return parts.join('\n');
}
