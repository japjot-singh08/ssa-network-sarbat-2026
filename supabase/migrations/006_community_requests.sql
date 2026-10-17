begin;
create table if not exists "communityRequests"(id text primary key, details jsonb not null, assessment jsonb, status text not null check(status in ('PENDING','PUBLISHED','REJECTED')), "reviewNote" text not null default '', "challengeId" text references challenges(id), "createdAt" text not null);
create index if not exists community_request_queue on "communityRequests"(status,"createdAt");
alter table "communityRequests" enable row level security;
revoke all on "communityRequests" from anon,authenticated;
commit;
