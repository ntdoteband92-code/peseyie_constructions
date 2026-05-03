'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { AppRole } from '@/lib/supabase/types'
import { isAppRole } from '@/lib/supabase/types'

async function getMyRole(): Promise<AppRole | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const adminClient = await createAdminClient()
    const { data } = await (adminClient.from('user_roles').select('role').eq('user_id', user.id).single()) as any
    if (!data) return null
    if (!isAppRole(data.role)) return null
    return data.role
  } catch {
    return null
  }
}

async function requireRole(allowedRoles: AppRole[]): Promise<AppRole> {
  const role = await getMyRole()
  if (!role || !allowedRoles.includes(role)) throw new Error('Unauthorized')
  return role
}

const DocumentCategoryEnum = z.enum([
  'contract', 'drawing', 'boq', 'tender_document', 'blasting_license',
  'explosive_license', 'equipment_rc', 'insurance', 'fitness_certificate',
  'labour_license', 'govt_correspondence', 'ra_bill_copy', 'photo_report', 'other'
])

const CreateDocumentSchema = z.object({
  project_id: z.string().uuid().optional().nullable(),
  category: DocumentCategoryEnum,
  file_name: z.string().min(1, 'File name is required'),
  storage_url: z.string().min(1, 'File URL is required'),
  expiry_date: z.string().optional().nullable(),
  notes: z.string().optional(),
  file_size_kb: z.coerce.number().optional().nullable(),
  mime_type: z.string().optional(),
})

export async function getDocuments(projectId?: string) {
  const supabase = await createAdminClient()
  let query = supabase
    .from('documents')
    .select('*, project:projects(id, project_name)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as any[]
}

export async function getDocumentById(id: string) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*, project:projects(id, project_name)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as any
}

export async function getDocumentVersions(documentId: string) {
  const supabase = await createAdminClient()
  const { data, error } = await (supabase.from('document_versions') as any)
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
  if (error) throw error
  return (data ?? []) as any[]
}

export async function getLicenseDashboard() {
  const supabase = await createAdminClient()
  const { data, error } = await (supabase
    .from('documents')
    .select('id, file_name, category, expiry_date, storage_url, project:projects(project_name)')
    .eq('is_deleted', false)
    .not('expiry_date', 'is', null)
    .order('expiry_date', { ascending: true })) as any

  if (error) throw error

  const today = new Date()
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

  return (data ?? []).map((doc: any) => {
    const expiry = doc.expiry_date ? new Date(doc.expiry_date) : null
    let status: 'valid' | 'expiring' | 'expired' = 'valid'
    if (expiry) {
      if (expiry < today) status = 'expired'
      else if (expiry <= thirtyDaysLater) status = 'expiring'
    }
    return { ...doc, rag_status: status }
  }) as any[]
}

export async function createDocument(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    console.log('[createDocument] rawData:', JSON.stringify(rawData))

    const rawDataClean = {
      ...rawData,
      project_id: rawData.project_id === '' ? null : rawData.project_id,
      file_size_kb: rawData.file_size_kb === '' ? null : Number(rawData.file_size_kb),
    }

    const validated = CreateDocumentSchema.safeParse(rawDataClean)
    if (!validated.success) {
      console.log('[createDocument] validation errors:', JSON.stringify(validated.error.flatten().fieldErrors))
      return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const adminClient = await createAdminClient()
    const { error } = await adminClient.from('documents').insert({
      ...validated.data,
      created_by: user?.id,
    } as any)
    if (error) return { error: error.message }

    revalidatePath('/documents')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function uploadDocumentVersion(documentId: string, formData: FormData) {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const fileName = formData.get('file_name') as string
    const fileUrl = formData.get('file_url') as string
    const fileSizeKb = formData.get('file_size_kb') as string
    const mimeType = formData.get('mime_type') as string

    const adminClient = await createAdminClient()

    const { data: versions } = await (adminClient.from('document_versions') as any)
      .select('version_number')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(1)

    const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1

    await (adminClient.from('document_versions') as any).insert({
      document_id: documentId,
      file_url: fileUrl,
      file_name: fileName,
      version_number: nextVersion,
      file_size_kb: fileSizeKb ? parseInt(fileSizeKb) : null,
      mime_type: mimeType,
      created_by: user?.id,
    })

    await (adminClient.from('documents') as any).update({ updated_at: new Date().toISOString() }).eq('id', documentId)

    revalidatePath('/documents')
    return { success: true, version: nextVersion }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function deleteDocument(id: string): Promise<any> {
  try {
    await requireRole(['admin', 'manager'])
    const adminClient = await createAdminClient()
    const { error } = await (adminClient.from('documents') as any).update({ is_deleted: true }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/documents')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export type Document = Awaited<ReturnType<typeof getDocuments>>[number]