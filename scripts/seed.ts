import { transaction, closeStore } from "../lib/store";
import { seed } from "../lib/seed";
async function main() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      "Set DATABASE_URL and run schema.sql first. This command seeds only an empty Supabase database.",
    );
  await transaction((s) => {
    if (s.chapters.length)
      throw new Error("Database is not empty; refusing to replace data.");
    Object.assign(s, seed());
  });
  console.log("Fictional demonstration seed imported.");
}
main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Seeding failed.");
    process.exitCode = 1;
  })
  .finally(closeStore);
