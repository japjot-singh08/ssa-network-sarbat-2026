begin;
alter table profiles add column if not exists name text not null default '';
alter table profiles add column if not exists email text not null default '';
alter table profiles add column if not exists "academicYear" text not null default '';
alter table profiles add column if not exists major text not null default '';
alter table chapters alter column lat drop not null;
alter table chapters alter column lng drop not null;
alter table chapters add column if not exists "publicContact" text;
alter table chapters add column if not exists "logoUrl" text;
alter table chapters add column if not exists "applicationsOpen" boolean not null default true;
alter table chapters add column if not exists state text not null default '';
alter table chapters add column if not exists "isSample" boolean not null default true;
alter table chapters add column if not exists "networkStatus" text not null default 'DEMONSTRATION';
alter table chapters add column if not exists "universityRecognition" text not null default 'NOT_RECORDED';
alter table chapters add column if not exists onboarding jsonb not null default '[]';
create table if not exists memberships(
 id text primary key,"userId" uuid not null references profiles(id),"chapterId" text not null references chapters(id),
 role text not null check(role in ('MEMBER','OFFICER')),status text not null check(status='ACTIVE'),"createdAt" text not null,unique("userId","chapterId")
);
create table if not exists "membershipApplications"(
 id text primary key,"userId" uuid not null references profiles(id),"chapterId" text not null references chapters(id),
 status text not null check(status in ('DRAFT','PENDING','CHANGES_REQUESTED','APPROVED','DECLINED')),
 answers jsonb not null,"formVersion" integer not null,"reviewNote" text not null,"reviewerId" text,"createdAt" text not null,"updatedAt" text not null
);
create unique index if not exists membership_active_application on "membershipApplications"("userId","chapterId") where status in ('DRAFT','PENDING','CHANGES_REQUESTED');
create table if not exists "chapterProposals"(
 id text primary key,"userId" uuid not null references profiles(id),"universityKey" text not null,
 status text not null check(status in ('DRAFT','PENDING','CHANGES_REQUESTED','APPROVED','DECLINED')),
 details jsonb not null,"chapterId" text references chapters(id),"reviewNote" text not null,"reviewerId" text,"createdAt" text not null,"updatedAt" text not null
);
create unique index if not exists chapter_active_proposal on "chapterProposals"("universityKey") where status in ('DRAFT','PENDING','CHANGES_REQUESTED','APPROVED');
create table if not exists "chapterResources"(
 id text primary key,"chapterId" text not null references chapters(id),title text not null,content text not null,url text,"createdAt" text not null
);
create table if not exists "auditLogs"(
 id text primary key,"actorId" text not null,action text not null,"targetId" text not null,"chapterId" text references chapters(id),"createdAt" text not null
);
create index if not exists membership_chapter on memberships("chapterId",role);
create index if not exists application_chapter on "membershipApplications"("chapterId",status);
create index if not exists proposal_queue on "chapterProposals"(status);
alter table memberships enable row level security;
alter table "membershipApplications" enable row level security;
alter table "chapterProposals" enable row level security;
alter table "chapterResources" enable row level security;
alter table "auditLogs" enable row level security;
revoke all on memberships,"membershipApplications","chapterProposals","chapterResources","auditLogs" from anon,authenticated;
-- All mutations require the server's validated Supabase user and domain authorization.
grant select on memberships,"membershipApplications","chapterProposals","chapterResources" to authenticated;
create or replace function public.manages_chapter(target text) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from memberships where "userId"=auth.uid() and "chapterId"=target and role='OFFICER' and status='ACTIVE')
 or exists(select 1 from profiles where id=auth.uid() and role='OFFICER' and "chapterId"=target)
$$;
revoke all on function public.manages_chapter(text) from public;
grant execute on function public.manages_chapter(text) to authenticated;
create policy membership_private on memberships for select to authenticated using("userId"=auth.uid() or public.manages_chapter("chapterId"));
create policy application_private on "membershipApplications" for select to authenticated using("userId"=auth.uid() or public.manages_chapter("chapterId"));
create policy proposal_private on "chapterProposals" for select to authenticated using("userId"=auth.uid() or (status<>'DRAFT' and exists(select 1 from profiles where id=auth.uid() and role='ADMIN')));
create policy chapter_resource_private on "chapterResources" for select to authenticated using(exists(select 1 from memberships m where m."userId"=auth.uid() and m."chapterId"="chapterResources"."chapterId") or public.manages_chapter("chapterId"));
create policy roster_profiles on profiles for select to authenticated using(exists(select 1 from memberships m where m."userId"=profiles.id and public.manages_chapter(m."chapterId")));
commit;
