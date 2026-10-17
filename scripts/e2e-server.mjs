import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
const real = process.argv.includes("--real-auth");
const dir = await mkdtemp(join(tmpdir(), "ssa-e2e-"));
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "0.0.0.0",
    "-p",
    real ? "3101" : "3100",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DEMO_MODE: real ? "false" : "true",
      DEMO_DATA_DIR: dir,
      SIGNUP_EMAIL_POLICY: "university",
      DATABASE_URL: "",
      ANTHROPIC_API_KEY: "",
      SESSION_SECRET: "synthetic-e2e-secret-not-for-real-use-123456",
      DEMO_REVIEWER_PASSCODE: "synthetic-e2e-reviewer-passcode",
    },
  },
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("exit", async (code) => {
  await rm(dir, { recursive: true, force: true });
  process.exit(code || 0);
});
