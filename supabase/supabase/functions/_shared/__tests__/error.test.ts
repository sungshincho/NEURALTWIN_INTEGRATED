import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { errorResponse } from "../error.ts";

Deno.test("errorResponse returns correct status", () => {
  const res = errorResponse("bad request", 400);
  assertEquals(res.status, 400);
});

Deno.test("errorResponse defaults to 400", () => {
  const res = errorResponse("default");
  assertEquals(res.status, 400);
});

Deno.test("errorResponse body contains error message", async () => {
  const res = errorResponse("something failed", 500);
  const body = await res.json();
  assertEquals(body.error, "something failed");
});

Deno.test("errorResponse includes extra fields", async () => {
  const res = errorResponse("fail", 422, { success: false, code: "VALIDATION" });
  const body = await res.json();
  assertEquals(body.error, "fail");
  assertEquals(body.success, false);
  assertEquals(body.code, "VALIDATION");
});

Deno.test("errorResponse sets correct headers", () => {
  const res = errorResponse("err", 500);
  assertEquals(res.headers.get("Content-Type"), "application/json");
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
});
