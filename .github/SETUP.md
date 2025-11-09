# Supabase CLI Setup

This repository is connected to your Supabase project: `qdkdosuupmouquvkiqfi`

## Quick Start

### 1. Login to Supabase CLI

```bash
supabase login
```

This will open a browser for authentication.

### 2. Link Your Project

```bash
supabase link --project-ref qdkdosuupmouquvkiqfi
```

### 3. Deploy Database Migrations

Apply all migrations to your Supabase project:

```bash
supabase db push
```

Or apply a specific migration:

```bash
supabase migration up
```

### 4. Deploy Edge Functions

Deploy all Edge Functions:

```bash
supabase functions deploy ingest_event
supabase functions deploy bulk_ingest
supabase functions deploy export_csv
supabase functions deploy blocker
supabase functions deploy create_next_unit
```

Or deploy all at once:

```bash
supabase functions deploy
```

## Common Workflow

When you make changes to migrations or functions:

1. **Database changes**: 
   ```bash
   supabase db push
   ```

2. **Edge Function changes**:
   ```bash
   supabase functions deploy <function-name>
   ```

3. **Both**:
   ```bash
   supabase db push && supabase functions deploy
   ```

## Alternative: Manual Deployment via Dashboard

If you prefer not to use CLI:

1. **Database Migrations**: Copy SQL from `supabase/migrations/001_initial_schema.sql` and paste into Supabase Dashboard > SQL Editor
2. **Edge Functions**: Deploy via Supabase Dashboard > Edge Functions > Deploy

## Project Reference

Your Supabase project reference: `qdkdosuupmouquvkiqfi`

This is configured in `supabase/config.toml` and used when you run `supabase link`.

