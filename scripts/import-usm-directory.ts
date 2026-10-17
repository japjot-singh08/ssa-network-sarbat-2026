import { importPublicDirectory } from "../lib/public-directory";
import { mkdir, writeFile } from "node:fs/promises";
import { transaction, closeStore, readState } from "../lib/store";

async function main() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      "DATABASE_URL is required for the hosted directory import.",
    );
  await mkdir("work", { recursive: true });
  await writeFile(
    `work/before-directory-import-${Date.now()}.json`,
    JSON.stringify(await readState()),
    { mode: 0o600 },
  );
  const result = await transaction((s) => {
    return importPublicDirectory(s);
  });
  console.log(
    `Imported/updated ${result} public chapter listings. Accounts, applications, awards, and claimed chapter profiles preserved.`,
  );
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(closeStore);
