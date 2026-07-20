# BindLab Production Security Inventory

Audit baseline recorded before the production-hardening changes on branch
`codex/production-security-hardening`.

## Public pages and subpages

- `/` - public product homepage.
- `/about` - public founder and product information.
- `/analysis` - local-browser analysis-plan workspace.
- `/start-experiment` - legacy local-browser experiment workflow.
- `/dashboard` - product dashboard.
- `/dashboard/reaction/new` - canonical local-browser experiment builder.
- `/dashboard/experiments` - local-browser experiment list.
- `/dashboard/experiments/[id]` - local-browser experiment detail/editor.
- `/dashboard/calculators` - deterministic calculator workbench.
- `/dashboard/dilution` - dilution calculator.
- `/dashboard/lcms` - LCMS planning tool.
- `/dashboard/bench-mode-demo` - Live Bench Mode demonstration.
- `/dashboard/new` - legacy lab-preparation project intake.
- `/dashboard/project/[id]` - legacy Supabase-backed project view.
- `/dashboard/pilot` - pilot signup/information page.
- `/dashboard/funding` - internal funding overview; production exposure requires owner approval.

## API routes

- `POST /api/gemini` - paid Gemini generation.
- `POST /api/ai/experiment-builder` - paid Gemini experiment extraction, including PDF vision.
- `POST /api/ai/pdf-extract` - PDF text extraction and base64 handoff.
- `GET, POST /api/experiments` - Supabase experiment list/create.
- `GET, PATCH, DELETE /api/experiments/[id]` - Supabase experiment record CRUD.
- `POST /api/calculation-logs` - Supabase or local-server calculation log persistence.
- `POST /api/lab-prep` - legacy project/document/generation persistence and Gemini generation.
- `POST /api/lab-prep/[id]/regenerate` - legacy project regeneration and persistence.

No protocol-version, LCMS-plan, or export API route exists in the audited tree.

## Data read/create/update/delete surfaces

- Browser experiment records use `localStorage` and do not sync between devices.
- Browser analysis plans, workflow templates, reagent records, and Bench Mode sessions use
  `localStorage`.
- Experiment, project, generation, document, and calculation-log APIs use Supabase.
- The legacy storage fallback writes server-local JSON. Server-local files are not durable on
  Vercel and must not be treated as user storage.

## AI-provider surfaces

- `/api/gemini`
- `/api/ai/experiment-builder`
- `/api/lab-prep`
- `/api/lab-prep/[id]/regenerate`
- `lib/ai/model-health.ts` performs server-side Gemini model discovery/health checks.

## Uploaded-file and PDF surfaces

- `/api/ai/pdf-extract` accepts PDFs for text extraction and AI handoff.
- `/api/ai/experiment-builder` accepts an encoded PDF for Gemini document vision.
- `/dashboard/new` accepts PDF, image, spreadsheet, CSV, text, and Markdown through the
  legacy lab-preparation route.

## Supabase surfaces

- `lib/supabase/server.ts`
- `/api/experiments`
- `/api/experiments/[id]`
- `/api/calculation-logs`
- `/api/lab-prep`
- `/api/lab-prep/[id]/regenerate`
- `/dashboard`
- `/dashboard/project/[id]`
- migrations under `supabase/migrations`.

## Public assets

- `/assets/bindlab-logo.png`
- `/assets/sense-of-chemistry.png`
- `/assets/founder- portrait.png`
- `/assets/about-me-photo.png`

The two founder portraits and biography identify Thomas Poon. This is intentional public founder
information and requires owner confirmation. No public audio, video, PDF, spreadsheet, or other
downloadable document was present at this baseline. `.DS_Store` files were present and should not
be published.
