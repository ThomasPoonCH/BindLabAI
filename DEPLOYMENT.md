# BindLab AI Deployment Guide

## Overview

BindLab AI is a Next.js 15 application with Supabase backend integration. This guide covers production deployment on Vercel (recommended) or other platforms.

## Pre-Deployment Checklist

- [ ] Supabase project created and migrations applied
- [ ] Environment variables collected and secured
- [ ] Build tested locally (`npm run build` succeeds)
- [ ] Production build previewed locally (`npm run preview`)
- [ ] Git repository pushed to GitHub
- [ ] All secrets added to platform (Vercel, Netlify, etc.)

## Step 1: Set Up Supabase

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose a name (e.g., `bindlab-ai-prod`)
4. Choose a region closest to your users
5. Set a strong database password
6. Wait for project initialization (~2 minutes)

### Get Your Credentials

From the Supabase dashboard:

1. Go to **Project Settings** > **API**
2. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Apply Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the query
5. Repeat for `supabase/migrations/002_experiments_schema.sql`

Alternatively, use Supabase CLI:

```bash
npx supabase db push
```

## Step 2: Configure Environment Variables

### Create `.env.production` (Local Testing)

For local production build testing:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemma-4-31b-it
GEMINI_FALLBACK_MODEL=gemini-flash-latest
```

### Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the key and store it securely
4. **Important:** Set up billing limits to prevent runaway costs:
   - Set spending limits in [Google Cloud Console](https://console.cloud.google.com)
   - Monitor usage regularly

### Environment Variables Summary

| Variable | Required | Where | Security | Purpose |
|----------|----------|-------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Vercel | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Vercel | Public | Supabase anon key (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Vercel | **Secret** | Supabase admin key (server-side only) |
| `GEMINI_API_KEY` | Yes | Vercel | **Secret** | Google Gemini API key |
| `GEMINI_MODEL` | No | Vercel | Public | Model name (default: `gemma-4-31b-it`) |
| `GEMINI_FALLBACK_MODEL` | No | Vercel | Public | Fallback model (default: `gemini-flash-latest`) |
| `AI_PROVIDER` | No | Vercel | Public | Must be `gemini` |

## Step 3: Deploy to Vercel

### Initial Setup

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** > **Project**
3. Import your GitHub repository (BindLabAI)
4. Vercel auto-detects it's a Next.js project

### Configure Environment Variables in Vercel

1. Under **Environment Variables**:
   - Add `NEXT_PUBLIC_SUPABASE_URL` (public)
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
   - Add `SUPABASE_SERVICE_ROLE_KEY` (secret)
   - Add `GEMINI_API_KEY` (secret)
   - Add `GEMINI_MODEL` (production)
   - Add `GEMINI_FALLBACK_MODEL` (production)

2. Make sure **secret** variables are marked as such

### Deploy

1. Click **Deploy**
2. Wait for the build to complete (~3-5 minutes)
3. Your app is now live at `https://your-project.vercel.app`

### Post-Deployment

1. Test the app at the Vercel URL
2. Run through the workflow:
   - Create a new experiment
   - Add reagents
   - Calculate amounts
   - Generate protocol (uses Gemini)
   - Save experiment (persists to Supabase)
3. Reopen an experiment to verify persistence
4. Monitor logs in Vercel dashboard

## Alternative: Deploy to Netlify

### Setup

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **Add New Site** > **Import an existing project**
3. Connect your GitHub repository

### Configure Build Settings

- Build command: `npm run build`
- Publish directory: `.next`

### Add Environment Variables

1. Go to **Site Configuration** > **Build & Deploy** > **Environment**
2. Add all variables from Step 2
3. Mark sensitive variables as secrets

### Deploy

1. Click **Deploy Site**
2. Monitor build progress in the Netlify dashboard
3. Access your site once deployment completes

## Alternative: Deploy to Cloudflare Pages

### Setup

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select your account and go to **Pages**
3. Click **Create a project** > **Connect to Git**
4. Select the BindLabAI repository

### Configure Build Settings

- Framework preset: **Next.js**
- Build command: `npm run build`
- Build output directory: `.next`

### Add Environment Variables

1. Under **Settings** > **Environment variables**
2. Add production variables (see Step 2)

### Deploy

1. Click **Save and Deploy**
2. Cloudflare builds and deploys your app

## API Routes

### Create Experiment

```bash
POST /api/experiments
Content-Type: application/json

{
  "title": "Reaction XYZ",
  "objective": "Synthesize compound ABC",
  "reactionType": "small_molecule_synthesis",
  "originalInstruction": "From literature procedure...",
  "experimentStatus": "draft",
  "reagents": [...],
  "conditions": {...},
  ...
}
```

Response (201 Created):

```json
{
  "experimentId": "uuid",
  "title": "Reaction XYZ",
  ...
}
```

### Get All Experiments

```bash
GET /api/experiments
```

Response:

```json
{
  "experiments": [
    {"experimentId": "uuid", ...},
    ...
  ]
}
```

### Get Single Experiment

```bash
GET /api/experiments/:id
```

### Update Experiment

```bash
PATCH /api/experiments/:id
Content-Type: application/json

{
  "title": "Updated title",
  ...
}
```

### Delete Experiment

```bash
DELETE /api/experiments/:id
```

### AI Generation (Gemini)

```bash
POST /api/gemini
Content-Type: application/json

{
  "prompt": "Generate a protocol for this reaction: ...",
  "modelName": "gemma-4-31b-it",
  "temperature": 0.7
}
```

Response:

```json
{
  "text": "Here's a protocol: ...",
  "metadata": {
    "model": "gemma-4-31b-it",
    "tokensUsed": 512
  }
}
```

## Troubleshooting

### Build Fails

**Error:** `NEXT_PUBLIC_SUPABASE_URL is not set`

Solution: Ensure all `NEXT_PUBLIC_*` variables are added to your deployment platform's environment variables.

### Database Errors at Runtime

**Error:** `Failed to connect to Supabase`

Solution:
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. Check Supabase project is active and not in read-only mode
3. Verify migrations have been applied to the database

### Gemini API Errors

**Error:** `429 RESOURCE_EXHAUSTED`

Solution:
1. Check your Google AI Studio quota and billing
2. Wait a few minutes before retrying
3. Consider implementing rate limiting on your backend

**Error:** `Invalid API key`

Solution:
1. Verify `GEMINI_API_KEY` is correct in your platform settings
2. Regenerate the key in Google AI Studio if needed
3. Ensure the key matches your project's API quota

### Experiments Not Saving

**Error:** `Experiments save locally but don't appear after refresh`

Solution:
1. Check browser console for network errors
2. Verify Supabase credentials are correct
3. Ensure RLS policies allow your user (should be `user_id is null` for demo)
4. Check Supabase database in SQL editor to confirm records exist

## Monitoring and Maintenance

### Daily Checks

- [ ] Visit the app and verify it loads
- [ ] Test creating and saving an experiment
- [ ] Monitor Vercel error logs
- [ ] Check Supabase database size (under Settings)

### Weekly Checks

- [ ] Review Gemini API usage in Google Cloud Console
- [ ] Check for any Supabase performance alerts
- [ ] Verify backups are enabled in Supabase

### Monthly Checks

- [ ] Review analytics (if enabled)
- [ ] Update dependencies: `npm update`
- [ ] Run tests: `npm test`
- [ ] Check for security updates: `npm audit`

## Security Checklist

- [ ] Never commit `.env.local` or secrets to Git
- [ ] Supabase RLS policies enforce data isolation
- [ ] Gemini API key is only accessed server-side
- [ ] Use HTTPS everywhere (enforced by Vercel)
- [ ] Enable Supabase Postgres backups
- [ ] Set spending limits on Google Cloud

## Performance Optimization

### Vercel Analytics

1. In Vercel dashboard, click **Analytics**
2. Enable **Web Vitals** monitoring
3. Monitor Core Web Vitals (LCP, FID, CLS)

### Supabase Connection Pooling

For high-traffic deployments:

1. Go to Supabase project settings
2. Enable PgBouncer connection pooling
3. Use the pooling connection string in API routes

## Future Enhancements

- [ ] Add Supabase authentication (move from single-user to multi-user)
- [ ] Implement experiment sharing and collaboration
- [ ] Add file upload support for LCMS data
- [ ] Create admin dashboard for monitoring usage
- [ ] Set up continuous backups to S3
- [ ] Add CDN caching for static assets
