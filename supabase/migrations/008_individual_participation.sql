begin;
alter table posts alter column "chapterId" drop not null;
alter table posts add column if not exists "authorId" text;
alter table posts add column if not exists "authorName" text;
create table if not exists "individualParticipations"(id text primary key,"userId" text not null,"challengeId" text not null references challenges(id),status text not null check(status in ('JOINED','COMPLETED')),summary text not null default '',evidence text not null default '',hours numeric not null default 0 check(hours>=0 and hours<=10000),"createdAt" text not null,unique("userId","challengeId"));
alter table "individualParticipations" enable row level security;
revoke all on "individualParticipations" from anon,authenticated;
create index if not exists individual_owner on "individualParticipations"("userId");
commit;
