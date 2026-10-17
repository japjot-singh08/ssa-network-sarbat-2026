import { test, expect } from "@playwright/test";
const headers = { origin: "http://localhost:3100" };
test("public help request persists privately and admin can publish it exactly once", async ({
  page,
}) => {
  await page.goto("/?view=arena");
  await page
    .getByRole("button", { name: "Request community help", exact: true })
    .click();
  await page
    .getByLabel("Organization or community group")
    .fill("Fictional test organizer");
  await page.getByLabel("Project location").fill("Seattle, WA");
  await page
    .getByLabel("Contact email (private to USM)")
    .fill("fictional@example.org");
  await page
    .getByLabel("Describe the help needed")
    .fill(
      "We need volunteers to pack 50 care kits for a fictional community demonstration on November 20.",
    );
  await page
    .getByRole("button", { name: "Send request to USM", exact: true })
    .click();
  await expect(
    page.getByText(/Request received. USM will review/),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/state")).json()).communityRequests,
  ).toEqual([]);
  const denied = await page.request.post("/api/community", {
    headers,
    data: { action: "screen", id: "anything" },
  });
  expect(denied.status()).toBeGreaterThanOrEqual(400);
  await page.request.post("/api/session", {
    headers,
    data: { role: "ADMIN", passcode: "synthetic-e2e-reviewer-passcode" },
  });
  const state = await (await page.request.get("/api/state")).json();
  const intake = state.communityRequests.find(
    (r: { details: { organization: string } }) =>
      r.details.organization === "Fictional test organizer",
  );
  expect(intake.details.contactEmail).toBe("fictional@example.org");
  const action = {
    action: "publish",
    communityRequestId: intake.id,
    title: "Pack care kits",
    description: "Help the community pack supplies.",
    organization: "Fictional test organizer",
    type: "Community Request",
    category: "Community Seva",
    location: "Seattle, WA",
    region: "West",
    deadline: "2026-11-20",
    sample: true,
    maxChapters: null,
    restrictRegion: false,
    volunteers: 10,
    points: 100,
    grant: 0,
    eligibility: "Local chapters",
    grantEligibility: "No grant",
    completion: "50 packed care kits",
    instructions: "Partner confirmation",
  };
  for (let i = 0; i < 2; i++)
    expect(
      (await page.request.post("/api/action", { headers, data: action })).ok(),
    ).toBe(true);
  const after = await (await page.request.get("/api/state")).json();
  expect(
    after.challenges.filter(
      (c: { title: string }) => c.title === "Pack care kits",
    ),
  ).toHaveLength(1);
});
