/**
 * 자연어 응답 생성기
 * 액션 실행 결과를 사용자 친화적 메시지로 변환
 */

import { ClassificationResult } from '../intent/classifier.ts';

export interface ActionResult {
  actions: any[];
  message: string;
  suggestions: string[];
  data?: any;
}

/**
 * 액션 결과를 자연어 응답으로 변환
 */
export function generateResponse(
  classification: ClassificationResult,
  actionResult: ActionResult,
  executionTimeMs: number
): string {
  let response = actionResult.message;

  // 실행 시간이 길었을 경우 안내
  if (executionTimeMs > 3000) {
    response += '\n(처리에 시간이 조금 걸렸네요.)';
  }

  return response;
}

/**
 * 에러 응답 생성
 */
export function generateErrorResponse(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    AI_TIMEOUT: 'AI 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.',
    RATE_LIMITED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    AUTH_EXPIRED: '세션이 만료되었습니다. 새로고침 후 다시 시도해주세요.',
    NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
    EF_FAILED: '기능 실행 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
    DB_QUERY_FAILED: '데이터 조회 중 문제가 발생했어요.',
    DEFAULT: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다.',
  };

  return errorMessages[errorCode] || errorMessages.DEFAULT;
}

/**
 * 데이터 조회 결과를 자연어로 변환
 */
export function formatDataResponse(
  queryType: string,
  data: any
): string {
  if (!data) {
    return '요청하신 데이터를 찾을 수 없습니다.';
  }

  switch (queryType) {
    case 'revenue':
      return `매출은 ₩${data.totalRevenue.toLocaleString()}원입니다.` +
        (data.change ? ` 전일 대비 ${data.change > 0 ? '+' : ''}${data.change}%입니다.` : '');

    case 'visitors':
      return `순 방문객은 ${formatNumber(data.uniqueVisitors)}명입니다.` +
        (data.change ? ` 전일 대비 ${data.change > 0 ? '+' : ''}${data.change}%입니다.` : '');

    case 'conversion':
      return `현재 전환율은 ${data.conversionRate.toFixed(1)}%입니다.`;

    default:
      return JSON.stringify(data);
  }
}

function formatNumber(num: number): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '억';
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(0) + '만';
  }
  return num.toLocaleString();
}
