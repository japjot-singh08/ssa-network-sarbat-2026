begin;
alter table challenges add column if not exists "maxChapters" integer check("maxChapters" > 0);
alter table challenges add column if not exists "restrictRegion" boolean not null default false;
alter table challenges add column if not exists sample boolean not null default true;
commit;
