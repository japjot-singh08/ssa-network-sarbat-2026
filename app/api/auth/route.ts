import { z } from "zod";
import { cookies } from "next/headers";
import { body, fail, limit, sameOrigin } from "@/lib/auth";
import { authClient, saveAuth, verifiedUser } from "@/lib/supabase-auth";
import { universityEmail } from "@/lib/university-email";
const email = z
  .email()
  .max(254)
  .transform((v) => v.toLowerCase().trim());
const schema = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("signup"),
      email,
      password: z.string().min(12).max(128),
      name: z.string().trim().min(1).max(100),
    })
    .strict(),
  z
    .object({
      mode: z.literal("login"),
      email,
      password: z.string().min(1).max(128),
    })
    .strict(),
  z.object({ mode: z.literal("reset"), email }).strict(),
  z.object({ mode: z.literal("resend"), email }).strict(),
  z
    .object({
      mode: z.literal("password"),
      password: z.string().min(12).max(128),
    })
    .strict(),
  z
    .object({
      mode: z.literal("exchange"),
      accessToken: z.string().max(16000),
      refreshToken: z.string().max(16000),
    })
    .strict(),
  z.object({ mode: z.literal("logout") }).strict(),
  z
    .object({
      mode: z.literal("activeChapter"),
      chapterId: z.string().max(100),
    })
    .strict(),
]);
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    limit("auth:" + req.headers.get("x-forwarded-for"), 12);
    const input = schema.parse(await body(req));
    const jar = await cookies();
    const callback = new URL("/auth/callback", req.headers.get("origin")!).href;
    if ("email" in input && !universityEmail(input.email))
      throw new Error(
        "Use your university .edu email, or a university domain approved by USM.",
      );
    const client = authClient();
    if (input.mode === "signup") {
      const { error } = await client.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: { name: input.name }, emailRedirectTo: callback },
      });
      if (error) throw error;
      return Response.json({
        message:
          "Check your university inbox to verify your email before signing in. If the account already exists, sign in or reset your password.",
      });
    }
    if (input.mode === "login") {
      const { data, error } = await client.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error || !data.session)
        throw new Error(error?.message || "Sign-in failed.");
      if (!data.user?.email_confirmed_at)
        throw new Error("Verify your university email before signing in.");
      await saveAuth(data.session);
      return Response.json({ message: "Signed in. Welcome to SSA Network." });
    }
    if (input.mode === "reset") {
      const { error } = await client.auth.resetPasswordForEmail(input.email, {
        redirectTo: callback + "?next=password",
      });
      if (error) throw error;
      return Response.json({
        message:
          "If that university account exists, a password reset link has been sent.",
      });
    }
    if (input.mode === "resend") {
      const { error } = await client.auth.resend({
        type: "signup",
        email: input.email,
        options: { emailRedirectTo: callback },
      });
      if (error) throw error;
      return Response.json({
        message: "If eligible, a new verification email has been sent.",
      });
    }
    if (input.mode === "exchange") {
      const { data, error } = await client.auth.setSession({
        access_token: input.accessToken,
        refresh_token: input.refreshToken,
      });
      if (
        error ||
        !data.session ||
        !data.user?.email_confirmed_at ||
        !data.user.email ||
        !universityEmail(data.user.email)
      )
        throw new Error(
          "The verification or reset link is invalid or expired.",
        );
      const verified = await client.auth.getUser(data.session.access_token);
      if (verified.error) throw verified.error;
      await saveAuth(data.session);
      return Response.json({ message: "Email verified. You’re signed in." });
    }
    if (input.mode === "logout") {
      const token = jar.get("ssa-auth")?.value,
        refresh = jar.get("ssa-refresh")?.value;
      if (token && refresh) {
        await client.auth.setSession({
          access_token: token,
          refresh_token: refresh,
        });
        await client.auth.signOut({ scope: "local" });
      }
      for (const name of [
        "ssa-auth",
        "ssa-refresh",
        "ssa-demo",
        "ssa-active-chapter",
      ])
        jar.delete(name);
      return Response.json({ message: "Signed out." });
    }
    if (input.mode === "password") {
      const user = await verifiedUser();
      if (!user)
        throw new Error("Open your password reset link or sign in first.");
      const token = jar.get("ssa-auth")?.value,
        refresh = jar.get("ssa-refresh")?.value;
      const { error: sessionError } = await client.auth.setSession({
        access_token: token!,
        refresh_token: refresh!,
      });
      if (sessionError) throw sessionError;
      const { error } = await client.auth.updateUser({
        password: input.password,
      });
      if (error) throw error;
      return Response.json({ message: "Password updated." });
    }
    if (input.mode === "activeChapter") {
      const { getActor } = await import("@/lib/auth");
      const actor = await getActor();
      if (!actor.managedChapterIds?.includes(input.chapterId))
        throw new Error("You do not manage that chapter.");
      jar.set("ssa-active-chapter", input.chapterId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      return Response.json({ message: "Active chapter selected." });
    }
  } catch (e) {
    return fail(e);
  }
}
