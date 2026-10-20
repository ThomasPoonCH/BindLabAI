> Historical first-pass report. Superseded by `BETA_READINESS_REPORT.md` and `RESEARCHER_TEST_GUIDE.md`.

# BindLab AI pre-researcher reliability review

Date: 20 October 2026. Development branch: `codex/production-security-hardening`.
No deployment, merge, push, new service, or dependency installation was performed.

## A. Problems discovered

- Parts instructions already correctly kept entered B quantities separate from normalized calculation units. Existing regression tests cover 2 L, 2000 mL, and 500 µL. That fix was retained.
- The parts UI used the same state for both reference-unit selectors, so changing either silently changed both.
- Volume-ratio helpers accepted non-volume units. Percentage conversion accepted w/w, w/v, and v/v as equivalent.
- Several low-level chemistry helpers validated denominators but accepted negative, NaN, or infinite numerators; some arithmetic could overflow.
- Text fallback could scan past another reagent and attach its quantity to an earlier reagent.
- AI provenance normalization accepted an AI claim of researcher confirmation.
- Draft merging checked only a few conflicts and could replace conditions or pair a retained concentration with the incoming unit.
- Saving automatically assigned ready_to_run. Failed writes were uncaught; corrupt or incompatible local records could be silently discarded during a later save.
- Record list read failures looked like an empty list. Bench autosave failures were uncaught.
- No lightweight feedback form existed.

## B. Improvements implemented

- Independent reference unit selectors; entered quantity/unit instruction formatting retained.
- Dimension checks for volume mixtures, percentage basis rejection, numerator and result validation, safer ratio arithmetic, empty parts inputs treated as missing.
- Conservative immediately attached quantity extraction; no inferred experimental conditions added.
- AI responses cannot set researcher confirmation or ready status. Unverified source values and suggestions have explicit labels; missing solvent, duration, and temperature are visible. Prompt rules explicitly prohibit invented parameters and require labeling suggestions.
- Expanded condition/workup conflict review and preservation of selected units.
- Saves stay in needs_review; unfinished drafts can be saved separately. Write failures preserve the open form and provide recovery guidance.
- Existing corrupt/incompatible storage is not overwritten. Existing compatible records remain under the original key and are updated by experiment ID; no migration occurred.
- Storage limitations are disclosed beside save. Record read errors and Bench autosave failures are surfaced.
- Footer feedback form offers five categories, description, optional contact, local saving, and JSON download. It collects no experiment contents or diagnostics automatically. It explicitly states that feedback has not been delivered to BindLab; pilot coordinators must arrange sharing.

## C. Scientific accuracy verification

Regression suite covers entered units, volume/mass/amount/concentration conversions, dilution, molarity, equivalents/reaction calculations, impossible inputs, overflow, percentage bases, AI malformed/partial responses, retry edit preservation, AI self-confirmation, quantity attribution, and condition conflicts.

The mandatory 2 L / 2000 mL / 500 µL examples pass. For the existing 5 mL per 10000 mL reference, 2 L water requires 1 mL TFA, and instructions retain 2 L.

Remaining scientific limitations:
- AI extraction is schema checked, not independently verified against every source claim. Prompt instructions cannot guarantee hallucination-free output. Every extracted value requires researcher review.
- Provenance is primarily per reagent and condition group, not a complete per-field immutable audit trail. Editing one condition currently updates group provenance; granular provenance needs further work.
- Quantity extraction intentionally misses complex notation, separated quantities, multiple conflicting occurrences, and many chemistry structures. Missing values must be supplied by researchers.
- Display precision is formatting, not an uncertainty/significant-figure propagation model.
- Mixture component volumes are approximate; mixing can change volume. This prototype is not a validated experiment execution or safety system.

## D. Data reliability

Canonical experiment records use localStorage key `bindlab-canonical-experiments`; legacy exports use `bindlab-experiments`. Live Bench demo and feedback use separate browser keys. Canonical saves preserve independent records and update by ID.

localStorage normally persists across refresh and normal browser restarts in the same browser profile/origin. This was verified through repository tests simulating retained storage, not a real browser restart. Clearing storage, private browsing, device/profile/origin changes, quota failures, or browser eviction can remove or hide records. There is no canonical record cloud backup or synchronization. Concurrent writes from multiple tabs remain a risk.

Separate legacy project APIs have Supabase support and a server JSON fallback in `.local-data`; the active canonical browser workflow does not use that fallback. Its read-error suppression and non-atomic read/modify/write behavior remain risks if those legacy paths are enabled. No existing data was modified during tests.

## E. Testing results

- Vitest: 25 files, 146 tests passed.
- TypeScript: passed.
- ESLint: zero errors; four existing warnings (three image element warnings and one anonymous config export).
- Production build: passed (rechecked after final UI changes).
- Local production route smoke checks: homepage, reaction builder, calculators, records, and Live Bench demo all returned HTTP 200.
- Repository/history secret scan: no findings. Built client bundle scan: no findings.
- No live paid AI requests, real PDF validation, interactive browser workflow/restart tests, or external database tests were performed. HTTP smoke checks do not verify interactive behavior.

## F. Researcher testing readiness

Suitable changes for a supervised prototype review, but do not yet treat all requested acceptance criteria as satisfied or describe the app as scientifically validated or bench ready. Before inviting an external pilot, perform browser acceptance tests with researcher-reviewed fixtures, confirm real AI timeout and malformed-response behavior, verify refresh/restart and quota recovery in supported browsers, and test the feedback sharing process.

Disclose local-only storage, manual feedback sharing, unverified AI extraction, group-level provenance, display precision limitations, and the demonstration nature of Live Bench Mode. Before wider release, prioritize field-level provenance/confirmation, source evidence verification, multi-tab persistence protection and export/recovery, and a delivered feedback channel.

Deployment remains pending user approval; no production changes were made.
