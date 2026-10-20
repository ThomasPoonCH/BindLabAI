# Reproducing beta verification

These scripts operate on synthetic fixtures and isolated browser profiles. Never point them at production or private research records.

## Local checks

```
npm test
npm run typecheck
npm run lint
npm run build
npm run security:scan
npm run security:scan-client
```

Run a development server with `npm run dev` and let it finish starting. Development now uses `.next-dev` and production builds use `.next`, so their generated assets and manifests stay separate.

The browser suite reuses an available Playwright installation without adding an application dependency. Install Playwright in a developer/test environment if it is unavailable, or set `PLAYWRIGHT_MODULE` to an existing package's `index.mjs`. `BETA_CHROME_PATH` may point to an installed Chrome executable; otherwise Playwright's installed Chromium is used.

```
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
BETA_CHROME_PATH=/absolute/path/to/chrome \
node scripts/beta/browser-tests.mjs
```

Defaults: `BETA_TEST_URL=http://localhost:3003`, `BETA_TEST_OUTPUT=/tmp/bindlab-beta-browser`. Results include JSON, screenshots, downloaded CSV/backup/feedback. The suite uses fresh contexts, then actually closes/reopens a unique persistent Chrome profile to test restart persistence. It removes only that temporary profile. AI and successful backend feedback responses are mocked; PDF upload parsing is real. Successful mocked feedback is not evidence of actual delivery.

To regenerate PDF fixtures, run `scripts/beta/make-pdf-fixtures.py` with Python reportlab and Pillow. The checked-in fixtures are synthetic. No real publication or research data is necessary.

## Controlled real AI/PDF acceptance

```
RUN_LIVE_AI=1 node scripts/beta/live-ai-tests.mjs
```

This opt-in sends only the script's synthetic material and PDF fixtures to the existing configured Gemini service. It tests complete/missing/conflicting procedures, mixed units, a table/multiple-step PDF, scanned PDF, source prompt injection and malformed PDF. Results are `/tmp/bindlab-beta-live-results.json`; any returned synthetic drafts are saved separately for manual chemistry review. Automated checks are an acceptance baseline, not independent scientific validation of every extracted field. Review every source attribution, units, absent conditions and generated suggestion manually before changing the readiness classification.

On 20 October, requests reached the provider but its credentials were rejected. No successful live extraction was claimed. Fix GEMINI_API_KEY in the owner's local environment/deployment secret settings; do not paste keys into feedback, source files, or chat. Production must also have the existing shared Upstash limiter configured. Never disable production fail-closed limiting for the pilot.

## Feedback delivery configuration

The local `.env.local` has the owner-supplied `NEXT_PUBLIC_FEEDBACK_EMAIL` fallback. This is intentionally a public recipient, never a credential. Researchers open their own email draft and send it; BindLab cannot confirm receipt. Download remains available without email software. No automated email was sent during development.

For secure backend storage using the existing Supabase project:

1. Review/apply `supabase/beta-feedback.sql` to the approved project. No schema or cloud changes were executed in this task.
2. Set server-only SUPABASE_SERVICE_ROLE_KEY and the project's existing NEXT_PUBLIC_SUPABASE_URL. Never prefix the service key with NEXT_PUBLIC.
3. Configure the existing shared rate limiter for production. Enable FEEDBACK_STORAGE_ENABLED=true only after the table, access tests and retention procedure are verified.
4. Confirm a synthetic submission is visible to the administrator, cannot be read by anonymous/authenticated browser roles, and duplicate receipt retries do not create duplicate feedback. Keep the route's origin, strict schema, honeypot, size limit, request timeout and limiter protections.
5. Delete feedback after 30 days using an approved scheduled daily deletion or a documented administrator procedure. The supplied SQL includes the deletion query but does not claim to install a scheduler.

Until these steps are completed, the API returns an honest unavailable response. The email/download alternative is user initiated and is not equivalent to verified backend delivery.

## Controlled access and data

Invitation handling is manual; the application does not enforce an invitation gate. Use owner-approved preview access controls or supervised local sessions. No production deployment is authorized. Browser records are local-only; Web Locks serialize cooperating writes where supported, and revisions reject stale saves. Browsers without Web Locks and legacy code writing the same storage key do not have a cross-tab atomicity guarantee. Keep backups and avoid concurrent editing in those environments. No behavioral analytics were added; use the consented manual comparison protocol instead.

## Safari localhost follow-up (20 October)

Safari exposed a development CSP issue: HTTP asset requests were upgraded to HTTPS. The upgrade directive is now production-only; regression tests retain production HTTPS enforcement and script restrictions. The actual Safari homepage was visually rechecked with typography, grid, cards and logo restored. The page, stylesheet and logo returned HTTP 200. Full tests passed 203/203; targeted transport-policy tests and TypeScript also passed. The last full production build preceded this follow-up; no new deployment was made.
