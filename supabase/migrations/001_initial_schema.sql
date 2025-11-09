-- Measurement System - Initial Schema
-- This migration creates all tables, types, functions, and RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE stage_key AS ENUM (
  'order_info',
  'bead_prep',
  'insert_beads',
  'pack',
  'ship'
);

CREATE TYPE event_type AS ENUM (
  'stage_start',
  'stage_complete',
  'rework_order_info',
  'rework_bead_prep',
  'rework_insert_beads',
  'rework_pack',
  'blocker',
  'shipment_dispatch',
  'annotation'
);

CREATE TYPE role_key AS ENUM (
  'operator',
  'supervisor',
  'admin'
);

CREATE TYPE blocker_code AS ENUM (
  'MATERIAL_SHORTAGE',
  'EQUIPMENT_FAILURE',
  'QUALITY_ISSUE',
  'WAITING_FOR_PREVIOUS_STAGE',
  'OTHER'
);

-- Organizations
CREATE TABLE orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organization members (links users to orgs with roles)
CREATE TABLE org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  role role_key NOT NULL DEFAULT 'operator',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, org_id)
);

-- Workstations
CREATE TABLE workstations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  promised_ship_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, order_number)
);

-- Units
CREATE TABLE units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, unit_number)
);

-- Unit batches (optional helper for creating units)
CREATE TABLE unit_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  label text NOT NULL,
  qty integer NOT NULL CHECK (qty > 0),
  created_at timestamptz DEFAULT now()
);

-- Events (all manufacturing events)
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stage stage_key NOT NULL,
  type event_type NOT NULL,
  workstation_id uuid REFERENCES workstations(id),
  user_id uuid REFERENCES auth.users(id),
  ts_device timestamptz NOT NULL,
  ts_server timestamptz DEFAULT now(),
  idempotency_key text,
  -- For stage_complete events
  qty_good integer DEFAULT 0 CHECK (qty_good >= 0),
  qty_defect integer DEFAULT 0 CHECK (qty_defect >= 0),
  defect_code text,
  rework boolean DEFAULT false,
  -- For blocker events
  blocker_code blocker_code,
  blocker_minutes integer CHECK (blocker_minutes >= 0),
  -- For shipment_dispatch events
  carrier text,
  tracking_number text,
  -- For annotation events
  annotation_text text,
  created_at timestamptz DEFAULT now()
);

-- Operator sessions (lightweight session storage)
CREATE TABLE op_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  workstation_id uuid REFERENCES workstations(id),
  stage stage_key,
  unit_id uuid REFERENCES units(id),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_workstations_org_id ON workstations(org_id);
CREATE INDEX idx_orders_org_id ON orders(org_id);
CREATE INDEX idx_units_org_id ON units(org_id);
CREATE INDEX idx_units_order_id ON units(order_id);
CREATE INDEX idx_unit_batches_org_id ON unit_batches(org_id);
CREATE INDEX idx_events_org_id_stage_ts ON events(org_id, stage, ts_server);
CREATE INDEX idx_events_org_id_unit_id ON events(org_id, unit_id);
CREATE INDEX idx_events_idempotency_key ON events(idempotency_key);
CREATE INDEX idx_op_sessions_user_id ON op_sessions(user_id);
CREATE INDEX idx_op_sessions_org_id ON op_sessions(org_id);

-- Enable Row Level Security
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE op_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Helper function to get user's org_ids
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF uuid AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- orgs: Users can only see orgs they belong to
CREATE POLICY "Users can view their orgs"
  ON orgs FOR SELECT
  USING (id IN (SELECT get_user_org_ids()));

-- org_members: Users can view members of their orgs
CREATE POLICY "Users can view members of their orgs"
  ON org_members FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

-- workstations: Users can view workstations in their orgs
CREATE POLICY "Users can view workstations in their orgs"
  ON workstations FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

-- orders: Users can view orders in their orgs
CREATE POLICY "Users can view orders in their orgs"
  ON orders FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can insert orders in their orgs"
  ON orders FOR INSERT
  WITH CHECK (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can update orders in their orgs"
  ON orders FOR UPDATE
  USING (org_id IN (SELECT get_user_org_ids()));

-- units: Users can view units in their orgs
CREATE POLICY "Users can view units in their orgs"
  ON units FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can insert units in their orgs"
  ON units FOR INSERT
  WITH CHECK (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can update units in their orgs"
  ON units FOR UPDATE
  USING (org_id IN (SELECT get_user_org_ids()));

-- unit_batches: Users can view batches in their orgs
CREATE POLICY "Users can view batches in their orgs"
  ON unit_batches FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can insert batches in their orgs"
  ON unit_batches FOR INSERT
  WITH CHECK (org_id IN (SELECT get_user_org_ids()));

-- events: Users can view events in their orgs
CREATE POLICY "Users can view events in their orgs"
  ON events FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can insert events in their orgs"
  ON events FOR INSERT
  WITH CHECK (org_id IN (SELECT get_user_org_ids()));

-- op_sessions: Users can only access their own sessions
CREATE POLICY "Users can view their own sessions"
  ON op_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own sessions"
  ON op_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid() AND org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can update their own sessions"
  ON op_sessions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON op_sessions FOR DELETE
  USING (user_id = auth.uid());

-- Function to create next unit from batch
CREATE OR REPLACE FUNCTION create_next_unit(p_batch_id uuid)
RETURNS uuid AS $$
DECLARE
  v_unit_id uuid;
  v_order_id uuid;
  v_org_id uuid;
  v_label text;
  v_count integer;
  v_unit_number text;
BEGIN
  -- Get batch info
  SELECT order_id, org_id, label INTO v_order_id, v_org_id, v_label
  FROM unit_batches
  WHERE id = p_batch_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch not found';
  END IF;
  
  -- Count existing units for this batch
  SELECT COUNT(*) INTO v_count
  FROM units
  WHERE order_id = v_order_id
    AND unit_number LIKE v_label || '-%';
  
  -- Create unit number
  v_unit_number := v_label || '-' || (v_count + 1);
  
  -- Create unit
  INSERT INTO units (org_id, order_id, unit_number)
  VALUES (v_org_id, v_order_id, v_unit_number)
  RETURNING id INTO v_unit_id;
  
  RETURN v_unit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get WIP by stage
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

-- Function to get cycle times
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

-- Function to get FPY
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

-- Function to get throughput
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

-- Function to get on-time percentage
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

