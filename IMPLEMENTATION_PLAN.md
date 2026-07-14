# BindLab MVP Implementation Plan

## Product Boundary

BindLab is an AI workflow platform for chemical-biology research, beginning with small-molecule synthesis and conjugation experiments. Its primary promise is:

> Turn an experimental objective into a checked calculation, editable bench protocol, LCMS sample-preparation plan, and reusable experiment record.

At launch, BindLab is not a general chatbot, ELN/LIMS replacement, retrosynthesis engine, or universal scientific platform. All numerical chemistry calculations remain deterministic TypeScript calculations. AI is limited to editable explanatory, protocol-draft, and lab-notebook text.

## Current Features

### Product routes

| Route | Current purpose | Status |
| --- | --- | --- |
| `/` | BindLab product homepage | Working; preserve current design |
| `/about` | Brand/about page | Working; separate from product workflow |
| `/dashboard` | Workflow entry point and legacy AI project list | Working, but mixes two product models |
| `/dashboard/reaction/new` | Reaction setup, reagent calculations, checks, rule-based draft protocol, LCMS support, and local export | Core MVP path; working demo flow |
| `/dashboard/calculators` | Calculator suite | Working; deterministic inputs and result logging exist |
| `/dashboard/dilution` | Dilution-oriented calculator entry | Functional but currently renders the full calculator workbench |
| `/dashboard/lcms` | LCMS preparation checklist | Informational only; not connected to a specific experiment |
| `/dashboard/experiments` | Browser-local saved workflow exports | Functional locally, not persistent or structured |
| `/dashboard/new` | Legacy generic AI lab-prep form | Functional but outside the focused product boundary |
| `/dashboard/project/[id]` | Legacy AI guide/project detail | Functional with local or Supabase storage |
| `/dashboard/pilot` | Pilot interest UI | Incomplete: form has no submission/storage behavior |
| `/dashboard/funding` | Competition narrative page | Static content only |

### Reusable components and logic

- `components/AppShell.tsx`: product navigation shell.
- `components/calculators/*`: calculator cards, formula presentation, unit inputs, result logging, and history.
- `lib/calculators/reaction.ts`: primary reusable reaction-planning engine. It calculates limiting mmol, equivalents, solid mass, liquid volume using density, solution volume using stock concentration, reaction volume, theoretical yield, LCMS adducts, preliminary warnings, protocol steps, and reagent CSV.
- `lib/calculators/chemistry.ts`, `synthesis.ts`, `lcms.ts`, and `units.ts`: deterministic molarity, dilution, mixture, density, concentration, theoretical yield, LCMS dilution, mobile-phase, and pipette utilities.
- `app/dashboard/reaction/new/reaction-workflow.tsx`: strongest existing end-to-end product prototype.
- `app/api/gemini/route.ts` and `lib/ai/*`: server-side Gemini integration; the API key remains on the server and has friendly failure handling.
- `lib/storage.ts` and `supabase/migrations/001_initial_schema.sql`: local JSON fallback plus an initial Supabase project/generation/calculation-log schema.

### Current storage and exports

- The reaction workflow saves a JSON-like snapshot in browser `localStorage` under `bindlab-experiments`.
- The legacy lab-prep workflow saves `projects`, `generations`, and calculator logs either to `.local-data/bind-lab-ai.json` or Supabase when configured.
- Reaction workflow exports: reagent CSV, copied protocol, browser print/PDF, and a local JSON preview.
- Legacy project workflow exports: Markdown.
- Calculator result cards can POST logs to `/api/calculation-logs`.

## Incomplete or Conflicting Functionality

1. **No shared Experiment Record.** The reaction workflow and legacy AI project flow persist different data shapes, so a reaction cannot be reliably reopened, edited, versioned, or linked to its calculations and LCMS plan.
2. **Reaction data is browser-local only.** `localStorage` is device/browser-specific and can be lost. The local export list is not a real experiment record.
3. **LCMS is only partially integrated.** Expected adduct masses and one dilution helper exist, but the standalone LCMS route is a checklist rather than an experiment-specific plan with method fields and result capture.
4. **Protocol drafting has two incompatible paths.** The reaction workflow produces a deterministic template; the older route generates a broad AI lab-prep guide. The focused MVP needs one editable protocol draft attached to an experiment.
5. **File upload is not implemented.** The legacy upload UI records only metadata in Supabase and does not store files, extract text, or use documents as verified reaction inputs.
6. **Safety checks are intentionally basic.** Keyword reminders do not replace SDS review, compatibility assessment, scale review, institutional SOPs, or supervisor approval.
7. **Input validation is incomplete at the product boundary.** The core calculator checks many positive values, but the workflow needs explicit blocking/confirmation states for impossible plans, incomplete reagent data, and tiny pipetting volumes.
8. **No experiment lifecycle.** There are no draft/ready/in-progress/completed states, revision history, ownership/authentication, or supervisor review.
9. **Pilot form has no backend.** It must either be connected to a real collection endpoint or remain out of the primary demo narrative.
10. **Potentially misleading scope remains in legacy routes.** Generic subject-area options include workflows beyond small-molecule synthesis and conjugation; those should not be promoted in the primary MVP.

## Recommended Architecture

### One source of truth: Experiment Record

Use an `experiments` domain model as the parent record. An experiment holds an objective, reaction setup, reagent table, deterministic calculation snapshot, warnings/checks, protocol draft, LCMS sample-prep plan, notebook notes, and export metadata.

Do not call Gemini for arithmetic. The server should recompute the deterministic plan from validated experiment inputs before saving calculated outputs. AI receives a constrained, structured summary only to produce editable prose fields such as protocol rationale, checklist language, and notebook draft.

### Persistence strategy

1. Add a Supabase migration for `experiments`, `experiment_reagents`, `experiment_calculations`, `experiment_protocol_versions`, and `experiment_lcms_plans`.
2. Preserve `projects` and `generations` during migration as legacy records; do not delete them.
3. Create server-side experiment APIs that validate payloads with Zod and run deterministic calculations before persistence.
4. Use browser local draft storage only as a temporary unsaved-draft convenience, never as the canonical record.
5. Add authentication and user ownership before treating the database as multi-user. Until then, label the demo as single-user/local workspace rather than implying shared lab records.

### AI boundary

- Server route only; read `GEMINI_API_KEY` and optional `GEMINI_MODEL` from environment variables.
- Inputs: structured objective, reagent summary, calculated amounts, warnings, and confirmed assumptions.
- Outputs: editable protocol draft, questions to confirm, and notebook text, each labeled as draft content.
- Never infer missing reagent identity, hazard classification, synthesis conditions, compatibility, analytical results, or experimental success.
- API errors, missing keys, and quota errors must remain in-page messages and never prevent calculation, saving a draft, or page rendering.

## Exact Focused Routes

Keep `/` and `/about` unchanged. Consolidate the primary application around these routes:

| Route | Purpose |
| --- | --- |
| `/dashboard` | List/search Experiment Records and resume drafts; one clear `New experiment` action |
| `/dashboard/experiments/new` | Primary guided workflow: objective -> reaction setup -> calculations/checks -> protocol -> LCMS -> review/save |
| `/dashboard/experiments/[experimentId]` | Editable Experiment Record with versioned calculations, protocol, LCMS plan, and exports |
| `/dashboard/experiments/[experimentId]/export` | Print-friendly/export view for reagent table, protocol, LCMS prep, warnings, and record metadata |
| `/dashboard/calculators` | Reusable deterministic calculator suite, able to attach a calculation to an existing Experiment Record |
| `/dashboard/lcms` | LCMS utility entry for an existing experiment or standalone calculation; no fake result interpretation |
| `/dashboard/pilot` | Optional later route, only after a real interest capture mechanism exists |

Compatibility approach:

- Keep `/dashboard/reaction/new` temporarily as a redirect or alias to `/dashboard/experiments/new` once the new route exists.
- Keep `/dashboard/new` and `/dashboard/project/[id]` accessible as **Legacy Lab Prep** until records are migrated; remove them from primary navigation instead of deleting them.
- Keep `/dashboard/dilution` only if it becomes a focused dilution view; otherwise direct users to the relevant calculator inside `/dashboard/calculators`.

## Required Experiment Record Fields

### Identity and lifecycle

- `id`, `owner_id` (nullable only during single-user demo), `title`, `experiment_type`
- `objective`, `status` (`draft`, `ready_for_review`, `in_progress`, `completed`, `archived`)
- `created_at`, `updated_at`, `last_calculated_at`, `version`

### Reaction setup

- limiting reagent: `name`, `molecular_weight_g_mol`, `mass_mg`, calculated `amount_mmol`
- `target_product_name`, `target_product_molecular_weight_g_mol` (optional until known)
- `solvent`, `target_concentration_m`, calculated `total_reaction_volume_ml`
- `temperature`, `time`, `atmosphere` (optional), `reaction_scale_notes`
- `source_reference` and `assumptions` as user-entered text

### Reagent rows

- `id`, `name`, `role`, `physical_state`
- `molecular_weight_g_mol`, `equivalents`, calculated `amount_mmol`, calculated `mass_mg`
- `density_g_ml` for neat liquids; `stock_concentration_m` for stock solutions
- calculated `volume_ul`, `addition_order`, `notes`
- `data_status` / `missing_fields` so unknown values are explicit rather than guessed

### Deterministic calculation audit

- calculation engine version, validated input snapshot, calculated output snapshot
- formulas used, units, warnings, missing data, pipetting warnings
- `calculated_at` and user confirmation state for each blocking warning

### Protocol and safety review

- editable `protocol_draft`, `protocol_version`, source (`deterministic_template` or `ai_draft`)
- `ai_assumptions`, `questions_to_confirm`, `supervisor_review_notes`
- `safety_reminders` and `sds_checked` / `sop_confirmed` acknowledgements
- No claim that these fields constitute a hazard assessment or approved SOP.

### LCMS plan and results

- neutral product MW, expected adduct list, ion mode, observed m/z (optional), tolerance
- sample source, sample volume, diluent, final volume, calculated dilution plan
- method metadata: instrument, column, mobile phase, gradient, injection volume, run time (all optional and user-entered)
- result note and attachment references only; no automated scientific conclusion without a validated interpretation workflow.

### Record/export metadata

- notebook observations, deviations, attachments, exported_at, export_format
- immutable export snapshot ID so a saved PDF/CSV can be traced to the inputs used.

## Primary Demo Workflow

### Plan and prepare a small-molecule synthesis / chemical-biology conjugation experiment

1. **Objective:** User names the reaction/conjugation, target product, and source procedure or assumptions.
2. **Reaction setup:** User enters limiting reagent, mass, MW, solvent, target concentration, temperature, time, and reagents with equivalents/state/density or stock concentration.
3. **Checked calculation:** BindLab deterministically calculates mmol, masses/volumes, approximate solvent volume, theoretical yield, and identifies missing or non-pipettable values.
4. **Review:** The user resolves missing data and acknowledges safety/SOP reminders. BindLab never invents a missing value.
5. **Editable protocol:** BindLab creates a deterministic first draft; an optional server-side AI action turns confirmed structured data into editable protocol and notebook wording.
6. **LCMS preparation:** BindLab generates expected simple adduct masses and a deterministic sample dilution plan, with user-entered method fields.
7. **Save and export:** The user saves the Experiment Record, exports a traceable reagent table/protocol/LCMS prep sheet, and can reopen the record later.

## Scientific and Product Risks

- Small-molecule and conjugation reactions require expert review; the product must never present draft text as an approved procedure.
- Density, concentration, reagent purity, salt form, hydrate form, equivalents, solvent compatibility, and scaling assumptions can materially change amounts.
- Approximate solvent volume is a planning value, not a solubility or compatibility determination.
- Simple LCMS adduct calculations do not identify compounds, validate purity, assign peaks, or replace a validated analytical method.
- AI-generated prose can be incomplete or incorrect; retain inputs, assumptions, warnings, and source/version metadata for review.
- Local JSON and browser localStorage are unsuitable for production records; deployment needs authenticated persistence, access control, backups, and audit requirements appropriate to the intended lab environment.

## Exact Next Implementation Task

Implement the Experiment Record foundation before changing visual design:

1. Add a Zod-backed `ExperimentRecord` schema and a Supabase migration for experiments and reagent rows.
2. Create `POST /api/experiments` and `GET/PATCH /api/experiments/[id]` that validate input and persist deterministic calculation snapshots from `calculateReactionPlan`.
3. Update only the existing `/dashboard/reaction/new` workflow to save/load the new record shape, while retaining its current visual presentation and exports.
4. Make `/dashboard/experiments` list and reopen those persisted records.

## Blockers

- Production persistence requires Supabase environment variables and a decision on authentication/user ownership. The existing schema enables RLS but the current server writes `user_id: null`, which is not a production-ready multi-user setup.
- A real pilot signup requires a destination (database table, email provider, or form service) and consent/privacy copy.
- Document extraction, reaction parsing, uploaded file storage, and validated LCMS result interpretation should remain out of the first focused workflow until their accuracy and review boundaries are specified.
