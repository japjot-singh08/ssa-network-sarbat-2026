import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Actor } from "./types";
import { readState } from "./store";
const localSecret = randomBytes(32).toString("hex");
export const demoMode = () =>
  process.env.DEMO_MODE === "true" ||
  (process.env.NODE_ENV !== "production" && process.env.DEMO_MODE !== "false");
function secret() {
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
  )
    throw new Error("Set SESSION_SECRET to at least 32 random characters.");
  return process.env.SESSION_SECRET || localSecret;
}
export function sign(actor: Actor) {
  const data = Buffer.from(
    JSON.stringify({ ...actor, exp: Date.now() + 8 * 60 * 60 * 1000 }),
  ).toString("base64url");
  return (
    data + "." + createHmac("sha256", secret()).update(data).digest("base64url")
  );
}
export function verify(value: string): Actor | null {
  try {
    const [data, sig] = value.split(".");
    const expected = createHmac("sha256", secret())
      .update(data)
      .digest("base64url");
    if (
      !sig ||
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    )
      return null;
    const actor = JSON.parse(Buffer.from(data, "base64url").toString());
    if (
      actor.exp < Date.now() ||
      !["STUDENT", "OFFICER", "ADMIN"].includes(actor.role)
    )
      return null;
    return { id: actor.id, role: actor.role, chapterId: actor.chapterId };
  } catch {
    return null;
  }
}
export async function getActor(): Promise<Actor> {
  const jar = await cookies();
  if (demoMode()) {
    const session = verify(jar.get("ssa-demo")?.value || "");
    if (session) return session;
    return { id: "guest", role: "STUDENT", chapterId: null };
  }
  const token = jar.get("ssa-auth")?.value;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key)
    return { id: "guest", role: "STUDENT", chapterId: null };
  const { data, error } = await createClient(url, key).auth.getUser(token);
  if (error || !data.user)
    return { id: "guest", role: "STUDENT", chapterId: null };
  const state = await readState();
  return (
    state.profiles.find((p) => p.id === data.user.id) || {
      id: data.user.id,
      role: "STUDENT",
      chapterId: null,
    }
  );
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(req.url).origin)
    throw new Error("A same-origin request is required.");
}
export async function body(req: Request) {
  const raw = await req.text();
  if (Buffer.byteLength(raw) > 90000) throw new Error("Request too large.");
  return JSON.parse(raw);
}
const buckets = new Map<string, { count: number; until: number }>();
export function limit(key: string, max = 30) {
  const now = Date.now();
  if (buckets.size > 10000)
    for (const [k, b] of buckets) if (b.until < now) buckets.delete(k);
  let bucket = buckets.get(key);
  if (!bucket || bucket.until < now) {
    bucket = { count: 0, until: now + 60000 };
    buckets.set(key, bucket);
  }
  if (++bucket.count > max)
    throw new Error("Too many requests. Please wait a minute.");
}
export const fail = (e: unknown, status = 400) =>
  Response.json(
    { error: e instanceof Error ? e.message : "Request failed." },
    { status },
  );
