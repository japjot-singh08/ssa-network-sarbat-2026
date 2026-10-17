begin;
-- Zero represents an unknown chapter size, never a verified membership count.
alter table chapters drop constraint if exists chapters_size_check;
alter table chapters add constraint chapters_size_check check(size between 0 and 1000);
commit;
