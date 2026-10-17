import { test, expect } from "@playwright/test";
const headers = { origin: "http://localhost:3100" };
test("picture upload resizes to JPEG, persists with a protected link, and attaches to a moderated feed post", async ({
  page,
}) => {
  await page.request.post("/api/session", {
    headers,
    data: { role: "OFFICER", chapterId: "uw" },
  });
  await page.goto("/?view=feed");
  await page
    .getByRole("button", { name: "Share a story from your chapter" })
    .click();
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    const x = c.getContext("2d")!;
    x.fillStyle = "gold";
    x.fillRect(0, 0, 32, 32);
    return c.toDataURL("image/png").split(",")[1];
  });
  await page
    .getByLabel("Optional picture")
    .setInputFiles({
      name: "test-picture.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    });
  await expect(
    page.getByRole("img", { name: "Uploaded picture preview" }),
  ).toBeVisible();
  const url = await page.locator('input[name="imageUrl"]').inputValue();
  const image = await page.request.get(url);
  expect(image.headers()["content-type"]).toBe("image/jpeg");
  expect((await page.request.get(url.split("?")[0])).status()).toBe(404);
  await page
    .getByLabel("Title", { exact: true })
    .fill("Picture post for review");
  await page
    .getByLabel("Caption", { exact: true })
    .fill("A fictional test photo and recap.");
  await page
    .getByRole("button", { name: "Submit for review", exact: true })
    .click();
  const state = await (await page.request.get("/api/state")).json();
  const post = state.posts.find(
    (p: { title: string }) => p.title === "Picture post for review",
  );
  expect(post.imageUrl).toBe(url);
  expect(post.status).toBe("PENDING");
  const bad = await page.request.post("/api/media", {
    headers: { ...headers, "content-type": "image/jpeg" },
    data: "not an image",
  });
  expect(bad.status()).toBeGreaterThanOrEqual(400);
});
