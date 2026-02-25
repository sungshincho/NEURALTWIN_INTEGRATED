import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";

// gateway.ts 내부 함수는 export 되지 않으므로,
// public API(chatCompletion, generateEmbedding)의 env 요구사항만 검증

Deno.test("chatCompletion throws without API key", async () => {
  // Google AI (default provider)
  const savedProvider = Deno.env.get("AI_PROVIDER");
  const savedKey = Deno.env.get("GOOGLE_AI_API_KEY");
  Deno.env.set("AI_PROVIDER", "google");
  Deno.env.delete("GOOGLE_AI_API_KEY");

  try {
    const mod = await import("../../ai/gateway.ts");
    await mod.chatCompletion({
      messages: [{ role: "user", content: "test" }],
    }).then(
      () => { throw new Error("Should have thrown"); },
      (err: Error) => {
        assertEquals(err.message.includes("GOOGLE_AI_API_KEY"), true);
      },
    );
  } finally {
    if (savedProvider) Deno.env.set("AI_PROVIDER", savedProvider);
    else Deno.env.delete("AI_PROVIDER");
    if (savedKey) Deno.env.set("GOOGLE_AI_API_KEY", savedKey);
  }
});

Deno.test("chatCompletion OpenAI throws without API key", async () => {
  const savedProvider = Deno.env.get("AI_PROVIDER");
  const savedKey = Deno.env.get("OPENAI_API_KEY");
  Deno.env.set("AI_PROVIDER", "openai");
  Deno.env.delete("OPENAI_API_KEY");

  try {
    const mod = await import("../../ai/gateway.ts");
    await mod.chatCompletion({
      messages: [{ role: "user", content: "test" }],
    }).then(
      () => { throw new Error("Should have thrown"); },
      (err: Error) => {
        assertEquals(err.message.includes("OPENAI_API_KEY"), true);
      },
    );
  } finally {
    if (savedProvider) Deno.env.set("AI_PROVIDER", savedProvider);
    else Deno.env.delete("AI_PROVIDER");
    if (savedKey) Deno.env.set("OPENAI_API_KEY", savedKey);
  }
});

Deno.test("generateEmbedding throws without API key (Google)", async () => {
  const savedProvider = Deno.env.get("AI_PROVIDER");
  const savedKey = Deno.env.get("GOOGLE_AI_API_KEY");
  Deno.env.set("AI_PROVIDER", "google");
  Deno.env.delete("GOOGLE_AI_API_KEY");

  try {
    const mod = await import("../../ai/gateway.ts");
    await mod.generateEmbedding("test text").then(
      () => { throw new Error("Should have thrown"); },
      (err: Error) => {
        assertEquals(err.message.includes("GOOGLE_AI_API_KEY"), true);
      },
    );
  } finally {
    if (savedProvider) Deno.env.set("AI_PROVIDER", savedProvider);
    else Deno.env.delete("AI_PROVIDER");
    if (savedKey) Deno.env.set("GOOGLE_AI_API_KEY", savedKey);
  }
});
