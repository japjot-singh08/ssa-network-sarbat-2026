import { test } from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import { transaction, closeStore } from "../lib/store";
import { migrateAccounts } from "../lib/migrate-accounts";
import { seed } from "../lib/seed";
import { applyPortal } from "../lib/membership";
import { apply } from "../lib/domain";
test(
  "PostgreSQL adapter: atomic approval, concurrent duplicate retries, persistence, rollback, constraints and RLS",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.DATABASE_SSL = "disable";
    const sql = postgres(process.env.TEST_DATABASE_URL!, {
      ssl: false,
      max: 1,
    });
    try {
      await migrateAccounts(sql);
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
      const studentId = crypto.randomUUID(),
        officerId = crypto.randomUUID();
      await sql`insert into auth.users(id) values(${studentId}),(${officerId})`;
      const student = {
        id: studentId,
        role: "STUDENT" as const,
        chapterId: null,
        email: "student@example.edu",
        verified: true,
      };
      const chapterOfficer = {
        id: officerId,
        role: "OFFICER" as const,
        chapterId: "uncc",
        verified: true,
      };
      const applicationId = await transaction((s) => {
        s.profiles.push({
          id: officerId,
          role: "OFFICER",
          chapterId: "uncc",
          name: "Test officer",
          email: "officer@example.edu",
        });
        applyPortal(s, student, {
          action: "membershipApply",
          chapterId: "uncc",
          submit: true,
          answers: {
            preferredName: "Test member",
            academicYear: "First year",
            major: "",
            motivation: "Seva",
            interests: "Community",
            volunteering: "Yes",
            additional: "",
          },
        });
        return s.membershipApplications[0].id;
      });
      await Promise.all(
        Array.from({ length: 3 }, () =>
          transaction((s) =>
            applyPortal(s, chapterOfficer, {
              action: "membershipReview",
              applicationId,
              decision: "APPROVED",
              note: "Checked",
            }),
          ),
        ),
      );
      assert.equal(
        (
          await sql`select id from memberships where "userId"=${studentId} and "chapterId"='uncc'`
        ).length,
        1,
      );
      const own = await sql.begin(async (tx) => {
        await tx`set local role authenticated`;
        await tx`select set_config('request.jwt.claim.sub',${studentId},true)`;
        return tx`select id from "membershipApplications"`;
      });
      assert.equal(own.length, 1);
      const other = await sql.begin(async (tx) => {
        await tx`set local role authenticated`;
        await tx`select set_config('request.jwt.claim.sub',${crypto.randomUUID()},true)`;
        return tx`select id from "membershipApplications"`;
      });
      assert.equal(other.length, 0);
      const roster = await sql.begin(async (tx) => {
        await tx`set local role authenticated`;
        await tx`select set_config('request.jwt.claim.sub',${officerId},true)`;
        return tx`select id from profiles where id=${studentId}`;
      });
      assert.equal(roster.length, 1);
      const proposalId = await transaction((s) => {
        applyPortal(s, student, {
          action: "chapterPropose",
          submit: true,
          details: {
            university: "Test University",
            location: "Test City, WA",
            state: "WA",
            region: "West",
            proposedName: "Test SSA",
            reason: "Community",
            students: "20",
            leadership: "Yes",
            goals: "Seva",
            activities: "Learning",
            support: "Mentorship",
            additional: "",
          },
        });
        return s.chapterProposals[0].id;
      });
      await Promise.all(
        Array.from({ length: 3 }, () =>
          transaction((s) =>
            applyPortal(s, admin, {
              action: "proposalReview",
              proposalId,
              decision: "APPROVED",
              note: "Approved",
            }),
          ),
        ),
      );
      const proposal = await transaction((s) =>
        s.chapterProposals.find((p) => p.id === proposalId)!,
      );
      assert.ok(proposal.chapterId);
      assert.equal(
        (
          await sql`select id from memberships where "userId"=${studentId} and "chapterId"=${proposal.chapterId}`
        ).length,
        1,
      );
      assert.equal(
        (await sql`select role from profiles where id=${studentId}`)[0].role,
        "OFFICER",
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
