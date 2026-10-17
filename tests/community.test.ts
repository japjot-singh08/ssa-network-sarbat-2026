import { test } from "node:test";
import assert from "node:assert/strict";
import { screenCommunity, communityInput } from "../lib/community";
import { seed } from "../lib/seed";
import { apply, visibleState } from "../lib/domain";
import { verifiedImpact } from "../lib/impact";
test("community AI flags gaps without approving, public validation blocks honeypots", async () => {
  const result = await screenCommunity(
    "Need volunteers, date unknown",
    async (system) => {
      assert.match(system, /cannot verify legitimacy/);
      return JSON.stringify({
        activity: "Volunteer support",
        organization: null,
        location: null,
        deadline: null,
        volunteers: null,
        skills: null,
        category: null,
        description: "Help requested",
        completion: "Proposed: confirm scope",
        instructions: "Proposed: partner confirmation",
        missingInformation: ["Organization", "Date"],
        concerns: ["Organizer not verified"],
        verificationSteps: ["Contact organizer independently"],
      });
    },
  );
  assert.equal(result.deadline, null);
  assert.ok(result.concerns.length);
  assert.throws(() =>
    communityInput.parse({
      organization: "Test group",
      location: "Seattle",
      contactEmail: "test@example.org",
      message: "A sufficiently detailed request for volunteers.",
      website: "spam",
    }),
  );
});
test("human publication is private until reviewed and duplicate publication creates one opportunity", () => {
  const s = seed(),
    admin = { id: "reviewer", role: "ADMIN" as const, chapterId: null },
    student = { id: "student", role: "STUDENT" as const, chapterId: null };
  s.communityRequests.push({
    id: "intake",
    details: { contactEmail: "private@example.org", message: "Private draft" },
    assessment: null,
    status: "PENDING",
    reviewNote: "",
    challengeId: null,
    createdAt: new Date().toISOString(),
  });
  assert.equal(visibleState(s, student).communityRequests.length, 0);
  const publish = {
    action: "publish" as const,
    communityRequestId: "intake",
    title: "Help pack supplies",
    description: "A human-confirmed community need.",
    organization: "Example partner",
    type: "Community Request" as const,
    category: "Community Seva" as const,
    location: "Seattle",
    region: "West" as const,
    deadline: "2026-11-30",
    sample: false,
    volunteers: 10,
    points: 100,
    grant: 0,
    eligibility: "Open to local chapters",
    grantEligibility: "No grant",
    completion: "Pack 50 confirmed kits",
    instructions: "Partner confirmation of completed work",
  };
  assert.throws(() => apply(s, student, publish));
  const count = s.challenges.length;
  apply(s, admin, publish);
  apply(s, admin, publish);
  assert.equal(s.challenges.length, count + 1);
  assert.equal(s.communityRequests[0].status, "PUBLISHED");
  assert.equal(s.points.length, seed().points.length);
  assert.deepEqual(verifiedImpact(s), { projects: 0, hours: 0, chapters: 0 });
});
