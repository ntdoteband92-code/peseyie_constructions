import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteEstimation } from '@/app/actions/estimation'

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const result = await deleteEstimation(id)
    if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Estimation delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}