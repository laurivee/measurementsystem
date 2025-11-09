// Supabase Edge Function: create_next_unit
// Creates the next unit from a batch (optional feature)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const createUnitSchema = z.object({
  batch_id: z.string().uuid(),
})

serve(async (req) => {
  try {
    const body = await req.json()
    const data = createUnitSchema.parse(body)

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

    // Call the database function
    const { data: unitId, error } = await supabase.rpc('create_next_unit', {
      p_batch_id: data.batch_id,
    })

    if (error) throw error

    // Get the created unit
    const { data: unit } = await supabase
      .from('units')
      .select('id, unit_number')
      .eq('id', unitId)
      .single()

    if (!unit) {
      return new Response(JSON.stringify({ error: 'Unit not found after creation' }), {
        status: 500,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        unit_id: unit.id,
        unit_number: unit.unit_number,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

