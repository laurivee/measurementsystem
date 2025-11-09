// Supabase Edge Function: blocker
// Records a blocker event

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const blockerSchema = z.object({
  unit_id: z.string().uuid(),
  stage: z.enum(['order_info', 'bead_prep', 'insert_beads', 'pack', 'ship']),
  blocker_code: z.enum([
    'MATERIAL_SHORTAGE',
    'EQUIPMENT_FAILURE',
    'QUALITY_ISSUE',
    'WAITING_FOR_PREVIOUS_STAGE',
    'OTHER',
  ]),
  blocker_minutes: z.number().int().min(0),
})

serve(async (req) => {
  try {
    const body = await req.json()
    const data = blockerSchema.parse(body)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get unit to find order_id and org_id
    const { data: unit } = await supabase
      .from('units')
      .select('order_id, org_id')
      .eq('id', data.unit_id)
      .single()

    if (!unit) {
      return new Response(JSON.stringify({ error: 'Unit not found' }), { status: 404 })
    }

    // Insert blocker event
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        org_id: unit.org_id,
        unit_id: data.unit_id,
        order_id: unit.order_id,
        stage: data.stage,
        type: 'blocker',
        blocker_code: data.blocker_code,
        blocker_minutes: data.blocker_minutes,
        ts_device: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, event_id: event.id }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

