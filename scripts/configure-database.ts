import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { seed } from "../lib/seed";
import { transaction, closeStore } from "../lib/store";
const names = [
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
];
async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL is missing.");
  const sql = postgres(uri, {
    max: 1,
    prepare: false,
    ssl: "require",
    connect_timeout: 15,
    onnotice: () => {},
  });
  try {
    await sql`select 1`;
    console.log("TLS database connection successful.");
    const existing = await sql<
      { tablename: string }[]
    >`select tablename from pg_tables where schemaname='public' and tablename in ${sql(names)}`;
    if (existing.length === 0) {
      await sql.unsafe(
        await readFile(
          new URL("../supabase/schema.sql", import.meta.url),
          "utf8",
        ),
      );
      console.log(
        "Schema, constraints, indexes, grants, and RLS policies applied.",
      );
    } else if (existing.length !== names.length)
      throw new Error(
        "Partial existing schema detected. Refusing to overwrite it.",
      );
    else console.log("Existing application schema found; preserving it.");
    const seeded = await transaction((s) => {
      if (s.chapters.length) return false;
      if (Object.values(s).some((rows) => rows.length))
        throw new Error(
          "Other existing application data found; refusing to replace it.",
        );
      Object.assign(s, seed());
      return true;
    });
    console.log(
      seeded
        ? "Fictional demonstration records seeded."
        : "Existing application records preserved.",
    );
    const security = await sql<
      { tablename: string; rowsecurity: boolean }[]
    >`select tablename,rowsecurity from pg_tables where schemaname='public' and tablename in ${sql(names)}`;
    if (security.some((t) => !t.rowsecurity))
      throw new Error("An application table has RLS disabled.");
    const counts =
      await sql`select (select count(*)::int from chapters) chapters,(select count(*)::int from challenges) challenges,(select count(*)::int from documents) resources`;
    console.log(JSON.stringify({ rlsTables: security.length, ...counts[0] }));
  } finally {
    await sql.end();
    await closeStore();
  }
}
main().catch((error) => {
  console.error(
    "Database setup failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
