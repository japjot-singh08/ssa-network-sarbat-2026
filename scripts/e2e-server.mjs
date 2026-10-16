import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
const dir = await mkdtemp(join(tmpdir(), "ssa-e2e-"));
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "-p",
    "3100",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DEMO_MODE: "true",
      DEMO_DATA_DIR: dir,
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
