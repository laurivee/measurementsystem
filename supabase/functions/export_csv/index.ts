// Supabase Edge Function: export_csv
// Exports events as CSV for a date range

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')
    const stage = url.searchParams.get('stage')

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: 'start_date and end_date are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

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

    // Build query
    let query = supabase
      .from('events')
      .select('*')
      .gte('ts_server', startDate)
      .lte('ts_server', endDate)

    if (stage) {
      query = query.eq('stage', stage)
    }

    const { data: events, error } = await query

    if (error) throw error

    // Convert to CSV
    const headers = [
      'event_id',
      'unit_id',
      'order_id',
      'stage',
      'type',
      'ts_server',
      'workstation_id',
      'qty_good',
      'qty_defect',
      'defect_code',
      'rework',
    ]

    const csvRows = [
      headers.join(','),
      ...(events || []).map((event) =>
        headers.map((header) => {
          const value = event[header] ?? ''
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      ),
    ]

    const csv = csvRows.join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="events_${startDate}_${endDate}.csv"`,
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

