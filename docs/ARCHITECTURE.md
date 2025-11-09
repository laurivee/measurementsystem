# Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │ ──────> │   Vercel     │ ──────> │  Supabase   │
│  (Mobile)   │         │  (Next.js)    │         │  (Postgres) │
└─────────────┘         └──────────────┘         └─────────────┘
                              │                         │
                              │                         │
                              └────────> Edge Functions │
                                         (Deno)         │
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │  Realtime   │
                                                 │  (Pub/Sub)  │
                                                 └─────────────┘
```

### Frontend Architecture

**Framework**: Next.js 14+ with App Router

- **Server Components**: Default for pages and layouts
- **Client Components**: Marked with `'use client'` for interactivity
- **Routing**: File-based routing in `src/app/`
- **Styling**: Tailwind CSS with Radix UI primitives
- **State Management**: React hooks + Supabase Realtime subscriptions

**Key Routes**:
- `/login` - Authentication
- `/choose-workstation` - Workstation selection
- `/units` - Unit list with filters
- `/unit/[id]` - Stage cards for a unit
- `/dashboard` - Supervisor metrics dashboard
- `/admin` - Admin panel

### Backend Architecture

**Database**: Supabase PostgreSQL

- **Tables**: `orgs`, `org_members`, `workstations`, `orders`, `units`, `unit_batches`, `events`, `op_sessions`
- **RLS**: Row Level Security policies enforce org-scoped access
- **Indexes**: Optimized for common queries (org_id, stage, timestamps)
- **Realtime**: Pub/Sub for live WIP updates

**Edge Functions**: Deno runtime

- `ingest_event` - Single event ingestion with validation
- `bulk_ingest` - Batch event ingestion (optional)
- `export_csv` - CSV export for analytics

**Authentication**: Supabase Auth

- Email/password or SSO
- JWT tokens with org membership claims
- Roles: `operator`, `supervisor`, `admin`

## Data Model

### Core Entities

#### Organizations (`orgs`)
- Multi-tenant organization structure
- Each user belongs to one or more orgs via `org_members`

#### Users (`auth.users`)
- Managed by Supabase Auth
- Linked to orgs via `org_members` with roles

#### Workstations (`workstations`)
- Manufacturing workstations
- Belongs to an org
- Used in operator sessions

#### Orders (`orders`)
- Production orders
- Contains metadata: `order_number`, `promised_ship_date`, etc.

#### Units (`units`)
- Individual units being manufactured
- Belongs to an order
- Tracks through manufacturing stages

#### Unit Batches (`unit_batches`)
- Optional helper for creating units in sequence
- Links to an order
- Has quantity and label

#### Events (`events`)
- All manufacturing events
- Types: `stage_start`, `stage_complete`, `rework_*`, `blocker`, `shipment_dispatch`, `annotation`
- Contains: `unit_id`, `stage`, `type`, `ts_device`, `ts_server`, `workstation_id`
- For `stage_complete`: `qty_good`, `qty_defect`, `defect_code`, `rework`
- Idempotency key prevents duplicates

#### Operator Sessions (`op_sessions`)
- Lightweight session storage
- Remembers operator's current context: `workstation_id`, `stage`, `unit_id`
- Updated on each action
- Used to reduce taps (remember current unit)

### Relationships

```
orgs (1) ──< (many) org_members (many) >── (1) auth.users
orgs (1) ──< (many) workstations
orgs (1) ──< (many) orders
orders (1) ──< (many) units
orders (1) ──< (many) unit_batches
units (1) ──< (many) events
auth.users (1) ──< (many) op_sessions
```

### Enums

**Stage Keys**:
- `order_info` - Order information stage
- `bead_prep` - Bead preparation
- `insert_beads` - Insert beads
- `pack` - Packing
- `ship` - Shipping

**Event Types**:
- `stage_start` - Stage started
- `stage_complete` - Stage completed
- `rework_*` - Rework events (stage-specific)
- `blocker` - Blocker event
- `shipment_dispatch` - Shipment dispatched
- `annotation` - General annotation

**Roles**:
- `operator` - Can log events
- `supervisor` - Can view dashboards
- `admin` - Full access

## Security Model

### Row Level Security (RLS)

All tables have RLS policies that enforce:
1. Users can only access data from orgs they belong to
2. Operators can insert/update events for their org
3. Supervisors can read events/metrics for their org
4. Admins have full CRUD for their org

### Authentication Flow

1. User authenticates via Supabase Auth
2. JWT token contains user ID
3. Edge Functions extract `org_id` from `org_members` table (never trust client)
4. All queries filtered by `org_id` via RLS

### Idempotency

- Events use idempotency keys: hash of `(unit_id, stage, type, ts_device truncated to sec)`
- Prevents duplicate events from rapid taps
- Stored in `events.idempotency_key`

## Performance Considerations

### Database Indexes

- `(org_id, stage, ts_server)` - For stage queries
- `(org_id, unit_id)` - For unit history
- `(user_id)` on `op_sessions` - For session lookup
- `(idempotency_key)` on `events` - For duplicate detection

### Query Patterns

**Common Queries**:
1. Get current operator session: `SELECT * FROM op_sessions WHERE user_id = ?`
2. Get units for today: `SELECT * FROM units WHERE org_id = ? AND created_at >= today`
3. Get WIP by stage: `SELECT stage, COUNT(*) FROM events WHERE type = 'stage_start' AND NOT EXISTS (SELECT 1 FROM events e2 WHERE e2.unit_id = events.unit_id AND e2.stage = events.stage AND e2.type = 'stage_complete') GROUP BY stage`
4. Get cycle times: `SELECT stage, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cycle_time) FROM (SELECT stage, complete.ts - start.ts AS cycle_time FROM events start JOIN events complete ON start.unit_id = complete.unit_id AND start.stage = complete.stage WHERE start.type = 'stage_start' AND complete.type = 'stage_complete') GROUP BY stage`

### Caching Strategy

- No explicit caching (rely on Supabase connection pooling)
- Realtime subscriptions for live data (WIP board)
- Client-side state for current session

## Realtime Architecture

### Supabase Realtime

- Subscriptions to `events` table for live updates
- Filtered by `org_id` via RLS
- Used for:
  - Live WIP board updates
  - Throughput metrics
  - Blocker notifications

### Subscription Pattern

```typescript
const subscription = supabase
  .channel('events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'events',
    filter: `org_id=eq.${orgId}`
  }, (payload) => {
    // Update WIP board
  })
  .subscribe()
```

## Analytics & Metrics

### Key Metrics

1. **Cycle Time**: Time from `stage_start` to `stage_complete` per stage
   - Calculated: `complete.ts - start.ts`
   - Aggregated: p50, p90 percentiles

2. **Lead Time**: Time from order creation to shipment
   - Calculated: `ship.ts - order_info.ts`

3. **WIP (Work In Progress)**: Units started but not completed
   - Count: `stage_start` events without matching `stage_complete`

4. **FPY (First Pass Yield)**: Percentage of units completed without defects
   - Calculated: `(units with qty_defect = 0) / (total units completed)`

5. **Rework Rate**: Percentage of units requiring rework
   - Calculated: `(units with rework = true) / (total units completed)`

6. **On-Time %**: Percentage of orders shipped on time
   - Calculated: `(orders shipped before promised_ship_date) / (total orders)`

### SQL Queries

See `docs/API.md` for detailed SQL queries for each metric.

## Deployment Architecture

### Frontend (Vercel)

- Next.js app deployed to Vercel
- Environment variables for Supabase credentials
- Automatic deployments from main branch
- Edge runtime for optimal performance

### Backend (Supabase)

- PostgreSQL database
- Edge Functions (Deno runtime)
- Realtime subscriptions
- Storage (if needed for exports)

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx (Edge Functions only)
```

## Scalability Considerations

### Current Limits

- Designed for single org with <1000 concurrent operators
- Events table can handle millions of rows with proper indexing
- Realtime subscriptions scale with Supabase's infrastructure

### Future Scaling

- Partition `events` table by date if needed
- Add read replicas for analytics queries
- Consider materialized views for complex metrics
- Implement pagination for large unit lists

## Monitoring & Observability

### Metrics to Monitor

- API response times (target: <600ms median)
- Database query performance
- Realtime subscription latency
- Error rates by endpoint
- User session duration

### Logging

- Edge Functions log to Supabase logs
- Client-side errors logged to monitoring service (optional)
- Database errors logged by Supabase

## Error Handling

### Client-Side

- Network errors: Show toast with retry button
- Validation errors: Inline form errors
- Auth errors: Redirect to login

### Server-Side

- Validation errors: Return 400 with error message
- Auth errors: Return 401
- Database errors: Return 500 with generic message (log details)

## References

- [PDR](PDR.md) - Product requirements
- [API](API.md) - API documentation
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

