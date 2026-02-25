/**
 * Result Filter — Phase 2 (Layer 2)
 *
 * multiSourceSearch 결과를 필터링·중복 제거·점수화하여
 * 시스템 프롬프트에 주입할 최종 컨텍스트를 생성
 *
 * 기능:
 * - URL 기반 중복 제거
 * - 스팸/광고 필터링
 * - 관련성 점수 계산 (키워드 매칭)
 * - 토큰 예산 내 컨텍스트 구성
 */

import type { MultiSearchResponse, MultiSearchResultItem } from './multiSourceSearch.ts';

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export interface FilteredResult {
  title: string;
  snippet: string;
  url: string;
  source: 'web' | 'sns' | 'news';
  relevanceScore: number;
}

export interface FilteredSearchResponse {
  results: FilteredResult[];
  context: string;                // 시스템 프롬프트 주입용
  totalBeforeFilter: number;
  totalAfterFilter: number;
  hasKnowledgeGraph: boolean;
  knowledgeSummary?: string;
}

// ═══════════════════════════════════════════
//  상수
// ═══════════════════════════════════════════

const MAX_RESULTS = 6;                  // 최대 결과 수
const MAX_CONTEXT_CHARS = 2000;         // 컨텍스트 최대 글자 수 (~500 토큰)
const MIN_SNIPPET_LENGTH = 20;          // 최소 스니펫 길이

// 스팸/광고 URL 패턴
const SPAM_URL_PATTERNS = [
  /shopping\.naver\.com/,
  /ad\./,
  /click\./,
  /affiliate/i,
  /coupang\.com\/vp/,         // 쿠팡 광고 링크
  /smartstore\.naver\.com/,   // 스마트스토어 (판매 페이지)
];

// 낮은 관련성 도메인
const LOW_RELEVANCE_DOMAINS = [
  'pinterest.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'play.google.com',
  'apps.apple.com',
];

// ═══════════════════════════════════════════
//  메인 필터 함수
// ═══════════════════════════════════════════

/**
 * 검색 결과를 필터링·점수화하여 최종 컨텍스트 생성
 */
export function filterAndFormatResults(
  searchResponse: MultiSearchResponse,
  originalMessage: string
): FilteredSearchResponse {
  const allResults: FilteredResult[] = [];
  const seenUrls = new Set<string>();
  let knowledgeSummary: string | undefined;

  // 1. 모든 검색 결과를 단일 리스트로 병합
  for (const item of searchResponse.items) {
    // Knowledge Graph 요약 수집 (첫 번째만)
    if (item.knowledgeSummary && !knowledgeSummary) {
      knowledgeSummary = item.knowledgeSummary;
    }

    for (const r of item.results) {
      // URL 중복 제거
      const normalizedUrl = normalizeUrl(r.url);
      if (seenUrls.has(normalizedUrl)) continue;
      seenUrls.add(normalizedUrl);

      // 스팸 필터
      if (isSpamUrl(r.url)) continue;

      // 최소 스니펫 길이
      if (r.snippet.length < MIN_SNIPPET_LENGTH) continue;

      // 관련성 점수 계산
      const relevanceScore = calculateRelevance(r.title, r.snippet, r.url, originalMessage, item.type);

      allResults.push({
        title: r.title,
        snippet: r.snippet,
        url: r.url,
        source: item.type,
        relevanceScore,
      });
    }
  }

  const totalBeforeFilter = searchResponse.totalResults;

  // 2. 점수순 정렬 + 최대 개수 제한
  allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const topResults = allResults.slice(0, MAX_RESULTS);

  // 3. 컨텍스트 텍스트 생성
  const context = buildContextText(topResults, knowledgeSummary);

  return {
    results: topResults,
    context,
    totalBeforeFilter,
    totalAfterFilter: topResults.length,
    hasKnowledgeGraph: !!knowledgeSummary,
    knowledgeSummary,
  };
}

// ═══════════════════════════════════════════
//  유틸리티
// ═══════════════════════════════════════════

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // 프로토콜, 트레일링 슬래시, 쿼리 파라미터 제거
    return `${u.hostname}${u.pathname}`.replace(/\/$/, '').toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function isSpamUrl(url: string): boolean {
  return SPAM_URL_PATTERNS.some(p => p.test(url));
}

function isLowRelevanceDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return LOW_RELEVANCE_DOMAINS.some(d => hostname.includes(d));
  } catch {
    return false;
  }
}

/**
 * 관련성 점수 계산 (0~1)
 * - 키워드 매칭 (타이틀/스니펫 vs 원본 메시지)
 * - 소스 타입 보너스
 * - 도메인 페널티
 */
function calculateRelevance(
  title: string,
  snippet: string,
  url: string,
  message: string,
  sourceType: 'web' | 'sns' | 'news'
): number {
  let score = 0.5; // 기본 점수

  // 메시지에서 의미 있는 키워드 추출 (2글자 이상)
  const keywords = extractKeywords(message);

  // 타이틀 키워드 매칭
  const titleLower = title.toLowerCase();
  for (const kw of keywords) {
    if (titleLower.includes(kw)) score += 0.15;
  }

  // 스니펫 키워드 매칭
  const snippetLower = snippet.toLowerCase();
  for (const kw of keywords) {
    if (snippetLower.includes(kw)) score += 0.1;
  }

  // 소스 타입 보정
  if (sourceType === 'web') score += 0.05;

  // 도메인 페널티
  if (isLowRelevanceDomain(url)) score -= 0.2;

  // 스니펫 길이 보너스 (더 상세할수록 유용)
  if (snippet.length > 100) score += 0.05;
  if (snippet.length > 200) score += 0.05;

  return Math.max(0, Math.min(1, score));
}

function extractKeywords(message: string): string[] {
  // 한글 2글자 이상 + 영문 3글자 이상 추출
  const words = message.toLowerCase().split(/[\s,?!.]+/);
  return words.filter(w =>
    (w.length >= 2 && /[가-힣]/.test(w)) ||
    (w.length >= 3 && /[a-z]/.test(w))
  );
}

// ═══════════════════════════════════════════
//  컨텍스트 텍스트 빌더
// ═══════════════════════════════════════════

function buildContextText(
  results: FilteredResult[],
  knowledgeSummary?: string
): string {
  if (results.length === 0 && !knowledgeSummary) return '';

  const parts: string[] = ['[웹 검색 결과]'];
  let charCount = parts[0].length;

  // Knowledge Graph 요약
  if (knowledgeSummary) {
    const line = `요약: ${knowledgeSummary}`;
    parts.push(line);
    charCount += line.length;
  }

  // 웹 결과 (URL 포함)
  const webResults = results.filter(r => r.source === 'web');
  for (const r of webResults) {
    const line = `- ${r.title} (${r.url}): ${r.snippet}`;
    if (charCount + line.length > MAX_CONTEXT_CHARS) break;
    parts.push(line);
    charCount += line.length;
  }

  // 뉴스 결과 (별도 섹션, URL 포함)
  const newsResults = results.filter(r => r.source === 'news');
  if (newsResults.length > 0) {
    const header = '\n[최신 뉴스 검색 결과]';
    parts.push(header);
    charCount += header.length;

    for (const r of newsResults) {
      const line = `- ${r.title} (${r.url}): ${r.snippet}`;
      if (charCount + line.length > MAX_CONTEXT_CHARS) break;
      parts.push(line);
      charCount += line.length;
    }
  }

  // SNS 결과 (별도 섹션, URL 포함)
  const snsResults = results.filter(r => r.source === 'sns');
  if (snsResults.length > 0) {
    const header = '\n[소셜미디어 검색 결과]';
    parts.push(header);
    charCount += header.length;

    for (const r of snsResults) {
      const line = `- ${r.title} (${r.url}): ${r.snippet}`;
      if (charCount + line.length > MAX_CONTEXT_CHARS) break;
      parts.push(line);
      charCount += line.length;
    }
  }

  parts.push('\n위 검색 결과를 참고하여 정확한 정보 기반으로 답변하세요. 검색 결과와 다른 내용을 지어내지 마세요. 가능하면 검색 결과의 새로운 사례를 인용하고, 동일 브랜드 반복을 피하세요.');

  return parts.join('\n');
}
