import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createEstimation } from '@/app/actions/estimation'
import { createOrUpdateEstimationItems } from '@/app/actions/estimation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    if (action === 'upsertItems') {
      const { estimationId, items } = body
      const result = await createOrUpdateEstimationItems(estimationId, items)
      if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 })
      return NextResponse.json({ success: true })
    }

    const { name, project_id, total_direct_cost, overheads_pct, profit_pct, grand_total, tender_id } = body

    const { data, error } = await supabase.from('estimations').insert({
      name,
      project_id: project_id || null,
      tender_id: tender_id || null,
      estimation_date: new Date().toISOString().split('T')[0],
      total_direct_cost: total_direct_cost ?? 0,
      overheads_pct: overheads_pct ?? 0,
      profit_pct: profit_pct ?? 0,
      grand_total: grand_total ?? 0,
      created_by: user.id,
    } as any).select('id').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ id: (data as any).id })
  } catch (error) {
    console.error('Estimation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}