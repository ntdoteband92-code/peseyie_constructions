import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBlastLog, deleteBlastLog } from '@/app/actions/blast-logs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const formData = new FormData()
    for (const [key, value] of Object.entries(body)) {
      formData.append(key, value !== null && value !== undefined ? String(value) : '')
    }
    const result = await createBlastLog(null, formData)
    if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Blast logs API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const result = await deleteBlastLog(id)
    if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Blast logs delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}