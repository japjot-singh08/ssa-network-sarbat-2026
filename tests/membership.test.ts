import { test } from "node:test";
import assert from "node:assert/strict";
import { seed } from "../lib/seed";
import {
  applyPortal,
  portalVisible,
  portalActionSchema,
  actorFromProfile,
} from "../lib/membership";
import { universityEmail } from "../lib/university-email";
import type { Actor } from "../lib/types";
const student: Actor = {
    id: "student",
    role: "STUDENT",
    chapterId: null,
    email: "student@example.edu",
    verified: true,
  },
  officer: Actor = {
    id: "officer",
    role: "OFFICER",
    chapterId: "uncc",
    email: "officer@example.edu",
    verified: true,
  },
  admin: Actor = {
    id: "admin",
    role: "ADMIN",
    chapterId: null,
    verified: true,
  };
const answers = {
  preferredName: "Test Student",
  academicYear: "First year",
  major: "",
  motivation: "Serve the community",
  interests: "Seva and learning",
  volunteering: "Yes",
  additional: "",
};
const details = {
  university: "Example University",
  location: "Example City, WA",
  state: "WA",
  region: "West",
  proposedName: "Example University SSA",
  reason: "Create a community",
  students: "20",
  leadership: "Yes",
  goals: "Seva and education",
  activities: "Campus service projects",
  support: "Mentorship",
  additional: "",
};
test("join workflow: drafts, duplicate protection, changes, scoped approval, roster and idempotent audit", () => {
  const s = seed();
  applyPortal(s, student, {
    action: "membershipApply",
    chapterId: "uncc",
    answers: { preferredName: "Draft" },
    submit: false,
  });
  assert.equal(s.membershipApplications[0].status, "DRAFT");
  applyPortal(s, student, {
    action: "membershipApply",
    chapterId: "uncc",
    answers,
    submit: true,
  });
  const app = s.membershipApplications[0];
  assert.equal(app.answers.universityEmail, student.email);
  assert.throws(
    () =>
      applyPortal(s, student, {
        action: "membershipApply",
        chapterId: "uncc",
        answers,
        submit: true,
      }),
    /pending/,
  );
  assert.throws(
    () =>
      applyPortal(s, student, {
        action: "membershipReview",
        applicationId: app.id,
        decision: "APPROVED",
        note: "",
      }),
    /officers/,
  );
  assert.throws(
    () =>
      applyPortal(
        s,
        { ...officer, chapterId: "stanford" },
        {
          action: "membershipReview",
          applicationId: app.id,
          decision: "APPROVED",
          note: "",
        },
      ),
    /officers/,
  );
  applyPortal(s, officer, {
    action: "membershipReview",
    applicationId: app.id,
    decision: "CHANGES_REQUESTED",
    note: "Clarify interests",
  });
  applyPortal(s, student, {
    action: "membershipApply",
    chapterId: "uncc",
    answers,
    submit: true,
  });
  applyPortal(s, officer, {
    action: "membershipReview",
    applicationId: app.id,
    decision: "APPROVED",
    note: "Welcome",
  });
  applyPortal(s, officer, {
    action: "membershipReview",
    applicationId: app.id,
    decision: "APPROVED",
    note: "Retry",
  });
  assert.equal(s.memberships.length, 1);
  assert.equal(s.memberships[0].role, "MEMBER");
  assert.equal(
    s.auditLogs.filter((l) => l.action === "MEMBERSHIP_APPROVED").length,
    1,
  );
  assert.equal(portalVisible(s, student).memberships.length, 1);
  assert.equal(
    portalVisible(s, { id: "guest", role: "STUDENT", chapterId: null })
      .membershipApplications.length,
    0,
  );
  assert.equal(
    portalVisible(s, { ...officer, chapterId: "stanford" }).profiles.length,
    0,
  );
});
test("new chapter requires USM human approval and atomically creates officer/portal/checklist once", () => {
  const s = seed();
  applyPortal(s, student, { action: "chapterPropose", details, submit: true });
  const p = s.chapterProposals[0];
  assert.equal(s.chapters.length, 5);
  assert.equal(s.profiles[0].role, "STUDENT");
  assert.throws(
    () =>
      applyPortal(s, officer, {
        action: "proposalReview",
        proposalId: p.id,
        decision: "APPROVED",
        note: "",
      }),
    /administrator/,
  );
  assert.throws(
    () =>
      applyPortal(
        s,
        { ...student, id: "other" },
        { action: "chapterPropose", details, submit: true },
      ),
    /active proposal/,
  );
  applyPortal(s, admin, {
    action: "proposalReview",
    proposalId: p.id,
    decision: "APPROVED",
    note: "Affiliation approved",
  });
  applyPortal(s, admin, {
    action: "proposalReview",
    proposalId: p.id,
    decision: "APPROVED",
    note: "Retry",
  });
  assert.equal(s.chapters.length, 6);
  assert.equal(s.memberships.length, 1);
  assert.equal(s.profiles.find((p) => p.id === student.id)?.role, "OFFICER");
  const c = s.chapters.at(-1)!;
  assert.equal(c.universityRecognition, "NOT_CONFIRMED");
  assert.equal(c.lat, null);
  assert.ok(c.onboarding?.length);
  assert.equal(c.isSample, false);
  assert.equal(
    s.auditLogs.filter((a) => a.action === "CHAPTER_APPROVED").length,
    1,
  );
  const actor = actorFromProfile(s, s.profiles[0], { verified: true });
  assert.equal(actor.role, "OFFICER");
  assert.ok(actor.managedChapterIds?.includes(c.id));
});
test("profile input cannot self-assign privileged roles; verified emails and private resources are enforced", () => {
  assert.equal(
    portalActionSchema.safeParse({
      action: "profile",
      name: "X",
      academicYear: "",
      major: "",
      role: "ADMIN",
    }).success,
    false,
  );
  const s = seed();
  assert.throws(
    () =>
      applyPortal(
        s,
        { ...student, verified: false },
        { action: "membershipApply", chapterId: "uncc", answers, submit: true },
      ),
    /Verify/,
  );
  assert.throws(
    () =>
      applyPortal(s, student, {
        action: "chapterResource",
        chapterId: "uncc",
        title: "Private",
        content: "Private content",
        url: "",
      }),
    /officers/,
  );
  applyPortal(s, officer, {
    action: "chapterResource",
    chapterId: "uncc",
    title: "Handover",
    content: "Private chapter handover",
    url: "",
  });
  assert.equal(portalVisible(s, student).chapterResources.length, 0);
  assert.equal(portalVisible(s, officer).chapterResources.length, 1);
});
test("university domains support .edu and explicitly configured international domains", () => {
  assert.equal(universityEmail("person@university.edu"), true);
  assert.equal(universityEmail("person@university.edu.evil.com"), false);
  assert.equal(universityEmail("person@gmail.com"), false);
  assert.equal(universityEmail("person@ox.ac.uk", "ox.ac.uk,ubc.ca"), true);
  assert.equal(universityEmail("person@evilox.ac.uk", "ox.ac.uk"), false);
});

test("draft chapter proposals stay private until submitted", () => {
  const s = seed();
  applyPortal(s, student, {
    action: "chapterPropose",
    details: { university: "Draft University" },
    submit: false,
  });
  assert.equal(portalVisible(s, admin).chapterProposals.length, 0);
  assert.equal(portalVisible(s, student).chapterProposals.length, 1);
  applyPortal(s, student, {
    action: "chapterPropose",
    proposalId: s.chapterProposals[0].id,
    details: { ...details, university: "Draft University" },
    submit: true,
  });
  assert.equal(portalVisible(s, admin).chapterProposals.length, 1);
});
