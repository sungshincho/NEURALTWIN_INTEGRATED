/**
 * Gemini 2.5 Flash API 클라이언트
 * Lovable API Gateway 경유
 */

const LOVABLE_API_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.5-flash';
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
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY is not set');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        temperature: options.temperature ?? DEFAULT_TEMPERATURE,
        max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
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
