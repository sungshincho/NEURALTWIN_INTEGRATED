/**
 * safeJsonParse.ts
 *
 * 안전한 JSON 파싱 유틸리티
 * - AI 응답 파싱 실패 시 폴백 처리
 * - 파싱 에러 로깅 및 추적
 *
 * Sprint 0 Task: S0-2
 * 작성일: 2026-01-12
 */

// ============================================================================
// 타입 정의
// ============================================================================

/** 파싱 결과 */
export interface ParseResult<T> {
  success: boolean;
  data: T;
  error?: string;
  rawResponse?: string;
  parseAttempts?: ParseAttempt[];
}

/** 파싱 시도 기록 */
export interface ParseAttempt {
  method: string;
  success: boolean;
  error?: string;
}

/** 파싱 옵션 */
export interface ParseOptions<T> {
  /** 폴백 데이터 (파싱 실패 시 반환) */
  fallback: T;
  /** 유효성 검증 함수 */
  validator?: (obj: unknown) => boolean;
  /** 마크다운 코드블록 제거 여부 */
  stripMarkdown?: boolean;
  /** 로깅 활성화 */
  enableLogging?: boolean;
  /** 함수명 (로깅용) */
  functionName?: string;
}

// ============================================================================
// 시뮬레이션 폴백 응답
// ============================================================================

/** 시뮬레이션 결과 폴백 */
export const SIMULATION_FALLBACK = {
  simulation_id: 'fallback',
  timestamp: new Date().toISOString(),
  duration_minutes: 0,
  kpis: {
    predicted_visitors: 0,
    predicted_conversion_rate: 0,
    predicted_revenue: 0,
    avg_dwell_time_seconds: 0,
    peak_congestion_percent: 0,
  },
  zone_analysis: [],
  flow_analysis: {
    primary_paths: [],
    dead_zones: [],
    congestion_points: [],
  },
  hourly_analysis: [],
  diagnostic_issues: [{
    id: 'parse-error',
    severity: 'critical' as const,
    category: 'conversion' as const,
    title: 'AI 응답 처리 실패',
    description: '시뮬레이션 결과를 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.',
    current_value: 0,
    threshold_value: 0,
    impact: '시뮬레이션 결과를 표시할 수 없습니다.',
    suggested_action: '시뮬레이션을 다시 실행하거나 지원팀에 문의하세요.',
  }],
  customer_journeys: [],
  ai_insights: ['AI 응답 파싱에 실패했습니다. 다시 시도해주세요.'],
  confidence_score: 0,
  _fallback: true,
};

/** 레이아웃 최적화 폴백 */
export const LAYOUT_OPTIMIZATION_FALLBACK = {
  furniture_changes: [],
  product_changes: [],
  summary: {
    total_furniture_changes: 0,
    total_product_changes: 0,
    expected_revenue_improvement: 0,
    expected_conversion_improvement: 0,
    confidence_score: 0,
    ai_insights: ['AI 응답 파싱에 실패했습니다. 다시 시도해주세요.'],
  },
  _fallback: true,
};

/** 인퍼런스 폴백 */
export const INFERENCE_FALLBACK = {
  result: null,
  insights: ['AI 응답 파싱에 실패했습니다.'],
  confidence: 0,
  _fallback: true,
};

// ============================================================================
// 핵심 파싱 함수
// ============================================================================

/**
 * 안전한 JSON 파싱
 *
 * @param text - 파싱할 텍스트 (AI 응답)
 * @param options - 파싱 옵션
 * @returns ParseResult<T>
 *
 * @example
 * const result = safeJsonParse(aiResponse, {
 *   fallback: SIMULATION_FALLBACK,
 *   stripMarkdown: true,
 *   validator: (obj) => obj.kpis !== undefined,
 * });
 *
 * if (result.success) {
 *   // 파싱 성공
 *   processResult(result.data);
 * } else {
 *   // 폴백 데이터 사용
 *   console.warn('Parsing failed:', result.error);
 *   processResult(result.data); // fallback data
 * }
 */
export function safeJsonParse<T>(
  text: string,
  options: ParseOptions<T>
): ParseResult<T> {
  const {
    fallback,
    validator,
    stripMarkdown = true,
    enableLogging = true,
    functionName = 'unknown',
  } = options;

  const attempts: ParseAttempt[] = [];

  // 빈 응답 체크
  if (!text || text.trim() === '') {
    if (enableLogging) {
      console.warn(`[safeJsonParse][${functionName}] Empty response`);
    }
    return {
      success: false,
      data: fallback,
      error: 'Empty response',
      rawResponse: text,
      parseAttempts: [{ method: 'empty-check', success: false, error: 'Empty response' }],
    };
  }

  let jsonStr = text.trim();

  // Step 1: 마크다운 코드블록 제거
  if (stripMarkdown) {
    const markdownMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (markdownMatch) {
      jsonStr = markdownMatch[1].trim();
      attempts.push({ method: 'strip-markdown', success: true });
    }
  }

  // Step 2: 첫 번째 { 또는 [ 찾기 (앞에 텍스트가 있을 경우)
  const jsonStartMatch = jsonStr.match(/^[^{\[]*([{\[][\s\S]*[}\]])$/);
  if (jsonStartMatch) {
    jsonStr = jsonStartMatch[1];
    attempts.push({ method: 'extract-json-bounds', success: true });
  }

  // Step 3: JSON 파싱 시도
  try {
    const parsed = JSON.parse(jsonStr);
    attempts.push({ method: 'json-parse', success: true });

    // Step 4: 유효성 검증
    if (validator) {
      const isValid = validator(parsed);
      attempts.push({ method: 'validation', success: isValid });

      if (!isValid) {
        if (enableLogging) {
          console.warn(`[safeJsonParse][${functionName}] Validation failed`);
        }
        return {
          success: false,
          data: fallback,
          error: 'Validation failed',
          rawResponse: text,
          parseAttempts: attempts,
        };
      }
    }

    if (enableLogging) {
      console.log(`[safeJsonParse][${functionName}] Parse success`);
    }

    return {
      success: true,
      data: parsed as T,
      parseAttempts: attempts,
    };

  } catch (parseError) {
    const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
    attempts.push({ method: 'json-parse', success: false, error: errorMessage });

    // Step 5: 복구 시도 - 흔한 JSON 오류 수정
    try {
      // 후행 콤마 제거
      const fixedJson = jsonStr
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');

      const parsed = JSON.parse(fixedJson);
      attempts.push({ method: 'fix-trailing-comma', success: true });

      if (validator && !validator(parsed)) {
        attempts.push({ method: 'validation-after-fix', success: false });
        throw new Error('Validation failed after fix');
      }

      if (enableLogging) {
        console.log(`[safeJsonParse][${functionName}] Parse success (after fix)`);
      }

      return {
        success: true,
        data: parsed as T,
        parseAttempts: attempts,
      };

    } catch {
      attempts.push({ method: 'fix-trailing-comma', success: false });
    }

    // Step 6: 부분 JSON 추출 시도
    try {
      // 첫 번째 완전한 JSON 객체 추출
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        const parsed = JSON.parse(objectMatch[0]);
        attempts.push({ method: 'extract-object', success: true });

        if (validator && !validator(parsed)) {
          throw new Error('Validation failed');
        }

        if (enableLogging) {
          console.log(`[safeJsonParse][${functionName}] Parse success (partial extract)`);
        }

        return {
          success: true,
          data: parsed as T,
          parseAttempts: attempts,
        };
      }
    } catch {
      attempts.push({ method: 'extract-object', success: false });
    }

    // 모든 시도 실패
    if (enableLogging) {
      console.error(`[safeJsonParse][${functionName}] All parse attempts failed:`, errorMessage);
      console.error(`[safeJsonParse][${functionName}] Raw response (first 500 chars):`, text.slice(0, 500));
    }

    return {
      success: false,
      data: fallback,
      error: errorMessage,
      rawResponse: text,
      parseAttempts: attempts,
    };
  }
}

// ============================================================================
// 특화된 파서 함수
// ============================================================================

/**
 * 시뮬레이션 응답 파싱
 */
export function parseSimulationResponse(
  text: string,
  enableLogging = true
): ParseResult<typeof SIMULATION_FALLBACK> {
  return safeJsonParse(text, {
    fallback: SIMULATION_FALLBACK,
    stripMarkdown: true,
    enableLogging,
    functionName: 'run-simulation',
    validator: (obj: unknown) => {
      const o = obj as Record<string, unknown>;
      return (
        o !== null &&
        typeof o === 'object' &&
        typeof o.kpis === 'object' ||
        Array.isArray(o.zone_analysis)
      );
    },
  });
}

/**
 * 레이아웃 최적화 응답 파싱
 */
export function parseLayoutOptimizationResponse(
  text: string,
  enableLogging = true
): ParseResult<typeof LAYOUT_OPTIMIZATION_FALLBACK> {
  return safeJsonParse(text, {
    fallback: LAYOUT_OPTIMIZATION_FALLBACK,
    stripMarkdown: true,
    enableLogging,
    functionName: 'generate-optimization',
    validator: (obj: unknown) => {
      const o = obj as Record<string, unknown>;
      return (
        o !== null &&
        typeof o === 'object' &&
        (Array.isArray(o.furniture_changes) || Array.isArray(o.product_changes))
      );
    },
  });
}

/**
 * 인퍼런스 응답 파싱
 */
export function parseInferenceResponse(
  text: string,
  enableLogging = true
): ParseResult<typeof INFERENCE_FALLBACK> {
  return safeJsonParse(text, {
    fallback: INFERENCE_FALLBACK,
    stripMarkdown: true,
    enableLogging,
    functionName: 'retail-ai-inference',
  });
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * AI 응답에서 JSON 추출
 * (마크다운 코드블록 및 앞뒤 텍스트 제거)
 */
export function extractJsonFromResponse(text: string): string {
  let result = text.trim();

  // 마크다운 코드블록 제거
  const markdownMatch = result.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (markdownMatch) {
    result = markdownMatch[1].trim();
  }

  // 앞뒤 텍스트 제거 (JSON 객체/배열만 추출)
  const jsonMatch = result.match(/([{\[][\s\S]*[}\]])/);
  if (jsonMatch) {
    result = jsonMatch[1];
  }

  return result;
}

/**
 * 파싱 결과 로깅
 */
export function logParseResult<T>(
  result: ParseResult<T>,
  functionName: string
): void {
  if (result.success) {
    console.log(`[${functionName}] JSON parse success`);
  } else {
    console.warn(`[${functionName}] JSON parse failed:`, result.error);
    console.warn(`[${functionName}] Attempts:`, result.parseAttempts);
    if (result.rawResponse) {
      console.warn(`[${functionName}] Raw (first 300):`, result.rawResponse.slice(0, 300));
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export default {
  safeJsonParse,
  parseSimulationResponse,
  parseLayoutOptimizationResponse,
  parseInferenceResponse,
  extractJsonFromResponse,
  logParseResult,
  SIMULATION_FALLBACK,
  LAYOUT_OPTIMIZATION_FALLBACK,
  INFERENCE_FALLBACK,
};
