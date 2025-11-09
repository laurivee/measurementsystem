// Supabase Edge Function: bulk_ingest
// Handles multiple event ingestion (optional)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const eventSchema = z.object({
  unit_id: z.string().uuid(),
  order_id: z.string().uuid(),
  stage: z.enum(['order_info', 'bead_prep', 'insert_beads', 'pack', 'ship']),
  type: z.string(),
  workstation_id: z.string().uuid().optional(),
  ts_device: z.string().datetime(),
})

const bulkSchema = z.object({
  events: z.array(eventSchema),
})

serve(async (req) => {
  try {
    const body = await req.json()
    const data = bulkSchema.parse(body)

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

    // Process events (placeholder implementation)
    const inserted = 0
    const duplicates = 0
    const errors: string[] = []

    return new Response(
      JSON.stringify({ success: true, inserted, duplicates, errors }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

