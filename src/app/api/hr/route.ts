import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createEmployee, createAdvance } from '@/app/actions/hr'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action, ...payload } = body

    let result
    if (action === 'createAdvance') {
      const formData = new FormData()
      Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)))
      result = await createAdvance(null, formData)
    } else {
      const formData = new FormData()
      Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)))
      result = await createEmployee(null, formData)
    }

    if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('HR API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}