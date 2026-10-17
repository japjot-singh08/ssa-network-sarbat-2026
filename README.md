# SSA Network

A working hackathon MVP for Sarbat Build Day 2026, built for United Sikh Movement (USM). Connect Sikh students through community service, national challenges, verified recognition, shared resources, and Claude-powered planning support.

**Demonstration records are fictional.** University chapter names identify sample records, not official participation. Initial Toolkit resources are fictional examples, not USM documents. Grants are tracking records only; the app does not process payments. Scoring is a provisional demo configuration, not adopted USM policy.

## Accounts and membership phase

The application now includes native student signup, verified email accounts, private chapter portals, membership applications, and USM review of new chapter proposals. See [DEPLOYMENT.md](DEPLOYMENT.md) for the real-account Vercel pilot and [AUTHENTICATION.md](AUTHENTICATION.md) for the current setup, testing boundaries, email-delivery requirements, and authorized account provisioning. The original demo remains available at Git tag `demo-baseline-2026-10-16`.

## Run the demo

Requires Node.js 22.13+ (tested on Node 24) and npm.

```sh
npm ci
npm run setup:demo
npm run dev
```

Open http://localhost:3000. Choose **Enter demo** or **Switch identity** to use a student or fictional chapter officer. Reviewer actions require a private passcode generated in `.env.local`. View it locally with:

```sh
npm run demo:credentials
```

Choose USM reviewer and enter that passcode. Do not share it publicly or include it in your recording. The local cookie is signed, HTTP-only, and expires after eight hours. A demonstration officer can only submit on behalf of the selected fictional chapter. Changing roles in the same browser retains a single reaction identity. Browser-based demo identities are not suitable for real student authentication.

Local data persists in `.data/state.json`, including approvals and awards. Atomic file replacement and a filesystem transaction lock prevent concurrent updates from losing data. Restarting the app preserves work. To start over, stop the server and move `.data` to a backup location; the next start seeds a new demonstration. If a process crashes while writing, stop all app processes and remove only the stale `.data/transaction.lock` directory. Never reset a hosted database to restart a demo.

For a production-mode local preview:

```sh
npm run build
npm run start
```

Build and dev use webpack for compatibility with environments that restrict Turbopack worker sockets. No external fonts or image services are required.

## Restore the original demonstration records

For a configured **demonstration** database, stop other testing and run:

```sh
npm run reset:demo -- --confirm-demo-reset
```

This requires `DEMO_MODE=true`, saves a private local snapshot under `.data/backups`, and replaces application records atomically with the original fictional seed. It refuses to run if provisioned real-account profiles exist. It never deletes Supabase Auth accounts. The restored seed includes one Stanford achievement with 223 points; test submissions, other awards, grants, and reactions are removed. This is an intentional reset, not a production administration tool. Backups and credentials are excluded from Git and the source ZIP.

## What works

- **Arena:** search, category/type/region/reward/deadline/status filters, full requirements, interest saving, officer acceptance, My Challenges, and evidence submission.
- **Evidence:** summary, impact, supporting text, optional external document/image link, participant count, and total volunteer-hours. Evidence is visible only to the chapter and reviewers. Rejected or clarification-requested submissions can be revised. Binary file uploads are not implemented; linked evidence must be accessible to the reviewer.
- **USM review desk:** human approval, rejection, and information requests; feedback; verified effort and score preview; explicit grant-eligibility confirmation.
- **Recognition:** one point-ledger transaction per approved submission, national semester rankings, chapter profiles, and grant tracking summaries. Participant counts do not multiply points.
- **Feed:** transactional verified achievement posts, officer-proposed posts, AI caption screening when configured, human moderation, and one toggleable Shabash per signed-in identity and post. No public comments.
- **Toolkit:** browse, category filters, full-text term search, resource reader, original source links, and administrator imports of approved public document text. Drive links alone do not ingest documents.
- **Sahayak:** server-only official Anthropic SDK, lightweight keyword retrieval over approved Toolkit text, actionable advisory answers, source-ID validation, and links to only retrieved sources. Shows an honest setup state without an API key.
- **Community requests:** reviewer-only Claude extraction from English, Punjabi, and Pinglish into editable fields; missing details require clarification; publication requires explicit human confirmation.
- **Matching:** deterministic distance, region, skills, experience, availability, and calendar factors. Unknown calendars, exams, and coordinates stay explicitly unknown.
- **Accounts:** signed demonstration sessions; Supabase Auth signup/sign-in/sign-out/reset and verified university accounts when demo mode is disabled; protected membership-based officer and operator-provisioned administrator roles.

## Configure Claude

Add these server-only settings to `.env.local` or your hosting environment:

```dotenv
ANTHROPIC_API_KEY=your-private-key
ANTHROPIC_MODEL=claude-sonnet-4-5
```

Use a model available to your Anthropic account; change the model setting if needed. Restart after changing server settings. The app makes no AI calls without a key and never sends a key to the client. Live calls incur your Anthropic account's API usage charges. The prompt includes only the question and relevant approved resource text. Request extraction sends the pasted message. Caption screening sends the proposed public caption. Do not paste confidential information.

Sahayak validates structured answers and source IDs; invented source IDs cause an error rather than a fabricated citation. Fictional resources stay labeled. AI is advisory and cannot publish content, award points, commit funds, or approve submissions. Caption flags remain subject to human review, and failed screening holds content for review.

Official integration references: [Anthropic TypeScript SDK](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Next.js request handlers](https://nextjs.org/docs/app/api-reference/functions/next-request).

## Supabase and Vercel deployment

No account, paid plan, or hosted infrastructure is created by this repository. Use a **dedicated demonstration Supabase project** first. Local file persistence is deliberately disabled on Vercel to prevent ephemeral or lost records.

1. Create/select a Supabase project you control. After saving its private pooler URI as `DATABASE_URL` in `.env.local`, you can run `npm run db:setup` to apply the schema and seed an empty database, then `npm run db:verify` to check access controls and rollback. These commands preserve existing application records and refuse a partial schema. Alternatively, run `supabase/schema.sql` once in its SQL editor. The migration creates normalized tables, foreign keys, indexes, unique award/reaction constraints, and RLS policies. It is a fresh-install migration, not a repeatable upgrade script.
2. Copy the private PostgreSQL transaction-pooler connection URL to `DATABASE_URL` in `.env.local`. URL-encode special password characters. This URL is a server secret. Use the Supabase pooler host and port supplied by your dashboard; prepared statements are disabled in the adapter.
3. Seed only an empty demonstration database:

   ```sh
   npm run seed:supabase
   ```

   This command refuses to replace an existing chapter dataset. Do not seed actual USM operations with fictional data.

4. Push the source to a private or public Git repository after verifying `.env.local` and `.data` are ignored. Import the repository into Vercel, choose Next.js, use Node 24 (or 22.13+), and use the standard build command `npm run build`.
5. Configure Vercel environment variables: `DATABASE_URL`, `SESSION_SECRET` (at least 32 random characters), `DEMO_MODE=true`, and a long private `DEMO_REVIEWER_PASSCODE`. Optionally configure `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`. Keep the reviewer passcode private. Anonymous public visitors can browse and select fictional student/officer identities, but cannot become reviewers without the passcode.
6. Deploy and repeat the complete demo journey on the deployed URL. Confirm refresh persistence, duplicate approval protection, and AI citations with your actual account. Those external integrations cannot be certified without credentials.

### Real accounts and chapter membership

Set `DEMO_MODE=false` and configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` server-side. Run `npm run db:migrate:accounts` before starting the extended app. See [AUTHENTICATION.md](AUTHENTICATION.md) for signup, email confirmation, password resets, refresh sessions, role provisioning, chapter membership, private rosters, and new-chapter approval. Email confirmation stays required. The early pilot uses `SIGNUP_EMAIL_POLICY=any` to allow verified personal email accounts. Custom Resend SMTP is configured; recipient delivery must still be tested. Set `SIGNUP_EMAIL_POLICY=university` to restore university restrictions.

## Architecture and integrity

`app/network.tsx` composes the responsive interface. `lib/domain.ts` owns validated actions, role checks, scoring, retrieval, matching, and approval behavior. `lib/store.ts` provides persistence; `lib/auth.ts` provides sessions and same-origin checks. `app/api/` routes are the only client mutation boundary. `supabase/schema.sql` is the PostgreSQL schema.

A submission approval changes status, records the reviewer/verified effort, inserts the point ledger award, optionally records an eligible grant, and creates a factual verified feed post **inside one transaction**. Repeated approvals return success without creating another award or post. Database unique constraints add a second layer of protection. File mode holds a cross-process lock and commits with an atomic rename; PostgreSQL mode holds an advisory transaction lock and commits using `postgres.begin()`.

For this small MVP, the PostgreSQL adapter reads the domain tables under a transaction lock and writes only inserted, changed, or removed rows in foreign-key order. Point and grant ledger entries are immutable in this adapter. This favors a single, testable domain implementation and is **not intended for large datasets or parallel external writers**. All domain writes must go through this app. Move to focused SQL commands/RPCs and database-enforced append-only ledger permissions before national production scale. Supabase Auth's own `auth.users` data is never rewritten.

Retrieval uses deterministic weighted keyword overlap (title weight 4, content weight 1), with at most three resources. No vector database is required. The PostgreSQL schema includes a full-text GIN index for future query-based retrieval; the current adapter shares the same small in-memory ranking used locally. Matching is advisory; it does not make commitments on behalf of chapters.

### Demo scoring formula

```text
score = round(base_points × effort_factor × size_factor)
effort_factor = 1 + 0.25 × min(verified_total_volunteer_hours / 20, 1)
size_factor = clamp(sqrt(40 / chapter_size), 0.8, 1.2)
```

Configuration lives in `SCORING` in `lib/domain.ts`. Effort bonuses cap at 20 total volunteer-hours. Participation count is descriptive and does not affect points. Reviewers cannot verify more hours than reported. Reviewers inspect the computed score and verify grant eligibility separately. This is a configurable demo proposal requiring USM approval before actual awards.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium  # once, if Chromium is not installed
npm run test:browser
```

Browser tests start an isolated production-mode server on port 3100 and use a temporary dataset plus synthetic test credentials. They require an existing production build. Unit tests also validate retrieval/citation grounding and the official Anthropic SDK with mocked transport (no live service). PostgreSQL integration tests were run against an isolated local PostgreSQL 18 cluster, including the migration, adapter, concurrent approvals, rollback, unique constraints, and public read/write restrictions. To repeat those tests, provide `TEST_DATABASE_URL` for an empty isolated database with `supabase/schema.sql` applied and Supabase-compatible `auth.users`, `auth.uid()`, `anon`, and `authenticated` test objects. Set `DATABASE_SSL=disable` only for a trusted local test database; hosted connections require TLS by default.

Unit tests cover human-only approval, idempotent awards, private evidence, revisions, role restrictions, score bounds, Toolkit retrieval, matching unknowns, safe URLs, signed sessions, caption moderation, file concurrency, and rollback. Browser tests cover the student/officer/reviewer journey, duplicate approval retries, resulting rankings, persistent Shabash, Toolkit search, missing-key behavior, cross-origin protection, and mobile overflow.

**Requires external validation:** live Supabase connectivity and RLS behavior, real-account sign-in, live Claude quality/latency/billing, Punjabi/Pinglish extraction quality, and deployed Vercel workflows. The hosted Supabase connection, schema, seeded data, public/private access restrictions, and rollback have now been verified against the configured demo project. Supabase Auth, live Claude calls, and Vercel deployment remain unverified. No audio transcription, binary upload, real payment processing, or video generation is included.

## Five-minute demonstration

See `DEMO.md` for a timed recording script and preflight. The team records and edits the video. The submission bundle includes a one-page PDF and a source ZIP with this README and the MIT license. No credentials, private documents, local evidence data, or generated dependency folders should enter the ZIP.

## License

MIT. See `LICENSE`.

### Public USM directory and executive-board claims

`lib/usm-directory.json` contains the 82 public chapter names, institutions, campus locations and coordinates published at https://www.unitedsikhmovement.org/ssas (retrieved October 16, 2026). It contains no student roster, private email, or board member information. Source URLs are retained for attribution. Ownership status on this app is independent of USM's existing website.

To import into the configured Supabase project, run:

```sh
node --env-file=.env.local --import tsx scripts/import-usm-directory.ts
```

The importer first saves a private backup under ignored `work/`, preserves accounts and approved officer-owned chapters, and labels imported listings `UNCLAIMED`. Re-running it updates unclaimed source listings without granting account access. Local demo seed data remains fictional; the hosted directory import is deliberate.

A verified signed-in user opens a chapter profile and submits their executive-board position, verification evidence and attestation. Claims appear under **My account → My applications**. USM admins review them under **My account → USM administration**, verify evidence through a trusted chapter contact, and approve, decline, or request changes. Evidence stays private to the applicant and administrators. Approval updates the existing chapter and grants only chapter-scoped officer membership in one transaction. Pending and duplicate claims do not grant access. Membership applications open after ownership approval. A successful claim here does not modify USM's other website or confirm university recognition.

Imported membership counts are stored as `0` meaning **unknown**, not a reported count. Migration `005_unclaimed_directory` supports this. Officers can set the current count under My SSA → Chapter Profile. Arena approval cannot award size-normalized points while the count is unknown.

### Community requests, Arena impact and AI assistance

Anyone can use Arena → **Request community help** without creating an account. The request and contact email are stored in the private USM inbox; nothing is automatically published. USM reviewers use **Community requests** in the review desk to screen with Claude, inspect missing information and verification steps, and load an editable publishing form. AI cannot establish organizer legitimacy: USM must verify through an independent trusted contact. Reviewers can decline or publish, and publication is idempotent. Administrators can also use **Add an Arena opportunity** directly from Arena.

Migration `006_community_requests` creates the inbox with RLS enabled and no direct anonymous/authenticated grants. Public submissions have server validation, a honeypot and rate limiting; AI screening is restricted to authenticated administrators. Contact emails are excluded from the Claude screening payload and public Arena cards.

Arena impact counters include only approved submissions on non-sample opportunities and use human-verified hours. Sahayak retrieves relevant open Arena requirements alongside Toolkit documents and validates source IDs. Claude uses a forced formatting tool for structured responses; that tool performs no external action. Answers render Markdown headings, lists and tables safely with raw HTML disabled. Missing AI configuration remains an explicit setup state. Set `ANTHROPIC_API_KEY` only on the server.

### Pictures and sample feed stories

Chapter officers can attach one picture when proposing a National Feed post. Community members can attach one to a help request. The browser resizes to a maximum 1600px edge and re-encodes as JPEG, stripping original metadata. Server uploads accept JPEGs up to 1.5 MB, validate file signatures, and use rate limiting. Preview/removal work before submission. Request images carry through the human publishing form; verified achievement posts inherit the challenge picture. Feed images remain subject to human moderation.

Migration `007_post_images` stores uploaded image bytes in the existing Supabase PostgreSQL database with RLS enabled and no direct public table grants, avoiding additional service credentials. Local demo uploads persist under the ignored demo data directory. Images use random, capability-protected links: anyone holding a full image link can view it. Public cards expose links only when published. Do not upload private or nonconsensual photos. Unused upload cleanup and a full media-management console are outside this MVP.

Three fictional demonstration feed posts use original SVG illustrations in `public/demo`, explicitly labeled as samples. They do not assert actual chapter events or grant points. Seed them idempotently with `node --env-file=.env.local --import tsx scripts/seed-feed-samples.ts` (omit `--env-file` for a local demo without that file).

Students without an SSA can use Arena’s **Join individually** action and record a private, self-reported completion under My Challenges. This does not reserve chapter capacity, award points or grants, or contribute to verified impact. Participants must confirm organizer availability and eligibility. All verified signed-in students may propose feed stories with pictures; a human reviewer must publish them. Example leaderboard standings and AI-illustrated fictional feed recaps are explicitly labeled and never write awards to the ledger. Migration 008 adds individual participation and student authorship.
