import { test } from "node:test";
import assert from "node:assert/strict";
import roster from "../lib/usm-directory.json";
test("public directory includes all 82 distinct source entries with valid published locations", () => {
  assert.equal(roster.length, 82);
  assert.equal(new Set(roster.map((c) => c.id)).size, 82);
  assert.equal(roster.filter((c) => c.university === "CSU Fresno").length, 2);
  for (const c of roster) {
    assert.ok(c.name && c.university);
    assert.ok(
      c.sourceUrl.startsWith("https://www.unitedsikhmovement.org/ssas/"),
    );
    assert.ok(
      c.lat === null || (typeof c.lat === "number" && Math.abs(c.lat) <= 90),
    );
    assert.ok(
      c.lng === null || (typeof c.lng === "number" && Math.abs(c.lng) <= 180),
    );
  }
});

import { importPublicDirectory } from "../lib/public-directory";
import { seed } from "../lib/seed";
test("directory import is idempotent, preserves source duplicates, and protects approved ownership", () => {
  const s = seed();
  importPublicDirectory(s);
  assert.equal(s.chapters.filter((c) => c.isSample === false).length, 82);
  const count = s.chapters.length;
  importPublicDirectory(s);
  assert.equal(s.chapters.length, count);
  const c = s.chapters.find((c) => c.id === "uw")!;
  c.networkStatus = "USM_AFFILIATED";
  c.bio = "Approved officer-authored profile";
  importPublicDirectory(s);
  assert.equal(c.bio, "Approved officer-authored profile");
  assert.equal(s.chapters.length, count);
});

import { applyPortal } from "../lib/membership";
test("hidden fictional records cannot block a real chapter proposal after public import", () => {
  const s = seed();
  importPublicDirectory(s);
  const student = {
    id: "new-officer",
    role: "STUDENT" as const,
    chapterId: null,
    verified: true,
  };
  applyPortal(s, student, {
    action: "chapterPropose",
    submit: true,
    details: {
      university: "UNC Charlotte",
      location: "Charlotte, NC",
      state: "NC",
      region: "Southeast",
      proposedName: "Charlotte SSA",
      reason: "Start our actual chapter",
      students: "20",
      leadership: "Yes",
      goals: "Connect students",
      activities: "Community service",
      support: "USM mentorship",
    },
  });
  const p = s.chapterProposals.find((p) => p.userId === student.id)!;
  applyPortal(
    s,
    { id: "admin", role: "ADMIN", chapterId: null },
    {
      action: "proposalReview",
      proposalId: p.id,
      decision: "APPROVED",
      note: "Human approved",
    },
  );
  assert.equal(
    s.chapters.filter(
      (c) => c.university === "UNC Charlotte" && c.isSample === false,
    ).length,
    1,
  );
});
