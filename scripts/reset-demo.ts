import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { seed } from "../lib/seed";
const tables = [
  "chapters",
  "challenges",
  "participations",
  "submissions",
  "points",
  "grants",
  "posts",
  "reactions",
  "documents",
  "interests",
  "profiles",
] as const;
async function main() {
  if (
    process.env.DEMO_MODE !== "true" ||
    !process.argv.includes("--confirm-demo-reset")
  )
    throw new Error(
      "Reset requires DEMO_MODE=true and --confirm-demo-reset. This resets demonstration data only.",
    );
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing.");
  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
    ssl: "require",
    connect_timeout: 15,
    onnotice: () => {},
  });
  try {
    const backupDir = path.join(process.cwd(), ".data", "backups");
    await mkdir(backupDir, { recursive: true, mode: 0o700 });
    const backupFile = path.join(
      backupDir,
      `pre-reset-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    );
    await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(78349201)`;
      const before: Record<string, unknown[]> = {};
      for (const table of tables)
        before[table] = [...(await tx`select * from ${tx(table)}`)];
      if (before.profiles.length)
        throw new Error(
          "Provisioned real account profiles exist. Refusing an automated demo reset.",
        );
      await writeFile(
        backupFile,
        JSON.stringify({ createdAt: new Date().toISOString(), data: before }),
        { mode: 0o600, flag: "wx" },
      );
      const fresh = seed();
      for (const table of [...tables].reverse())
        await tx`delete from ${tx(table)}`;
      for (const table of tables)
        for (const row of fresh[table]) {
          const values = Object.fromEntries(
            Object.entries(row).map(([key, value]) => [
              key,
              ["skills", "commitments", "experience"].includes(key) &&
              value !== null
                ? tx.json(value)
                : value,
            ]),
          );
          await tx`insert into ${tx(table)} ${tx(values)}`;
        }
    });
    console.log(
      "Original fictional demonstration data restored. Local pre-reset backup saved under .data/backups (excluded from Git).",
    );
    const summary =
      await sql`select (select count(*)::int from submissions) submissions,(select count(*)::int from points) awards,(select coalesce(sum(amount),0)::int from points) points,(select count(*)::int from grants) grants,(select count(*)::int from reactions) shabash`;
    console.log(JSON.stringify(summary[0]));
  } finally {
    await sql.end();
  }
}
main().catch((error) => {
  console.error(
    "Reset failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
