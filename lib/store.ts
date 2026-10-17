import { mkdir, readFile, rename, writeFile, rmdir } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { seed } from "./seed";
import type { State } from "./types";
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
  "memberships",
  "membershipApplications",
  "chapterProposals",
  "chapterResources",
  "auditLogs",
  "communityRequests",
] as const;
const jsonFields = new Set([
  "assessment",
  "skills",
  "commitments",
  "experience",
  "answers",
  "details",
  "onboarding",
]);
let client: ReturnType<typeof postgres> | undefined;
function sqlClient() {
  return (client ??= postgres(process.env.DATABASE_URL!, {
    max: 3,
    prepare: false,
    ssl: process.env.DATABASE_SSL === "disable" ? false : "require",
    types: {
      numeric: { to: 1700, from: [1700], serialize: String, parse: Number },
    },
  }));
}
export async function transaction<T>(
  fn: (state: State) => T | Promise<T>,
): Promise<T> {
  if (process.env.DATABASE_URL) {
    const sql = sqlClient();
    const result = await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(78349201)`;
      const state = {} as State;
      for (const table of tables)
        (state[table] as unknown[]) = [
          ...(await tx`select * from ${tx(table)}`),
        ];
      const before = new Map(
        tables.map((table) => [
          table,
          new Map(state[table].map((row) => [row.id, JSON.stringify(row)])),
        ]),
      );
      const output = await fn(state);
      // Apply only changed rows, preserving dependency order and the audit ledger.
      for (const table of [...tables].reverse()) {
        const remaining = new Set(state[table].map((row) => row.id));
        for (const id of before.get(table)!.keys()) {
          if (!remaining.has(id)) {
            if (
              table === "points" ||
              table === "grants" ||
              table === "auditLogs"
            )
              throw new Error("Award ledger entries are immutable.");
            await tx`delete from ${tx(table)} where id = ${id}`;
          }
        }
      }
      for (const table of tables) {
        for (const row of state[table]) {
          const previous = before.get(table)!.get(row.id);
          if (previous === JSON.stringify(row)) continue;
          if (
            previous &&
            (table === "points" || table === "grants" || table === "auditLogs")
          )
            throw new Error("Award ledger entries are immutable.");
          const normalized = Object.fromEntries(
            Object.entries(row).map(([key, value]) => [
              key,
              jsonFields.has(key) && value !== null ? tx.json(value) : value,
            ]),
          );
          if (previous) {
            const { id, ...updates } = normalized;
            await tx`update ${tx(table)} set ${tx(updates)} where id = ${id}`;
          } else {
            await tx`insert into ${tx(table)} ${tx(normalized)}`;
          }
        }
      }
      return { output };
    });
    return (result as { output: T }).output;
  }
  if (process.env.VERCEL)
    throw new Error(
      "Persistent database required: configure DATABASE_URL before using Vercel. Local file storage is not safe on serverless hosting.",
    );
  const dir = process.env.DEMO_DATA_DIR || path.join(process.cwd(), ".data");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const lock = path.join(dir, "transaction.lock");
  let locked = false;
  for (let i = 0; i < 200; i++) {
    try {
      await mkdir(lock);
      locked = true;
      break;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      await new Promise((r) => setTimeout(r, 25));
    }
  }
  if (!locked)
    throw new Error(
      "Data store busy. Retry; if a process crashed, remove .data/transaction.lock while the app is stopped.",
    );
  try {
    let state: State;
    try {
      state = JSON.parse(await readFile(path.join(dir, "state.json"), "utf8"));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      state = seed();
    }
    for (const table of tables)
      if (!state[table]) (state[table] as unknown[]) = [];
    const output = await fn(state);
    const tmp = path.join(
      dir,
      `state-${process.pid}-${crypto.randomUUID()}.tmp`,
    );
    await writeFile(tmp, JSON.stringify(state), { mode: 0o600 });
    await rename(tmp, path.join(dir, "state.json"));
    return output;
  } finally {
    await rmdir(lock);
  }
}
export const readState = () => transaction((s) => structuredClone(s));

export async function closeStore() {
  if (client) {
    await client.end();
    client = undefined;
  }
}
