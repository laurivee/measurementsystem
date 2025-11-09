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

## Adding the GitHub Actions Workflow

Due to GitHub security restrictions, you need to add the workflow file manually:

1. Go to: https://github.com/laurivee/measurementsystem
2. Click "Add file" → "Create new file"
3. Path: `.github/workflows/supabase.yml`
4. Copy the contents from the file in your local repository (see below)
5. Click "Commit new file"

**Workflow file contents:**
```yaml
name: Supabase

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/migrations/**'
      - 'supabase/functions/**'
  pull_request:
    branches:
      - main
    paths:
      - 'supabase/migrations/**'
      - 'supabase/functions/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Link Supabase project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Run database migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Deploy Edge Functions
        run: |
          supabase functions deploy ingest_event
          supabase functions deploy bulk_ingest
          supabase functions deploy export_csv
          supabase functions deploy blocker
          supabase functions deploy create_next_unit
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

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

