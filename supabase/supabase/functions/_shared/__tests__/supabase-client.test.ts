import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";

// supabase-client.ts 는 실제 createClient를 호출하므로,
// 환경변수가 없으면 throw 하는지만 검증한다.

Deno.test("createSupabaseAdmin throws without env vars", async () => {
  // 기존 값 백업 & 삭제
  const savedUrl = Deno.env.get("SUPABASE_URL");
  const savedKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  Deno.env.delete("SUPABASE_URL");
  Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");

  // 동적 import로 모듈 캐시 우회 (Deno 특성상 어려울 수 있으므로 try/catch)
  try {
    const mod = await import("../supabase-client.ts");
    assertThrows(() => mod.createSupabaseAdmin(), Error, "SUPABASE_URL");
  } finally {
    // 복원
    if (savedUrl) Deno.env.set("SUPABASE_URL", savedUrl);
    if (savedKey) Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", savedKey);
  }
});

Deno.test("createSupabaseWithAuth throws without env vars", async () => {
  const savedUrl = Deno.env.get("SUPABASE_URL");
  const savedAnon = Deno.env.get("SUPABASE_ANON_KEY");
  Deno.env.delete("SUPABASE_URL");
  Deno.env.delete("SUPABASE_ANON_KEY");

  try {
    const mod = await import("../supabase-client.ts");
    assertThrows(
      () => mod.createSupabaseWithAuth("Bearer test-token"),
      Error,
      "SUPABASE_URL",
    );
  } finally {
    if (savedUrl) Deno.env.set("SUPABASE_URL", savedUrl);
    if (savedAnon) Deno.env.set("SUPABASE_ANON_KEY", savedAnon);
  }
});
