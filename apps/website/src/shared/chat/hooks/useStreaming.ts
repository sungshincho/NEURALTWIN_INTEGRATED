/**
 * NEURALTWIN Chat UI Kit - useStreaming Hook
 * SSE 스트리밍 처리 훅
 */

import { useCallback, useRef } from 'react';
import type { UseStreamingOptions, StreamingMetadata } from '../types/chat.types';

interface StreamState {
  isStreaming: boolean;
  abortController: AbortController | null;
}

/**
 * SSE 스트리밍 훅
 * - fetch + ReadableStream 파싱
 * - 토큰 단위 content 업데이트
 * - abort() 지원
 */
export function useStreaming(options: UseStreamingOptions) {
  const { onDelta, onComplete, onError } = options;
  const stateRef = useRef<StreamState>({
    isStreaming: false,
    abortController: null,
  });

  /**
   * 스트리밍 시작
   */
  const startStreaming = useCallback(
    async (url: string, body: Record<string, unknown>) => {
      // 기존 스트림 중단
      if (stateRef.current.abortController) {
        stateRef.current.abortController.abort();
      }

      const abortController = new AbortController();
      stateRef.current = {
        isStreaming: true,
        abortController,
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';

        // SSE 스트리밍 처리
        if (contentType.includes('text/event-stream')) {
          await processSSEStream(response, onDelta, onComplete, onError);
        }
        // JSON 응답 처리 (non-streaming)
        else if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data.message) {
            onDelta(data.message);
          }
          onComplete({
            conversationId: data.meta?.conversationId || '',
            topicCategory: data.meta?.topicCategory,
            confidence: data.meta?.confidence,
            suggestions: data.suggestions,
            showLeadForm: data.showLeadForm,
            isAuthenticated: data.meta?.isAuthenticated,
          });
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // 사용자가 중단함
          return;
        }
        onError((error as Error).message || '스트리밍 오류가 발생했습니다.');
      } finally {
        stateRef.current.isStreaming = false;
        stateRef.current.abortController = null;
      }
    },
    [onDelta, onComplete, onError]
  );

  /**
   * 스트리밍 중단
   */
  const abort = useCallback(() => {
    if (stateRef.current.abortController) {
      stateRef.current.abortController.abort();
      stateRef.current = {
        isStreaming: false,
        abortController: null,
      };
    }
  }, []);

  return {
    startStreaming,
    abort,
    isStreaming: () => stateRef.current.isStreaming,
  };
}

/**
 * SSE 스트림 파싱
 */
async function processSSEStream(
  response: Response,
  onDelta: (chunk: string) => void,
  onComplete: (metadata: StreamingMetadata) => void,
  onError: (error: string) => void
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
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
        if (i === lines.length - 1 && line && !line.endsWith('\n')) {
          buffer = line;
          continue;
        }

        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();

          // [DONE] 이벤트
          if (jsonStr === '[DONE]') {
            continue;
          }

          try {
            const data = JSON.parse(jsonStr);

            // delta 이벤트
            if (data.type === 'delta' && data.content) {
              onDelta(data.content);
            }

            // done 이벤트
            if (data.type === 'done' && data.meta) {
              onComplete({
                conversationId: data.meta.conversationId,
                topicCategory: data.meta.topicCategory,
                confidence: data.meta.confidence,
                suggestions: data.meta.suggestions,
                showLeadForm: data.meta.showLeadForm,
                isAuthenticated: data.meta.isAuthenticated,
              });
            }

            // error 이벤트
            if (data.type === 'error') {
              onError(data.message || '알 수 없는 오류');
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
}

export default useStreaming;
