-- Run in a dedicated Supabase project's SQL editor. Backend uses the private pooler URL.
-- Public clients have read access only to approved public data. All mutations go through
-- Next.js server authorization and one serializable-by-advisory-lock SQL transaction.
begin;
create table if not exists chapters (
 id text primary key, name text not null, university text not null, region text not null,
 location text not null, size integer not null check(size between 0 and 1000), skills jsonb not null,
 availability text, commitments jsonb, experience jsonb not null, lat double precision not null,
 lng double precision not null, bio text not null
);
create table if not exists challenges (
 id text primary key, title text not null, description text not null, organization text not null,
 type text not null check(type in ('Community Request','National Challenge')), category text not null,
 location text not null, region text not null, deadline text, volunteers integer check(volunteers>0),
 points integer not null check(points>0), "grant" numeric not null check("grant">=0), eligibility text not null,
 "grantEligibility" text not null, completion text not null, instructions text not null,
 status text not null check(status in ('OPEN','CLOSED')), skills jsonb not null,
 lat double precision, lng double precision, "createdAt" text not null
);
create table if not exists participations (
 id text primary key, "chapterId" text not null references chapters(id),
 "challengeId" text not null references challenges(id), "createdAt" text not null,
 unique("chapterId","challengeId")
);
create table if not exists submissions (
 id text primary key, "participationId" text not null unique references participations(id),
 summary text not null, impact text not null, evidence text not null, attachment text,
 participants integer not null check(participants>0), hours numeric not null check(hours>0),
 status text not null check(status in ('PENDING','APPROVED','REJECTED','NEEDS_INFO')),
 feedback text not null, "reviewerId" text, "verifiedHours" numeric check("verifiedHours">=0 and "verifiedHours"<=hours), "createdAt" text not null
);
create table if not exists points (
 id text primary key, "chapterId" text not null references chapters(id),
 "submissionId" text not null unique references submissions(id), amount integer not null check(amount>0),
 semester text not null, "createdAt" text not null
);
create table if not exists grants (
 id text primary key, "chapterId" text not null references chapters(id),
 "submissionId" text not null unique references submissions(id), amount numeric not null check(amount>0), "createdAt" text not null
);
create table if not exists posts (
 id text primary key, "chapterId" text not null references chapters(id),
 "submissionId" text unique references submissions(id), title text not null, description text not null,
 category text not null, verified boolean not null, status text not null check(status in ('PUBLISHED','PENDING','FLAGGED','REJECTED')),
 moderation text not null, "createdAt" text not null
);
create table if not exists reactions (
 id text primary key, "postId" text not null references posts(id), "userId" text not null,
 unique("postId","userId")
);
create table if not exists documents (
 id text primary key, title text not null, description text not null, category text not null,
 source text not null, url text, "updatedAt" text, content text not null, sample boolean not null
);
create table if not exists interests (
 id text primary key, "userId" text not null, "challengeId" text not null references challenges(id),
 unique("userId","challengeId")
);
-- A profile holds one chapter membership in this MVP; roles can only be provisioned by USM.
create table if not exists profiles (
 id uuid primary key references auth.users(id), role text not null check(role in ('STUDENT','OFFICER','ADMIN')),
 "chapterId" text references chapters(id), check(role<>'OFFICER' or "chapterId" is not null)
);
create index if not exists challenges_filter_idx on challenges(status,category,region,deadline);
create index if not exists submissions_pending_idx on submissions(status);
create index if not exists points_rank_idx on points(semester,"chapterId");
create index if not exists posts_public_idx on posts(status,"createdAt");
create index if not exists documents_search_idx on documents using gin(to_tsvector('english',title||' '||content));
create index if not exists participations_challenge_idx on participations("challengeId");
create index if not exists grants_chapter_idx on grants("chapterId");
create index if not exists reactions_user_idx on reactions("userId");
create index if not exists interests_challenge_idx on interests("challengeId");
alter table chapters enable row level security;
alter table challenges enable row level security;
alter table participations enable row level security;
alter table submissions enable row level security;
alter table points enable row level security;
alter table grants enable row level security;
alter table posts enable row level security;
alter table reactions enable row level security;
alter table documents enable row level security;
alter table interests enable row level security;
alter table profiles enable row level security;
revoke all on chapters,challenges,participations,submissions,points,grants,posts,reactions,documents,interests,profiles from anon,authenticated;
grant select on chapters,challenges,points,documents,posts to anon,authenticated;
grant select on profiles to authenticated;
create policy chapters_public on chapters for select using(true);
create policy challenges_public on challenges for select using(true);
create policy points_public on points for select using(true);
create policy documents_public on documents for select using(true);
create policy posts_public on posts for select using(status='PUBLISHED');
create policy own_profile on profiles for select to authenticated using(id=auth.uid());
commit;
