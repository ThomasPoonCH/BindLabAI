# BindLab security and deployment notes

## Secret handling

- Real secrets belong only in ignored environment files or deployment-platform secret storage.
- `.env.example` contains empty placeholders only.
- `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `OPENAI_API_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, and `UPSTASH_REDIS_REST_TOKEN` are server-only.
- Only the Supabase project URL and anon key use `NEXT_PUBLIC_`; these values are designed to
  be public and still depend on Row Level Security.
- Deleting a key from the current tree is not sufficient if it was ever committed, pasted into
  a public issue, or otherwise disclosed. Revoke and rotate the affected credential at its
  provider, then update the deployment secret.

Run both redacted checks before release:

```bash
npm run security:scan
npm run build
npm run security:scan-client
```

The scanners report only a variable/category and file location. They never print a matching
secret value.

## Cloud experiment containment

The visible product continues to use browser localStorage. The interface labels this explicitly.
Cloud experiment API routes require a verified Supabase user and restrict every query to that
user. Secure cloud saving is intentionally not exposed as a UI button until the migration and
two-user isolation tests have been run against the production Supabase project.

Legacy service-role persistence routes return a safe unavailable response in production.
The service-role key must not be used for normal user CRUD.

## Shared AI rate limiting

Production AI and PDF routes fail closed unless both variables are configured:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

The development fallback is intentionally process-local and is not represented as globally
reliable. Vercel deployments need the shared Redis REST configuration.

Current prototype limits are deliberately conservative:

- experiment builder: 4 requests per network identifier per 60 seconds;
- general Gemini route: 5 requests per network identifier per 60 seconds;
- PDF extraction: 6 requests per network identifier per 60 seconds;
- AI and PDF work: at most 2 simultaneous jobs per function instance (best effort, not a
  distributed lock);
- JSON prompts: 12,000 characters on the general route and 36,000 characters for experiment
  evidence; provider calls time out after 15 seconds;
- PDF uploads: `application/pdf` plus a `.pdf` extension and `%PDF-` signature, 8 MiB, 30 pages,
  24,000 extracted characters, and a 10-second parser timeout.

The upload route parses PDFs in memory and never writes them to disk or creates a public URL.
Encrypted, empty, malformed, disguised, and unsupported documents receive generic errors.

## Supabase authentication

Configure Supabase Auth site URL and allowed redirect URLs for:

- `https://YOUR_PRODUCTION_DOMAIN/auth/callback`
- local development callback URLs only when needed.

Apply `supabase/migrations/003_authenticated_ownership_hardening.sql` only after reviewing the
existing null-owned demonstration rows. The migration does not assign those records to anyone.
It makes them invisible and rejects new null-owned rows. Do not validate the new NOT VALID
constraints until the owner deliberately archives or removes all legacy null-owned records.

## Public route boundary

See `PRODUCTION_PUBLIC_ROUTES.md`. Funding, legacy lab-preparation, and legacy project-detail
pages return 404 in production. `robots.txt` is supplementary and is not access control.
