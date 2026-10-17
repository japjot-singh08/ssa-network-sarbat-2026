begin;
alter table posts add column if not exists "imageUrl" text;
alter table posts add column if not exists sample boolean not null default false;
alter table challenges add column if not exists "imageUrl" text;
create table if not exists "mediaUploads" (id text primary key, token text not null, mime text not null, data bytea not null, "createdAt" timestamptz not null default now());
alter table "mediaUploads" enable row level security;
revoke all on "mediaUploads" from anon,authenticated;
commit;
