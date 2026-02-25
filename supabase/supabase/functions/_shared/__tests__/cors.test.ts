import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { corsHeaders, handleCorsOptions } from "../cors.ts";

Deno.test("corsHeaders includes wildcard origin", () => {
  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
});

Deno.test("corsHeaders includes authorization in allowed headers", () => {
  const headers = corsHeaders["Access-Control-Allow-Headers"];
  assertEquals(typeof headers, "string");
  assertEquals(headers.includes("authorization"), true);
  assertEquals(headers.includes("content-type"), true);
});

Deno.test("handleCorsOptions returns Response for OPTIONS", () => {
  const req = new Request("https://example.com/test", { method: "OPTIONS" });
  const res = handleCorsOptions(req);
  assertNotEquals(res, null);
  assertEquals(res!.status, 200);
  assertEquals(res!.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("handleCorsOptions returns null for GET", () => {
  const req = new Request("https://example.com/test", { method: "GET" });
  const res = handleCorsOptions(req);
  assertEquals(res, null);
});

Deno.test("handleCorsOptions returns null for POST", () => {
  const req = new Request("https://example.com/test", { method: "POST" });
  const res = handleCorsOptions(req);
  assertEquals(res, null);
});
