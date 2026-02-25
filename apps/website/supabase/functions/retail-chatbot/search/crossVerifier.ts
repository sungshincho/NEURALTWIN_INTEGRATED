/**
 * Cross-Verifier — Phase 5 (Layer 2 Enhancement)
 *
 * 다중 검색 소스에서 수집된 수치/데이터의 일관성을 확인
 * AI 컨텍스트에 신뢰도 라벨을 추가하여 답변 정확도 향상
 *
 * 동작 방식:
 * 1. 검색 결과에서 수치 패턴 추출 (퍼센트, 금액, 배율 등)
 * 2. 동일 키워드 근처의 수치를 비교
 * 3. 2개 이상 소스에서 유사한 수치 → 높은 신뢰도
 * 4. 소스 간 수치 차이가 크면 → 범위로 표시
 */

import type { FilteredResult } from './resultFilter.ts';

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

interface ExtractedFact {
  keyword: string;    // "전환율", "객단가" 등
  value: number;
  unit: string;       // "%", "원", "배" 등
  sourceIndex: number;
}

export interface VerifiedFact {
  keyword: string;
  values: number[];
  unit: string;
  sourceCount: number;
  confidence: 'high' | 'medium' | 'low';
  summary: string;    // "전환율: 15~20% (3개 소스 일치)"
}

export interface CrossVerificationResult {
  verifiedFacts: VerifiedFact[];
  contextAnnotation: string;  // AI 컨텍스트에 추가할 신뢰도 메모
}

// ═══════════════════════════════════════════
//  수치 추출 패턴
// ═══════════════════════════════════════════

// 한국어 수치 패턴: "전환율 15.3%", "객단가 25,000원", "매출 3배"
const NUM_PATTERNS = [
  { regex: /(전환율|CVR|conversion)\s*[:\s]*(\d+(?:\.\d+)?)%/gi, unit: '%' },
  { regex: /(객단가|단가|AOV|평균\s*구매)\s*[:\s]*(?:약\s*)?(\d[\d,]*)원?/gi, unit: '원' },
  { regex: /(매출|revenue|sales)\s*[:\s]*(\d+(?:\.\d+)?)\s*(배|%|억)/gi, unit: '' },
  { regex: /(체류\s*시간|dwell\s*time)\s*[:\s]*(\d+(?:\.\d+)?)\s*(분|초)/gi, unit: '' },
  { regex: /(ROI|수익률|투자\s*수익)\s*[:\s]*(\d+(?:\.\d+)?)%/gi, unit: '%' },
  { regex: /(면적|평수)\s*[:\s]*(\d+(?:\.\d+)?)\s*(평|㎡|m²)/gi, unit: '' },
  { regex: /(\d+(?:\.\d+)?)\s*%\s*(증가|감소|향상|개선|상승|하락)/gi, unit: '%' },
];

// ═══════════════════════════════════════════
//  메인 교차 검증 함수
// ═══════════════════════════════════════════

export function crossVerifyResults(results: FilteredResult[]): CrossVerificationResult {
  if (results.length < 2) {
    return { verifiedFacts: [], contextAnnotation: '' };
  }

  // 1. 모든 결과에서 수치 추출
  const allFacts: ExtractedFact[] = [];
  for (let i = 0; i < results.length; i++) {
    const text = `${results[i].title} ${results[i].snippet}`;
    const facts = extractFacts(text, i);
    allFacts.push(...facts);
  }

  if (allFacts.length === 0) {
    return { verifiedFacts: [], contextAnnotation: '' };
  }

  // 2. 키워드별로 그룹핑
  const grouped = groupFactsByKeyword(allFacts);

  // 3. 교차 검증
  const verifiedFacts: VerifiedFact[] = [];
  for (const [keyword, facts] of grouped.entries()) {
    // 고유 소스 수 계산
    const uniqueSources = new Set(facts.map(f => f.sourceIndex)).size;
    const values = facts.map(f => f.value);
    const unit = facts[0].unit;

    // 신뢰도 판정
    let confidence: 'high' | 'medium' | 'low';
    if (uniqueSources >= 3) {
      confidence = 'high';
    } else if (uniqueSources >= 2) {
      // 값 편차로 추가 판정
      const spread = getSpreadRatio(values);
      confidence = spread < 0.3 ? 'high' : 'medium';
    } else {
      confidence = 'low';
    }

    // 요약 생성
    const min = Math.min(...values);
    const max = Math.max(...values);
    const summary = min === max
      ? `${keyword}: ${min}${unit} (${uniqueSources}개 소스 일치)`
      : `${keyword}: ${min}~${max}${unit} (${uniqueSources}개 소스)`;

    verifiedFacts.push({
      keyword,
      values,
      unit,
      sourceCount: uniqueSources,
      confidence,
      summary,
    });
  }

  // 4. 컨텍스트 주석 생성
  const contextAnnotation = buildContextAnnotation(verifiedFacts);

  return { verifiedFacts, contextAnnotation };
}

// ═══════════════════════════════════════════
//  유틸리티 함수
// ═══════════════════════════════════════════

function extractFacts(text: string, sourceIndex: number): ExtractedFact[] {
  const facts: ExtractedFact[] = [];

  for (const pattern of NUM_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      // 숫자가 첫 번째 그룹이면 키워드는 뒤에, 아니면 앞에
      let keyword: string;
      let valueStr: string;

      if (/^\d/.test(match[1])) {
        // "15% 증가" 패턴 — 키워드는 뒤쪽
        valueStr = match[1];
        keyword = match[2] || '변화율';
      } else {
        keyword = match[1];
        valueStr = match[2];
      }

      const value = parseFloat(valueStr.replace(/,/g, ''));
      if (!isNaN(value)) {
        // 단위: 패턴 기본 단위 또는 매칭된 단위
        const unit = pattern.unit || match[3] || '';
        facts.push({
          keyword: normalizeKeyword(keyword),
          value,
          unit,
          sourceIndex,
        });
      }
    }
  }

  return facts;
}

function normalizeKeyword(keyword: string): string {
  const lower = keyword.toLowerCase().trim();
  // 동의어 정규화
  if (/전환율|cvr|conversion/.test(lower)) return '전환율';
  if (/객단가|단가|aov|평균\s*구매/.test(lower)) return '객단가';
  if (/매출|revenue|sales/.test(lower)) return '매출';
  if (/체류\s*시간|dwell\s*time/.test(lower)) return '체류시간';
  if (/roi|수익률|투자\s*수익/.test(lower)) return 'ROI';
  if (/증가|향상|개선|상승/.test(lower)) return '증가율';
  if (/감소|하락/.test(lower)) return '감소율';
  return keyword.trim();
}

function groupFactsByKeyword(facts: ExtractedFact[]): Map<string, ExtractedFact[]> {
  const grouped = new Map<string, ExtractedFact[]>();
  for (const fact of facts) {
    const existing = grouped.get(fact.keyword) || [];
    existing.push(fact);
    grouped.set(fact.keyword, existing);
  }
  // 1개 소스만 있는 것은 제외
  for (const [key, facts] of grouped.entries()) {
    if (facts.length < 2) grouped.delete(key);
  }
  return grouped;
}

function getSpreadRatio(values: number[]): number {
  if (values.length < 2) return 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === 0) return max === 0 ? 0 : 1;
  return (max - min) / min;
}

function buildContextAnnotation(facts: VerifiedFact[]): string {
  if (facts.length === 0) return '';

  const highConfidence = facts.filter(f => f.confidence === 'high');
  const medConfidence = facts.filter(f => f.confidence === 'medium');

  const parts: string[] = ['\n[교차 검증 결과]'];

  if (highConfidence.length > 0) {
    parts.push('높은 신뢰도 (다수 소스 일치):');
    for (const f of highConfidence) {
      parts.push(`  ✓ ${f.summary}`);
    }
  }

  if (medConfidence.length > 0) {
    parts.push('중간 신뢰도 (소스 간 차이 있음):');
    for (const f of medConfidence) {
      parts.push(`  △ ${f.summary}`);
    }
  }

  parts.push('위 교차 검증 결과를 참고하여, 높은 신뢰도 수치를 우선 인용하세요. 중간 신뢰도 수치는 범위로 표현하세요.');

  return parts.join('\n');
}
