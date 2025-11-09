# AI Agent Guide

This document provides guidance for AI agents working on the Measurement System project.

## Project Overview

This is a tap-only measurement web app built with Next.js (App Router) and Supabase. The goal is to enable operators to record manufacturing events with minimal taps (≤3 taps for start/complete).

## Project Structure

### Key Directories

- `src/app/` - Next.js App Router pages and routes
- `src/components/` - React components (UI primitives and feature components)
- `src/lib/` - Utilities, Supabase client, API functions
- `src/types/` - TypeScript type definitions
- `src/hooks/` - Custom React hooks
- `supabase/migrations/` - Database migration files
- `supabase/functions/` - Supabase Edge Functions
- `docs/` - Project documentation

### Important Files

- `docs/PDR.md` - **Source of truth** for all requirements and specifications
- `supabase/migrations/001_initial_schema.sql` - Complete database schema
- `src/lib/supabase/client.ts` - Supabase client configuration
- `src/types/database.ts` - Database types (generated from Supabase schema)

## Coding Conventions

### TypeScript

- Use strict TypeScript configuration
- Prefer type inference where possible
- Use `database.ts` types for database entities
- Define component props with interfaces or types

### React Components

- Use functional components with hooks
- Prefer server components where possible (Next.js App Router)
- Client components should be marked with `'use client'`
- Component files: PascalCase (e.g., `StageCard.tsx`)
- Component props: TypeScript interfaces

### Styling

- Use Tailwind CSS for styling
- Use Radix UI primitives for accessible components
- Mobile-first design (phone-first tap UI)
- Minimum touch target: 48px × 48px
- Use Tailwind's responsive utilities (`sm:`, `md:`, `lg:`)

### Database

- All tables use UUID primary keys
- Use `timestamptz` for all timestamps
- RLS (Row Level Security) policies enforce org-scoped access
- Indexes on `(org_id, stage, ts_server)` and `(org_id, unit_id)`

### API Patterns

- Edge Functions use Zod for validation
- Idempotency keys prevent duplicate events
- Auto-attach `org_id` from JWT (never trust client)
- Return consistent error formats

## Common Workflows

### Adding a New Component

1. Create component file in `src/components/`
2. If using Radix UI, wrap in `src/components/ui/` wrapper
3. Export from component file
4. Use TypeScript interfaces for props
5. Style with Tailwind classes
6. Ensure mobile-first, tap-friendly design

### Adding a Database Migration

1. Create new migration file: `supabase/migrations/XXX_description.sql`
2. Use `CREATE TABLE`, `ALTER TABLE`, etc.
3. Add RLS policies if needed
4. Add indexes for performance
5. Test migration locally: `supabase db reset`

### Adding an Edge Function

1. Create function directory: `supabase/functions/function_name/`
2. Create `index.ts` with handler
3. Use Zod for request validation
4. Implement idempotency checks
5. Return consistent response format
6. Deploy: `supabase functions deploy function_name`

### Adding a New Page/Route

1. Create directory in `src/app/route_name/`
2. Create `page.tsx` for the route
3. Add `layout.tsx` if needed
4. Use server components by default
5. Mark client components with `'use client'`
6. Add to navigation if needed

## Database Schema Reference

### Core Tables

- `orgs` - Organizations
- `org_members` - User-organization membership with roles
- `workstations` - Manufacturing workstations
- `orders` - Production orders
- `units` - Individual units being manufactured
- `unit_batches` - Batches for creating units
- `events` - All manufacturing events (start, complete, blockers, etc.)
- `op_sessions` - Operator work sessions (current context)

### Key Enums

- `stage_key`: `order_info`, `bead_prep`, `insert_beads`, `pack`, `ship`
- `event_type`: `stage_start`, `stage_complete`, `rework_*`, `blocker`, `shipment_dispatch`, `annotation`
- `role_key`: `operator`, `supervisor`, `admin`

### Relationships

- `org_members.user_id` → `auth.users.id`
- `org_members.org_id` → `orgs.id`
- `units.order_id` → `orders.id`
- `events.unit_id` → `units.id`
- `events.org_id` → `orgs.id`
- `op_sessions.user_id` → `auth.users.id`
- `op_sessions.org_id` → `orgs.id`

## API Patterns

### Edge Function Structure

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const schema = z.object({
  // Define schema
})

serve(async (req) => {
  try {
    // Validate request
    const body = await req.json()
    const data = schema.parse(body)
    
    // Get Supabase client
    const supabase = createClient(...)
    
    // Check auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    
    // Extract org_id from JWT (never trust client)
    
    // Implement idempotency check
    
    // Process request
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
```

### Idempotency Pattern

```typescript
// Generate idempotency key
const idempotencyKey = crypto
  .createHash('sha256')
  .update(`${unit_id}-${stage}-${type}-${Math.floor(ts_device / 1000)}`)
  .digest('hex')

// Check if already processed
const existing = await supabase
  .from('events')
  .select('id')
  .eq('idempotency_key', idempotencyKey)
  .single()

if (existing.data) {
  return { success: true, id: existing.data.id, duplicate: true }
}
```

## Testing Considerations

- Test mobile-first UI (use browser dev tools)
- Test tap interactions (large buttons, haptics)
- Test idempotency (duplicate requests)
- Test RLS policies (org isolation)
- Test realtime subscriptions (WIP board updates)

## Performance Targets

- Median write latency < 600 ms
- ≤ 3 taps to log start/complete
- ≥ 95% completeness of traces

## Common Pitfalls

1. **Forgetting RLS**: Always test with different org contexts
2. **Trusting client org_id**: Always extract from JWT
3. **Missing idempotency**: Duplicate taps can corrupt data
4. **Small touch targets**: Ensure minimum 48px × 48px
5. **Not handling offline**: Show toast and retry button (no offline mode)

## Resources

- [PDR](PDR.md) - Complete requirements
- [Architecture](ARCHITECTURE.md) - Technical details
- [API](API.md) - API documentation
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/)

