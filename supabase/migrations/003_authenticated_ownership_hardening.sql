-- Forward-only ownership hardening.
-- Existing demonstration rows with user_id IS NULL remain unassigned and invisible.
-- NOT VALID constraints reject new null-owned rows without silently assigning legacy
-- records to a real account. Validate them only after legacy rows are deliberately
-- archived or removed by the owner.

drop policy if exists "experiments_select_own" on public.experiments;
drop policy if exists "experiments_insert_own" on public.experiments;
drop policy if exists "experiments_update_own" on public.experiments;
drop policy if exists "experiments_delete_own" on public.experiments;

create policy "experiments_select_authenticated_owner"
on public.experiments for select to authenticated
using ((select auth.uid()) = user_id);
create policy "experiments_insert_authenticated_owner"
on public.experiments for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "experiments_update_authenticated_owner"
on public.experiments for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "experiments_delete_authenticated_owner"
on public.experiments for delete to authenticated
using ((select auth.uid()) = user_id);

alter table public.experiments
  add constraint experiments_new_rows_require_owner check (user_id is not null) not valid;

-- Every child row must be owned by the same authenticated user as its parent.
do $$
declare
  child_table text;
begin
  foreach child_table in array array[
    'experiment_calculations',
    'experiment_protocol_versions',
    'experiment_lcms_plans',
    'experiment_exports'
  ]
  loop
    execute format('alter table public.%I add constraint %I check (user_id is not null) not valid',
      child_table, child_table || '_new_rows_require_owner');
  end loop;
end $$;

drop policy if exists "experiment_calculations_select_own" on public.experiment_calculations;
drop policy if exists "experiment_calculations_insert_own" on public.experiment_calculations;
drop policy if exists "experiment_calculations_update_own" on public.experiment_calculations;
drop policy if exists "experiment_calculations_delete_own" on public.experiment_calculations;
create policy "experiment_calculations_select_authenticated_owner"
on public.experiment_calculations for select to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e
  where e.id = experiment_id and e.user_id = (select auth.uid())
));
create policy "experiment_calculations_insert_authenticated_owner"
on public.experiment_calculations for insert to authenticated
with check ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e
  where e.id = experiment_id and e.user_id = (select auth.uid())
));
create policy "experiment_calculations_update_authenticated_owner"
on public.experiment_calculations for update to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e
  where e.id = experiment_id and e.user_id = (select auth.uid())
))
with check ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e
  where e.id = experiment_id and e.user_id = (select auth.uid())
));
create policy "experiment_calculations_delete_authenticated_owner"
on public.experiment_calculations for delete to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e
  where e.id = experiment_id and e.user_id = (select auth.uid())
));

drop policy if exists "experiment_protocol_versions_select_own" on public.experiment_protocol_versions;
drop policy if exists "experiment_protocol_versions_insert_own" on public.experiment_protocol_versions;
drop policy if exists "experiment_protocol_versions_update_own" on public.experiment_protocol_versions;
drop policy if exists "experiment_protocol_versions_delete_own" on public.experiment_protocol_versions;
create policy "experiment_protocol_versions_select_authenticated_owner"
on public.experiment_protocol_versions for select to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e where e.id = experiment_id and e.user_id = (select auth.uid())
));
create policy "experiment_protocol_versions_insert_authenticated_owner"
on public.experiment_protocol_versions for insert to authenticated
with check ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e where e.id = experiment_id and e.user_id = (select auth.uid())
));
create policy "experiment_protocol_versions_update_authenticated_owner"
on public.experiment_protocol_versions for update to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e where e.id = experiment_id and e.user_id = (select auth.uid())
))
with check ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e where e.id = experiment_id and e.user_id = (select auth.uid())
));
create policy "experiment_protocol_versions_delete_authenticated_owner"
on public.experiment_protocol_versions for delete to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e where e.id = experiment_id and e.user_id = (select auth.uid())
));

drop policy if exists "experiment_lcms_plans_select_own" on public.experiment_lcms_plans;
drop policy if exists "experiment_lcms_plans_insert_own" on public.experiment_lcms_plans;
drop policy if exists "experiment_lcms_plans_update_own" on public.experiment_lcms_plans;
drop policy if exists "experiment_lcms_plans_delete_own" on public.experiment_lcms_plans;
create policy "experiment_lcms_plans_select_authenticated_owner"
on public.experiment_lcms_plans for select to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e where e.id = experiment_id and e.user_id = (select auth.uid())
));
create policy "experiment_lcms_plans_insert_authenticated_owner"
on public.experiment_lcms_plans for insert to authenticated
with check ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e where e.id = experiment_id and e.user_id = (select auth.uid())
));
create policy "experiment_lcms_plans_update_authenticated_owner"
on public.experiment_lcms_plans for update to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e where e.id = experiment_id and e.user_id = (select auth.uid())
))
with check ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e where e.id = experiment_id and e.user_id = (select auth.uid())
));
create policy "experiment_lcms_plans_delete_authenticated_owner"
on public.experiment_lcms_plans for delete to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e where e.id = experiment_id and e.user_id = (select auth.uid())
));

drop policy if exists "experiment_exports_select_own" on public.experiment_exports;
drop policy if exists "experiment_exports_insert_own" on public.experiment_exports;
drop policy if exists "experiment_exports_update_own" on public.experiment_exports;
drop policy if exists "experiment_exports_delete_own" on public.experiment_exports;
create policy "experiment_exports_select_authenticated_owner"
on public.experiment_exports for select to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e where e.id = experiment_id and e.user_id = (select auth.uid())
));
create policy "experiment_exports_insert_authenticated_owner"
on public.experiment_exports for insert to authenticated
with check ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e where e.id = experiment_id and e.user_id = (select auth.uid())
));
create policy "experiment_exports_delete_authenticated_owner"
on public.experiment_exports for delete to authenticated
using ((select auth.uid()) = user_id and exists (
  select 1 from public.experiments e where e.id = experiment_id and e.user_id = (select auth.uid())
));

create index if not exists experiment_calculations_user_idx on public.experiment_calculations(user_id);
create index if not exists experiment_protocol_versions_user_idx on public.experiment_protocol_versions(user_id);
create index if not exists experiment_lcms_plans_user_idx on public.experiment_lcms_plans(user_id);
create index if not exists experiment_exports_user_idx on public.experiment_exports(user_id);
