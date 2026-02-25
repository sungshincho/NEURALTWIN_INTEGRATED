/**
 * 일반 대화(general_chat) 처리
 */

import { callGemini, GeminiMessage } from '../utils/geminiClient.ts';
import { SYSTEM_PROMPT } from '../constants/systemPrompt.ts';

export interface ChatActionResult {
  message: string;
  suggestions: string[];
  tokensUsed: number;
}

/**
 * 일반 대화 응답 생성
 */
export async function handleGeneralChat(
  userMessage: string,
  conversationHistory: GeminiMessage[] = [],
  context?: any
): Promise<ChatActionResult> {
  // 컨텍스트 기반 시스템 프롬프트 보강
  let contextInfo = '';
  if (context?.page?.current) {
    contextInfo += `\n\n현재 사용자 위치: ${context.page.current}`;
    if (context.page.tab) {
      contextInfo += ` (${context.page.tab} 탭)`;
    }
  }

  const messages: GeminiMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT + contextInfo },
    ...conversationHistory.slice(-10), // 최근 10개 메시지만 포함
    { role: 'user', content: userMessage },
  ];

  try {
    const response = await callGemini(messages, {
      temperature: 0.7,
      maxTokens: 512,
    });

    // 후속 제안 생성
    const suggestions = generateSuggestions(userMessage, context);

    return {
      message: response.content,
      suggestions,
      tokensUsed: response.tokensUsed,
    };

  } catch (error: unknown) {
    console.error('[chatActions] handleGeneralChat error:', error);

    if (error instanceof Error && error.message === 'AI_TIMEOUT') {
      return {
        message: 'AI 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.',
        suggestions: ['다시 시도해줘'],
        tokensUsed: 0,
      };
    }

    return {
      message: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.',
      suggestions: ['인사이트 허브로 이동', '도움말 보기'],
      tokensUsed: 0,
    };
  }
}

/**
 * 문맥 기반 후속 제안 생성
 */
function generateSuggestions(message: string, context?: any): string[] {
  const lowercaseMessage = message.toLowerCase();

  // 인사 관련
  if (/안녕|hi|hello|반가워/.test(lowercaseMessage)) {
    return [
      '오늘 매출 알려줘',
      '인사이트 허브 보여줘',
      '뭐 할 수 있어?',
    ];
  }

  // 기능 질문
  if (/뭐.*할.*수.*있|기능|도움|help/.test(lowercaseMessage)) {
    return [
      '인사이트 허브로 이동',
      '시뮬레이션 돌려줘',
      '오늘 매출 조회해줘',
    ];
  }

  // 현재 페이지 기반 제안
  const currentPage = context?.page?.current;
  switch (currentPage) {
    case '/insights':
      return ['고객탭 보여줘', '오늘 매출 얼마야?', '7일 데이터로 변경'];
    case '/studio':
      return ['시뮬레이션 돌려줘', '최적화 해줘', 'AI 시뮬레이션 탭 열어줘'];
    case '/roi':
      return ['90일 데이터로 변경', '인사이트 허브로 이동'];
    case '/settings':
      return ['매장 관리 탭', '데이터 연결 추가'];
    default:
      return ['인사이트 허브로 이동', '오늘 매출 조회', '시뮬레이션 실행'];
  }
}
