/**
 * NEURALTWIN Dual Chatbot System - SSE Streaming Response Helper
 * Server-Sent Events 스트리밍 응답 유틸리티
 */

import { getCorsHeadersByOrigin } from "./cors.ts";

// Re-export for backward compatibility (errorHandler.ts imports getCORSHeaders)
export const getCORSHeaders = getCorsHeadersByOrigin;

// =============================================
// SSE Response 생성
// =============================================

interface SSEResponseResult {
  stream: ReadableStream<Uint8Array>;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  response: Response;
  encoder: TextEncoder;
}

/**
 * SSE Response 생성
 * @param origin - 요청 Origin (CORS용)
 * @param additionalHeaders - 추가 헤더
 */
export function createSSEResponse(
  origin?: string,
  additionalHeaders?: Record<string, string>
): SSEResponseResult {
  const encoder = new TextEncoder();

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    ...getCORSHeaders(origin),
    ...additionalHeaders,
  });

  const response = new Response(readable, {
    status: 200,
    headers,
  });

  return { stream: readable, writer, response, encoder };
}

// =============================================
// SSE 이벤트 전송
// =============================================

/**
 * SSE delta 청크 전송
 */
export async function writeSSEChunk(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  data: { type: 'delta'; content: string }
): Promise<void> {
  const payload = JSON.stringify(data);
  await writer.write(encoder.encode(`data: ${payload}\n\n`));
}

/**
 * SSE 완료 이벤트 전송
 */
export async function writeSSEDone(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  metadata: {
    conversationId: string;
    topicCategory: string;
    confidence?: number;
    suggestions?: string[];
    showLeadForm?: boolean;
    isAuthenticated?: boolean;  // v2.1
  }
): Promise<void> {
  const payload = JSON.stringify({
    type: 'done',
    meta: metadata,
  });
  await writer.write(encoder.encode(`data: ${payload}\n\n`));
}

/**
 * SSE 에러 이벤트 전송
 */
export async function writeSSEError(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  message: string
): Promise<void> {
  const payload = JSON.stringify({
    type: 'error',
    message,
  });
  await writer.write(encoder.encode(`data: ${payload}\n\n`));
}

// =============================================
// AI Gateway SSE 스트림 파싱
// =============================================

/**
 * AI Gateway SSE 스트림 → 클라이언트 프록시
 *
 * 수신 (AI Gateway — OpenAI-compatible SSE):
 *   data: {"choices":[{"delta":{"content":"텍스트"}}]}
 *
 * 전달 (클라이언트):
 *   data: {"type":"delta","content":"텍스트 청크"}
 */
export async function proxyAIStream(
  aiResponse: Response,
  clientWriter: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  onChunk?: (content: string) => void
): Promise<string> {
  let fullResponse = '';

  const reader = aiResponse.body?.getReader();
  if (!reader) {
    throw new Error('AI response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE 이벤트 파싱 (data: {...}\n\n 형식)
      const lines = buffer.split('\n');
      buffer = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 마지막 줄이 불완전할 수 있으므로 버퍼에 보관
        if (i === lines.length - 1 && !line.endsWith('\n')) {
          buffer = line;
          continue;
        }

        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();

          // [DONE] 이벤트 처리
          if (jsonStr === '[DONE]') {
            continue;
          }

          try {
            const data = JSON.parse(jsonStr);
            const content = data.choices?.[0]?.delta?.content;

            if (content) {
              fullResponse += content;
              onChunk?.(content);
              await writeSSEChunk(clientWriter, encoder, { type: 'delta', content });
            }
          } catch {
            // JSON 파싱 실패 시 무시
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullResponse;
}

// =============================================
// Non-streaming 응답 파싱
// =============================================

/**
 * AI Gateway non-streaming 응답에서 메시지 추출
 */
export function extractMessageFromResponse(aiData: unknown): string {
  const data = aiData as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  return data?.choices?.[0]?.message?.content || '죄송합니다, 응답을 생성하지 못했습니다.';
}
