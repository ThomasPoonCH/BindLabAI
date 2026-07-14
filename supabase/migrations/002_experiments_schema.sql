-- Create experiments table
create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  objective text,
  reaction_type text,
  experiment_status text default 'needs_review' not null,
  original_instruction text not null,
  
  -- Reaction conditions as JSON for flexibility
  conditions jsonb not null,
  
  -- Reagents as JSONB array
  reagents jsonb not null default '[]'::jsonb,
  
  -- Optional fields
  workup text,
  purification text,
  analytical_methods text[] default '{}',
  expected_product text,
  expected_molecular_weight numeric,
  notes text,
  
  -- Safety and validation data
  safety_notes text[] default '{}',
  missing_information text[] default '{}',
  conflicts text[] default '{}',
  assumptions text[] default '{}',
  warnings text[] default '{}',
  ai_summary text,
  
  -- Metadata
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  last_calculated_at timestamp with time zone,
  version integer default 1 not null
);

-- Create experiment_calculations table for audit trail
create table public.experiment_calculations (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.experiments(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  
  -- Calculation snapshot
  calculation_version text not null,
  validated_input_snapshot jsonb not null,
  calculated_output_snapshot jsonb not null,
  
  -- Formulas and warnings
  formulas_used text[] not null default '{}',
  warnings text[] default '{}',
  missing_data text[] default '{}',
  pipetting_warnings text[] default '{}',
  
  -- Confirmation states
  confirmed_warnings text[] default '{}',
  
  -- Metadata
  calculated_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);

-- Create experiment_protocol_versions table for editable protocol history
create table public.experiment_protocol_versions (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.experiments(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  
  -- Protocol content
  protocol_draft text not null,
  source text not null, -- 'deterministic_template' or 'ai_draft'
  version integer not null,
  
  -- AI context
  ai_assumptions text[] default '{}',
  questions_to_confirm text[] default '{}',
  supervisor_review_notes text,
  
  -- Safety review
  safety_reminders text[] default '{}',
  sds_checked boolean default false,
  sop_confirmed boolean default false,
  
  -- Metadata
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create experiment_lcms_plans table
create table public.experiment_lcms_plans (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.experiments(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  
  -- Product information
  neutral_product_mw numeric,
  expected_adducts text[] default '{}',
  ion_mode text, -- 'positive', 'negative', 'both'
  observed_mz numeric,
  mz_tolerance numeric,
  
  -- Sample preparation
  sample_source text,
  sample_volume numeric,
  sample_volume_unit text,
  diluent text,
  final_volume numeric,
  final_volume_unit text,
  calculated_dilution_plan text,
  
  -- Method metadata (user-entered)
  instrument text,
  column_name text,
  mobile_phase text,
  gradient text,
  injection_volume numeric,
  run_time text,
  
  -- Results
  result_note text,
  
  -- Metadata
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create experiment_exports table for traceability
create table public.experiment_exports (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.experiments(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  
  -- Export metadata
  export_format text not null, -- 'pdf', 'csv', 'json', 'markdown'
  notebook_observations text,
  deviations text,
  exported_at timestamp with time zone default now() not null,
  
  -- Immutable snapshot reference
  experiment_snapshot jsonb not null,
  
  -- Metadata
  created_at timestamp with time zone default now() not null
);

-- Enable RLS on all tables
alter table public.experiments enable row level security;
alter table public.experiment_calculations enable row level security;
alter table public.experiment_protocol_versions enable row level security;
alter table public.experiment_lcms_plans enable row level security;
alter table public.experiment_exports enable row level security;

-- Create RLS policies for experiments
create policy "experiments_select_own" on public.experiments for select using (auth.uid() = user_id or user_id is null);
create policy "experiments_insert_own" on public.experiments for insert with check (auth.uid() = user_id or user_id is null);
create policy "experiments_update_own" on public.experiments for update using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id or user_id is null);
create policy "experiments_delete_own" on public.experiments for delete using (auth.uid() = user_id or user_id is null);

-- Create RLS policies for experiment_calculations
create policy "experiment_calculations_select_own" on public.experiment_calculations for select using (
  auth.uid() = user_id or user_id is null or exists(
    select 1 from public.experiments where id = experiment_id and (auth.uid() = user_id or user_id is null)
  )
);
create policy "experiment_calculations_insert_own" on public.experiment_calculations for insert with check (
  auth.uid() = user_id or user_id is null
);
create policy "experiment_calculations_delete_own" on public.experiment_calculations for delete using (
  auth.uid() = user_id or user_id is null
);

-- Create RLS policies for experiment_protocol_versions
create policy "experiment_protocol_versions_select_own" on public.experiment_protocol_versions for select using (
  auth.uid() = user_id or user_id is null or exists(
    select 1 from public.experiments where id = experiment_id and (auth.uid() = user_id or user_id is null)
  )
);
create policy "experiment_protocol_versions_insert_own" on public.experiment_protocol_versions for insert with check (
  auth.uid() = user_id or user_id is null
);
create policy "experiment_protocol_versions_update_own" on public.experiment_protocol_versions for update using (
  auth.uid() = user_id or user_id is null
) with check (auth.uid() = user_id or user_id is null);

-- Create RLS policies for experiment_lcms_plans
create policy "experiment_lcms_plans_select_own" on public.experiment_lcms_plans for select using (
  auth.uid() = user_id or user_id is null or exists(
    select 1 from public.experiments where id = experiment_id and (auth.uid() = user_id or user_id is null)
  )
);
create policy "experiment_lcms_plans_insert_own" on public.experiment_lcms_plans for insert with check (
  auth.uid() = user_id or user_id is null
);
create policy "experiment_lcms_plans_update_own" on public.experiment_lcms_plans for update using (
  auth.uid() = user_id or user_id is null
) with check (auth.uid() = user_id or user_id is null);

-- Create RLS policies for experiment_exports
create policy "experiment_exports_select_own" on public.experiment_exports for select using (
  auth.uid() = user_id or user_id is null
);
create policy "experiment_exports_insert_own" on public.experiment_exports for insert with check (
  auth.uid() = user_id or user_id is null
);

-- Create indexes for performance
create index experiments_user_created_idx on public.experiments(user_id, created_at desc);
create index experiments_status_idx on public.experiments(experiment_status);
create index experiment_calculations_experiment_idx on public.experiment_calculations(experiment_id);
create index experiment_protocol_versions_experiment_idx on public.experiment_protocol_versions(experiment_id);
create index experiment_lcms_plans_experiment_idx on public.experiment_lcms_plans(experiment_id);
create index experiment_exports_experiment_idx on public.experiment_exports(experiment_id);
