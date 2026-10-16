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
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: "http://localhost:3100/api/state",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
