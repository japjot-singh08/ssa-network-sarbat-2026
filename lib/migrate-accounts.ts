import { readFile } from "node:fs/promises";
import path from "node:path";
import type postgres from "postgres";
export async function migrateAccounts(sql: ReturnType<typeof postgres>) {
  await sql`create table if not exists public.ssa_schema_migrations(id text primary key,"appliedAt" timestamptz not null default now())`;
  await sql`alter table public.ssa_schema_migrations enable row level security`;
  await sql`revoke all on public.ssa_schema_migrations from anon,authenticated`;
  let changed = false;
  for (const id of [
    "002_accounts_memberships",
    "003_proposal_draft_privacy",
    "004_arena_participation",
    "005_unclaimed_directory",
    "006_community_requests",
    "007_post_images",
  ]) {
    const done =
      await sql`select id from public.ssa_schema_migrations where id=${id}`;
    if (done.length) continue;
    await sql.unsafe(
      await readFile(
        path.join(process.cwd(), `supabase/migrations/${id}.sql`),
        "utf8",
      ),
    );
    await sql`insert into public.ssa_schema_migrations(id) values(${id}) on conflict do nothing`;
    changed = true;
  }
  return changed;
}
