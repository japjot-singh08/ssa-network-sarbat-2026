import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { seed } from "../lib/seed";
import {
  apply,
  score,
  retrieve,
  matching,
  visibleState,
  actionSchema,
} from "../lib/domain";
import { transaction } from "../lib/store";
import { sign, verify } from "../lib/auth";
import type { Actor, State } from "../lib/types";
const officer: Actor = { id: "officer-test", role: "OFFICER", chapterId: "uw" },
  admin: Actor = { id: "reviewer-test", role: "ADMIN", chapterId: null },
  student: Actor = { id: "student-test", role: "STUDENT", chapterId: null };
function pending(s: State) {
  apply(s, officer, { action: "accept", challengeId: "warmth" });
  const p = s.participations.find((p) => p.chapterId === "uw")!;
  apply(s, officer, {
    action: "submit",
    participationId: p.id,
    summary: "Assembled and distributed 40 kits",
    impact: "40 neighbors received supplies",
    evidence:
      "Partner confirmation, item list, and receipts provided in reviewer evidence.",
    participants: 12,
    hours: 24,
  });
  return s.submissions.find((t) => t.participationId === p.id)!;
}
test("complete core journey with human-only approval and idempotent awards", () => {
  const s = seed();
  const initial = s.points.length;
  const submission = pending(s);
  assert.equal(s.points.length, initial);
  assert.throws(
    () =>
      apply(s, officer, {
        action: "review",
        submissionId: submission.id,
        decision: "APPROVED",
        feedback: "Reviewed",
        verifiedHours: 20,
        grantApproved: true,
      }),
    /reviewer/,
  );
  const review = {
    action: "review" as const,
    submissionId: submission.id,
    decision: "APPROVED" as const,
    feedback:
      "Evidence meets all completion criteria and grant receipts verified.",
    verifiedHours: 20,
    grantApproved: true,
  };
  apply(s, admin, review);
  apply(s, admin, review);
  assert.equal(submission.status, "APPROVED");
  assert.equal(
    s.points.filter((p) => p.submissionId === submission.id).length,
    1,
  );
  assert.equal(
    s.grants.filter((p) => p.submissionId === submission.id).length,
    1,
  );
  const post = s.posts.find((p) => p.submissionId === submission.id)!;
  assert.equal(
    s.posts.filter((p) => p.submissionId === submission.id).length,
    1,
  );
  assert.equal(post.status, "PUBLISHED");
  assert.equal(s.points.at(-1)?.amount, score(200, 20, 42));
  apply(s, student, { action: "react", postId: post.id });
  assert.equal(s.reactions.length, 1);
  apply(s, student, { action: "react", postId: post.id });
  assert.equal(s.reactions.length, 0);
});
test("roles, evidence privacy, duplicate acceptance, requested revisions", () => {
  const s = seed();
  assert.throws(
    () => apply(s, student, { action: "accept", challengeId: "warmth" }),
    /officer/,
  );
  const sub = pending(s);
  apply(s, officer, { action: "accept", challengeId: "warmth" });
  assert.equal(s.participations.filter((p) => p.chapterId === "uw").length, 1);
  assert.equal(visibleState(s, student).submissions.length, 0);
  assert.throws(
    () =>
      apply(
        s,
        { ...officer, chapterId: "uncc" },
        {
          action: "submit",
          participationId: sub.participationId,
          summary: "test",
          impact: "test",
          evidence: "test",
          participants: 1,
          hours: 2,
        },
      ),
    /another chapter/,
  );
  apply(s, admin, {
    action: "review",
    submissionId: sub.id,
    decision: "NEEDS_INFO",
    feedback: "Need partner confirmation",
    verifiedHours: 0,
    grantApproved: false,
  });
  apply(s, officer, {
    action: "submit",
    participationId: sub.participationId,
    summary: "Updated summary",
    impact: "Updated impact",
    evidence: "Added confirmation",
    participants: 12,
    hours: 24,
  });
  assert.equal(sub.status, "PENDING");
  assert.equal(
    s.submissions.filter((x) => x.participationId === sub.participationId)
      .length,
    1,
  );
  assert.throws(
    () =>
      apply(s, admin, {
        action: "review",
        submissionId: sub.id,
        decision: "APPROVED",
        feedback: "ok",
        verifiedHours: 100,
        grantApproved: false,
      }),
    /cannot exceed/,
  );
});
test("scoring bounds and participant inflation cannot increase award", () => {
  assert.equal(score(200, 20, 40), 250);
  assert.equal(score(200, 10000, 40), 250);
  assert.equal(score(200, 20, 1), 300);
  assert.equal(score(200, 20, 1000), 200);
});
test("Toolkit retrieval and matching use real available fields", () => {
  const s = seed();
  assert.ok(
    retrieve(s, "How do we organize langar seva?").some(
      (d) => d.id === "langar",
    ),
  );
  assert.equal(retrieve(s, "xyzzy").length, 0);
});
test("matching explicitly marks unknown calendars and geography", () => {
  const s = seed();
  const result = matching(s.challenges[0], s.chapters);
  assert.equal(result[0].chapter.id, "uw");
  assert.ok(result[0].reasons.includes("Calendar and exams unknown"));
  assert.ok(
    matching(s.challenges[2], s.chapters)[0].reasons.some((r) =>
      r.includes("Distance unknown"),
    ),
  );
});
test("input rejects unsafe attachment URLs and signed identities resist tampering", () => {
  assert.equal(
    actionSchema.safeParse({
      action: "submit",
      participationId: "x",
      summary: "s",
      impact: "i",
      evidence: "e",
      attachment: "javascript:alert(1)",
      participants: 1,
      hours: 1,
    }).success,
    false,
  );
  const token = sign(admin);
  assert.deepEqual(verify(token), admin);
  assert.equal(verify(token + "x"), null);
});
test("proposed captions stay pending until human moderation", () => {
  const s = seed();
  apply(s, officer, {
    action: "post",
    title: "Event announcement",
    description: "Join our campus event.",
    category: "Education",
  });
  const p = s.posts.at(-1)!;
  assert.equal(p.status, "PENDING");
  assert.ok(!visibleState(s, student).posts.some((x) => x.id === p.id));
  assert.throws(
    () =>
      apply(s, student, {
        action: "moderate",
        postId: p.id,
        publish: true,
        feedback: "ok",
      }),
    /reviewer/,
  );
  apply(s, admin, {
    action: "moderate",
    postId: p.id,
    publish: true,
    feedback: "Caption reviewed",
  });
  assert.equal(p.status, "PUBLISHED");
});
test("atomic file persistence, concurrency, and rollback", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "ssa-store-test-"));
  process.env.DEMO_DATA_DIR = dir;
  try {
    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        transaction((s) => {
          s.interests.push({
            id: "i" + i,
            userId: "u" + i,
            challengeId: "warmth",
          });
        }),
      ),
    );
    const state = JSON.parse(
      await readFile(path.join(dir, "state.json"), "utf8"),
    );
    assert.equal(state.interests.length, 8);
    await assert.rejects(
      transaction((s) => {
        s.chapters = [];
        throw new Error("rollback");
      }),
    );
    assert.equal(await transaction((s) => s.chapters.length), 5);
  } finally {
    delete process.env.DEMO_DATA_DIR;
    await rm(dir, { recursive: true, force: true });
  }
});
