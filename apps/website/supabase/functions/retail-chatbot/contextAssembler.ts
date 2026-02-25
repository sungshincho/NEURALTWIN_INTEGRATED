/**
 * Context Assembler — Phase 2
 *
 * Layer 1 (벡터 지식) + Layer 2 (웹 검색) + Layer 3 (대화 메모리)를
 * 토큰 예산 내에서 최적으로 조합하여 최종 시스템 프롬프트 생성
 *
 * 토큰 예산 (Gemini 2.5 Pro input ~1M, 실용적 프롬프트 한도):
 * - 기본 시스템 프롬프트: ~4,000 tokens (고정)
 * - Layer 1 벡터 지식: ~2,000 tokens (최대)
 * - Layer 2 웹 검색: ~1,500 tokens (최대)
 * - Layer 3 프로파일: ~200 tokens
 * - Layer 3 인사이트: ~500 tokens
 * - 깊이 지시: ~300 tokens
 * - 합계 목표: ~8,500 tokens 이내
 *
 * 우선순위:
 * 1. 기본 시스템 프롬프트 (필수, 자르지 않음)
 * 2. Layer 1 벡터 지식 (핵심, 자르지 않음)
 * 3. Layer 3 대화 메모리 (맥락, 자르지 않음)
 * 4. Layer 2 웹 검색 (보충, 예산 초과 시 축소)
 * 5. 깊이 지시 (마지막, 예산 초과 시 생략)
 */

// ═══════════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════════

export interface AssemblyInput {
  // 기본 (필수)
  systemPrompt: string;            // topicRouter.buildEnrichedPrompt 결과

  // Layer 1: 벡터 지식
  knowledgeContext: string;         // formatSearchResultsForPrompt 결과

  // Layer 2: 웹 검색
  searchContext: string;            // filterAndFormatResults 결과

  // Layer 3: 대화 메모리
  profileContext: string;           // formatProfileForPrompt 결과
  insightsContext: string;          // formatInsightsForPrompt 결과

  // 질문 깊이 지시
  depthInstruction: string;         // getDepthInstruction 결과

  // PI: 점진적 품질 향상 지시 (대화 진행 단계별)
  progressiveInstruction?: string;  // buildProgressiveInstruction 결과
}

export interface AssemblyResult {
  finalPrompt: string;              // 최종 조립된 시스템 프롬프트
  tokenEstimate: number;            // 추정 토큰 수
  layersIncluded: string[];         // 포함된 레이어 목록
  truncated: boolean;               // 일부 컨텐츠가 잘렸는지
}

// ═══════════════════════════════════════════
//  상수
// ═══════════════════════════════════════════

// 대략적 토큰 추정: 한글 1자 ≈ 1.5 토큰, 영문 1단어 ≈ 1.3 토큰
// 혼합 텍스트 평균: 1글자 ≈ 1.2 토큰 (보수적 추정)
const CHARS_PER_TOKEN = 0.83;       // 1 토큰 ≈ 0.83 글자 (한글 기준)
const MAX_TOTAL_TOKENS = 10000;     // 전체 시스템 프롬프트 토큰 상한
const MAX_SEARCH_CONTEXT_TOKENS = 1500;

// ═══════════════════════════════════════════
//  토큰 추정
// ═══════════════════════════════════════════

function estimateTokens(text: string): number {
  if (!text) return 0;
  // 한글 비율에 따라 가중 추정
  const koreanChars = (text.match(/[가-힣]/g) || []).length;
  const totalChars = text.length;
  const koreanRatio = koreanChars / Math.max(totalChars, 1);

  // 한글 비율이 높을수록 토큰/글자 비율 증가
  const charsPerToken = 0.83 - (koreanRatio * 0.2); // 한글 많으면 0.63, 영어면 0.83
  return Math.ceil(totalChars / Math.max(charsPerToken, 0.5));
}

// ═══════════════════════════════════════════
//  텍스트 토큰 단위 트림
// ═══════════════════════════════════════════

function trimToTokenBudget(text: string, maxTokens: number): string {
  const currentTokens = estimateTokens(text);
  if (currentTokens <= maxTokens) return text;

  // 줄 단위로 자르기 (의미 보존)
  const lines = text.split('\n');
  let result = '';
  let tokens = 0;

  for (const line of lines) {
    const lineTokens = estimateTokens(line);
    if (tokens + lineTokens > maxTokens) break;
    result += (result ? '\n' : '') + line;
    tokens += lineTokens;
  }

  return result;
}

// ═══════════════════════════════════════════
//  메인 조립 함수
// ═══════════════════════════════════════════

export function assembleContext(input: AssemblyInput): AssemblyResult {
  const {
    systemPrompt,
    knowledgeContext,
    searchContext,
    profileContext,
    insightsContext,
    depthInstruction,
    progressiveInstruction,
  } = input;

  const layersIncluded: string[] = ['system_prompt'];
  let truncated = false;

  // 1. 기본 프롬프트 (필수)
  let assembled = systemPrompt;
  let usedTokens = estimateTokens(assembled);

  // 2. Layer 1: 벡터 지식 (핵심 — 자르지 않음)
  if (knowledgeContext) {
    assembled += knowledgeContext;
    usedTokens += estimateTokens(knowledgeContext);
    layersIncluded.push('knowledge_vector');
  }

  // 3. Layer 3: 프로파일 (소형, 자르지 않음)
  if (profileContext) {
    assembled += profileContext;
    usedTokens += estimateTokens(profileContext);
    layersIncluded.push('user_profile');
  }

  // 4. Layer 3: 대화 인사이트 (중형, 자르지 않음)
  if (insightsContext) {
    assembled += insightsContext;
    usedTokens += estimateTokens(insightsContext);
    layersIncluded.push('conversation_insights');
  }

  // 5. Layer 2: 웹 검색 (큰, 예산 초과 시 축소)
  // C-6: 레퍼런스/사례 질문 시 웹 검색 결과를 "최신 사례"로 우선 배치
  const isReferenceQuery = /레퍼런스|사례|케이스|case study|best practice|benchmark|글로벌.*사례|해외.*사례/i.test(searchContext);
  if (searchContext) {
    const effectiveSearchContext = isReferenceQuery && knowledgeContext
      ? searchContext + '\n[참고: 위 검색 결과가 최신 사례이며 우선 인용하세요. 벡터 지식은 보충 참고용입니다.]'
      : searchContext;
    const searchTokens = estimateTokens(effectiveSearchContext);
    const remainingBudget = MAX_TOTAL_TOKENS - usedTokens - estimateTokens(depthInstruction);

    if (searchTokens <= remainingBudget && searchTokens <= MAX_SEARCH_CONTEXT_TOKENS) {
      assembled += effectiveSearchContext;
      usedTokens += searchTokens;
      layersIncluded.push(isReferenceQuery ? 'web_search_priority' : 'web_search');
    } else {
      // 예산 맞춰 축소
      const budget = Math.min(remainingBudget, MAX_SEARCH_CONTEXT_TOKENS);
      if (budget > 200) { // 최소 200 토큰은 있어야 의미 있음
        const trimmed = trimToTokenBudget(searchContext, budget);
        assembled += trimmed;
        usedTokens += estimateTokens(trimmed);
        layersIncluded.push('web_search_trimmed');
        truncated = true;
      }
    }
  }

  // 6. 깊이 지시 (마지막, 예산 초과 시 생략)
  if (depthInstruction) {
    const depthTokens = estimateTokens(depthInstruction);
    if (usedTokens + depthTokens <= MAX_TOTAL_TOKENS) {
      assembled += '\n' + depthInstruction;
      usedTokens += depthTokens;
      layersIncluded.push('depth_instruction');
    } else {
      truncated = true;
    }
  }

  // 7. PI: 점진적 품질 향상 지시 (대화 단계별)
  if (progressiveInstruction) {
    const piTokens = estimateTokens(progressiveInstruction);
    if (usedTokens + piTokens <= MAX_TOTAL_TOKENS + 500) { // 약간의 여유 허용
      assembled += '\n' + progressiveInstruction;
      usedTokens += piTokens;
      layersIncluded.push('progressive_intelligence');
    } else {
      truncated = true;
    }
  }

  return {
    finalPrompt: assembled,
    tokenEstimate: usedTokens,
    layersIncluded,
    truncated,
  };
}
