/**
 * AI Gateway — Direct API Integration
 *
 * Supports Google AI (Gemini) as primary and OpenAI as fallback.
 * Returns OpenAI-compatible response format for backward compatibility.
 */

// ── Environment Helpers ──

function requireEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

type AIProvider = 'google' | 'openai';

function getProvider(): AIProvider {
  const provider = (Deno.env.get('AI_PROVIDER') || 'google').toLowerCase();
  if (provider !== 'google' && provider !== 'openai') {
    console.warn(`Invalid AI_PROVIDER "${provider}", falling back to "google"`);
    return 'google';
  }
  return provider as AIProvider;
}

// ── Types ──

export interface ChatMessage {
  role: string;
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  responseFormat?: { type: string };
  tools?: any[];
  toolChoice?: string;
}

// ── Model Name Resolution ──

const GOOGLE_MODEL_MAP: Record<string, string> = {
  'gemini-2.5-flash': 'gemini-2.5-flash',
  'gemini-2.5-pro': 'gemini-2.5-pro',
  'gemini-2.0-flash': 'gemini-2.0-flash',
  // Legacy gateway model names (google/ prefix)
  'google/gemini-2.5-flash-preview-04-17': 'gemini-2.5-flash',
  'google/gemini-2.5-flash': 'gemini-2.5-flash',
  'google/gemini-2.5-pro': 'gemini-2.5-pro',
};

function resolveGoogleModel(model?: string): string {
  return GOOGLE_MODEL_MAP[model || 'gemini-2.5-flash'] || model || 'gemini-2.5-flash';
}

// ── Google AI Format Conversion ──

function convertMessagesToGoogleAI(messages: ChatMessage[]) {
  // Build tool_call_id → function_name mapping for tool result messages
  const toolCallNameMap: Record<string, string> = {};
  for (const msg of messages) {
    if (msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        if (tc.id && tc.function?.name) {
          toolCallNameMap[tc.id] = tc.function.name;
        }
      }
    }
  }

  let systemInstruction: { parts: Array<{ text: string }> } | undefined;
  const contents: any[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      // Google AI uses systemInstruction instead of system role
      if (systemInstruction) {
        // Merge multiple system messages
        systemInstruction.parts.push({ text: msg.content || '' });
      } else {
        systemInstruction = { parts: [{ text: msg.content || '' }] };
      }
    } else if (msg.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: msg.content || '' }] });
    } else if (msg.role === 'assistant') {
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        const parts: any[] = [];
        if (msg.content) {
          parts.push({ text: msg.content });
        }
        for (const tc of msg.tool_calls) {
          let args: any;
          try {
            args = JSON.parse(tc.function.arguments);
          } catch {
            args = {};
          }
          parts.push({
            functionCall: { name: tc.function.name, args },
          });
        }
        contents.push({ role: 'model', parts });
      } else {
        contents.push({ role: 'model', parts: [{ text: msg.content || '' }] });
      }
    } else if (msg.role === 'tool') {
      const functionName = toolCallNameMap[msg.tool_call_id || ''] || 'unknown';
      let responseContent: any;
      try {
        responseContent = JSON.parse(msg.content || '{}');
      } catch {
        responseContent = { result: msg.content || '' };
      }
      contents.push({
        role: 'function',
        parts: [{
          functionResponse: {
            name: functionName,
            response: responseContent,
          },
        }],
      });
    }
  }

  return { systemInstruction, contents };
}

function convertToolsToGoogleAI(tools: any[]): any[] | undefined {
  if (!tools || tools.length === 0) return undefined;

  const functionDeclarations = tools
    .filter((t: any) => t.type === 'function')
    .map((t: any) => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    }));

  if (functionDeclarations.length === 0) return undefined;
  return [{ functionDeclarations }];
}

function convertGoogleAIResponseToOpenAI(googleResponse: any, model: string): any {
  const candidate = googleResponse.candidates?.[0];
  if (!candidate) {
    return {
      choices: [{ message: { role: 'assistant', content: '' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      model,
    };
  }

  const parts = candidate.content?.parts || [];
  const functionCalls = parts.filter((p: any) => p.functionCall);
  const textParts = parts.filter((p: any) => p.text !== undefined);
  const content = textParts.map((p: any) => p.text).join('') || null;

  const message: any = { role: 'assistant', content };

  if (functionCalls.length > 0) {
    message.tool_calls = functionCalls.map((fc: any, i: number) => ({
      id: `call_${fc.functionCall.name}_${Date.now()}_${i}`,
      type: 'function',
      function: {
        name: fc.functionCall.name,
        arguments: JSON.stringify(fc.functionCall.args || {}),
      },
    }));
  }

  const usage = googleResponse.usageMetadata || {};

  return {
    choices: [{
      message,
      finish_reason: functionCalls.length > 0 ? 'tool_calls' : 'stop',
    }],
    usage: {
      prompt_tokens: usage.promptTokenCount || 0,
      completion_tokens: usage.candidatesTokenCount || 0,
      total_tokens: usage.totalTokenCount || 0,
    },
    model,
  };
}

// ══════════════════════════════════════════
//  chatCompletion — Non-streaming
// ══════════════════════════════════════════

export async function chatCompletion(options: ChatCompletionOptions): Promise<any> {
  const provider = getProvider();
  if (provider === 'openai') return chatCompletionOpenAI(options);

  try {
    return await chatCompletionGoogle(options);
  } catch (error) {
    const hasOpenAIKey = !!Deno.env.get('OPENAI_API_KEY');
    if (!hasOpenAIKey) throw error;
    console.warn(`[AI Gateway] Google AI failed, falling back to OpenAI: ${error}`);
    return chatCompletionOpenAI(options);
  }
}

async function chatCompletionGoogle(options: ChatCompletionOptions): Promise<any> {
  const apiKey = requireEnv('GOOGLE_AI_API_KEY');
  const model = resolveGoogleModel(options.model);

  const { systemInstruction, contents } = convertMessagesToGoogleAI(options.messages);

  const generationConfig: any = {};
  if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
  if (options.maxTokens !== undefined) generationConfig.maxOutputTokens = options.maxTokens;
  if (options.jsonMode || options.responseFormat?.type === 'json_object') {
    generationConfig.responseMimeType = 'application/json';
  }

  const body: any = { contents, generationConfig };
  if (systemInstruction) body.systemInstruction = systemInstruction;

  // Tools
  const googleTools = convertToolsToGoogleAI(options.tools || []);
  if (googleTools) {
    body.tools = googleTools;
    if (options.toolChoice === 'required') {
      body.toolConfig = { functionCallingConfig: { mode: 'ANY' } };
    } else if (options.toolChoice === 'auto') {
      body.toolConfig = { functionCallingConfig: { mode: 'AUTO' } };
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google AI API error (${response.status}): ${error}`);
  }

  const googleResult = await response.json();
  return convertGoogleAIResponseToOpenAI(googleResult, model);
}

async function chatCompletionOpenAI(options: ChatCompletionOptions): Promise<any> {
  const apiKey = requireEnv('OPENAI_API_KEY');

  const body: any = {
    model: options.model || 'gpt-4o-mini',
    messages: options.messages,
  };
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;
  if (options.jsonMode || options.responseFormat?.type === 'json_object') {
    body.response_format = { type: 'json_object' };
  }
  if (options.tools) {
    body.tools = options.tools;
    if (options.toolChoice) body.tool_choice = options.toolChoice;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  return response.json();
}

// ══════════════════════════════════════════
//  chatCompletionStream — SSE Streaming
//  Returns OpenAI-compatible SSE format
// ══════════════════════════════════════════

export async function chatCompletionStream(options: ChatCompletionOptions): Promise<Response> {
  const provider = getProvider();
  if (provider === 'openai') return chatCompletionStreamOpenAI(options);

  try {
    return await chatCompletionStreamGoogle(options);
  } catch (error) {
    const hasOpenAIKey = !!Deno.env.get('OPENAI_API_KEY');
    if (!hasOpenAIKey) throw error;
    console.warn(`[AI Gateway] Google AI Stream failed, falling back to OpenAI: ${error}`);
    return chatCompletionStreamOpenAI(options);
  }
}

async function chatCompletionStreamGoogle(options: ChatCompletionOptions): Promise<Response> {
  const apiKey = requireEnv('GOOGLE_AI_API_KEY');
  const model = resolveGoogleModel(options.model);

  const { systemInstruction, contents } = convertMessagesToGoogleAI(options.messages);

  const generationConfig: any = {};
  if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
  if (options.maxTokens !== undefined) generationConfig.maxOutputTokens = options.maxTokens;

  const body: any = { contents, generationConfig };
  if (systemInstruction) body.systemInstruction = systemInstruction;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const upstreamResponse = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!upstreamResponse.ok) {
    const error = await upstreamResponse.text();
    throw new Error(`Google AI Stream error (${upstreamResponse.status}): ${error}`);
  }

  // Transform Google AI SSE → OpenAI-compatible SSE
  const reader = upstreamResponse.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const transformedStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Process remaining buffer
            if (buffer.trim()) {
              processGoogleSSELine(buffer, controller, encoder);
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            processGoogleSSELine(line, controller, encoder);
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });

  return new Response(transformedStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function processGoogleSSELine(
  line: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
): void {
  if (!line.startsWith('data: ')) return;
  const jsonStr = line.slice(6).trim();
  if (!jsonStr) return;

  try {
    const googleChunk = JSON.parse(jsonStr);
    const text = googleChunk.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text !== undefined && text !== '') {
      const openAIChunk = {
        choices: [{ delta: { content: text }, finish_reason: null }],
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
    }
  } catch {
    // Skip unparseable lines
  }
}

async function chatCompletionStreamOpenAI(options: ChatCompletionOptions): Promise<Response> {
  const apiKey = requireEnv('OPENAI_API_KEY');

  const body: any = {
    model: options.model || 'gpt-4o-mini',
    messages: options.messages,
    stream: true,
  };
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Stream error (${response.status}): ${error}`);
  }

  // OpenAI already returns SSE in the correct format
  return response;
}

// ══════════════════════════════════════════
//  generateEmbedding — Vector Embedding
// ══════════════════════════════════════════

export async function generateEmbedding(text: string, model?: string): Promise<number[]> {
  const provider = getProvider();
  if (provider === 'openai') return generateEmbeddingOpenAI(text, model);

  try {
    return await generateEmbeddingGoogle(text, model);
  } catch (error) {
    const hasOpenAIKey = !!Deno.env.get('OPENAI_API_KEY');
    if (!hasOpenAIKey) throw error;
    console.warn(`[AI Gateway] Google Embedding failed, falling back to OpenAI: ${error}`);
    return generateEmbeddingOpenAI(text, model);
  }
}

async function generateEmbeddingGoogle(text: string, model?: string): Promise<number[]> {
  const apiKey = requireEnv('GOOGLE_AI_API_KEY');
  const embeddingModel = model || 'text-embedding-004';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${embeddingModel}:embedContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${embeddingModel}`,
      content: { parts: [{ text }] },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Embedding API error (${response.status}): ${error}`);
  }

  const result = await response.json();
  return result.embedding?.values || [];
}

async function generateEmbeddingOpenAI(text: string, model?: string): Promise<number[]> {
  const apiKey = requireEnv('OPENAI_API_KEY');

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Embedding API error (${response.status}): ${error}`);
  }

  const result = await response.json();
  return result.data?.[0]?.embedding || [];
}

// ══════════════════════════════════════════
//  Fallback Chain — Multi-model retry
// ══════════════════════════════════════════

export interface FallbackModelConfig {
  provider: AIProvider;
  model: string;
  name: string;
}

export interface FallbackConfig {
  models: FallbackModelConfig[];
  maxRetries?: number;  // 각 모델당 재시도 횟수 (기본: 1)
  retryDelay?: number;  // 재시도 간 대기 시간 ms (기본: 1000)
}

export const DEFAULT_FALLBACK_CHAIN: FallbackConfig = {
  models: [
    { provider: 'google', model: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { provider: 'openai', model: 'gpt-4o', name: 'GPT-4o' },
    { provider: 'google', model: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  ],
  maxRetries: 1,
  retryDelay: 1000,
};

// Provider별 직접 호출 (getProvider() 우회)
function chatCompletionDirect(
  options: ChatCompletionOptions,
  provider: AIProvider,
): Promise<any> {
  if (provider === 'openai') return chatCompletionOpenAI(options);
  return chatCompletionGoogle(options);
}

function chatCompletionStreamDirect(
  options: ChatCompletionOptions,
  provider: AIProvider,
): Promise<Response> {
  if (provider === 'openai') return chatCompletionStreamOpenAI(options);
  return chatCompletionStreamGoogle(options);
}

function isRetryableError(errorMsg: string): boolean {
  return errorMsg.includes('429') || errorMsg.includes('503') || errorMsg.includes('500');
}

function isAuthError(errorMsg: string): boolean {
  return errorMsg.includes('401') || errorMsg.includes('403');
}

/**
 * Non-streaming fallback chain.
 * Tries each model in order; retries on 429/5xx, skips on 401/403.
 */
export async function chatCompletionWithFallback(
  options: ChatCompletionOptions,
  fallbackConfig: FallbackConfig = DEFAULT_FALLBACK_CHAIN,
): Promise<any & { modelUsed: string }> {
  const errors: Array<{ model: string; error: string }> = [];
  const maxRetries = fallbackConfig.maxRetries ?? 1;
  const retryDelay = fallbackConfig.retryDelay ?? 1000;

  for (const modelConfig of fallbackConfig.models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AI] Trying ${modelConfig.name} (attempt ${attempt + 1})`);

        const response = await chatCompletionDirect(
          { ...options, model: modelConfig.model },
          modelConfig.provider,
        );

        console.log(`[AI] Success with ${modelConfig.name}`);
        return { ...response, modelUsed: modelConfig.name };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[AI] ${modelConfig.name} failed (attempt ${attempt + 1}): ${errorMsg}`);
        errors.push({ model: modelConfig.name, error: errorMsg });

        if (isAuthError(errorMsg)) break; // 인증 에러 → 이 모델 포기

        if (isRetryableError(errorMsg) && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, retryDelay));
          continue;
        }

        break; // 기타 에러 → 다음 모델로
      }
    }
  }

  console.error('[AI] All models failed:', JSON.stringify(errors));
  throw new Error(`All AI models failed. Errors: ${JSON.stringify(errors)}`);
}

/**
 * Streaming fallback chain.
 * Tries each model in order; if upstream fetch fails, falls back to next.
 */
export async function chatCompletionStreamWithFallback(
  options: ChatCompletionOptions,
  fallbackConfig: FallbackConfig = DEFAULT_FALLBACK_CHAIN,
): Promise<Response & { modelUsed?: string }> {
  const errors: Array<{ model: string; error: string }> = [];

  for (const modelConfig of fallbackConfig.models) {
    try {
      console.log(`[AI Stream] Trying ${modelConfig.name}`);

      const response = await chatCompletionStreamDirect(
        { ...options, model: modelConfig.model },
        modelConfig.provider,
      );

      console.log(`[AI Stream] Success with ${modelConfig.name}`);
      // 헤더에 사용된 모델 정보 추가
      const headers = new Headers(response.headers);
      headers.set('X-AI-Model-Used', modelConfig.name);
      return new Response(response.body, { status: response.status, headers }) as Response & { modelUsed?: string };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[AI Stream] ${modelConfig.name} failed: ${errorMsg}`);
      errors.push({ model: modelConfig.name, error: errorMsg });
      continue;
    }
  }

  console.error('[AI Stream] All models failed:', JSON.stringify(errors));
  throw new Error(`All AI models failed for streaming. Errors: ${JSON.stringify(errors)}`);
}
