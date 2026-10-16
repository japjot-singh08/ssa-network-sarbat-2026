import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
let existing = "";
try {
  existing = await readFile(".env.local", "utf8");
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
if (process.argv.includes("--show")) {
  const pass = existing.match(/^DEMO_REVIEWER_PASSCODE=(.+)$/m)?.[1];
  console.log(
    pass
      ? "Private local demo reviewer passcode: " + pass
      : "Run npm run setup:demo first.",
  );
} else if (existing) {
  console.log(
    ".env.local already exists; left unchanged. Use npm run demo:credentials to view your local reviewer passcode.",
  );
} else {
  await writeFile(
    ".env.local",
    `DEMO_MODE=true\nSESSION_SECRET=${randomBytes(32).toString("hex")}\nDEMO_REVIEWER_PASSCODE=${randomBytes(18).toString("base64url")}\n`,
    { mode: 0o600 },
  );
  console.log(
    "Created private .env.local. Run npm run demo:credentials when you need reviewer access.",
  );
}
