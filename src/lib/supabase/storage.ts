'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

const DOCUMENTS_BUCKET = 'documents'

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * Throws if upload fails.
 */
export async function uploadFile(file: File, documentId: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const fileExt = file.name.split('.').pop()
  const fileName = `${documentId}_${Date.now()}${fileExt ? `.${fileExt}` : ''}`

  const supabase = await createAdminClient()
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(fileName, buffer, {
      contentType: file.type || 'application/octet-stream',
    })
  
  if (error) throw error
  
  const { data: urlData } = supabase.storage
    .from(DOCUMENTS_BUCKET)
    .getPublicUrl(fileName)
  
  return urlData.publicUrl
}