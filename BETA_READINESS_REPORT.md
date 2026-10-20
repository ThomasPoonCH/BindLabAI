# BindLab AI researcher beta readiness

20 October 2026 · Existing branch: `codex/production-security-hardening`

**Assessment: Ready for supervised demonstration only.** The deterministic preparation workflow is testable, but a controlled AI beta still requires valid provider credentials and verified service configuration. No live extraction passed during this task.

## A. Implemented changes

- **Field evidence:** `lib/experiment-evidence.ts`, the experiment schema, builder response normalization, workspace and reagent table now track individual source-extracted, calculated, AI-suggested, researcher-confirmed and missing/unverified fields. Explicit confirmation/editing preserves source references/excerpts without confirming adjacent values. AI and backup imports cannot assert researcher confirmation. A dedicated evidence table supports per-field review. Source/library property conflicts preserve the source value and show a review issue.
- **Practical preparation workflow:** the existing manual/AI workspace supports a clearly fictional Alpha/Beta example, source review, deterministic rescaling, unfinished draft saving, CSV export and JSON backup. Existing features and visual structure remain. Execution readiness cannot be selected during beta.
- **Scientific checks:** retained the entered-unit fix and mandatory parts regressions; fixed microlitre option values, missing/zero presentation, invalid calculation success labels, finite/overflow checks, explicit stoichiometric coefficients, reference-purity handling, impossible stock/final-volume targets, chronological gradients and whole HPLC run counts. Final reaction volume is distinguished from solvent volume to add. Source stock concentrations are not inferred from unlabeled final concentrations.
- **Exports:** `lib/experiment-export.ts` and shared `lib/csv.ts` produce UTF-8, quoted, explicit-unit CSV with separate input and rescaled calculation rows, evidence status and source details. Formula prefixes are escaped in current and legacy exports. Missing values stay blank. Invalid plans do not export partial quantities as successful calculated results. JSON import validates format/schema/size/count, creates new IDs and requires renewed confirmation.
- **Persistence:** repository writes use revision checks and Web Locks where available. Stale tabs cannot overwrite newer revisions. Import writes are atomic at the localStorage-item level and preserve unrelated records. Quota failure keeps the current form available for recovery. A record-key change remounts the workspace, preventing stale state when navigating between records.
- **AI/PDF resilience:** browser authorization before external AI processing, request deadlines, duplicate-request guards, scanned-PDF-only generation support and untrusted-source prompt instructions. A real PDF test exposed a Node Buffer/PDF.js compatibility error; passing a plain Uint8Array fixes the valid-table-PDF failure. Source-excerpt support and mixed-unit parsing were improved.
- **Feedback:** `components/Feedback.tsx`, `lib/feedback.ts`, `/api/feedback` and `supabase/beta-feedback.sql` support categories, feature, description, optional email/role/rating, rate limiting, strict input limits, honeypot and idempotent receipts. Success requires acknowledged storage. No experimental contents are attached. The user-approved email fallback is configured in ignored local environment settings; it opens an email draft for the researcher to send. Download remains available. No email was sent automatically and no database schema was applied.
- **Beta disclosure and guide:** visible prototype, independent-review, confidentiality, Google Gemini processing and local-storage disclosures; researcher comparison protocol and reproducible verification instructions. No behavioral analytics or new application dependencies were added.

## B. Actual verification

| Check | Result |
| --- | --- |
| Automated unit/regression/API tests | 204 passed, 0 failed across 32 test files |
| TypeScript | Passed |
| ESLint | 0 errors; 4 pre-existing warnings |
| Final production build | Passed |
| Browser suite | 17 passed, 0 failed; final rerun recorded in test/beta/verification-results.json |
| Mandatory 2 L / 2000 mL / 500 µL instruction regressions | Passed in unit and browser checks |
| Browser persistence | Refresh, independent records, actual close/reopen of an isolated Chrome disk profile, stale-tab conflict and quota-failure preservation passed |
| Real PDF parsing | Table PDF and image-only PDF passed; malformed PDF rejected |
| CSV in Microsoft Excel | Opened using UTF-8/comma-delimited import; eight columns and Fictional Beta rescaled mass 450 mg verified in the formula bar |
| Live AI/PDF generation | 7 unavailable: all reached the configured provider and returned AUTHENTICATION_FAILED (401); none claimed successful extraction |
| Live malformed-PDF acceptance | Passed, HTTP 422 |
| Feedback API | Mocked acknowledged storage/error/idempotency/security tests passed; actual administrator delivery unavailable without backend configuration |
| Email alternative | Approved recipient configured; email URI construction and browser availability tested. Actual mail-client send/recipient receipt not executed |
| Repository/history secret scan | No findings |
| Built client secret scan | 56 files scanned; no findings |
| Diff whitespace check | Passed |

Browser tests use isolated Chrome profiles with mocked AI and successful feedback responses; real PDF parsing runs through the local server. They cover navigation, manual builder, individual confirmation, rescaling, export/download, save/reopen/reload, backup/import, calculator unit/error states, LC-MS/HPLC, AI consent/success/failure UI, feedback, responsive overflow at 1440 and 390 px, Live Bench rendering, storage failure and actual browser restart. Browser runtime/asset/console errors are audited. Mocked success must not be interpreted as a successful live provider or administrator integration.

An intermediate build and browser run were invalidated because a development server and build shared `.next`; they were excluded and rerun separately. A subsequent nullable-property build error was corrected. Only the final checks are reported as passing.

## C. Outstanding problems and limitations

1. **Live extraction is blocked:** the configured AI key is rejected. Source attribution, ambiguity handling, prompt-injection resistance and chemistry extraction accuracy against actual provider output remain unverified. Prompts and schema validation cannot guarantee factual accuracy. Visual page references are reported extraction claims, not independently verified citations.
2. **Backend feedback is implemented but not enabled/verified:** the local environment lacks Supabase administrator configuration, enabled feedback storage and a shared production rate limiter. The explicit email/download alternative works without adding a third-party mail service; sending and receipt are controlled outside BindLab. Retention requires administrator setup and is not falsely claimed to be automatic.
3. **Controlled access is manual:** no invitation-token gate was added. Use supervised local sessions or owner-approved preview access controls. Do not treat a publicly reachable link as invitation enforcement.
4. **Storage remains local:** no synchronization or cloud backup. Clearing/evicting browser storage, private browsing and changing profile/device/origin remain risks. Web Locks protect cooperating writers where supported; older browsers and legacy writers without locks do not provide a cross-tab atomicity guarantee. Backups contain source text and must be handled accordingly.
5. **Scientific scope:** displayed rounding is not propagated measurement uncertainty. Unknown purity gives nominal mass-derived quantities; source and review status must be checked. Complex structures, multistep associations, unsupported quantity notation and every legacy/demonstration function are not independently scientifically validated. Live Bench remains a demonstration, not a safety or execution decision system.
6. Excel import was checked on this Mac; other spreadsheet applications/locales and mobile Safari/Firefox were not tested. No real laboratory execution, researcher usability study, actual mail delivery, or cloud feedback access/deletion check was performed.

## D. Researcher beta readiness

**Ready for supervised demonstration only.** Use the fictional workflow to test review, rescaling, save/reload, export and feedback handoff. Do not invite researchers to rely on successful live extraction yet. For a controlled beta, first restore provider access, rerun and manually review all synthetic AI/PDF cases, verify production rate limiting and feedback handoff/storage, and establish access controls for the intended preview.

## E. Researcher test guide

See `RESEARCHER_TEST_GUIDE.md` for invitations/disclosures, an independent answer key, a short end-to-end test, stop criteria, and a counterbalanced comparison with preferred tools/Excel. Record time, actions/corrections, numerical errors, missing/misattributed fields, confidence, export completion and voluntary reuse. Use pseudonymous participant codes and consented manual observations; do not collect experimental contents or infer that BindLab wins.

## F. Next development priorities (maximum three)

1. Restore AI credentials and validate source-to-field extraction using the supplied reproducible synthetic acceptance suite and researcher review.
2. Configure/verify controlled preview access, production shared limiting, and feedback receipt plus retention using the existing infrastructure or the approved manual email handoff.
3. Run the 3–5 researcher comparison, then prioritize fixes based on extraction/review/export friction and observed errors rather than adding routine spreadsheet features.

## G. Deployment status

No commits, pushes, merges, production deployments, cloud schema changes or automated emails were made. The existing branch and pre-existing work remain in place. The local feedback recipient was configured in `.env.local`; no credential values were printed or committed. Deployment requires explicit user approval.

## Safari follow-up

The local Safari screenshot subsequently exposed a development-only asset transport failure missed by Chrome checks. Fixed by retaining `upgrade-insecure-requests` only in production, and isolating `.next-dev` from production output. Verified the actual Safari homepage visually and checked page/CSS/logo HTTP 200. The new transport regression tests preserve production HTTPS protections. Full unit suite: 203 passed across 32 files; targeted policy tests and TypeScript passed after the configuration update. The production build listed above predates this small follow-up. No deployment occurred.

## Current recheck — 20 October 2026

The original 201 tests remain covered; two Safari CSP regressions and one CSV warning/missing-value regression bring the total to **204 passing tests in 32 files**. The final production build passed after the development-cache separation. ESLint passes with four existing warnings. TypeScript and browser results are recorded in `test/beta/verification-results.json`.

The user explicitly confirmed the existing local Gemini credential is development-only. Seven synthetic live AI cases were rerun using that server-side configuration: complete procedure, missing values, conflicting conditions, mixed units, table PDF, scanned PDF and source prompt injection. Every case returned HTTP 401 `AUTHENTICATION_FAILED`; no live extraction or scientific output was verified. A replacement valid development credential must be configured locally before these acceptance tests can pass. No credential values are included in this report. Exact-value scans found no configured credential in 109 client build files or 28 local test/server logs.

A real synthetic POST to the running feedback endpoint returned HTTP 503 `FEEDBACK_UNAVAILABLE`, with no receipt or acknowledgement of storage. Storage is disabled and no feedback database is configured. The approved email fallback opens a draft addressed to the configured recipient; a draft is not delivery. **Actual recipient receipt remains unverified.** No test message was emailed and no backend schema or external service was provisioned.

The fictional Alpha/Beta workflow independently checks 100 mg at 100 g/mol = 1 mmol; Beta at 1.5 equivalents and 150 g/mol = 225 mg; 0.1 M final concentration = 10 mL. Rescaling Alpha to 200 mg gives 2 mmol, Beta 450 mg and final solution volume 20 mL. Browser checks cover explicit field confirmation, saving, refresh, independent records, backup/import copies, CSV download, stale-tab protection, storage failure and a real isolated browser restart. AI response behavior is exercised with mocks and deterministic normalization tests; it must not be represented as successful live model evaluation.

Two export findings were corrected during this recheck: deterministic engine warnings now appear in CSV review rows, and an unknown total reaction volume is labeled `Missing / Unverified`. A regression test verifies both. ESLint now excludes the separate generated development cache. These changes do not alter the visual design.

**Remaining beta gates:** successful live AI acceptance with a valid development key; configured and acknowledged feedback storage or a tested manual email process with independently confirmed recipient receipt; supervised researcher assessment using the provided guide. Browser-local storage remains vulnerable to browser clearing, private mode and device loss; export backups are essential. Automated checks establish software behavior for tested cases, not chemical suitability, laboratory safety, scientific validity or experimental success. Missing purity/property/source information still requires independent review.

No changes were committed, pushed, merged or deployed.
