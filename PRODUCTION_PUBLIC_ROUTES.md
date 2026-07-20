# Proposed production public-route allowlist

Owner approval is required before treating this list as final.

## Public product routes

- `/`
- `/about`
- `/dashboard`
- `/dashboard/reaction/new`
- `/dashboard/calculators`
- `/dashboard/dilution`
- `/dashboard/lcms`
- `/dashboard/experiments`
- `/dashboard/experiments/[local-id]`
- `/dashboard/bench-mode-demo`
- `/dashboard/pilot`
- `/start-experiment` (legacy local-browser workflow)
- `/analysis`
- `/privacy`
- `/terms`
- `/data-handling`
- `/auth`
- `/account` (authenticated, noindex)

## Public API entry points with controls

- `/api/gemini`
- `/api/ai/experiment-builder`
- `/api/ai/pdf-extract`
- `/api/experiments` (authenticated only)
- `/api/experiments/[id]` (authenticated owner only)

## Production-hidden routes

- `/dashboard/funding`
- `/dashboard/new`
- `/dashboard/project/[id]`

These routes return 404 in production. `noindex` is also used where appropriate but is not the
access-control mechanism.

## Disabled or migration-only API surfaces

The legacy lab-preparation and calculation-log persistence routes must not use a service-role
client for public user data. They should remain unavailable in production until converted to
verified user-scoped access and tested against the ownership migration.
