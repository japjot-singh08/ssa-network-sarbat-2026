import { createClient, type Session } from "@supabase/supabase-js";
import { cookies } from "next/headers";
export function authClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    key =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error(
      "Supabase authentication needs SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY on the server.",
    );
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
export async function saveAuth(session: Session) {
  const jar = await cookies();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  jar.set("ssa-auth", session.access_token, {
    ...options,
    maxAge: session.expires_in,
  });
  jar.set("ssa-refresh", session.refresh_token, {
    ...options,
    maxAge: 14 * 86400,
  });
  jar.delete("ssa-demo");
}
export async function verifiedUser() {
  const jar = await cookies();
  const access = jar.get("ssa-auth")?.value,
    refresh = jar.get("ssa-refresh")?.value;
  if (!access && !refresh) return null;
  const client = authClient();
  if (access) {
    const { data, error } = await client.auth.getUser(access);
    if (!error && data.user) return data.user;
  }
  if (refresh) {
    const { data, error } = await client.auth.refreshSession({
      refresh_token: refresh,
    });
    if (!error && data.session) {
      await saveAuth(data.session);
      const validated = await client.auth.getUser(data.session.access_token);
      if (!validated.error) return validated.data.user;
    }
  }
  return null;
}
