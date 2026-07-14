# BindLab AI Production Deployment Checklist

This checklist ensures BindLab AI is properly configured and deployed for production use.

## Phase 1: Pre-Deployment (Local)

### Code Quality
- [x] Production build succeeds: `npm run build` ✓
- [x] No TypeScript errors
- [x] API endpoints implemented and tested
- [x] Supabase migrations created
- [ ] Address ESLint warnings (image optimization - optional for MVP)

### Git & Repository
- [ ] All code committed to GitHub
- [ ] Feature branch pushed to origin
- [ ] Ready for merge to main

### Environment Variables (Local Testing)
- [ ] Create `.env.production.local` with test credentials
- [ ] Test variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  GEMINI_API_KEY=
  ```

## Phase 2: Supabase Setup

### Supabase Project Creation
- [ ] Create new Supabase project: https://supabase.com
- [ ] Project name: `bindlab-ai-prod`
- [ ] Choose region (closest to target users)
- [ ] Set strong database password
- [ ] Wait for initialization

### Database Configuration
- [ ] Go to SQL Editor in Supabase dashboard
- [ ] Run migration: `supabase/migrations/001_initial_schema.sql`
- [ ] Run migration: `supabase/migrations/002_experiments_schema.sql`
- [ ] Verify tables created:
  - `public.experiments`
  - `public.experiment_calculations`
  - `public.experiment_protocol_versions`
  - `public.experiment_lcms_plans`
  - `public.experiment_exports`

### Credentials Collection
- [ ] Copy from Supabase **Project Settings > API**:
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)
- [ ] Verify credentials work locally
- [ ] Test: `npm run dev` loads without database errors

### Security Configuration (Optional for MVP)
- [ ] Enable Row Level Security (RLS) policies - ✓ Already in migration
- [ ] Review RLS policies in Supabase dashboard
- [ ] Test experiment creation/retrieval via API

## Phase 3: Gemini API Setup

### Google AI Studio Configuration
- [ ] Create account at https://aistudio.google.com
- [ ] Create API Key: https://aistudio.google.com/app/apikey
- [ ] Copy API key: → `GEMINI_API_KEY`
- [ ] Set spending limits in Google Cloud Console
- [ ] Verify API key works locally
- [ ] Test: Create experiment and generate protocol

### Model Selection
- [ ] Primary model: `gemma-4-31b-it` (or your preferred model)
- [ ] Fallback model: `gemini-flash-latest`
- [ ] Verify both models have quota

## Phase 4: Vercel Deployment

### Repository Setup
- [ ] GitHub repository is public or Vercel has access
- [ ] All code pushed to GitHub
- [ ] Ready to import

### Vercel Project Creation
- [ ] Go to https://vercel.com
- [ ] Click **Add New > Project**
- [ ] Select **Import Git Repository**
- [ ] Choose ThomasPoonCH/BindLabAI
- [ ] Vercel auto-detects Next.js framework

### Environment Variables (Production)
In Vercel **Settings > Environment Variables**, add:

**Public Variables** (safe to expose):
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Secret Variables** (marked as secret):
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `GEMINI_API_KEY`

Optional:
- [ ] `GEMINI_MODEL=gemma-4-31b-it`
- [ ] `GEMINI_FALLBACK_MODEL=gemini-flash-latest`

### Deployment
- [ ] Review build settings (should auto-detect)
- [ ] Click **Deploy**
- [ ] Wait for build to complete (~3-5 minutes)
- [ ] Deployment successful: check Vercel dashboard

### Post-Deployment Verification
- [ ] Open production URL: `https://your-bindlab.vercel.app`
- [ ] Page loads without errors
- [ ] Create test experiment:
  1. Navigate to `/dashboard`
  2. Click "New Experiment"
  3. Fill in basic info
  4. Add reagents
  5. Calculate amounts
  6. Save experiment
- [ ] Experiment persists after page refresh
- [ ] Can reopen saved experiment
- [ ] AI protocol generation works (if Gemini configured)

## Phase 5: Monitoring & Maintenance

### Daily Checks (First Week)
- [ ] App loads from production URL
- [ ] Create test experiment to verify database
- [ ] Check Vercel error logs for any issues
- [ ] Monitor Supabase dashboard

### Weekly Checks
- [ ] Review Gemini API usage in Google Cloud Console
- [ ] Check Supabase database size
- [ ] Test experiment export functionality
- [ ] Verify no new error patterns in logs

### Monthly Checks
- [ ] Update dependencies: `npm update`
- [ ] Run security audit: `npm audit`
- [ ] Review backup status in Supabase
- [ ] Check spending limits and billing

## Phase 6: Troubleshooting

### App Won't Load
1. Check Vercel deployment status
2. View deployment logs in Vercel dashboard
3. Verify all environment variables are set
4. Check browser console for errors

### Database Connection Errors
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Check Supabase project is active
4. Test database connection in Supabase SQL editor

### Experiments Won't Save
1. Check browser Network tab for failed requests
2. Verify Supabase RLS policies allow inserts
3. Check Supabase database logs
4. Verify `experiment_status` is valid enum value

### Gemini AI Not Working
1. Verify `GEMINI_API_KEY` is set in Vercel
2. Check API key is valid in Google AI Studio
3. Verify API has quota remaining
4. Check /api/gemini logs in Vercel

## Phase 7: Optimization (Post-Launch)

- [ ] Fix ESLint image warnings (optional)
- [ ] Add database indexing optimization
- [ ] Enable Vercel Web Analytics
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Implement authentication for multi-user support
- [ ] Add user onboarding tutorial

## Sign-Off

- [ ] All checks completed
- [ ] Production deployment verified
- [ ] Team notified of production URL
- [ ] Documentation links shared

**Deployment Date:** _______________
**Deployed By:** _______________
**Verified By:** _______________

## Quick Links

- Production URL: `https://your-bindlab.vercel.app`
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com
- Google Cloud Console: https://console.cloud.google.com
- GitHub Repository: https://github.com/ThomasPoonCH/BindLabAI
