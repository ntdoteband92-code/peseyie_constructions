import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRaBillPDFData } from '@/app/actions/ra-bills'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; billId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { billId } = await params
    if (!billId) return NextResponse.json({ error: 'billId is required' }, { status: 400 })

    const data = await getRaBillPDFData(billId)
    return NextResponse.json(data)
  } catch (error) {
    console.error('RA Bill PDF data error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}