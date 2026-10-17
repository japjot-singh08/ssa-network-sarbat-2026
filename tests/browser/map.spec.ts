import { test, expect } from "@playwright/test";

test("chapter map and search lead to a profile, including when tiles are unavailable", async ({
  page,
}) => {
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
  await page.goto("/?view=directory");
  await expect(
    page.getByRole("heading", { name: "Find your SSA." }),
  ).toBeVisible();
  const navigation = await page.locator("aside").boundingBox();
  expect(navigation!.height).toBeLessThan(160);
  await expect(
    page.getByRole("button", { name: "View UNC Charlotte SSA", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search chapters").fill("Charlotte");
  await expect(
    page.getByRole("heading", { name: "1 chapter to explore" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View Stanford SSA", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "View UNC Charlotte SSA", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Chapter profile", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("region", { name: "Chapter profile", exact: true }),
  ).toContainText("UNC Charlotte SSA");
  await page.getByLabel("Search chapters").fill("missing-university");
  await expect(
    page.getByRole("heading", { name: "No chapters match your search." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "5 chapters to explore" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("unclaimed chapter explains ownership and submits private executive-board evidence", async ({
  page,
  request,
}) => {
  await request.post("/api/session", {
    headers: { origin: "http://localhost:3100" },
    data: { role: "STUDENT" },
  });
  const state = await (await request.get("/api/state")).json();
  const c = state.chapters[0];
  c.isSample = false;
  c.networkStatus = "UNCLAIMED";
  c.applicationsOpen = false;
  state.actor = {
    id: "claim-ui-student",
    role: "STUDENT",
    chapterId: null,
    verified: true,
  };
  state.chapterProposals = [];
  await page.route("**/api/state", (route) => route.fulfill({ json: state }));
  await page.route("**/api/portal", async (route) => {
    const payload = route.request().postDataJSON();
    expect(payload.action).toBe("chapterClaim");
    expect(payload.chapterId).toBe(c.id);
    expect(payload.confirmed).toBe(true);
    state.chapterProposals.push({
      id: "claim-ui",
      userId: state.actor.id,
      status: "PENDING",
      details: { claimChapterId: c.id },
      chapterId: c.id,
    });
    await route.fulfill({ json: { message: "Claim sent to USM." } });
  });
  await page.goto("/?view=directory");
  await page
    .getByRole("button", { name: `View ${c.name}`, exact: true })
    .click();
  await expect(
    page.getByText("Unclaimed on SSA Network", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Your executive-board position").fill("President");
  await page
    .getByLabel("Evidence of your executive-board role")
    .fill("Public executive-board roster at https://example.edu/ssa/board");
  await page.getByRole("checkbox", { name: /I currently serve/ }).check();
  await page
    .getByRole("button", { name: "Submit chapter claim", exact: true })
    .click();
  await expect(
    page.getByText(/Your claim is pending USM review/),
  ).toBeVisible();
});
