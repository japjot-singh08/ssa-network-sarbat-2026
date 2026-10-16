import { cookies } from "next/headers";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { body, demoMode, fail, limit, sameOrigin, sign } from "@/lib/auth";
import { readState } from "@/lib/store";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    limit("session:" + req.headers.get("x-forwarded-for"), 20);
    const input = z
      .object({
        role: z.enum(["STUDENT", "OFFICER", "ADMIN"]).optional(),
        chapterId: z.string().optional(),
        passcode: z.string().optional(),
        token: z.string().optional(),
        logout: z.boolean().optional(),
      })
      .parse(await body(req));
    const jar = await cookies(),
      options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
        path: "/",
        maxAge: 8 * 3600,
      };
    if (input.logout) {
      jar.delete("ssa-demo");
      jar.delete("ssa-auth");
      jar.delete("ssa-refresh");
      jar.delete("ssa-active-chapter");
      return Response.json({ message: "Signed out." });
    }
    if (!demoMode())
      throw new Error(
        "Use real university sign-in. Demo identities are disabled.",
      );
    const role = input.role || "STUDENT";
    if (role === "ADMIN") {
      const pass = process.env.DEMO_REVIEWER_PASSCODE;
      const submitted = input.passcode || "";
      if (!pass || pass.length < 12)
        throw new Error(
          "Configure a private DEMO_REVIEWER_PASSCODE of at least 12 characters on the server.",
        );
      if (
        pass.length !== submitted.length ||
        !timingSafeEqual(Buffer.from(pass), Buffer.from(submitted))
      )
        throw new Error("Incorrect reviewer passcode.");
    }
    if (
      role === "OFFICER" &&
      !(await readState()).chapters.some((c) => c.id === input.chapterId)
    )
      throw new Error("Select a demonstration chapter.");
    // Keep one demo identity in this browser to prevent role switching from multiplying reactions.
    const previous = jar.get("ssa-demo");
    const { verify } = await import("@/lib/auth");
    const old = previous ? verify(previous.value) : null;
    jar.set(
      "ssa-demo",
      sign({
        id: old?.id || randomUUID(),
        role,
        chapterId: role === "OFFICER" ? input.chapterId! : null,
      }),
      options,
    );
    return Response.json({ message: "Demonstration identity updated." });
  } catch (e) {
    return fail(e, 403);
  }
}
