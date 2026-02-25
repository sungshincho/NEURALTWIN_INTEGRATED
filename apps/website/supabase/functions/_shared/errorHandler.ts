/**
 * NEURALTWIN Dual Chatbot System - Error Handler
 * 표준화된 에러 응답 유틸리티
 */

import { getCORSHeaders } from './streamingResponse.ts';

// =============================================
// 에러 코드
// =============================================

export const ERROR_CODES = {
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT: 'INVALID_INPUT',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// =============================================
// 에러 메시지 (한국어)
// =============================================

const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.INVALID_INPUT]: '입력을 처리하지 못했습니다.',
  [ERROR_CODES.AI_SERVICE_ERROR]: '죄송합니다, 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.AUTHENTICATION_REQUIRED]: '로그인이 필요합니다.',
  [ERROR_CODES.AUTHENTICATION_FAILED]: '인증에 실패했습니다.',
  [ERROR_CODES.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ERROR_CODES.METHOD_NOT_ALLOWED]: '허용되지 않는 요청 방식입니다.',
  [ERROR_CODES.INTERNAL_ERROR]: '서버 오류가 발생했습니다.',
};

// =============================================
// 에러 응답 생성
// =============================================

interface ErrorResponseOptions {
  origin?: string;
  details?: Record<string, unknown>;
}

/**
 * 표준화된 에러 응답 생성
 * @param statusCode - HTTP 상태 코드
 * @param message - 에러 메시지
 * @param options - 추가 옵션 (origin, details)
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  options?: ErrorResponseOptions
): Response {
  const body = JSON.stringify({
    error: true,
    message,
    ...(options?.details && { details: options.details }),
  });

  return new Response(body, {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...getCORSHeaders(options?.origin),
    },
  });
}

// =============================================
// CORS 프리플라이트 응답
// =============================================

/**
 * CORS OPTIONS 요청 응답
 */
export function createCORSResponse(origin?: string): Response {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders(origin),
  });
}

// =============================================
// 에러 유형별 응답
// =============================================

/**
 * Rate Limit 초과 응답 (429)
 */
export function createRateLimitResponse(origin?: string, remaining?: number): Response {
  return createErrorResponse(429, ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED], {
    origin,
    details: remaining !== undefined ? { remaining } : undefined,
  });
}

/**
 * 입력 검증 실패 응답 (400)
 */
export function createValidationErrorResponse(
  message: string,
  origin?: string,
  details?: Record<string, unknown>
): Response {
  return createErrorResponse(400, message || ERROR_MESSAGES[ERROR_CODES.INVALID_INPUT], {
    origin,
    details,
  });
}

/**
 * AI 서비스 에러 응답 (503)
 */
export function createAIServiceErrorResponse(origin?: string): Response {
  return createErrorResponse(503, ERROR_MESSAGES[ERROR_CODES.AI_SERVICE_ERROR], {
    origin,
  });
}

/**
 * 인증 필요 응답 (401)
 */
export function createAuthRequiredResponse(origin?: string): Response {
  return createErrorResponse(401, ERROR_MESSAGES[ERROR_CODES.AUTHENTICATION_REQUIRED], {
    origin,
  });
}

/**
 * 인증 실패 응답 (401)
 */
export function createAuthFailedResponse(origin?: string): Response {
  return createErrorResponse(401, ERROR_MESSAGES[ERROR_CODES.AUTHENTICATION_FAILED], {
    origin,
  });
}

/**
 * 메서드 허용되지 않음 응답 (405)
 */
export function createMethodNotAllowedResponse(origin?: string): Response {
  return createErrorResponse(405, ERROR_MESSAGES[ERROR_CODES.METHOD_NOT_ALLOWED], {
    origin,
  });
}

// =============================================
// 범용 에러 핸들러
// =============================================

/**
 * Edge Function 에러 핸들러
 * 에러 유형에 따라 적절한 응답 반환
 */
export function handleEdgeFunctionError(
  error: unknown,
  origin?: string
): Response {
  console.error('[errorHandler] Edge Function error:', error);

  // 에러 메시지 추출
  const errorMessage = error instanceof Error ? error.message : String(error);

  // AI API 실패 감지
  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('LOVABLE') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('network')
  ) {
    return createAIServiceErrorResponse(origin);
  }

  // Rate Limit 감지
  if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
    return createRateLimitResponse(origin);
  }

  // 입력 검증 실패 감지
  if (
    errorMessage.includes('invalid') ||
    errorMessage.includes('required') ||
    errorMessage.includes('validation')
  ) {
    return createValidationErrorResponse(errorMessage, origin);
  }

  // 인증 실패 감지
  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('token') ||
    errorMessage.includes('jwt')
  ) {
    return createAuthFailedResponse(origin);
  }

  // 기타 에러
  return createErrorResponse(500, ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR], {
    origin,
  });
}

// =============================================
// 입력 검증 헬퍼
// =============================================

/**
 * 메시지 입력 검증
 */
export function validateMessageInput(message: unknown): { valid: boolean; error?: string } {
  if (typeof message !== 'string') {
    return { valid: false, error: '메시지는 문자열이어야 합니다.' };
  }

  if (message.length === 0) {
    return { valid: false, error: '메시지를 입력해주세요.' };
  }

  if (message.length > 1000) {
    return { valid: false, error: '메시지는 1,000자 이하로 입력해주세요.' };
  }

  return { valid: true };
}

/**
 * 세션 ID 검증
 */
export function validateSessionId(sessionId: unknown): { valid: boolean; error?: string } {
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return { valid: false, error: '세션 ID가 필요합니다.' };
  }

  return { valid: true };
}

/**
 * 이메일 검증 (간단한 regex)
 */
export function validateEmail(email: unknown): { valid: boolean; error?: string } {
  if (typeof email !== 'string') {
    return { valid: false, error: '이메일은 문자열이어야 합니다.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: '유효한 이메일 주소를 입력해주세요.' };
  }

  return { valid: true };
}

/**
 * UUID 검증
 */
export function validateUUID(uuid: unknown): { valid: boolean; error?: string } {
  if (typeof uuid !== 'string') {
    return { valid: false, error: 'UUID는 문자열이어야 합니다.' };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: '유효한 UUID 형식이 아닙니다.' };
  }

  return { valid: true };
}
