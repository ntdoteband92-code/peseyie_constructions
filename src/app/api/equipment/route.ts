import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createEquipment, createVehicle } from '@/app/actions/equipment'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const action = formData.get('action')

    let result
    if (action === 'createVehicle') {
      result = await createVehicle(null, formData)
    } else {
      result = await createEquipment(null, formData)
    }

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Equipment API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}