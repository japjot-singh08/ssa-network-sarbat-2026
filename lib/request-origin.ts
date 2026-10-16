/** Validate the browser-facing origin, not Next.js's internal listen address. */
export function assertSameOrigin(req: Request) {
  const denied = () => {
    throw new Error("A same-origin request is required.");
  };
  const value = req.headers.get("origin");
  if (
    !value ||
    value === "null" ||
    req.headers.get("sec-fetch-site") === "cross-site"
  )
    return denied();
  try {
    const internal = new URL(req.url);
    // Host is the authority addressed by the browser. Do not trust arbitrary
    // x-forwarded-host values, or equate different localhost aliases/ports.
    const authority = req.headers.get("host") || internal.host;
    const expected = new URL(`${internal.protocol}//${authority}`);
    if (
      !["http:", "https:"].includes(expected.protocol) ||
      expected.username ||
      expected.password ||
      expected.pathname !== "/" ||
      expected.search ||
      expected.hash ||
      authority.trim() !== authority
    )
      return denied();
    const origin = new URL(value);
    if (value !== origin.origin || origin.origin !== expected.origin)
      return denied();
  } catch {
    return denied();
  }
}
