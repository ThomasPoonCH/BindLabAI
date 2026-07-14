create extension if not exists vector;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  learning_level text,
  preferred_language text,
  created_at timestamp with time zone default now() not null
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  subject_area text not null,
  user_level text not null,
  preferred_language text not null,
  raw_input text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  file_name text not null,
  file_type text,
  storage_path text,
  extracted_text text,
  created_at timestamp with time zone default now() not null
);

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  chunk_text text not null,
  embedding vector,
  page_number integer,
  created_at timestamp with time zone default now() not null
);

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  model_provider text not null,
  model_name text not null,
  prompt text not null,
  output_json jsonb not null,
  created_at timestamp with time zone default now() not null
);

create table public.calculation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  calculator_type text not null,
  input_json jsonb not null,
  result_json jsonb not null,
  formula text,
  explanation text,
  created_at timestamp with time zone default now() not null
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.generations enable row level security;
alter table public.calculation_logs enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "projects_select_own" on public.projects for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects for delete using (auth.uid() = user_id);

create policy "documents_select_own" on public.documents for select using (auth.uid() = user_id);
create policy "documents_insert_own" on public.documents for insert with check (auth.uid() = user_id);
create policy "documents_update_own" on public.documents for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documents_delete_own" on public.documents for delete using (auth.uid() = user_id);

create policy "document_chunks_select_own" on public.document_chunks for select using (auth.uid() = user_id);
create policy "document_chunks_insert_own" on public.document_chunks for insert with check (auth.uid() = user_id);
create policy "document_chunks_update_own" on public.document_chunks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "document_chunks_delete_own" on public.document_chunks for delete using (auth.uid() = user_id);

create policy "generations_select_own" on public.generations for select using (auth.uid() = user_id);
create policy "generations_insert_own" on public.generations for insert with check (auth.uid() = user_id);
create policy "generations_delete_own" on public.generations for delete using (auth.uid() = user_id);

create policy "calculation_logs_select_own" on public.calculation_logs for select using (auth.uid() = user_id);
create policy "calculation_logs_insert_own" on public.calculation_logs for insert with check (auth.uid() = user_id);
create policy "calculation_logs_delete_own" on public.calculation_logs for delete using (auth.uid() = user_id);

create index projects_user_created_idx on public.projects(user_id, created_at desc);
create index documents_project_idx on public.documents(project_id);
create index document_chunks_project_idx on public.document_chunks(project_id);
create index generations_project_created_idx on public.generations(project_id, created_at desc);
