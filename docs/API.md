# API Documentation

## Overview

The Measurement System API consists of Supabase Edge Functions and direct database queries via the Supabase client.

## Authentication

All API requests require authentication via Supabase Auth JWT token.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

The JWT token is obtained from Supabase Auth and contains the user ID. The `org_id` is extracted server-side from the `org_members` table (never trust client-provided `org_id`).

## Edge Functions

### POST /functions/v1/ingest_event

Ingests a single manufacturing event.

**Request Body**:
```json
{
  "org_id": "uuid",           // Ignored - extracted from JWT
  "unit_id": "uuid",
  "order_id": "uuid",
  "stage": "insert_beads",     // stage_key enum
  "type": "stage_start",       // event_type enum
  "workstation_id": "uuid",
  "ts_device": "2025-11-09T13:22:31.000Z"
}
```

**For `stage_complete` events, additional fields**:
```json
{
  "qty_good": 1,
  "qty_defect": 0,
  "defect_code": "MISS_BEAD",  // Optional
  "rework": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "event_id": "uuid",
  "duplicate": false
}
```

**Response** (400 Bad Request):
```json
{
  "error": "Validation error message"
}
```

**Response** (401 Unauthorized):
```json
{
  "error": "Unauthorized"
}
```

**Validation Rules**:
- `unit_id` must exist and belong to the user's org
- `stage` must be a valid `stage_key`
- `type` must be a valid `event_type`
- `qty_good` and `qty_defect` must be non-negative integers
- Idempotency check: hash of `(unit_id, stage, type, ts_device truncated to sec)`

**Idempotency**:
- Duplicate requests return `{ "success": true, "duplicate": true, "event_id": "..." }`
- No error thrown for duplicates

---

### POST /functions/v1/bulk_ingest

Ingests multiple events in a single request (optional).

**Request Body**:
```json
{
  "events": [
    {
      "unit_id": "uuid",
      "order_id": "uuid",
      "stage": "insert_beads",
      "type": "stage_start",
      "workstation_id": "uuid",
      "ts_device": "2025-11-09T13:22:31.000Z"
    },
    // ... more events
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "inserted": 5,
  "duplicates": 0,
  "errors": []
}
```

**Validation**: Same as `ingest_event` for each event in the array.

---

### POST /functions/v1/blocker

Records a blocker event.

**Request Body**:
```json
{
  "unit_id": "uuid",
  "stage": "pack",
  "blocker_code": "MATERIAL_SHORTAGE",
  "blocker_minutes": 5
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "event_id": "uuid"
}
```

**Blocker Codes** (predefined):
- `MATERIAL_SHORTAGE`
- `EQUIPMENT_FAILURE`
- `QUALITY_ISSUE`
- `WAITING_FOR_PREVIOUS_STAGE`
- `OTHER`

---

### POST /functions/v1/create_next_unit

Creates the next unit from a batch (optional feature).

**Request Body**:
```json
{
  "batch_id": "uuid"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "unit_id": "uuid",
  "unit_number": "1042"
}
```

**Logic**:
- Finds the batch
- Counts existing units for that batch
- Creates new unit with `unit_number = batch.label + "-" + (count + 1)`
- Returns the new unit ID

---

### GET /functions/v1/export_csv

Exports events as CSV for a date range.

**Query Parameters**:
- `start_date`: ISO date string (e.g., `2025-11-01`)
- `end_date`: ISO date string (e.g., `2025-11-30`)
- `stage`: Optional stage filter

**Response** (200 OK):
- Content-Type: `text/csv`
- CSV file with columns: `event_id`, `unit_id`, `order_id`, `stage`, `type`, `ts_server`, `workstation_id`, `qty_good`, `qty_defect`, `defect_code`, `rework`

**Response** (400 Bad Request):
```json
{
  "error": "Invalid date range"
}
```

---

## Direct Database Queries

These queries are made via the Supabase client from the frontend.

### Get Operator Session

```typescript
const { data } = await supabase
  .from('op_sessions')
  .select('*')
  .eq('user_id', userId)
  .single()
```

### Update Operator Session

```typescript
await supabase
  .from('op_sessions')
  .upsert({
    user_id: userId,
    org_id: orgId,
    workstation_id: workstationId,
    stage: stage,
    unit_id: unitId,
    updated_at: new Date().toISOString()
  })
```

### Get Units for Today

```typescript
const today = new Date().toISOString().split('T')[0]
const { data } = await supabase
  .from('units')
  .select('*, orders(*)')
  .eq('org_id', orgId)
  .gte('created_at', today)
  .order('created_at', { ascending: false })
```

### Get Current Unit (from session)

```typescript
const { data: session } = await supabase
  .from('op_sessions')
  .select('unit_id')
  .eq('user_id', userId)
  .single()

if (session?.unit_id) {
  const { data: unit } = await supabase
    .from('units')
    .select('*, orders(*)')
    .eq('id', session.unit_id)
    .single()
}
```

### Get WIP by Stage

```typescript
const { data: starts } = await supabase
  .from('events')
  .select('unit_id, stage')
  .eq('org_id', orgId)
  .eq('type', 'stage_start')

const { data: completes } = await supabase
  .from('events')
  .select('unit_id, stage')
  .eq('org_id', orgId)
  .eq('type', 'stage_complete')

// Client-side: filter starts that don't have matching completes
```

**Better SQL approach** (use RPC function):
```sql
CREATE OR REPLACE FUNCTION get_wip_by_stage(p_org_id uuid)
RETURNS TABLE(stage stage_key, wip_count bigint) AS $$
  SELECT e.stage, COUNT(DISTINCT e.unit_id) as wip_count
  FROM events e
  WHERE e.org_id = p_org_id
    AND e.type = 'stage_start'
    AND NOT EXISTS (
      SELECT 1 FROM events e2
      WHERE e2.unit_id = e.unit_id
        AND e2.stage = e.stage
        AND e2.type = 'stage_complete'
        AND e2.org_id = p_org_id
    )
  GROUP BY e.stage;
$$ LANGUAGE sql SECURITY DEFINER;
```

### Get Cycle Times

```sql
CREATE OR REPLACE FUNCTION get_cycle_times(
  p_org_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE(
  stage stage_key,
  p50_cycle_time interval,
  p90_cycle_time interval
) AS $$
  WITH cycle_times AS (
    SELECT
      s.stage,
      (c.ts_server - s.ts_server) AS cycle_time
    FROM events s
    JOIN events c ON s.unit_id = c.unit_id
      AND s.stage = c.stage
      AND s.org_id = c.org_id
    WHERE s.org_id = p_org_id
      AND s.type = 'stage_start'
      AND c.type = 'stage_complete'
      AND s.ts_server >= p_start_date
      AND s.ts_server <= p_end_date
  )
  SELECT
    stage,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cycle_time) AS p50_cycle_time,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY cycle_time) AS p90_cycle_time
  FROM cycle_times
  GROUP BY stage;
$$ LANGUAGE sql SECURITY DEFINER;
```

### Get FPY (First Pass Yield)

```sql
CREATE OR REPLACE FUNCTION get_fpy(
  p_org_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE(
  stage stage_key,
  fpy_percent numeric
) AS $$
  WITH stage_completes AS (
    SELECT
      stage,
      COUNT(*) FILTER (WHERE qty_defect = 0) AS good_count,
      COUNT(*) AS total_count
    FROM events
    WHERE org_id = p_org_id
      AND type = 'stage_complete'
      AND ts_server >= p_start_date
      AND ts_server <= p_end_date
    GROUP BY stage
  )
  SELECT
    stage,
    CASE
      WHEN total_count > 0 THEN (good_count::numeric / total_count::numeric * 100)
      ELSE 0
    END AS fpy_percent
  FROM stage_completes;
$$ LANGUAGE sql SECURITY DEFINER;
```

### Get Throughput

```sql
CREATE OR REPLACE FUNCTION get_throughput(
  p_org_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE(
  stage stage_key,
  units_completed bigint,
  avg_cycle_time interval
) AS $$
  SELECT
    stage,
    COUNT(DISTINCT unit_id) AS units_completed,
    AVG(cycle_time) AS avg_cycle_time
  FROM (
    SELECT
      c.stage,
      c.unit_id,
      (c.ts_server - s.ts_server) AS cycle_time
    FROM events c
    JOIN events s ON c.unit_id = s.unit_id
      AND c.stage = s.stage
      AND c.org_id = s.org_id
    WHERE c.org_id = p_org_id
      AND c.type = 'stage_complete'
      AND s.type = 'stage_start'
      AND c.ts_server >= p_start_date
      AND c.ts_server <= p_end_date
  ) AS cycles
  GROUP BY stage;
$$ LANGUAGE sql SECURITY DEFINER;
```

### Get On-Time Percentage

```sql
CREATE OR REPLACE FUNCTION get_on_time_percentage(
  p_org_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS numeric AS $$
  WITH shipped_orders AS (
    SELECT DISTINCT
      o.id,
      o.promised_ship_date,
      MIN(e.ts_server) AS actual_ship_date
    FROM orders o
    JOIN events e ON e.order_id = o.id
    WHERE o.org_id = p_org_id
      AND e.type = 'shipment_dispatch'
      AND e.ts_server >= p_start_date
      AND e.ts_server <= p_end_date
    GROUP BY o.id, o.promised_ship_date
  )
  SELECT
    CASE
      WHEN COUNT(*) > 0 THEN
        (COUNT(*) FILTER (WHERE actual_ship_date <= promised_ship_date)::numeric / COUNT(*)::numeric * 100)
      ELSE 0
    END
  FROM shipped_orders;
$$ LANGUAGE sql SECURITY DEFINER;
```

## Realtime Subscriptions

### Subscribe to Events

```typescript
const subscription = supabase
  .channel('events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'events',
    filter: `org_id=eq.${orgId}`
  }, (payload) => {
    console.log('New event:', payload.new)
    // Update WIP board, metrics, etc.
  })
  .subscribe()
```

### Subscribe to WIP Updates

```typescript
// Use RPC function with polling or create a materialized view
// For real-time, subscribe to all event inserts and recalculate WIP client-side
```

## Error Handling

All Edge Functions return consistent error formats:

**Success**:
```json
{
  "success": true,
  // ... additional data
}
```

**Error**:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE" // Optional
}
```

**HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting implemented. Consider adding:
- Per-user rate limits (e.g., 100 requests/minute)
- Per-org rate limits for bulk operations
- Idempotency already prevents duplicate events

## References

- [PDR](PDR.md) - Product requirements
- [Architecture](ARCHITECTURE.md) - System architecture
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)

