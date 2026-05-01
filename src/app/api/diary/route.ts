import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDiaryEntry, createDocument } from '@/app/actions/diary'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const action = formData.get('action')

    let result
    if (action === 'createDiary') {
      result = await createDiaryEntry(null, formData)
    } else if (action === 'createDocument') {
      result = await createDocument(null, formData)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Diary API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}