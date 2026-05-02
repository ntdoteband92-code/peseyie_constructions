import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteEquipment } from '@/app/actions/equipment'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const type = new URL(request.url).searchParams.get('type')

    if (type === 'vehicle') {
      const { error } = await (supabase.from('vehicles') as any).update({ is_deleted: true } as any).eq('id', id) as any
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    } else {
      const result = await deleteEquipment(id)
      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete equipment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}