import postgres from "postgres";
import assert from "node:assert/strict";
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
    ssl: "require",
    connect_timeout: 15,
    onnotice: () => {},
  });
  try {
    const publicPosts = await sql.begin(async (tx) => {
      await tx`set local role anon`;
      return tx`select id from posts where status='PUBLISHED'`;
    });
    for (const table of [
      "submissions",
      "grants",
      "profiles",
      "memberships",
      "membershipApplications",
      "chapterProposals",
      "chapterResources",
      "auditLogs",
    ]) {
      let denied = false;
      try {
        await sql.begin(async (tx) => {
          await tx`set local role anon`;
          await tx`select * from ${tx(table)} limit 1`;
        });
      } catch (error) {
        if ((error as { code?: string }).code === "42501") denied = true;
        else throw error;
      }
      assert.ok(denied, `Public access unexpectedly allowed: ${table}`);
    }
    const id = crypto.randomUUID(),
      marker = new Error("Intentional verification rollback");
    try {
      await sql.begin(async (tx) => {
        await tx`insert into interests(id,"userId","challengeId") values(${id},'synthetic-connectivity-check','warmth')`;
        throw marker;
      });
    } catch (error) {
      if (error !== marker) throw error;
    }
    const remaining = await sql`select id from interests where id=${id}`;
    assert.equal(remaining.length, 0);
    const constraints =
      await sql`select conname from pg_constraint where conrelid in ('points'::regclass,'grants'::regclass,'reactions'::regclass,'posts'::regclass) and contype='u'`;
    assert.ok(constraints.length >= 4);
    console.log(
      JSON.stringify({
        hostedDatabaseVerified: true,
        publicPosts: publicPosts.length,
        privateTablesDenied: 8,
        rollbackVerified: true,
        uniqueAwardAndReactionConstraints: constraints.length,
      }),
    );
  } finally {
    await sql.end();
  }
}
main().catch((error) => {
  console.error(
    "Verification failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
