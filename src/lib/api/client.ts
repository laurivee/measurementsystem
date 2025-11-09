// API client functions for calling Edge Functions

import { supabase } from '@/lib/supabase/client'

export async function ingestEvent(data: {
  unit_id: string
  order_id: string
  stage: string
  type: string
  workstation_id?: string
  ts_device: string
  qty_good?: number
  qty_defect?: number
  defect_code?: string
  rework?: boolean
}) {
  const { data: result, error } = await supabase.functions.invoke('ingest_event', {
    body: data,
  })

  if (error) throw error
  return result
}

export async function recordBlocker(data: {
  unit_id: string
  stage: string
  blocker_code: string
  blocker_minutes: number
}) {
  const { data: result, error } = await supabase.functions.invoke('blocker', {
    body: data,
  })

  if (error) throw error
  return result
}

export async function createNextUnit(batch_id: string) {
  const { data: result, error } = await supabase.functions.invoke('create_next_unit', {
    body: { batch_id },
  })

  if (error) throw error
  return result
}

export async function exportCSV(startDate: string, endDate: string, stage?: string) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  })
  if (stage) params.append('stage', stage)

  const { data, error } = await supabase.functions.invoke('export_csv', {
    body: Object.fromEntries(params),
  })

  if (error) throw error
  return data
}

