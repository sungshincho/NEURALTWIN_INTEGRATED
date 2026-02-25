/**
 * NEURALTWIN Web Search Module
 * Serper API를 통한 실시간 웹 검색
 *
 * 브랜드, 기업, 제품 등 외부 정보가 필요할 때 호출
 */

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface SerperKnowledgeGraph {
  title?: string;
  type?: string;
  description?: string;
  descriptionSource?: string;
  attributes?: Record<string, string>;
}

interface SerperResponse {
  organic?: SerperResult[];
  knowledgeGraph?: SerperKnowledgeGraph;
}

export interface WebSearchResult {
  query: string;
  knowledgeSummary?: string;
  results: Array<{
    title: string;
    snippet: string;
    url: string;
  }>;
  context: string; // AI에 주입할 최종 컨텍스트
}

// ═══════════════════════════════════════════
//  Serper API 호출
// ═══════════════════════════════════════════

const SERPER_API_URL = 'https://google.serper.dev/search';

export async function searchWeb(query: string, numResults: number = 5): Promise<WebSearchResult> {
  const apiKey = Deno.env.get('SERPER_API_KEY');

  if (!apiKey) {
    console.warn('[WebSearch] SERPER_API_KEY not configured');
    return { query, results: [], context: '' };
  }

  try {
    const response = await fetch(SERPER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        q: query,
        gl: 'kr',     // 한국 결과 우선
        hl: 'ko',     // 한국어
        num: numResults,
      }),
    });

    if (!response.ok) {
      console.error(`[WebSearch] Serper API error: ${response.status}`);
      return { query, results: [], context: '' };
    }

    const data: SerperResponse = await response.json();

    // Knowledge Graph 요약
    let knowledgeSummary: string | undefined;
    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph;
      const parts: string[] = [];
      if (kg.title) parts.push(kg.title);
      if (kg.type) parts.push(`(${kg.type})`);
      if (kg.description) parts.push(kg.description);
      if (kg.attributes) {
        for (const [key, value] of Object.entries(kg.attributes)) {
          parts.push(`${key}: ${value}`);
        }
      }
      knowledgeSummary = parts.join(' | ');
    }

    // 검색 결과 정리
    const results = (data.organic || []).slice(0, numResults).map(r => ({
      title: r.title,
      snippet: r.snippet,
      url: r.link,
    }));

    // AI 컨텍스트 구성
    const contextParts: string[] = ['[웹 검색 결과]'];

    if (knowledgeSummary) {
      contextParts.push(`요약: ${knowledgeSummary}`);
    }

    for (const r of results) {
      contextParts.push(`- ${r.title}: ${r.snippet}`);
    }

    contextParts.push('위 검색 결과를 참고하여 정확한 정보 기반으로 답변하세요. 검색 결과와 다른 내용을 지어내지 마세요.');

    const context = contextParts.join('\n');

    console.log(`[WebSearch] query="${query}", results=${results.length}, kg=${!!knowledgeSummary}`);

    return {
      query,
      knowledgeSummary,
      results,
      context,
    };
  } catch (err) {
    console.error('[WebSearch] Error:', err);
    return { query, results: [], context: '' };
  }
}

// ═══════════════════════════════════════════
//  뉴스 검색 (Serper /news 엔드포인트)
// ═══════════════════════════════════════════

const SERPER_NEWS_URL = 'https://google.serper.dev/news';

export async function searchNews(query: string, numResults: number = 3): Promise<WebSearchResult> {
  const apiKey = Deno.env.get('SERPER_API_KEY');

  if (!apiKey) {
    console.warn('[NewsSearch] SERPER_API_KEY not configured');
    return { query, results: [], context: '' };
  }

  try {
    const response = await fetch(SERPER_NEWS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        q: query,
        gl: 'kr',
        hl: 'ko',
        num: numResults,
      }),
    });

    if (!response.ok) {
      console.error(`[NewsSearch] Serper News API error: ${response.status}`);
      return { query, results: [], context: '' };
    }

    const data = await response.json();

    // 뉴스 결과 정리
    const results = (data.news || []).slice(0, numResults).map((r: { title: string; link: string; snippet: string; date?: string; source?: string }) => ({
      title: r.source ? `[${r.source}] ${r.title}` : r.title,
      snippet: r.date ? `(${r.date}) ${r.snippet}` : r.snippet,
      url: r.link,
    }));

    const contextParts: string[] = ['[뉴스 검색 결과]'];
    for (const r of results) {
      contextParts.push(`- ${r.title}: ${r.snippet}`);
    }

    const context = contextParts.join('\n');
    console.log(`[NewsSearch] query="${query}", results=${results.length}`);

    return { query, results, context };
  } catch (err) {
    console.error('[NewsSearch] Error:', err);
    return { query, results: [], context: '' };
  }
}

// ═══════════════════════════════════════════
//  검색 쿼리 생성 (브랜드/기업 + 리테일 컨텍스트)
// ═══════════════════════════════════════════

export function buildSearchQuery(
  message: string,
  detectedEntities: string[]
): string {
  const msgLower = message.toLowerCase();

  // SNS/소셜미디어 컨텍스트 감지
  const isSnsQuery = /인스타|instagram|페이스북|facebook|유튜브|youtube|틱톡|tiktok|sns|소셜|블로그/i.test(message);
  const isResearchQuery = /리서치|조사|검색|찾아/i.test(message);

  // 감지된 고유명사가 있으면 해당 엔티티 중심 쿼리
  if (detectedEntities.length > 0) {
    // 한글 엔티티 우선, 없으면 가장 긴 영문 엔티티
    const koreanEnt = detectedEntities.find(e => /[가-힣]/.test(e));
    const longEngEnt = detectedEntities
      .filter(e => !/[가-힣]/.test(e))
      .sort((a, b) => b.length - a.length)[0];
    const entity = koreanEnt || longEngEnt || detectedEntities[0];

    // SNS/소셜미디어 검색
    if (isSnsQuery) {
      if (/인스타|instagram/i.test(message)) return `${entity} 인스타그램 공식 계정`;
      if (/페이스북|facebook/i.test(message)) return `${entity} 페이스북 페이지`;
      if (/유튜브|youtube/i.test(message)) return `${entity} 유튜브 채널`;
      return `${entity} SNS 소셜미디어 공식 계정`;
    }

    // 리서치/조사 요청
    if (isResearchQuery) {
      return `${entity} 브랜드 매장 리뷰 소개`;
    }

    // 리테일 맥락 추가 (세분화)
    if (/전략\s*(분석|리서치|조사)/.test(msgLower)) {
      return `${entity} 리테일 전략 분석 성공 사례`;
    }
    if (/오프라인/.test(msgLower)) {
      return `${entity} 오프라인 매장 전략 VMD 레이아웃`;
    }
    if (/리서치|조사/.test(msgLower)) {
      return `${entity} 브랜드 리서치 분석 리포트`;
    }
    if (/유통|현황|분석|전략/.test(msgLower)) {
      return `${entity} 브랜드 유통 현황 분석`;
    }
    if (msgLower.includes('팝업') || msgLower.includes('popup')) {
      return `${entity} 브랜드 공식 사이트 제품 카테고리`;
    }
    if (msgLower.includes('수입') || msgLower.includes('import')) {
      return `${entity} brand official products`;
    }
    return `${entity} 브랜드 소개 제품`;
  }

  // 엔티티 없이 SNS 일반 검색
  if (isSnsQuery) {
    return message.slice(0, 80) + ' SNS 인스타그램';
  }

  // 엔티티 없으면 원본 메시지 축약
  return message.slice(0, 100);
}

// ═══════════════════════════════════════════
//  듀얼 검색: 웹 + 소셜미디어 병렬 실행
// ═══════════════════════════════════════════

/**
 * 미지 엔티티에 대해 웹검색 + 소셜미디어 검색을 동시 실행하여
 * 결합된 컨텍스트를 반환합니다.
 *
 * - webQuery: 브랜드 일반 정보 (공식 사이트, 제품, 소개)
 * - snsQuery: 인스타그램/소셜미디어 반응 (리뷰, 해시태그, 계정)
 */
export async function dualSearch(
  message: string,
  detectedEntities: string[]
): Promise<{ webResult: WebSearchResult; snsResult: WebSearchResult; combinedContext: string }> {
  // 엔티티 우선순위: 한글 엔티티 > 긴 영문 엔티티 > 첫 번째 엔티티
  // (f&b, sns 같은 약어보다 실제 브랜드명을 우선)
  const koreanEntity = detectedEntities.find(e => /[가-힣]/.test(e));
  const longEnglishEntity = detectedEntities
    .filter(e => !/[가-힣]/.test(e))
    .sort((a, b) => b.length - a.length)[0];
  const entity = koreanEntity || longEnglishEntity || detectedEntities[0] || message.slice(0, 30);
  const msgLower = message.toLowerCase();

  // 메시지 맥락에 맞는 웹 검색 쿼리 구성 (세분화)
  let webQuery: string;
  if (/전략.*(분석|리서치)|오프라인.*매장/.test(msgLower)) {
    webQuery = `${entity} 오프라인 매장 전략 분석 사례`;
  } else if (/리서치|조사|분석/.test(msgLower)) {
    webQuery = `${entity} 브랜드 리서치 분석 리포트 현황`;
  } else if (msgLower.includes('팝업') || msgLower.includes('popup')) {
    webQuery = `${entity} 브랜드 공식 사이트 제품 카테고리`;
  } else if (msgLower.includes('수입') || msgLower.includes('import')) {
    webQuery = `${entity} brand official products`;
  } else if (/유통|현황|전략/.test(msgLower)) {
    webQuery = `${entity} 브랜드 유통 현황 분석`;
  } else if (/매장|공간|인테리어|동선/.test(msgLower)) {
    webQuery = `${entity} 매장 공간 인테리어 컨셉`;
  } else {
    webQuery = `${entity} 브랜드 소개 제품`;
  }

  // 소셜미디어 검색 쿼리
  const snsQuery = `${entity} 인스타그램 리뷰 후기`;

  console.log(`[DualSearch] web="${webQuery}", sns="${snsQuery}"`);

  // 병렬 실행
  const [webResult, snsResult] = await Promise.all([
    searchWeb(webQuery, 5),
    searchWeb(snsQuery, 3),
  ]);

  // 결합 컨텍스트 생성
  const parts: string[] = [];

  if (webResult.context) {
    parts.push(webResult.context);
  }

  if (snsResult.results.length > 0) {
    parts.push('\n[소셜미디어 검색 결과]');
    if (snsResult.knowledgeSummary) {
      parts.push(`요약: ${snsResult.knowledgeSummary}`);
    }
    for (const r of snsResult.results) {
      parts.push(`- ${r.title}: ${r.snippet}`);
    }
  }

  if (parts.length > 0) {
    parts.push('\n위 웹 검색 결과와 소셜미디어 정보를 종합하여 정확한 정보 기반으로 답변하세요. 검색 결과에서 확인된 사실만 전달하고, 확인되지 않은 내용은 지어내지 마세요. 검색 결과를 바탕으로 초기 분석을 제공한 뒤, 더 심화된 리서치를 위한 후속 질문을 안내하세요.');
  }

  const combinedContext = parts.join('\n');
  const totalResults = webResult.results.length + snsResult.results.length;
  console.log(`[DualSearch] combined: web=${webResult.results.length}, sns=${snsResult.results.length}, total=${totalResults}`);

  return { webResult, snsResult, combinedContext };
}
