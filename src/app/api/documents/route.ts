import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDocument, deleteDocument } from '@/app/actions/documents'
import { uploadFile } from '@/lib/supabase/storage'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    // Handle file upload if a file is provided
    if (file && file.size > 0) {
      const tempDocData = {
        project_id: formData.get('project_id') as string || null,
        category: formData.get('category') as string,
        file_name: formData.get('file_name') as string,
        expiry_date: formData.get('expiry_date') as string || null,
        notes: formData.get('notes') as string || '',
        created_by: user.id
      }
      
      // Create a temporary document to get an ID for storage
      const adminClient = await (await import('@/lib/supabase/server')).createAdminClient()
      const { data: tempDoc, error: insertError } = await adminClient
        .from('documents')
        .insert({
          project_id: tempDocData.project_id,
          category: tempDocData.category,
          file_name: tempDocData.file_name,
          notes: tempDocData.notes,
          created_by: tempDocData.created_by,
          expiry_date: tempDocData.expiry_date,
          is_deleted: false
        } as any)
        .select('id')
        .single()
        
      if (insertError || !tempDoc) throw insertError
      
      // Upload file and update document with storage URL
      const storageUrl = await uploadFile(file, tempDoc.id)
      await adminClient
        .from('documents')
        .update({
          storage_url: storageUrl,
          file_size_kb: Math.ceil(file.size / 1024),
          mime_type: file.type || null
        })
        .eq('id', tempDoc.id)
    } else {
      // Legacy URL-based upload
      const result = await createDocument(null, formData)
      if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const result = await deleteDocument(id)
    if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Documents delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}