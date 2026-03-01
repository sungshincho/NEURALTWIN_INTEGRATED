/**
 * Fact Summarizer — Phase 6 (C-5)
 *
 * 검색 결과에서 핵심 팩트(수치, 사례, 트렌드)를 추출하여
 * 구조화된 요약을 생성. AI 컨텍스트에 추가하여 답변 정확도 향상.
 *
 * 규칙 기반 추출 (API 호출 없이 토큰 효율적):
 * 1. 수치 팩트: 퍼센트, 금액, 배율 등
 * 2. 브랜드/사례: 고유명사 + 성과 정보
 * 3. 트렌드 키워드: 최근, 증가, 급성장 등
 */

import type { FilteredResult } from './resultFilter.ts';
import type { VerifiedFact } from './crossVerifier.ts';

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export interface ExtractedFact {
  type: 'stat' | 'case' | 'trend';
  text: string;          // 핵심 문장 (1줄)
  source: string;        // 출처 타이틀
  confidence: number;    // 0~1
}

export interface FactSummaryResult {
  facts: ExtractedFact[];
  summaryText: string;   // AI 컨텍스트 주입용 요약
  factCount: number;
}

// ═══════════════════════════════════════════
//  수치 팩트 추출 패턴
// ═══════════════════════════════════════════

const STAT_PATTERNS = [
  // "전환율 15.3%", "매출 30% 증가"
  /([가-힣a-zA-Z\s]{2,10})\s*(?:약\s*)?(\d[\d,.]*)\s*(%|원|배|억|만|건|명|개월|평|㎡)/g,
  // "3배 향상", "200% 성장"
  /(\d[\d,.]*)\s*(배|%)\s*(향상|성장|증가|개선|상승|감소|하락)/g,
  // "$25,000", "25000원"
  /(?:약\s*)?(\d[\d,.]*)\s*(달러|원|USD|\$)/g,
];

// 사례 추출 패턴 (브랜드명 + 성과)
const CASE_PATTERNS = [
  // "나이키는 ... 증가했다", "스타벅스의 ... 전략"
  /([가-힣a-zA-Z]{2,15})[은는이가의]?\s+.{5,40}(?:증가|감소|성장|도입|적용|활용|운영|개선|향상|성공|실패)/g,
  // "~~ 사례", "~~ 케이스"
  /.{5,50}(?:사례|케이스|case|best practice)/gi,
];

// 트렌드 패턴
const TREND_PATTERNS = [
  /(?:최근|최신|2024|2025|2026|올해)\s*.{5,50}(?:트렌드|추세|동향|변화)/g,
  /(?:급성장|급증|폭발적|혁신적|파괴적)\s*.{3,30}/g,
];

// ═══════════════════════════════════════════
//  메인 팩트 요약 함수
// ═══════════════════════════════════════════

export function summarizeFacts(
  results: FilteredResult[],
  verifiedFacts?: VerifiedFact[]
): FactSummaryResult {
  if (results.length === 0) {
    return { facts: [], summaryText: '', factCount: 0 };
  }

  const allFacts: ExtractedFact[] = [];

  // 1. 각 결과에서 팩트 추출
  for (const result of results) {
    const text = `${result.title} ${result.snippet}`;

    // 수치 팩트
    const stats = extractByPatterns(text, STAT_PATTERNS, 'stat', result.title);
    allFacts.push(...stats);

    // 사례 팩트
    const cases = extractByPatterns(text, CASE_PATTERNS, 'case', result.title);
    allFacts.push(...cases);

    // 트렌드 팩트
    const trends = extractByPatterns(text, TREND_PATTERNS, 'trend', result.title);
    allFacts.push(...trends);
  }

  // 2. 교차 검증 결과 반영 (있으면)
  if (verifiedFacts && verifiedFacts.length > 0) {
    for (const vf of verifiedFacts) {
      // 교차 검증된 팩트는 높은 신뢰도로 추가
      const confidence = vf.confidence === 'high' ? 0.95 : vf.confidence === 'medium' ? 0.7 : 0.4;
      allFacts.push({
        type: 'stat',
        text: vf.summary,
        source: `교차검증 (${vf.sourceCount}개 소스)`,
        confidence,
      });
    }
  }

  // 3. 중복 제거 + 신뢰도순 정렬
  const deduplicated = deduplicateFacts(allFacts);
  deduplicated.sort((a, b) => b.confidence - a.confidence);

  // 4. 상위 8개만 유지
  const topFacts = deduplicated.slice(0, 8);

  // 5. 요약 텍스트 생성
  const summaryText = buildFactSummary(topFacts);

  return {
    facts: topFacts,
    summaryText,
    factCount: topFacts.length,
  };
}

// ═══════════════════════════════════════════
//  유틸리티 함수
// ═══════════════════════════════════════════

function extractByPatterns(
  text: string,
  patterns: RegExp[],
  type: ExtractedFact['type'],
  source: string
): ExtractedFact[] {
  const facts: ExtractedFact[] = [];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const factText = match[0].trim();
      // 너무 짧거나 긴 것 필터
      if (factText.length < 5 || factText.length > 80) continue;

      facts.push({
        type,
        text: cleanFactText(factText),
        source: source.length > 30 ? source.slice(0, 30) + '…' : source,
        confidence: calculateFactConfidence(factText, type),
      });
    }
  }

  return facts;
}

function cleanFactText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^[,.\s]+|[,.\s]+$/g, '')
    .trim();
}

function calculateFactConfidence(text: string, type: ExtractedFact['type']): number {
  let score = 0.5;

  // 수치가 포함되면 신뢰도 증가
  if (/\d+/.test(text)) score += 0.15;

  // 구체적 단위 포함
  if (/%|원|배|억|만|달러|\$/.test(text)) score += 0.1;

  // 사례는 브랜드명이 명확할수록 높음
  if (type === 'case' && /[A-Z][a-z]+|[가-힣]{2,6}[은는이가]/.test(text)) score += 0.1;

  // 트렌드는 연도가 명시되면 높음
  if (type === 'trend' && /202[4-6]|올해|최근/.test(text)) score += 0.1;

  // 텍스트 길이가 적당하면 보너스 (15~50자가 가장 정보량이 높음)
  if (text.length >= 15 && text.length <= 50) score += 0.05;

  return Math.min(1, score);
}

function deduplicateFacts(facts: ExtractedFact[]): ExtractedFact[] {
  const seen = new Set<string>();
  const result: ExtractedFact[] = [];

  for (const fact of facts) {
    // 핵심 키워드 기반 중복 체크 (숫자+단위 조합)
    const key = fact.text
      .replace(/[^가-힣a-zA-Z0-9%원배억만]/g, '')
      .toLowerCase()
      .slice(0, 20);

    if (seen.has(key)) continue;
    seen.add(key);
    result.push(fact);
  }

  return result;
}

function buildFactSummary(facts: ExtractedFact[]): string {
  if (facts.length === 0) return '';

  const parts: string[] = ['\n[핵심 팩트 요약]'];

  // 타입별 그룹
  const stats = facts.filter(f => f.type === 'stat');
  const cases = facts.filter(f => f.type === 'case');
  const trends = facts.filter(f => f.type === 'trend');

  if (stats.length > 0) {
    parts.push('주요 수치:');
    for (const f of stats.slice(0, 4)) {
      const marker = f.confidence >= 0.8 ? '✓' : '·';
      parts.push(`  ${marker} ${f.text}`);
    }
  }

  if (cases.length > 0) {
    parts.push('주요 사례:');
    for (const f of cases.slice(0, 3)) {
      parts.push(`  · ${f.text}`);
    }
  }

  if (trends.length > 0) {
    parts.push('트렌드:');
    for (const f of trends.slice(0, 2)) {
      parts.push(`  · ${f.text}`);
    }
  }

  parts.push('위 핵심 팩트를 답변에 자연스럽게 인용하세요. 수치는 정확히, 사례는 구체적으로 언급하세요.');

  return parts.join('\n');
}
