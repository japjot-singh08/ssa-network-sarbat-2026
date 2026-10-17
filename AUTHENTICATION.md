# Accounts and chapter portals

This phase extends the existing application. The original working demo remains at Git tag `demo-baseline-2026-10-16`; account and membership development is on `feature/accounts-memberships`.

## View the new experience

Set `DEMO_MODE=false`, configure the Supabase auth settings below, build, and start the app. Visit http://localhost:3000 and choose **Sign in / Join**. Create an account with a university email, verify the email, and sign in. Real account signup, email verification, and sign-in have been exercised by the operator. Cross-device hosted verification and password recovery remain to be checked after deployment.

The directory is public. Signed-in students have My dashboard, My SSA, My applications, My profile, Arena, Leaderboard, Feed, Toolkit, and Sahayak. **Join an SSA** and **Start a New SSA** are prominent dashboard actions. Officers retain those student features and gain chapter-scoped application review, a private roster, public profile editing, chapter resources, and Arena controls. Administrators receive USM administration and the existing review desk.

Sample chapter and achievement records remain explicitly labeled even in real-account mode. Real accounts do not turn fictional chapter participation into a claim of actual USM affiliation.

## Server configuration

```dotenv
DEMO_MODE=false
DATABASE_URL=YOUR_PRIVATE_SUPABASE_POSTGRES_POOLER_URI
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PROJECT_PUBLISHABLE_KEY
SESSION_SECRET=YOUR_EXISTING_RANDOM_SECRET
UNIVERSITY_EMAIL_DOMAINS=
```

The publishable key is not a service-role or secret key. This implementation uses it from server routes. `.edu` addresses are supported by default. To support approved international institutions or USM staff accounts, add exact approved domains to `UNIVERSITY_EMAIL_DOMAINS`, comma-separated. An address ending in an attacker domain such as `university.edu.evil.com` is rejected. Additional domains grant signup eligibility only, never officer or administrator access.

Run the additive migrations once:

```sh
npm run db:migrate:accounts
```

The migration adds profile fields, public chapter fields, memberships, native membership applications with versioned JSON answers, new-chapter proposals, private chapter resources, and audit logs. It enables RLS, adds foreign keys and unique constraints, and records migration completion. The original Arena, posts, points, and grants are preserved. The current configured Supabase project has had these migrations applied.

## Email verification and reset configuration

Supabase **Confirm email** must remain enabled. In Supabase Authentication → URL Configuration, set the local Site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/callback` plus `http://localhost:3000/auth/callback?next=password`. When hosted, add the equivalent exact HTTPS URLs for the deployed site. Do not add arbitrary wildcard external destinations.

The app supports Supabase's default confirmation/reset link flow. It consumes the returned token fragment, immediately removes it from browser history, validates the session with Supabase, and stores access and refresh tokens only in HTTP-only, SameSite cookies. Expired access tokens are refreshed server-side. Privileged roles are fetched from protected database records, never signup metadata or editable client fields. Sign-out clears the cookies and revokes the current Supabase session when available.

**Email delivery is an external configuration requirement.** The project was initially configured with the default Supabase sender; the operator subsequently configured Resend SMTP. Supabase documents that this sender delivers only to project team addresses and has restrictive limits. Configure an approved SMTP provider for public university signups and password-reset delivery. The operator created the domain and Resend account; no paid plan was purchased by the assistant. Do not disable email confirmation to work around delivery restrictions.

References: [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Supabase email passwords](https://supabase.com/docs/guides/auth/passwords), [server-side auth security](https://supabase.com/docs/guides/auth/server-side/advanced-guide).

## Membership workflow

1. A verified student opens Explore Chapters, selects a chapter, and chooses Apply to Join.
2. They save a draft or submit the configurable sample questions. The university email comes from their verified account, not an editable application field.
3. My applications shows Draft, Pending, Changes Requested, Approved, or Declined.
4. Only officers of the receiving chapter can inspect and decide the application. Other chapter officers cannot gain access by changing IDs or URLs.
5. Human approval atomically updates the application, inserts one membership, adds the student to the private roster, and creates one audit record. Retries do not duplicate memberships or audit decisions.
6. The student's dashboard and My SSA reflect the membership after refresh.

Initial questions are defined in `membershipQuestions` in `lib/membership.ts`; each application stores `formVersion`. Replace these sample questions with approved USM questions when supplied. No Google Forms dependency is needed.

## New chapter workflow

Students save or submit a proposal with university, location, proposed name, interested-student estimate, leadership readiness, goals, activities, requested support, and comments. A normalized university name prevents duplicate active proposals; reviewers should still check institutional aliases before approval.

Drafts stay private to the author. Submitted proposals appear in USM administration. Human approval creates one discoverable chapter, the applicant's officer membership, portal access, an onboarding checklist, and an audit record in the same transaction. Repeated approval is idempotent. The chapter is marked **USM affiliated** and **university recognition not confirmed**. Platform affiliation does not establish official university recognition.

Chapter rosters, membership answers, and chapter resources are not public. Ordinary members can read their chapter's resources and public activity, but cannot inspect other members' private profiles or manage applications. National administrators do not receive private membership application answers through the national API unless independently authorized as an officer of that chapter.

## Authorized initial accounts

New users always start as students. There is no public role-selection, role-promotion, or administrator bootstrap endpoint. After a user verifies their university email, an authorized USM operator can provision the approved role using a server-only CLI:

```sh
npm run account:grant -- --email APPROVED_UNIVERSITY_EMAIL --role ADMIN --confirm-role-grant
npm run account:grant -- --email APPROVED_UNIVERSITY_EMAIL --role OFFICER --chapter CHAPTER_ID --confirm-role-grant
```

These commands require the private database connection, refuse unverified accounts, and record an audit entry. Run them only after explicit USM authorization. They do not create accounts or passwords. A human must enter their own password and verify their inbox. The assistant must obtain explicit approval for the exact account before granting an actual privileged role.

Future officers can also receive access through the specified USM approval of their new-chapter proposal. Officers cannot promote themselves or another applicant through a profile form.

## Testing and limits

- Unit tests cover membership drafts/revisions, scoped human review, duplicate applications, unique memberships, audit idempotence, new chapter approvals, protected profile input, private resources, university domains, and existing Arena behavior.
- PostgreSQL tests run on an isolated local cluster verify the actual migrations, native transaction adapter, concurrent membership/chapter approvals, foreign keys, unique constraints, own-application RLS, unrelated-user denial, and officer roster access.
- Browser demo tests exercise the original Arena journey and both new membership/proposal journeys using explicitly fictional local identities. These are not claimed as successful real Supabase sign-ins.
- Browser real-mode tests check the actual real-account UI, university-domain validation, rejection of self-selected roles, disabled demo administrator switching, forged-session rejection, and private-data denial to visitors.
- Hosted Supabase's auth settings and publishable-key connectivity are verified. Actual account creation, inbox verification, successful sign-in, refresh, sign-out revocation, and password reset delivery still need a human-controlled account and suitable email delivery configuration.

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:browser`. The PostgreSQL test is optional in the default unit command; point `TEST_DATABASE_URL` only at an empty isolated database with the base schema and Supabase-compatible test auth objects. Browser tests start separate temporary demo and real-mode servers on ports 3100 and 3101; they do not write to hosted student data.

Optional chapter-to-chapter collaboration requests are deliberately deferred until the account/email verification workflow is confirmed end to end. No real-time chat, full finance management, binary uploads, or automatic university recognition was added.

## Early pilot email policy

`SIGNUP_EMAIL_POLICY=any` permits verified personal as well as university email accounts. The local pilot uses this setting. Omit it or set `university` to restrict accounts to .edu and approved domains again. The same policy applies to signup, login, recovery, callback validation, session authorization, and operator provisioning. Switching back also blocks existing personal-email accounts from access, so plan migration before changing production. Email verification and protected database roles remain required in both modes. Membership answer field `universityEmail` retains its existing storage name for compatibility; in open mode it contains the verified account email and does not prove university affiliation.

The sending domain `ssa-network-demo.me` has been verified in Resend and custom SMTP was configured by the operator. Charlotte rejected one recovery email; accepting personal accounts does not guarantee delivery to every provider. Test actual delivery before the demo.
