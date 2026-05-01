import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createExpense, createIncomeEntry } from '@/app/actions/expenses'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const action = formData.get('action')

    let result
    if (action === 'createIncome') {
      result = await createIncomeEntry(null, formData)
    } else {
      result = await createExpense(null, formData)
    }

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Expense API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}