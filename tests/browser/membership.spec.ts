import { test, expect } from "@playwright/test";
const headers = { origin: "http://localhost:3100" };
test("student application → chapter-scoped human approval → private roster and dashboard", async ({
  page,
  request,
}) => {
  await page.goto("/?view=directory");
  await expect(
    page.getByRole("heading", { name: "Find your sangat." }),
  ).toBeVisible();
  await page.request.post("/api/session", {
    headers,
    data: { role: "STUDENT" },
  });
  await page.reload();
  await page
    .getByRole("button", { name: /UNC Charlotte SSA UNC Charlotte/ })
    .click();
  await expect(
    page.getByRole("region", { name: "Chapter profile", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Apply to Join", exact: true })
    .click();
  await expect(
    page.getByRole("region", {
      name: "Chapter membership application",
      exact: true,
    }),
  ).toBeFocused();
  await page.getByLabel("Preferred name *").fill("Fictional Student");
  await page.getByLabel("Academic year *").fill("First year");
  await page
    .getByLabel("Why would you like to join? *")
    .fill("To serve and connect with the community");
  await page
    .getByLabel("Activities you are interested in *")
    .fill("Community seva");
  await page
    .getByLabel("Interest in volunteering or leadership *")
    .fill("Volunteering");
  await page
    .getByRole("button", { name: "Submit application", exact: true })
    .click();
  await expect(page.getByText("PENDING", { exact: true })).toBeVisible();
  let state = await (await page.request.get("/api/state")).json();
  const app = state.membershipApplications.find(
    (a: { status: string }) => a.status === "PENDING",
  );
  const studentId = state.actor.id;
  const studentDenied = await page.request.post("/api/portal", {
    headers,
    data: {
      action: "membershipReview",
      applicationId: app.id,
      decision: "APPROVED",
      note: "No privilege",
    },
  });
  expect(studentDenied.status()).toBe(400);
  await request.post("/api/session", {
    headers,
    data: { role: "OFFICER", chapterId: "stanford" },
  });
  const other = await request.get("/api/state");
  expect((await other.json()).membershipApplications).toHaveLength(0);
  expect(
    (
      await request.post("/api/portal", {
        headers,
        data: {
          action: "membershipReview",
          applicationId: app.id,
          decision: "APPROVED",
          note: "Wrong chapter",
        },
      })
    ).status(),
  ).toBe(400);
  await page.request.post("/api/session", {
    headers,
    data: { role: "OFFICER", chapterId: "uncc" },
  });
  await page.goto("/?view=myssa");
  await page.getByRole("button", { name: /^Applications/ }).click();
  await expect(
    page.getByRole("heading", { name: "Fictional Student" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Membership decision" })
    .selectOption("APPROVED");
  await page
    .getByText("I reviewed this application and confirm this decision.")
    .click();
  await page.getByRole("button", { name: "Confirm human decision" }).click();
  await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Members", exact: true }).click();
  await expect(page.locator(".roster")).toContainText("Fictional Student");
  await page.request.post("/api/portal", {
    headers,
    data: {
      action: "membershipReview",
      applicationId: app.id,
      decision: "APPROVED",
      note: "Retry",
    },
  });
  state = await (await page.request.get("/api/state")).json();
  expect(
    state.memberships.filter(
      (m: { userId: string; chapterId: string }) =>
        m.userId === studentId && m.chapterId === "uncc",
    ),
  ).toHaveLength(1);
  await page.request.post("/api/session", {
    headers,
    data: { role: "STUDENT" },
  });
  await page.goto("/?view=dashboard");
  await expect(
    page.getByRole("button", { name: /UNC Charlotte SSA Chapter member/ }),
  ).toBeVisible();
  const publicContext = await page.context().browser()!.newContext();
  try {
    const publicPage = await publicContext.newPage();
    await publicPage.goto("http://localhost:3100");
    const publicState = await (
      await publicPage.request.get("http://localhost:3100/api/state")
    ).json();
    expect(publicState.memberships).toHaveLength(0);
    expect(publicState.membershipApplications).toHaveLength(0);
    expect(publicState.profiles).toHaveLength(0);
  } finally {
    await publicContext.close();
  }
});
test("Start a Chapter → USM review → one chapter, officer membership, onboarding and directory entry", async ({
  page,
}) => {
  await page.goto("/");
  await page.request.post("/api/session", {
    headers,
    data: { role: "STUDENT" },
  });
  await page.goto("/?view=start");
  const details = {
    university: "Fictional Coastal University",
    location: "Example City, WA",
    state: "WA",
    region: "West",
    proposedName: "Fictional Coastal SSA",
    reason: "Community and seva",
    students: "20",
    leadership: "Yes",
    goals: "Community service and learning",
    activities: "Service and discussion",
    support: "Mentorship",
    additional: "",
  };
  for (const [name, value] of Object.entries(details))
    await page.locator(`textarea[name="${name}"]`).fill(value);
  await page
    .getByRole("button", { name: "Submit application", exact: true })
    .click();
  await expect(
    page.getByText("PENDING USM REVIEW", { exact: true }),
  ).toBeVisible();
  let state = await (await page.request.get("/api/state")).json();
  const proposal = state.chapterProposals.find(
    (p: { details: Record<string, string> }) =>
      p.details.university === details.university,
  );
  await page.request.post("/api/session", {
    headers,
    data: { role: "ADMIN", passcode: "synthetic-e2e-reviewer-passcode" },
  });
  await page.goto("/?view=admin");
  await page
    .getByRole("combobox", { name: "USM chapter decision" })
    .selectOption("APPROVED");
  await page
    .getByText("I reviewed this application and confirm this decision.")
    .click();
  await page.getByRole("button", { name: "Confirm human decision" }).click();
  await expect(page.getByText("APPROVED", { exact: true })).toBeVisible();
  await page.request.post("/api/portal", {
    headers,
    data: {
      action: "proposalReview",
      proposalId: proposal.id,
      decision: "APPROVED",
      note: "Retry",
    },
  });
  state = await (await page.request.get("/api/state")).json();
  expect(
    state.chapters.filter(
      (c: { university: string }) => c.university === details.university,
    ),
  ).toHaveLength(1);
  const chapter = state.chapters.find(
    (c: { university: string }) => c.university === details.university,
  );
  expect(chapter.onboarding.length).toBeGreaterThan(0);
  expect(chapter.universityRecognition).toBe("NOT_CONFIRMED");
  await page.goto("/?view=directory");
  await expect(
    page.getByRole("button", { name: /Fictional Coastal SSA/ }),
  ).toBeVisible();
});
