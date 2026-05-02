'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { AppRole } from '@/lib/supabase/types'
import { isAppRole } from '@/lib/supabase/types'

async function getMyRole(): Promise<AppRole | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_role')
  if (error || !data || !isAppRole(data)) return null
  return data
}

async function requireRole(allowedRoles: AppRole[]): Promise<AppRole> {
  const role = await getMyRole()
  if (!role || !allowedRoles.includes(role)) throw new Error('Unauthorized')
  return role
}

// Diary Entries
const DiarySchema = z.object({
  project_id: z.string().uuid().min(1, 'Project is required'),
  entry_date: z.string().min(1, 'Date is required'),
  weather_am: z.string().optional(),
  weather_pm: z.string().optional(),
  work_summary: z.string().min(1, 'Work summary is required'),
  workers_present: z.coerce.number().optional().nullable(),
  equipment_on_site: z.string().optional(),
  visitors: z.string().optional(),
  materials_received: z.string().optional(),
  issues: z.string().optional(),
  verified_by: z.string().optional(),
})

export async function getDiaryEntries(projectId?: string, startDate?: string, endDate?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('diary_entries')
    .select('*, project:projects(project_name), created_by_user:profiles!diary_entries_created_by_fkey(full_name)')
    .eq('is_deleted', false)
    .order('entry_date', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)
  if (startDate) query = query.gte('entry_date', startDate)
  if (endDate) query = query.lte('entry_date', endDate)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as any
}

export async function createDiaryEntry(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    const validated = DiarySchema.safeParse(rawData)
    if (!validated.success) return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('diary_entries').insert({
      ...validated.data,
      created_by: user?.id,
    } as any)
    if (error) return { error: error.message }
    revalidatePath('/diary')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

// Documents
const DocumentSchema = z.object({
  project_id: z.string().uuid().optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  document_name: z.string().min(1, 'Document name is required'),
  file_url: z.string().min(1, 'File URL is required'),
  expiry_date: z.string().optional().nullable(),
  notes: z.string().optional(),
})

export async function getDocuments(projectId?: string, category?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('documents')
    .select('*, project:projects(project_name)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)
  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as any
}

export async function getExpiringDocuments(daysAhead: number = 60) {
  const supabase = await createClient()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  const { data, error } = await supabase
    .from('documents')
    .select('*, project:projects(project_name)')
    .eq('is_deleted', false)
    .not('expiry_date', 'is', null)
    .lte('expiry_date', futureDate.toISOString().split('T')[0])
    .order('expiry_date')

  if (error) throw error
  return data ?? []
}

export async function createDocument(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    const validated = DocumentSchema.safeParse(rawData)
    if (!validated.success) return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('documents').insert({
      ...validated.data,
      uploaded_by: user?.id,
    } as any)
    if (error) return { error: error.message }
    revalidatePath('/documents')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export type DiaryEntry = Awaited<ReturnType<typeof getDiaryEntries>>[number]
export type Document = Awaited<ReturnType<typeof getDocuments>>[number]