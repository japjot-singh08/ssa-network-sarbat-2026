import postgres from "postgres";
import { migrateAccounts } from "../lib/migrate-accounts";
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing.");
  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
    ssl: "require",
    onnotice: () => {},
  });
  try {
    console.log(
      (await migrateAccounts(sql))
        ? "Accounts and membership migration applied; existing Arena/Feed/awards preserved."
        : "Accounts migration already applied.",
    );
  } finally {
    await sql.end();
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Migration failed");
  process.exitCode = 1;
});
