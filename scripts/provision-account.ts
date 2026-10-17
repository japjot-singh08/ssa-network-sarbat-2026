// Operator-only provisioning. Never expose this script through an application route.
import postgres from "postgres";
import { accountEmailAllowed } from "../lib/university-email";
const args = process.argv.slice(2),
  value = (flag: string) => args[args.indexOf(flag) + 1];
async function main() {
  if (!args.includes("--confirm-role-grant"))
    throw new Error(
      "Explicit USM authorization and --confirm-role-grant are required.",
    );
  const email = value("--email"),
    role = value("--role"),
    chapter = value("--chapter");
  if (
    !email ||
    !accountEmailAllowed(email) ||
    !["ADMIN", "OFFICER"].includes(role)
  )
    throw new Error(
      "Provide --email ACCOUNT_EMAIL --role ADMIN|OFFICER and optionally --chapter CHAPTER_ID.",
    );
  if (role === "OFFICER" && (!args.includes("--chapter") || !chapter))
    throw new Error("Officers require a chapter.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing.");
  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
    ssl: "require",
  });
  try {
    await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(78349201)`;
      const users =
        await tx`select id,email,email_confirmed_at,raw_user_meta_data from auth.users where lower(email)=lower(${email})`;
      if (users.length !== 1 || !users[0].email_confirmed_at)
        throw new Error("A verified account must exist first.");
      const u = users[0],
        now = new Date().toISOString();
      if (
        role === "OFFICER" &&
        !(await tx`select id from chapters where id=${chapter}`).length
      )
        throw new Error("Chapter not found.");
      await tx`insert into profiles(id,role,"chapterId",name,email) values(${u.id},${role},${role === "OFFICER" ? chapter : null},${u.raw_user_meta_data?.name || ""},${u.email}) on conflict(id) do update set role=excluded.role,"chapterId"=excluded."chapterId",email=excluded.email`;
      if (role === "OFFICER")
        await tx`insert into memberships(id,"userId","chapterId",role,status,"createdAt") values(${crypto.randomUUID()},${u.id},${chapter},'OFFICER','ACTIVE',${now}) on conflict("userId","chapterId") do update set role='OFFICER'`;
      await tx`insert into "auditLogs"(id,"actorId",action,"targetId","chapterId","createdAt") values(${crypto.randomUUID()},'authorized-usm-operator',${"ACCOUNT_PROVISIONED_" + role},${u.id},${role === "OFFICER" ? chapter : null},${now})`;
    });
    console.log("Authorized role provisioned and audit record created.");
  } finally {
    await sql.end();
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Provisioning failed.");
  process.exitCode = 1;
});
