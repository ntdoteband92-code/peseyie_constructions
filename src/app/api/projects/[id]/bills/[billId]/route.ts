import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteRaBill, updateRaBillStatus } from '@/app/actions/ra-bills'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; billId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { billId, id: projectId } = await params
    const result = await deleteRaBill(billId, projectId)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete RA bill error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const result = await updateRaBillStatus(billId, projectId, status)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update RA bill error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}