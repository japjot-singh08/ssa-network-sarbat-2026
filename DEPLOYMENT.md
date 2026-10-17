# Vercel pilot deployment

Import the private GitHub repository and deploy `feature/accounts-memberships`. Preserve `main` and the original demo tag. Framework: Next.js. Root: repository root. Build: `npm run build`. Install: `npm ci`. Use Node 24.x.

## Server environment

Transfer these privately from local configuration into the Vercel project: DATABASE_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SESSION_SECRET, ANTHROPIC_API_KEY. Set DEMO_MODE=false, SIGNUP_EMAIL_POLICY=any, ANTHROPIC_MODEL=claude-sonnet-4-6. Keep secrets out of Git, screenshots, chat, and client-prefixed variables. Do not import demo reviewer credentials.

The Supabase database is already provisioned and contains the approved Toolkit imports and test accounts. Do not reseed or reset it. SMTP is configured in Supabase rather than Vercel.

## Authentication URLs

After the stable deployment URL exists, set Supabase Site URL to its exact HTTPS origin. Add its exact `/auth/callback` and `/auth/callback?next=password` redirect URLs. Keep localhost equivalents only for local development. New users must create accounts on the hosted app so callback requests originate from that host. Previously issued localhost links remain local; resend from the deployed app.

## Hosted verification

Verify public browsing, signup and email receipt on a teammate-controlled inbox, callback, sign-out and sign-in, role-specific authorization, chapter proposal and human approval, membership approval, Arena approval, exactly-once points/grants/feed, Shabash, and live Claude citations. Check on mobile and another device. Review Vercel function logs for connection and origin errors. Sample chapters/resources remain labeled. Grants are tracking only.

University-only restrictions are configurable; re-enabling them blocks existing personal-email users, so plan access migration first. Public AI access consumes Anthropic credits; keep the pilot audience small and set a provider spending limit. Current per-process throttling is best-effort on serverless instances.
