import { z } from "zod";
export function universityEmail(
  email: string,
  configured = process.env.UNIVERSITY_EMAIL_DOMAINS || "",
) {
  if (!z.email().safeParse(email).success) return false;
  const domain = email.toLowerCase().split("@")[1];
  const allowed = configured
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return (
    domain.endsWith(".edu") ||
    allowed.some((d) => domain === d || domain.endsWith("." + d))
  );
}

// Open registration is explicit; omitted or unknown values retain university restrictions.
export function accountEmailAllowed(
  email: string,
  policy = process.env.SIGNUP_EMAIL_POLICY || "university",
  configured = process.env.UNIVERSITY_EMAIL_DOMAINS || "",
) {
  return policy === "any"
    ? z.email().safeParse(email).success
    : universityEmail(email, configured);
}
