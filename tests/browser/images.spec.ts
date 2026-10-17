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
    .getByRole("button", { name: "Share a story or event recap" })
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
  await page.getByLabel("Optional picture").setInputFiles({
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

test("PDF evidence uploads persist and download with safe headers", async ({
  page,
}) => {
  const pdf = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n",
  );
  const upload = await page.request.post("/api/media", {
    headers: { ...headers, "content-type": "application/pdf" },
    data: pdf,
  });
  expect(upload.ok()).toBeTruthy();
  const { url } = await upload.json();
  const file = await page.request.get(url);
  expect(file.headers()["content-type"]).toBe("application/pdf");
  expect(file.headers()["content-disposition"]).toContain("attachment");
  expect(Buffer.compare(await file.body(), pdf)).toBe(0);
  expect((await page.request.get(url.split("?")[0])).status()).toBe(404);
  const invalid = await page.request.post("/api/media", {
    headers: { ...headers, "content-type": "application/pdf" },
    data: Buffer.from("<script>bad</script>"),
  });
  expect(invalid.ok()).toBeFalsy();
  await page.request.post("/api/session", {
    headers,
    data: { role: "OFFICER", chapterId: "berkeley" },
  });
  await page.request.post("/api/action", {
    headers,
    data: { action: "accept", challengeId: "demo-west-cleanup" },
  });
  const state = await (await page.request.get("/api/state")).json();
  const participation = state.participations.find(
    (p: { chapterId: string; challengeId: string }) =>
      p.chapterId === "berkeley" && p.challengeId === "demo-west-cleanup",
  );
  const submit = await page.request.post("/api/action", {
    headers,
    data: {
      action: "submit",
      participationId: participation.id,
      summary: "Packed care kits",
      impact: "Provided requested supplies",
      evidence: "PDF contains partner confirmation.",
      attachment: url,
      participants: 4,
      hours: 8,
    },
  });
  expect(submit.ok()).toBeTruthy();
  const saved = await (await page.request.get("/api/state")).json();
  expect(
    saved.submissions.find(
      (s: { participationId: string }) =>
        s.participationId === participation.id,
    ).attachment,
  ).toBe(url);
  await page.request.post("/api/action", {
    headers,
    data: { action: "accept", challengeId: "demo-national-food-drive" },
  });
  await page.goto("/?view=arena");
  await page.getByRole("button", { name: /My Challenges/ }).click();
  await page.getByRole("button", { name: /Submit evidence/ }).click();
  await expect(page.getByLabel("Upload evidence (PDF or image)")).toBeVisible();
  await page.getByLabel("Upload evidence (PDF or image)").setInputFiles({
    name: "confirmation.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await expect(
    page.getByRole("link", { name: "Download uploaded PDF" }),
  ).toBeVisible();
  await page.screenshot({
    path: "outputs/Evidence-Upload-Form.png",
    fullPage: false,
  });
  await page.request.post("/api/session", {
    headers,
    data: { role: "ADMIN", passcode: "synthetic-e2e-reviewer-passcode" },
  });
  const submission = saved.submissions.find(
    (s: { participationId: string }) => s.participationId === participation.id,
  );
  const review = await page.request.post("/api/action", {
    headers,
    data: {
      action: "review",
      submissionId: submission.id,
      decision: "REJECTED",
      feedback: "Synthetic PDF test concluded; no awards.",
      verifiedHours: 0,
      grantApproved: false,
    },
  });
  expect(review.ok()).toBeTruthy();
});
