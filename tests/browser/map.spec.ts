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
