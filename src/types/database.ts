// TypeScript types for database entities
// These should be generated from Supabase schema, but for now we'll define them manually

export type StageKey = 'order_info' | 'bead_prep' | 'insert_beads' | 'pack' | 'ship'

export type EventType =
  | 'stage_start'
  | 'stage_complete'
  | 'rework_order_info'
  | 'rework_bead_prep'
  | 'rework_insert_beads'
  | 'rework_pack'
  | 'blocker'
  | 'shipment_dispatch'
  | 'annotation'

export type RoleKey = 'operator' | 'supervisor' | 'admin'

export type BlockerCode =
  | 'MATERIAL_SHORTAGE'
  | 'EQUIPMENT_FAILURE'
  | 'QUALITY_ISSUE'
  | 'WAITING_FOR_PREVIOUS_STAGE'
  | 'OTHER'

export interface Org {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  user_id: string
  org_id: string
  role: RoleKey
  created_at: string
}

export interface Workstation {
  id: string
  org_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  org_id: string
  order_number: string
  promised_ship_date?: string
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  org_id: string
  order_id: string
  unit_number: string
  created_at: string
  updated_at: string
}

export interface UnitBatch {
  id: string
  org_id: string
  order_id?: string
  label: string
  qty: number
  created_at: string
}

export interface Event {
  id: string
  org_id: string
  unit_id: string
  order_id: string
  stage: StageKey
  type: EventType
  workstation_id?: string
  user_id?: string
  ts_device: string
  ts_server: string
  idempotency_key?: string
  qty_good?: number
  qty_defect?: number
  defect_code?: string
  rework?: boolean
  blocker_code?: BlockerCode
  blocker_minutes?: number
  carrier?: string
  tracking_number?: string
  annotation_text?: string
  created_at: string
}

export interface OpSession {
  id: string
  user_id: string
  org_id: string
  workstation_id?: string
  stage?: StageKey
  unit_id?: string
  updated_at: string
}

