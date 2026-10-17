import { test, expect } from "@playwright/test";
const origin = "http://localhost:3100";
test("student → officer → human reviewer → leaderboard → feed → Toolkit → Sahayak setup", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Your campus. Our community.",
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "outputs/ssa-network-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Explore the Arena", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Find a cause. Make your mark." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Enter demo", exact: true }).click();
  await page
    .getByRole("button", { name: "Enter demonstration", exact: false })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const forbidden = await page.request.post("/api/action", {
    headers: { origin },
    data: {
      action: "review",
      submissionId: "s-seed",
      decision: "APPROVED",
      feedback: "Unauthorized",
      verifiedHours: 10,
      grantApproved: false,
    },
  });
  expect(forbidden.status()).toBe(400);
  await page.getByRole("button", { name: "My account", exact: true }).click();
  await page.getByRole("button", { name: "Switch identity" }).click();
  await page
    .getByRole("dialog")
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("OFFICER");
  await page
    .getByRole("dialog")
    .getByLabel("Officer’s chapter")
    .selectOption("uw");
  await page
    .getByRole("button", { name: "Enter demonstration", exact: false })
    .click();
  await page
    .locator("article.challenge-card")
    .filter({
      has: page.getByRole("heading", {
        name: "Pack Winter Care Kits in Seattle",
        exact: true,
      }),
    })
    .getByRole("button", { name: "View details" })
    .click();
  await expect(
    page.getByRole("dialog").getByText("What completion looks like"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Accept for my chapter" }).click();
  await expect(
    page.getByRole("button", { name: "Submit evidence", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Submit evidence", exact: true })
    .click();
  await page
    .getByLabel("What did you complete?")
    .fill("Assembled and distributed 40 winter care kits with the partner.");
  await page
    .getByLabel("What changed for the community?")
    .fill(
      "40 neighbors received warm supplies, supported by partner confirmation.",
    );
  await page
    .getByLabel("Evidence and completion criteria")
    .fill(
      "Demo evidence: 40 kits, itemized list, partner confirmation, and receipts totaling $150. Fictional evidence for the hackathon.",
    );
  await page.getByLabel("Participants", { exact: true }).fill("12");
  await page.getByLabel("Total volunteer-hours").fill("24");
  await page.getByRole("button", { name: "Submit for human review" }).click();
  await expect(page.getByText("PENDING", { exact: true })).toBeVisible();
  let data = await (await page.request.get("/api/state")).json();
  const submission = data.submissions.find(
    (s: { status: string }) => s.status === "PENDING",
  );
  expect(
    data.points.filter(
      (p: { submissionId: string }) => p.submissionId === submission.id,
    ),
  ).toHaveLength(0);
  await page.getByRole("button", { name: "My account", exact: true }).click();
  await page.getByRole("button", { name: "Switch identity" }).click();
  await page
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("ADMIN");
  await page.getByLabel("Private reviewer passcode").fill("wrong-password");
  await page
    .getByRole("button", { name: "Enter demonstration", exact: false })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Incorrect reviewer passcode",
  );
  await page
    .getByLabel("Private reviewer passcode")
    .fill("synthetic-e2e-reviewer-passcode");
  await page
    .getByRole("button", { name: "Enter demonstration", exact: false })
    .click();
  await page.getByRole("button", { name: "My account", exact: true }).click();
  await page.getByRole("button", { name: "USM review desk" }).click();
  await expect(
    page.getByRole("heading", { name: "The USM review desk." }),
  ).toBeVisible();
  await page.getByLabel("Verified total volunteer-hours").fill("20");
  await page.getByText("Record $150 grant award.", { exact: false }).click();
  await page
    .getByRole("combobox", { name: "Decision", exact: true })
    .selectOption("APPROVED");
  await page
    .getByLabel("Reviewer feedback")
    .fill(
      "Confirmed 40 kits, partner distribution confirmation, itemized supplies, and receipts. All criteria met.",
    );
  await page
    .getByText("I reviewed the evidence against the completion criteria.")
    .click();
  await page
    .getByRole("button", { name: "Confirm human review decision" })
    .click();
  await expect(
    page.getByRole("heading", { name: "You’re all caught up." }),
  ).toBeVisible();
  const repeated = await Promise.all(
    Array.from({ length: 3 }, () =>
      page.request.post("/api/action", {
        headers: { origin },
        data: {
          action: "review",
          submissionId: submission.id,
          decision: "APPROVED",
          feedback: "Retry",
          verifiedHours: 20,
          grantApproved: true,
        },
      }),
    ),
  );
  for (const r of repeated) expect(r.ok()).toBe(true);
  data = await (await page.request.get("/api/state")).json();
  expect(
    data.points.filter(
      (p: { submissionId: string }) => p.submissionId === submission.id,
    ),
  ).toHaveLength(1);
  expect(
    data.grants.filter(
      (p: { submissionId: string }) => p.submissionId === submission.id,
    ),
  ).toHaveLength(1);
  expect(
    data.posts.filter(
      (p: { submissionId: string }) => p.submissionId === submission.id,
    ),
  ).toHaveLength(1);
  await page.getByRole("button", { name: "Leaderboard", exact: true }).click();
  await expect(page.locator(".leader-row").nth(1)).toContainText(
    "University of Washington SSA",
  );
  await page.getByRole("button", { name: "My account", exact: true }).click();
  await page.getByRole("button", { name: "Switch identity" }).click();
  await page
    .getByRole("combobox", { name: "Role", exact: true })
    .selectOption("STUDENT");
  await page
    .getByRole("button", { name: "Enter demonstration", exact: false })
    .click();
  await page
    .getByRole("button", { name: "National feed", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pack Winter Care Kits in Seattle" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Shabash/ })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: /Shabash/ }).first(),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Shabash/ }).first(),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Toolkit", exact: true }).click();
  await page.getByRole("textbox", { name: "Search Toolkit" }).fill("langar");
  await expect(page.locator(".resource-card")).toHaveCount(1);
  await page.locator(".resource-card").click();
  await expect(page.getByRole("dialog")).toContainText("Fictional sample");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: /^Sahayak/ }).click();
  await expect(
    page.getByText("AI setup required:", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ask Sahayak", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
test("responsive mobile navigation and layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Your campus. Our community.",
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "outputs/ssa-network-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Arena", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Find a cause. Make your mark." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("reject cross-origin writes and expose informative missing-AI response", async ({
  request,
}) => {
  const r = await request.post("/api/session", {
    headers: { origin: "https://not-this-app.example" },
    data: { role: "ADMIN", passcode: "synthetic-e2e-reviewer-passcode" },
  });
  expect(r.status()).toBe(403);
  await request.post("/api/session", {
    headers: { origin },
    data: { role: "STUDENT" },
  });
  const ai = await request.post("/api/ai", {
    headers: { origin },
    data: { mode: "chat", question: "How do we plan langar seva?" },
  });
  expect(ai.status()).toBe(400);
  expect((await ai.json()).error).toContain("ANTHROPIC_API_KEY");
});
