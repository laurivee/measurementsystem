# Deployment Guide

## Overview

This guide covers deploying the Measurement System to production using Vercel (frontend) and Supabase (backend).

## Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- Supabase account ([supabase.com](https://supabase.com))
- Git repository connected to GitHub
- Node.js 18+ installed locally (for local development)

## Step 1: Set Up Supabase Project

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `measurement-system` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development

### 1.2 Apply Database Migrations

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Apply migrations:
```bash
supabase db reset
```

Or manually apply migrations:
```bash
# Copy migration SQL from supabase/migrations/001_initial_schema.sql
# Paste into Supabase Dashboard > SQL Editor > Run
```

### 1.3 Set Up Seed Data (Optional)

1. Run seed script:
```bash
supabase db seed
```

Or manually run `supabase/seed.sql` in the SQL Editor.

### 1.4 Deploy Edge Functions

Deploy each Edge Function:

```bash
supabase functions deploy ingest_event
supabase functions deploy bulk_ingest
supabase functions deploy export_csv
```

### 1.5 Get Supabase Credentials

From Supabase Dashboard > Settings > API:

- **Project URL**: `https://xxx.supabase.co`
- **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

## Step 2: Set Up Vercel Project

### 2.1 Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository: `jukka-matti/measurementsystem`
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### 2.2 Configure Environment Variables

In Vercel project settings > Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: 
- Use `NEXT_PUBLIC_` prefix for client-accessible variables
- Never commit service_role key to client code
- Set for all environments: Production, Preview, Development

### 2.3 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Visit your deployment URL: `https://your-project.vercel.app`

## Step 3: Configure Supabase Auth

### 3.1 Set Up Auth Providers

In Supabase Dashboard > Authentication > Providers:

1. **Email**: Enable (default)
2. **Email Templates**: Customize if needed
3. **Redirect URLs**: Add your Vercel domain:
   - `https://your-project.vercel.app`
   - `https://your-project.vercel.app/auth/callback`

### 3.2 Set Up RLS Policies

Verify RLS policies are enabled:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should show rowsecurity = true for all tables
```

Policies should be created by the migration file. Verify in Dashboard > Authentication > Policies.

## Step 4: Post-Deployment Checklist

### 4.1 Test Authentication

1. Visit your Vercel deployment
2. Try to sign up/login
3. Verify email confirmation works (if enabled)
4. Check that user is created in `auth.users`

### 4.2 Test Core Functionality

1. **Operator Flow**:
   - Login as operator
   - Choose workstation
   - Select a unit
   - Start a stage
   - Complete a stage
   - Verify events are created

2. **Supervisor Flow**:
   - Login as supervisor
   - View dashboard
   - Verify WIP board updates in real-time
   - Check metrics (FPY, throughput, etc.)

3. **Edge Functions**:
   - Test `ingest_event` endpoint
   - Verify idempotency (duplicate requests)
   - Test CSV export

### 4.3 Verify RLS

Test that users can only access their org's data:

1. Create two test orgs
2. Create users in each org
3. Verify user from org A cannot see org B's data

## Step 5: Monitoring & Maintenance

### 5.1 Set Up Monitoring

**Vercel Analytics**:
- Enable in Vercel Dashboard > Analytics
- Monitor page views, performance, errors

**Supabase Monitoring**:
- Dashboard > Logs: View Edge Function logs
- Dashboard > Database: Monitor query performance
- Dashboard > API: View API usage

### 5.2 Set Up Alerts

**Vercel**:
- Set up email notifications for failed deployments
- Monitor build times

**Supabase**:
- Set up alerts for database size (free tier limits)
- Monitor API usage (free tier: 50K requests/month)

### 5.3 Backup Strategy

**Database Backups**:
- Supabase free tier: Daily backups (7-day retention)
- Upgrade to Pro for longer retention
- Export data regularly via CSV export function

**Code Backups**:
- Git repository is the source of truth
- Tag releases: `git tag v1.0.0`

## Step 6: Environment-Specific Configurations

### Development

Local `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local_anon_key
```

Run Supabase locally:
```bash
supabase start
```

### Staging

Create a separate Supabase project for staging:
1. Create new Supabase project: `measurement-system-staging`
2. Apply same migrations
3. Create Vercel preview environment with staging Supabase credentials

### Production

Use production Supabase project and Vercel production deployment.

## Troubleshooting

### Build Failures

**Error**: `Module not found`
- Check `package.json` dependencies
- Run `npm install` locally to verify

**Error**: `Environment variable not found`
- Verify variables are set in Vercel Dashboard
- Check variable names match exactly (case-sensitive)

### Runtime Errors

**Error**: `Unauthorized` or `Invalid JWT`
- Check Supabase URL and anon key are correct
- Verify JWT token is being sent in requests
- Check Supabase Auth is configured correctly

**Error**: `RLS policy violation`
- Verify user belongs to an org (`org_members` table)
- Check RLS policies are enabled and correct
- Verify `org_id` is being extracted from JWT (not client)

### Database Issues

**Slow Queries**:
- Check indexes are created (see migration file)
- Use Supabase Dashboard > Database > Query Performance
- Consider adding additional indexes for common queries

**Connection Limits**:
- Free tier: 60 connections
- Monitor in Dashboard > Database
- Consider connection pooling

## Rollback Procedure

### Rollback Frontend

1. Go to Vercel Dashboard > Deployments
2. Find previous successful deployment
3. Click "..." > "Promote to Production"

### Rollback Database

1. **Dangerous**: Restore from backup (loses recent data)
2. **Safer**: Create new migration to undo changes:
```sql
-- Example: rollback a column addition
ALTER TABLE events DROP COLUMN IF EXISTS new_column;
```

## Scaling Considerations

### When to Upgrade

**Supabase**:
- Free tier: 500MB database, 50K API requests/month
- Upgrade to Pro ($25/month) for:
  - 8GB database
  - 500K API requests/month
  - Longer backup retention

**Vercel**:
- Free tier: 100GB bandwidth/month
- Upgrade to Pro ($20/month) for:
  - Unlimited bandwidth
  - Team collaboration
  - Advanced analytics

### Performance Optimization

1. **Database**:
   - Add indexes for slow queries
   - Use materialized views for complex metrics
   - Partition `events` table by date if >10M rows

2. **Frontend**:
   - Enable Vercel Edge caching
   - Use Next.js Image optimization
   - Implement pagination for large lists

3. **Edge Functions**:
   - Optimize SQL queries
   - Use connection pooling
   - Cache frequently accessed data

## Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Service role key never exposed to client
- [ ] Environment variables set securely in Vercel
- [ ] Auth redirect URLs configured correctly
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] CORS configured in Supabase (if needed)
- [ ] Rate limiting considered (not implemented yet)

## References

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Supabase Deployment Docs](https://supabase.com/docs/guides/getting-started)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

