import { test } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { transaction, closeStore } from "../lib/store";
import { seed } from "../lib/seed";
import { apply } from "../lib/domain";
test(
  "PostgreSQL adapter: atomic approval, concurrent duplicate retries, persistence, rollback, constraints and RLS",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.DATABASE_SSL = "disable";
    const sql = postgres(process.env.TEST_DATABASE_URL!, { ssl: false });
    try {
      await transaction((s) => {
        if (s.chapters.length)
          throw new Error("Use an empty isolated test database.");
        Object.assign(s, seed());
      });
      const officer = {
          id: "officer",
          role: "OFFICER" as const,
          chapterId: "uw",
        },
        admin = { id: "admin", role: "ADMIN" as const, chapterId: null };
      const id = await transaction((s) => {
        apply(s, officer, { action: "accept", challengeId: "warmth" });
        const p = s.participations.find((p) => p.chapterId === "uw")!;
        apply(s, officer, {
          action: "submit",
          participationId: p.id,
          summary: "40 kits assembled",
          impact: "40 people helped",
          evidence: "Test partner confirmation and receipts",
          participants: 12,
          hours: 24,
        });
        return s.submissions.find((t) => t.participationId === p.id)!.id;
      });
      await Promise.all(
        Array.from({ length: 4 }, () =>
          transaction((s) =>
            apply(s, admin, {
              action: "review",
              submissionId: id,
              decision: "APPROVED",
              feedback: "Human checked evidence",
              verifiedHours: 20,
              grantApproved: true,
            }),
          ),
        ),
      );
      const state = await transaction((s) => structuredClone(s));
      assert.equal(state.points.filter((p) => p.submissionId === id).length, 1);
      assert.equal(state.grants.filter((p) => p.submissionId === id).length, 1);
      assert.equal(state.posts.filter((p) => p.submissionId === id).length, 1);
      assert.equal(typeof state.grants[0].amount, "number");
      await assert.rejects(
        transaction((s) => {
          s.chapters = [];
          throw new Error("deliberate rollback");
        }),
      );
      assert.equal(await transaction((s) => s.chapters.length), 5);
      await assert.rejects(
        sql`insert into points select 'duplicate',"chapterId","submissionId",amount,semester,"createdAt" from points where "submissionId"=${id}`,
        /duplicate key/,
      );
      const outsider = await sql.reserve();
      try {
        await outsider`set role anon`;
        const pub = await outsider`select * from posts`;
        assert.ok(pub.length > 0);
        await assert.rejects(
          outsider`select * from submissions`,
          /permission denied/,
        );
        await assert.rejects(
          outsider`update points set amount=9999`,
          /permission denied/,
        );
        await assert.rejects(
          outsider`select * from grants`,
          /permission denied/,
        );
      } finally {
        await outsider`reset role`;
        outsider.release();
      }
    } finally {
      await sql.end();
      await closeStore();
      delete process.env.DATABASE_URL;
      delete process.env.DATABASE_SSL;
    }
  },
);
