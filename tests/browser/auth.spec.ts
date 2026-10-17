import { test, expect } from "@playwright/test";
const headers = { origin: "http://localhost:3101" };
test("real-account UI and university signup validation, with no self-assigned roles", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Sign in / Join", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName(
    "Welcome to SSA Network",
  );
  await expect(
    page.getByRole("combobox", { name: "Role", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.screenshot({
    path: "outputs/ssa-network-real-sign-in.png",
    fullPage: true,
  });
  await page
    .getByLabel("Preferred name", { exact: true })
    .fill("Validation Test");
  await page.getByLabel("Email address").fill("test@gmail.com");
  await page
    .getByLabel("Password (at least 12 characters)")
    .fill("synthetic-password-never-an-account");
  await page.getByRole("button", { name: "Create student account" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "university",
  );
  const privilege = await page.request.post("/api/auth", {
    headers,
    data: {
      mode: "signup",
      email: "test@example.edu",
      password: "synthetic-password-not-created",
      name: "Validation Test",
      role: "ADMIN",
    },
  });
  expect(privilege.status()).toBe(400);
  const demo = await page.request.post("/api/session", {
    headers,
    data: { role: "ADMIN", passcode: "synthetic-e2e-reviewer-passcode" },
  });
  expect(demo.status()).toBe(403);
  expect((await demo.json()).error).toContain("disabled");
});
test("real mode rejects unverified protected actions and fabricated sessions", async ({
  request,
}) => {
  const rejected = await request.post("/api/auth", {
    headers,
    data: { mode: "exchange", accessToken: "invalid", refreshToken: "invalid" },
  });
  expect(rejected.status()).toBe(400);
  const action = await request.post("/api/portal", {
    headers,
    data: {
      action: "membershipApply",
      chapterId: "uncc",
      answers: {},
      submit: false,
    },
  });
  expect(action.status()).toBe(400);
  const state = await (await request.get("/api/state")).json();
  expect(state.demo).toBe(false);
  expect(state.actor.id).toBe("guest");
  for (const field of [
    "profiles",
    "memberships",
    "membershipApplications",
    "chapterProposals",
    "chapterResources",
    "auditLogs",
  ])
    expect(state[field]).toHaveLength(0);
});
