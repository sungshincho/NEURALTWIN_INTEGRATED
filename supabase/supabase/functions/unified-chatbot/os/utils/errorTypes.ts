/**
 * 챗봇 에러 타입 정의 (패치 문서 반영)
 * - 7개 에러 코드 + 재시도 정책
 * - Phase 2~3에서 각 모듈에서 참조
 */

export type AssistantErrorCode =
  | 'AI_TIMEOUT'
  | 'RATE_LIMITED'
  | 'AUTH_EXPIRED'
  | 'NETWORK_ERROR'
  | 'INTENT_UNCLEAR'
  | 'EF_FAILED'
  | 'DB_QUERY_FAILED'
  | 'SESSION_ERROR'
  | 'INTERNAL_ERROR';

export interface AssistantError {
  code: AssistantErrorCode;
  userMessage: string;
  retryable: boolean;
  retryAfterMs?: number;
  httpStatus: number;
}

export const ERROR_DEFINITIONS: Record<AssistantErrorCode, AssistantError> = {
  AI_TIMEOUT: {
    code: 'AI_TIMEOUT',
    userMessage: 'AI 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.',
    retryable: true,
    retryAfterMs: 2000,
    httpStatus: 504,
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    userMessage: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    retryable: false,
    httpStatus: 429,
  },
  AUTH_EXPIRED: {
    code: 'AUTH_EXPIRED',
    userMessage: '세션이 만료되었습니다. 새로고침 후 다시 시도해주세요.',
    retryable: false,
    httpStatus: 401,
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    userMessage: '네트워크 연결을 확인해주세요.',
    retryable: true,
    retryAfterMs: 1000,
    httpStatus: 503,
  },
  INTENT_UNCLEAR: {
    code: 'INTENT_UNCLEAR',
    userMessage: '', // 에러 아님, general_chat 폴백
    retryable: false,
    httpStatus: 200,
  },
  EF_FAILED: {
    code: 'EF_FAILED',
    userMessage: '기능 실행 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
    retryable: true,
    retryAfterMs: 2000,
    httpStatus: 502,
  },
  DB_QUERY_FAILED: {
    code: 'DB_QUERY_FAILED',
    userMessage: '데이터 조회 중 문제가 발생했어요.',
    retryable: true,
    retryAfterMs: 1000,
    httpStatus: 500,
  },
  SESSION_ERROR: {
    code: 'SESSION_ERROR',
    userMessage: '대화 세션을 생성할 수 없습니다.',
    retryable: true,
    retryAfterMs: 1000,
    httpStatus: 500,
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    userMessage: '내부 오류가 발생했습니다.',
    retryable: false,
    httpStatus: 500,
  },
};

/**
 * 에러 응답 생성 헬퍼
 */
export function createErrorResponse(
  code: AssistantErrorCode,
  corsHeaders: Record<string, string>
): Response {
  const errorDef = ERROR_DEFINITIONS[code];
  return new Response(
    JSON.stringify({
      error: errorDef.userMessage,
      code: errorDef.code,
      retryable: errorDef.retryable,
      retryAfterMs: errorDef.retryAfterMs,
    }),
    {
      status: errorDef.httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * 에러 응답을 어시스턴트 메시지 형태로 변환 (채팅창에 표시용)
 */
export function getErrorAsAssistantMessage(code: AssistantErrorCode): string {
  return ERROR_DEFINITIONS[code].userMessage;
}
