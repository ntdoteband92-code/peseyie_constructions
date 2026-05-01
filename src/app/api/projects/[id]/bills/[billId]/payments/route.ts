import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addRaBillPayment } from '@/app/actions/ra-bills'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; billId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { billId, id: projectId } = await params
    const body = await request.json()

    const result = await addRaBillPayment(billId, projectId, {
      amount_received: body.amount_received,
      payment_date: body.payment_date,
      reference_no: body.reference_no,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Add RA bill payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}