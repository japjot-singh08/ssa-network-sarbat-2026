import { test, expect } from "@playwright/test";
test("student without SSA can join Arena and propose a feed story", async ({
  page,
}) => {
  const headers = { origin: "http://localhost:3100" };
  await page.request.post("/api/session", {
    headers,
    data: { role: "STUDENT" },
  });
  await page.goto("/?view=feed");
  await expect(
    page.getByRole("button", { name: "Share a story or event recap" }),
  ).toBeVisible();
  const before = await (await page.request.get("/api/state")).json();
  const challenge = before.challenges.find(
    (c: { status: string; deadline: string | null }) =>
      c.status === "OPEN" &&
      (!c.deadline || c.deadline > new Date().toISOString().slice(0, 10)),
  );
  const joined = await page.request.post("/api/action", {
    headers,
    data: { action: "joinIndividual", challengeId: challenge.id },
  });
  expect(joined.ok()).toBeTruthy();
  await page.goto("/?view=arena");
  await page.getByRole("button", { name: /My Challenges/ }).click();
  await expect(
    page.getByRole("heading", { name: "My individual participation" }),
  ).toBeVisible();
  await page
    .getByLabel("What did you contribute?")
    .fill("Packed supplies for the community partner.");
  await page
    .getByLabel("Completion notes or evidence")
    .fill("Organizer confirmed participation by email.");
  await page.getByLabel("Your hours contributed").fill("2");
  await page
    .getByRole("button", { name: "Record personal completion" })
    .click();
  await expect(
    page.getByText("Self-reported completion", { exact: true }),
  ).toBeVisible();
  const after = await (await page.request.get("/api/state")).json();
  expect(after.points).toEqual(before.points);
  await page.goto("/?view=leaderboard");
  await page.getByText("See example chapter standings").click();
  await expect(
    page.getByText("Illustrative Fall 2026 numbers only.", { exact: false }),
  ).toBeVisible();
});

test("directory uses three compact columns on desktop", async ({ page }) => {
  await page.goto("/?view=directory");
  const cards = page.locator(".chapter-directory-grid > button");
  await expect(cards.first()).toBeVisible();
  const boxes = await cards.evaluateAll((es) =>
    es
      .slice(0, 3)
      .map((e) => ({
        x: e.getBoundingClientRect().x,
        y: e.getBoundingClientRect().y,
      })),
  );
  expect(boxes.length).toBe(3);
  expect(boxes[0].y).toBe(boxes[1].y);
  expect(boxes[1].y).toBe(boxes[2].y);
  expect(boxes[0].x).toBeLessThan(boxes[1].x);
});
