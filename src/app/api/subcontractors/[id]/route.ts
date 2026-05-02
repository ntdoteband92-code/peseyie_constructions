import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteSubcontractor } from '@/app/actions/subcontractors'

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

    if (type === 'sub') {
      const result = await deleteSubcontractor(id)
      if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 })
    } else {
      const { error } = await (supabase.from('work_orders') as any).update({ is_deleted: true } as any).eq('id', id) as any
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}