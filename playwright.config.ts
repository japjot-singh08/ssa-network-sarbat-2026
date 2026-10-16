import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  timeout: 60000,
  use: {
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    },
    baseURL: "http://localhost:3100",
    viewport: { width: 1440, height: 1080 },
    trace: "retain-on-failure",
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "work/playwright-report", open: "never" }],
  ],
  outputDir: "work/test-results",
  projects: [
    { name: "demo", testIgnore: "**/auth.spec.ts" },
    {
      name: "real-auth",
      testMatch: "**/auth.spec.ts",
      use: { baseURL: "http://localhost:3101" },
    },
  ],
  webServer: [
    {
      command: "node scripts/e2e-server.mjs",
      url: "http://localhost:3100/api/state",
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: "node scripts/e2e-server.mjs --real-auth",
      url: "http://localhost:3101/api/state",
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
