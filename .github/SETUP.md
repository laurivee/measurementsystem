# GitHub + Supabase Setup

This repository is connected to your Supabase project: `qdkdosuupmouquvkiqfi`

## GitHub Secrets Setup

To enable automatic database migrations and Edge Function deployments via GitHub Actions, you need to add the following secrets to your GitHub repository:

1. Go to: https://github.com/laurivee/measurementsystem/settings/secrets/actions
2. Click "New repository secret"
3. Add these secrets:

### Required Secrets:

- **`SUPABASE_ACCESS_TOKEN`**: Your Supabase access token
  - Get it from: https://app.supabase.com/account/tokens
  - Or run: `supabase login` and copy the token

- **`SUPABASE_PROJECT_REF`**: Your project reference
  - Value: `qdkdosuupmouquvkiqfi`

## How It Works

- When you push changes to `supabase/migrations/` or `supabase/functions/`, GitHub Actions will:
  1. Run database migrations automatically
  2. Deploy updated Edge Functions
  3. Keep your Supabase project in sync with your code

## Manual Setup (Alternative)

If you prefer to manage migrations manually:

```bash
# Link your project
supabase link --project-ref qdkdosuupmouquvkiqfi

# Apply migrations
supabase db push

# Deploy functions
supabase functions deploy ingest_event
supabase functions deploy bulk_ingest
supabase functions deploy export_csv
supabase functions deploy blocker
supabase functions deploy create_next_unit
```

