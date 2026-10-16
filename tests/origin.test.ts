import { test } from "node:test";
import assert from "node:assert/strict";
import { assertSameOrigin } from "../lib/request-origin";
function req(
  origin: string | null,
  host = "localhost:3000",
  extra: Record<string, string> = {},
) {
  return new Request("http://0.0.0.0:3000/api/session", {
    method: "POST",
    headers: { host, ...(origin ? { origin } : {}), ...extra },
  });
}
test("accepts browser Host when Next uses its internal wildcard listen address", () => {
  assert.doesNotThrow(() => assertSameOrigin(req("http://localhost:3000")));
  assert.doesNotThrow(() =>
    assertSameOrigin(req("http://127.0.0.1:3000", "127.0.0.1:3000")),
  );
  assert.doesNotThrow(() =>
    assertSameOrigin(
      new Request("https://internal.example/api/session", {
        headers: { host: "ssa.example", origin: "https://ssa.example" },
      }),
    ),
  );
});
test("rejects foreign origins, different ports or protocols, missing/null origins and forged forwarded headers", () => {
  for (const origin of [
    null,
    "null",
    "https://evil.example",
    "http://localhost:3001",
    "https://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3000/path",
  ])
    assert.throws(() => assertSameOrigin(req(origin)), /same-origin/);
  assert.throws(
    () =>
      assertSameOrigin(
        req("https://evil.example", "localhost:3000", {
          "x-forwarded-host": "evil.example",
          "x-forwarded-proto": "https",
        }),
      ),
    /same-origin/,
  );
  assert.throws(
    () =>
      assertSameOrigin(
        req("http://localhost:3000", "localhost:3000", {
          "sec-fetch-site": "cross-site",
        }),
      ),
    /same-origin/,
  );
});
test("rejects malformed Host authorities", () => {
  for (const host of [
    "evil.example@localhost:3000",
    "localhost:3000/path",
    "localhost:3000?query",
    "localhost:3000#fragment",
  ])
    assert.throws(
      () => assertSameOrigin(req("http://localhost:3000", host)),
      /same-origin/,
    );
});
