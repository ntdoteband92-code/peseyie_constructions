import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMusterExportData } from '@/app/actions/muster-roll'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const month = searchParams.get('month')

    if (!projectId || !month) {
      return NextResponse.json({ error: 'projectId and month are required' }, { status: 400 })
    }

    const data = await getMusterExportData(projectId, month)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Muster export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}