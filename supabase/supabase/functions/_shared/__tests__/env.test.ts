import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { requireEnv, getEnvConfig } from "../env.ts";

Deno.test("requireEnv returns value when set", () => {
  Deno.env.set("TEST_VAR_123", "hello");
  assertEquals(requireEnv("TEST_VAR_123"), "hello");
  Deno.env.delete("TEST_VAR_123");
});

Deno.test("requireEnv throws when missing", () => {
  Deno.env.delete("NONEXISTENT_VAR_XYZ");
  assertThrows(
    () => requireEnv("NONEXISTENT_VAR_XYZ"),
    Error,
    "Missing required environment variable: NONEXISTENT_VAR_XYZ",
  );
});

Deno.test("requireEnv throws on empty string", () => {
  Deno.env.set("EMPTY_VAR", "");
  assertThrows(
    () => requireEnv("EMPTY_VAR"),
    Error,
    "Missing required environment variable: EMPTY_VAR",
  );
  Deno.env.delete("EMPTY_VAR");
});

Deno.test("getEnvConfig returns all three Supabase keys", () => {
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "anon-key");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-key");

  const config = getEnvConfig();
  assertEquals(config.supabaseUrl, "https://test.supabase.co");
  assertEquals(config.supabaseAnonKey, "anon-key");
  assertEquals(config.supabaseServiceKey, "service-key");

  Deno.env.delete("SUPABASE_URL");
  Deno.env.delete("SUPABASE_ANON_KEY");
  Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");
});

Deno.test("getEnvConfig throws when SUPABASE_URL missing", () => {
  Deno.env.delete("SUPABASE_URL");
  Deno.env.set("SUPABASE_ANON_KEY", "anon-key");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-key");

  assertThrows(() => getEnvConfig(), Error, "SUPABASE_URL");

  Deno.env.delete("SUPABASE_ANON_KEY");
  Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");
});
