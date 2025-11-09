# Deployment Checklist

## ✅ Completed
- [x] Repository cloned and set up
- [x] Node.js installed
- [x] Dependencies installed
- [x] Security vulnerabilities fixed (Next.js updated)
- [x] Supabase credentials configured in `.env.local`
- [x] Project pushed to GitHub
- [x] Supabase project linked (config.toml created)

## 🔲 Still Needed

### 1. Supabase Backend Setup

#### 1.1 Login to Supabase CLI
```bash
supabase login
```
This will open a browser for authentication.

#### 1.2 Link Your Project
```bash
npm run supabase:link
# or: supabase link --project-ref qdkdosuupmouquvkiqfi
```

#### 1.3 Run Database Migrations
```bash
npm run supabase:migrate
# or: supabase db push
```
This creates all tables, functions, and RLS policies in your Supabase database.

#### 1.4 Deploy Edge Functions
```bash
npm run supabase:deploy:all
# or: supabase functions deploy ingest_event && supabase functions deploy bulk_ingest && supabase functions deploy export_csv && supabase functions deploy blocker && supabase functions deploy create_next_unit
```

### 2. Vercel Frontend Deployment

#### 2.1 Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

#### 2.2 Login to Vercel
```bash
vercel login
```

#### 2.3 Deploy to Vercel
```bash
vercel
```
Follow the prompts:
- Link to existing project? **No** (first time)
- Project name: `measurementsystem` (or your choice)
- Directory: `./` (current directory)
- Override settings? **No**

Or connect via GitHub:
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import repository: `laurivee/measurementsystem`
4. Framework: Next.js (auto-detected)
5. Configure environment variables (see step 2.4)

#### 2.4 Configure Environment Variables in Vercel

In Vercel Dashboard > Project Settings > Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://qdkdosuupmouquvkiqfi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFka2Rvc3V1cG1vdXF1dmtpcWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2ODY5MDksImV4cCI6MjA3ODI2MjkwOX0.Zn4sxKWBiRHAOn2WqTHBZjDOJf6dKIlTOcK4DCeLIOQ
```

**Important**: 
- Set for all environments: Production, Preview, Development
- These are the same values from your `.env.local`

### 3. Supabase Auth Configuration

#### 3.1 Configure Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration:

Add your Vercel domain(s):
- `https://your-project.vercel.app`
- `https://your-project.vercel.app/auth/callback`

(Replace `your-project` with your actual Vercel project name)

### 4. Testing

#### 4.1 Test Database Connection
- Visit your Vercel deployment
- Check browser console for any connection errors

#### 4.2 Test Authentication
- Try to sign up/login
- Verify user is created in Supabase Dashboard > Authentication > Users

#### 4.3 Test Core Features
- Create an organization
- Create workstations
- Create orders and units
- Test event logging

## Quick Start Commands

Once Supabase CLI is logged in:

```bash
# Link project (one-time)
npm run supabase:link

# Deploy everything
npm run supabase:migrate && npm run supabase:deploy:all

# Deploy to Vercel
vercel --prod
```

## Troubleshooting

### Supabase CLI not authenticated
```bash
supabase login
```

### Migration fails
- Check Supabase Dashboard > Database > Migrations
- Verify you have the correct project linked
- Try manually running SQL from `supabase/migrations/001_initial_schema.sql` in SQL Editor

### Vercel build fails
- Check environment variables are set correctly
- Verify `NEXT_PUBLIC_` prefix is used
- Check build logs in Vercel Dashboard

### Auth not working
- Verify redirect URLs in Supabase Dashboard
- Check environment variables match between `.env.local` and Vercel
- Verify Supabase project URL is correct

## Next Steps After Deployment

1. Create test users (operator, supervisor)
2. Set up demo data (organizations, workstations, orders)
3. Test all workflows
4. Monitor Supabase Dashboard for errors
5. Set up Vercel Analytics (optional)

