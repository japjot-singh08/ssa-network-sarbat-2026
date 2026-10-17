# SSA Network

A working Sarbat Build Day 2026 MVP for United Sikh Movement (USM): connect Sikh students through community seva, shared opportunities, verified chapter recognition, resources, and Claude-powered planning.

## Start here: run locally without service accounts

Requires **Node.js 24.x** and npm. Extract the source ZIP, open a terminal **inside the extracted folder containing `package.json`**, then run:

```sh
npm ci
npm run setup:demo
npm run dev
```

Open **http://localhost:3000**. Choose **Enter demo**, select a student or chapter officer, and enter the demonstration. Use **My account** for private chapter/application tools. Public navigation contains Arena, Leaderboard, National Feed, Toolkit and Sahayak.

To test human review, retrieve your generated local reviewer passcode:

```sh
npm run demo:credentials
```

Switch the demo identity to USM reviewer and enter that passcode. Demo identities are for fictional local testing; they are not real authentication. `setup:demo` creates a private `.env.local` only if it does not already exist. For a clean download, do not copy the hosted project's secrets. Never publish the generated passcode.

**No Supabase or Claude account is needed for the local workflow.** AI features show a configuration message until you supply your own Anthropic key. Local data and uploads persist under ignored `.data/`; restarting preserves work. To restart the fictional local dataset, stop the server and move `.data` to a private backup location. Never use this procedure on a hosted database. If a process crashes while writing, stop every app instance before removing only a stale `.data/transaction.lock` directory.

For a local production preview, stop the dev server, then run:

```sh
npm run build
npm run start
```

The UI is identical to the deployed pilot, but fresh local data is fictional. The hosted pilot's real accounts, imported guides, chapter claims, and private evidence are intentionally absent from the download.

## What you can test

1. As a chapter officer, open Arena, accept an open opportunity, then use **My Challenges → Submit evidence**. Provide summary, impact, evidence, participant count and total volunteer-hours. Upload a PDF or image if useful.
2. Switch to USM reviewer, open **My account → USM review desk**, inspect the evidence, and approve, reject or request clarification. Approval awards chapter points once and creates a verified feed post; retrying cannot duplicate awards.
3. Open Leaderboard and National Feed. Another signed-in student can give Shabash. Proposed student stories stay pending until human publication.
4. As a student without a chapter, choose **Join individually** on an Arena opportunity. Record personal completion under My Challenges. These self-reported records do not award chapter points/grants or change verified impact.
5. Browse/search Toolkit. With Claude configured, ask Sahayak for a project plan and open its cited resources.

For new hosted accounts, chapter claims and membership applications require the appropriate human approval. Admin roles are never self-assigned during signup.

## Features

- **Arena:** searchable regional marketplace, shared/limited/one-chapter opportunities, eligibility, completion criteria, acceptance and evidence. Individual participation is available without an SSA.
- **Community requests:** anyone may submit a private help request. Authorized reviewers can ask Claude to structure English, Punjabi or Pinglish text, flag unknowns, and load an editable publishing form. AI cannot verify organizer legitimacy; a human confirms and publishes.
- **Review and recognition:** role-protected human decisions; atomic points, eligible grant records and verified feed publication. Grants are tracking records, not payments. Chapter size must be known before size-normalized points are awarded.
- **Feed:** student/officer stories, optional pictures, human moderation, verified achievement posts and toggleable Shabash. No public comments.
- **Directory:** searchable chapters, interactive map, executive-board claims, membership requests and private chapter portals.
- **Toolkit:** search, categories, resource reader and administrator import of approved document text. A Google Drive link alone does not ingest a document.
- **Sahayak:** Claude answers grounded in retrieved Toolkit text and open Arena requirements, validated source IDs, readable Markdown and source links. AI does not approve work, award points or commit funds.
- **Evidence files:** chapter claims, chapter completion and individual completion accept PDFs up to 3 MB or JPEG/PNG/WebP pictures. Images are resized to a maximum 1600px edge and converted to JPEG; server JPEG limit is 1.5 MB. Written explanations remain required. PDFs download as attachments. Files use unguessable capability links: anyone holding the full link can retrieve the file. Keep evidence links within the review workflow and do not upload sensitive personal records.

## Optional: enable Claude

Add your own server-only settings to `.env.local`, then restart:

```dotenv
ANTHROPIC_API_KEY=your-private-key
ANTHROPIC_MODEL=claude-sonnet-4-6
```

Use a model available to your Anthropic account. API calls incur that account's usage charges. Without a key, the rest of the app still works. Sahayak sends the question and relevant excerpts; request processing sends request text; caption screening sends proposed public captions. Do not submit confidential information. Keys never belong in client-prefixed environment variables, Git, recordings or the source ZIP.

## Optional: deploy with Supabase and real accounts

Local file persistence is deliberately disabled on Vercel. A hosted deployment requires PostgreSQL. Use a dedicated Supabase project and your own accounts/secrets; downloading the source does not provide access to the team's hosted services.

1. Copy `.env.example` to `.env.local` if no local file exists. Set `DATABASE_URL` to your Supabase PostgreSQL pooler URI. Percent-encode special characters in its password. Set a random `SESSION_SECRET` of at least 32 characters.
2. For a **fresh demonstration database**, run:

   ```sh
   npm run db:setup
   npm run db:verify
   ```

   `db:setup` applies the base schema, all tracked migrations, and fictional seed data to an empty database. It preserves existing records and refuses partial base schemas. Do not also reseed a populated database. For an existing compatible installation, run `npm run db:migrate:accounts` before deploying this version. Migrations 002–008 include memberships, directory claims, community intake, media storage and individual participation.
3. For real authentication set `DEMO_MODE=false`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY`. Choose `SIGNUP_EMAIL_POLICY=any` for verified personal-email pilot accounts, or `university` for .edu and configured `UNIVERSITY_EMAIL_DOMAINS`. Personal email does not prove university affiliation. Email confirmation remains required.
4. Configure your own SMTP provider in Supabase Auth for public signup/recovery emails. Configure Supabase Site URL to your app's exact origin, and allow `/auth/callback` and `/auth/callback?next=password` URLs for the hosted origin and any intended localhost development origin. Some institutional inboxes may reject pilot emails; test delivery and recovery with an address you control.
5. Create and verify your initial administrator account through the app, then explicitly provision that authorized account from your private terminal:

   ```sh
   npm run account:grant -- --email YOUR_VERIFIED_EMAIL --role ADMIN --confirm-role-grant
   ```

   This requires the configured private database connection and does not create a password. Grant administrator access only to an authorized operator. Chapter officers normally obtain scoped access through approved chapter claims/proposals.
6. Import the public directory if desired:

   ```sh
   node --env-file=.env.local --import tsx scripts/import-usm-directory.ts
   ```

   This imports 82 public listings from the source snapshot with attribution and unclaimed ownership. It saves a private backup and protects approved officer-owned chapters. It does not import private student rosters. The source is USM's public directory: https://www.unitedsikhmovement.org/ssas . Local seed chapters are fictional.
7. Import the repository into Vercel: Next.js, repository root, Node 24.x, install `npm ci`, build `npm run build`. Add the same server environment variables to Vercel; `.env.local` is not uploaded. Optionally add your Anthropic key/model. Keep `DEMO_MODE=false` for real accounts. The existing team pilot uses branch `deploy-pilot`; a new installation can use `main`.
8. Verify hosted signup/email/callback, login/logout/recovery, chapter claims, evidence downloads, human approvals, refresh persistence, duplicate-award protection, feed and AI citations. See [AUTHENTICATION.md](AUTHENTICATION.md) and [DEPLOYMENT.md](DEPLOYMENT.md) for additional details.

Optional fictional feed stories can be seeded with `node --env-file=.env.local --import tsx scripts/seed-feed-samples.ts`. This adds or refreshes only the three known sample records. It does not award points. Add your approved real guides through the reviewer Toolkit import workflow; the source ZIP does not include the team's private database exports.

## Demo data and limitations

Fictional challenges, sample standings and stories are labeled. Sample feed pictures were AI-generated and do not document actual chapter events. Public directory entries are attributed listings, not verified ownership or claims of current participation. Toolkit content identifies whether it is a fictional example or an approved imported resource. Scoring is a provisional configuration requiring USM approval, not adopted policy. No payments or automatic approvals occur.

The deployed pilot has been exercised with real Supabase accounts, PostgreSQL persistence, Vercel and Claude. This does not guarantee every recipient's email delivery or every language/model response. No audio transcription, public comments, malware scanning service or full upload-management console is included. Unused uploads require operator cleanup. Per-process rate limits are best-effort on serverless infrastructure. A supported pilot is the intended scale.

## Architecture and integrity

Next.js + TypeScript + Tailwind CSS; Supabase PostgreSQL/Auth; Anthropic SDK; Vercel-compatible hosting. `app/network.tsx` and `app/portals.tsx` implement the interface. `lib/domain.ts` validates Arena actions; `lib/membership.ts` implements account/chapter permissions. API routes authorize mutations server-side. `lib/store.ts` supports atomic local JSON persistence or PostgreSQL transactions. Base SQL is in `supabase/schema.sql`; incremental migrations are in `supabase/migrations/`.

Human approval, the unique point award, eligible grant record and verified feed post commit together. Duplicate approvals are idempotent. PostgreSQL foreign keys, unique constraints and RLS provide additional controls; sensitive tables have no direct anonymous/authenticated writes. The app's PostgreSQL adapter uses a transaction advisory lock and loads small domain tables, writing only changed rows. It is not designed for national-scale datasets or concurrent external writers. Points/grants/audit entries are immutable through the adapter. Supabase Auth's `auth.users` is not rewritten.

Retrieval is weighted keyword matching over at most three Toolkit resources plus relevant open Arena challenges. Chapter matching uses recorded location, skills, experience and availability; unknown calendars/exams remain unknown. No vector database is required.

Provisional scoring: `round(base × effort × sizeFactor)`, where effort is `1 + 0.25 × min(verified volunteer-hours / 20, 1)` and sizeFactor is `clamp(sqrt(40 / chapter size), 0.8, 1.2)`. Participant counts do not multiply points. Reviewers cannot verify more hours than reported.

## Run the checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Browser tests require the build and Chromium. They launch isolated servers on **3100 and 3101**, with temporary fictional data and synthetic credentials; keep those ports free. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` if using an existing compatible Chromium installation. Tests do not require real service credentials or make paid AI calls.

Unit tests cover permissions, evidence privacy, atomic/idempotent awards, claims, matching, retrieval and mocked AI. Browser checks cover the full student/officer/reviewer journey, PDF/image upload and retrieval, individual participation, map/claims, moderation, Markdown, mobile layout and same-origin protection. The optional PostgreSQL test skips unless `TEST_DATABASE_URL` points to an empty isolated test database with the base schema and Supabase-compatible auth objects. Never point that test at the pilot database. See `tests/postgres.test.ts` for prerequisites; use `DATABASE_SSL=disable` only for trusted local PostgreSQL.

## Package and hand over

`main` contains the current submission source. `deploy-pilot` is the production deployment branch; `feature/accounts-memberships` tracks development. The original checkpoint is preserved at tag `demo-baseline-2026-10-16`.

Download GitHub **Code → Download ZIP** while `main` is selected, or use the cleaned submission archive. To regenerate that archive locally:

```sh
python3 scripts/package_source.py
```

It creates `outputs/SSA-Network-Source.zip` containing source, setup instructions, placeholder `.env.example`, tests and MIT license. It excludes credentials, `.data`, backups, dependencies, build output and private database exports, and checks configured secrets are absent. Rename the archive to your team's required submission filename. Do not add test-account passwords to the source archive. The team records its own video; no video is generated by the app.

## License

MIT. See [LICENSE](LICENSE).
