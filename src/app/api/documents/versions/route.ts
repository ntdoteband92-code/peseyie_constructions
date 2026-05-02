import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { uploadDocumentVersion } from '@/app/actions/documents'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    if (!documentId) return NextResponse.json({ error: 'Missing documentId' }, { status: 400 })

    const adminClient = await createAdminClient()
    const { data, error } = await (adminClient.from('document_versions') as any)
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ versions: data ?? [] })
  } catch (error) {
    console.error('Document versions GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const documentId = formData.get('document_id') as string
    if (!documentId) return NextResponse.json({ error: 'Missing document_id' }, { status: 400 })

    const result = await uploadDocumentVersion(documentId, formData)
    if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, version: result.version })
  } catch (error) {
    console.error('Document versions POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}