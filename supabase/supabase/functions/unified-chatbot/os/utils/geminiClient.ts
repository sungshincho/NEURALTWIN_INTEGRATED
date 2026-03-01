/**
 * Gemini 2.5 Flash API 클라이언트
 * Direct Google AI API
 */
import { chatCompletion } from "@shared/ai/gateway.ts";

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 1024;
const TIMEOUT_MS = 15000;

export interface GeminiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GeminiResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

/**
 * Gemini API 호출
 */
export async function callGemini(
  messages: GeminiMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  } = {}
): Promise<GeminiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const data = await chatCompletion({
      model: DEFAULT_MODEL,
      messages,
      temperature: options.temperature ?? DEFAULT_TEMPERATURE,
      maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      jsonMode: options.jsonMode,
    });

    clearTimeout(timeoutId);

    const choice = data.choices?.[0];

    if (!choice?.message?.content) {
      throw new Error('Invalid Gemini response format');
    }

    return {
      content: choice.message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      model: data.model || DEFAULT_MODEL,
    };

  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI_TIMEOUT');
    }
    throw error;
  }
}

/**
 * JSON 응답 파싱 헬퍼
 */
export function parseJsonResponse<T>(content: string): T | null {
  try {
    // Markdown 코드 블록 제거
    const cleaned = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
