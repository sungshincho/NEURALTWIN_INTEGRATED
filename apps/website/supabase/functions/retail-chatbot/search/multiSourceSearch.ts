/**
 * Multi-Source Search — Phase 2 (Layer 2)
 *
 * searchStrategyEngine의 쿼리 목록을 받아 병렬 실행
 * 기존 webSearch.ts의 searchWeb() 함수를 활용
 *
 * 기능:
 * - 우선순위 기반 쿼리 실행 (priority 1~3)
 * - 병렬 실행 + 개별 타임아웃 (3초)
 * - 실패한 쿼리는 결과 없이 건너뜀 (fail-open)
 */

import { searchWeb, searchNews, type WebSearchResult } from '../webSearch.ts';
import type { SearchQuery } from './searchStrategyEngine.ts';

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export interface MultiSearchResultItem {
  query: string;
  type: 'web' | 'sns' | 'news';
  priority: number;
  results: Array<{
    title: string;
    snippet: string;
    url: string;
  }>;
  knowledgeSummary?: string;
}

export interface MultiSearchResponse {
  items: MultiSearchResultItem[];
  totalResults: number;
  queriesExecuted: number;
  queriesFailed: number;
}

// ═══════════════════════════════════════════
//  상수
// ═══════════════════════════════════════════

const SEARCH_TIMEOUT_MS = 3000;   // 개별 검색 타임아웃 (3초)
const MAX_CONCURRENT = 3;         // 최대 동시 검색 수
const WEB_RESULT_COUNT = 5;       // 웹 검색 결과 수
const SNS_RESULT_COUNT = 3;       // SNS 검색 결과 수
const NEWS_RESULT_COUNT = 3;      // 뉴스 검색 결과 수

// ═══════════════════════════════════════════
//  메인 실행 함수
// ═══════════════════════════════════════════

/**
 * 검색 전략 쿼리들을 병렬 실행하여 통합 결과 반환
 */
export async function executeMultiSearch(
  queries: SearchQuery[]
): Promise<MultiSearchResponse> {
  if (queries.length === 0) {
    return { items: [], totalResults: 0, queriesExecuted: 0, queriesFailed: 0 };
  }

  // 우선순위순 정렬 + 최대 동시 실행 수 제한
  const sortedQueries = [...queries]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_CONCURRENT);

  console.log(`[MultiSearch] Executing ${sortedQueries.length} queries (${sortedQueries.map(q => q.type).join(', ')})`);

  // 병렬 실행 (개별 타임아웃 + 에러 포획)
  const results = await Promise.allSettled(
    sortedQueries.map(q => executeSearchWithTimeout(q))
  );

  const items: MultiSearchResultItem[] = [];
  let totalResults = 0;
  let queriesFailed = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const query = sortedQueries[i];

    if (result.status === 'fulfilled' && result.value) {
      const searchResult = result.value;
      const item: MultiSearchResultItem = {
        query: query.query,
        type: query.type,
        priority: query.priority,
        results: searchResult.results,
        knowledgeSummary: searchResult.knowledgeSummary,
      };
      items.push(item);
      totalResults += searchResult.results.length;
    } else {
      queriesFailed++;
      const reason = result.status === 'rejected' ? result.reason : 'empty result';
      console.warn(`[MultiSearch] Query failed: "${query.query}" — ${reason}`);
    }
  }

  console.log(`[MultiSearch] Done: ${items.length}/${sortedQueries.length} queries, ${totalResults} total results`);

  return {
    items,
    totalResults,
    queriesExecuted: sortedQueries.length,
    queriesFailed,
  };
}

// ═══════════════════════════════════════════
//  개별 검색 + 타임아웃
// ═══════════════════════════════════════════

async function executeSearchWithTimeout(
  query: SearchQuery
): Promise<WebSearchResult> {
  let numResults: number;
  let searchFn: (q: string, n: number) => Promise<WebSearchResult>;

  switch (query.type) {
    case 'news':
      numResults = NEWS_RESULT_COUNT;
      searchFn = searchNews;
      break;
    case 'sns':
      numResults = SNS_RESULT_COUNT;
      searchFn = searchWeb;
      break;
    default:
      numResults = WEB_RESULT_COUNT;
      searchFn = searchWeb;
  }

  return Promise.race([
    searchFn(query.query, numResults),
    new Promise<WebSearchResult>((_, reject) =>
      setTimeout(() => reject(new Error(`Search timeout: ${query.query}`)), SEARCH_TIMEOUT_MS)
    ),
  ]);
}
