/**
 * streamingResponse.ts
 *
 * SSE 스트리밍 응답 유틸리티
 * - Server-Sent Events 응답 생성
 * - 실시간 데이터 전송
 */

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * SSE 응답 생성 결과
 */
export interface SSEResponseResult {
  response: Response;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  encoder: TextEncoder;
}

// ============================================================================
// SSE 응답 함수
// ============================================================================

/**
 * SSE 응답 스트림 생성
 */
export function createSSEResponse(headers: Record<string, string> = {}): SSEResponseResult {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...headers,
    },
  });

  return { response, writer, encoder };
}

/**
 * SSE 이벤트 전송 (이벤트 타입 포함)
 */
export async function sendSSEEvent(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  event: string,
  data: unknown
): Promise<void> {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  await writer.write(encoder.encode(message));
}

/**
 * SSE 데이터 전송 (기본 data 이벤트)
 */
export async function sendSSEData(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  data: unknown
): Promise<void> {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  await writer.write(encoder.encode(message));
}

/**
 * SSE 스트림 종료
 */
export async function closeSSE(
  writer: WritableStreamDefaultWriter<Uint8Array>
): Promise<void> {
  await writer.close();
}

// ============================================================================
// Export
// ============================================================================

export default {
  createSSEResponse,
  sendSSEEvent,
  sendSSEData,
  closeSSE,
};
