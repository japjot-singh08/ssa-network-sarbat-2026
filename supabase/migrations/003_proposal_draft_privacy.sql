begin;
drop policy if exists proposal_private on "chapterProposals";
create policy proposal_private on "chapterProposals" for select to authenticated using(
 "userId"=auth.uid() or (status<>'DRAFT' and exists(select 1 from profiles where id=auth.uid() and role='ADMIN'))
);
commit;
