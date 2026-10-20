-- Apply only to the existing approved Supabase project after administrator review.
-- No browser role can read, insert, update or delete this feedback table.
create table if not exists public.beta_feedback (
  id uuid primary key,
  created_at timestamptz not null default now(),
  category text not null check (category in ('Bug','Calculation error','AI accuracy','Feature request','General feedback')),
  description text not null check (length(description) between 5 and 5000),
  feature text not null,
  contact text,
  researcher_role text,
  usefulness_rating integer check (usefulness_rating between 1 and 5)
);
alter table public.beta_feedback enable row level security;
revoke all on public.beta_feedback from public, anon, authenticated;
grant insert on public.beta_feedback to service_role;
-- Administrator retention procedure: run daily through existing approved scheduling:
-- delete from public.beta_feedback where created_at < now() - interval '30 days';
-- Do not enable FEEDBACK_STORAGE_ENABLED until access and retention are verified.
