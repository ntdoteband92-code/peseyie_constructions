import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    await supabase.from('projects').select('id').limit(1)
    return Response.json({ ok: true, timestamp: new Date().toISOString() })
  } catch {
    return Response.json({ ok: false }, { status: 500 })
  }
}
