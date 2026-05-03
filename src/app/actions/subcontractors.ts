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
    const { data, error } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single() as any

    if (error || !data) return null
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

const SubcontractorSchema = z.object({
  firm_name: z.string().min(1, 'Name is required'),
  specialty: z.string().min(1, 'Trade is required'),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  pan: z.string().optional(),
  gstin: z.string().optional(),
  license_info: z.string().optional(),
  is_active: z.coerce.boolean().default(true),
})

export async function getSubcontractors(search?: string) {
  const supabase = await createAdminClient()
  let query = supabase
    .from('subcontractors')
    .select('*')
    .eq('is_deleted', false)
    .order('name')

  if (search) {
    query = query.ilike('firm_name', `%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as any
}

export async function getSubcontractorById(id: string) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('subcontractors')
    .select('*')
    .eq('id', id)
    .single() as any
  if (error) throw error
  return data as any
}

export async function createSubcontractor(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager'])
    const rawData = Object.fromEntries(formData)
    const validated = SubcontractorSchema.safeParse(rawData)
    if (!validated.success) return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }

    const adminClient = await createAdminClient()
    const { error } = await adminClient.from('subcontractors').insert(validated.data as any)
    if (error) return { error: error.message }
    revalidatePath('/subcontractors')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function updateSubcontractor(id: string, _prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager'])
    const rawData = Object.fromEntries(formData)
    const validated = SubcontractorSchema.partial().safeParse(rawData)
    if (!validated.success) return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }

    const adminClient = await createAdminClient()
    const { error } = await (adminClient.from('subcontractors') as any)
      .update(validated.data as any)
      .eq('id', id) as any
    if (error) return { error: error.message }
    revalidatePath('/subcontractors')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function deleteSubcontractor(id: string): Promise<any> {
  try {
    await requireRole(['admin'])
    const adminClient = await createAdminClient()
    const { error } = await (adminClient.from('subcontractors') as any)
      .update({ is_deleted: true } as any)
      .eq('id', id) as any
    if (error) return { error: error.message }
    revalidatePath('/subcontractors')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

// Work Orders
const WorkOrderSchema = z.object({
  project_id: z.string().uuid().min(1, 'Project is required'),
  subcontractor_id: z.string().uuid().min(1, 'Subcontractor is required'),
  work_description: z.string().min(1, 'Work description is required'),
  location_chainage: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.coerce.number().optional(),
  rate: z.coerce.number().optional(),
  total_value: z.coerce.number().min(0, 'Contract value must be positive'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed', 'terminated']).default('pending'),
  tds_pct: z.coerce.number().optional().nullable(),
  remarks: z.string().optional(),
})

export async function getWorkOrders(subcontractorId?: string) {
  const supabase = await createAdminClient()
  let query = supabase
    .from('work_orders')
    .select('*, project:projects(project_name), subcontractor:subcontractors(firm_name)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (subcontractorId) query = query.eq('subcontractor_id', subcontractorId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as any
}

export async function createWorkOrder(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager'])
    const rawData = Object.fromEntries(formData)
    const validated = WorkOrderSchema.safeParse(rawData)
    if (!validated.success) return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }

    const adminClient = await createAdminClient()
    const { error } = await adminClient.from('work_orders').insert(validated.data as any)
    if (error) return { error: error.message }
    revalidatePath('/subcontractors')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function updateWorkOrder(id: string, _prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager'])
    const rawData = Object.fromEntries(formData)
    const validated = WorkOrderSchema.partial().safeParse(rawData)
    if (!validated.success) return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }

    const adminClient = await createAdminClient()
    const { error } = await (adminClient.from('work_orders') as any)
      .update(validated.data as any)
      .eq('id', id) as any
    if (error) return { error: error.message }
    revalidatePath('/subcontractors')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export type Subcontractor = Awaited<ReturnType<typeof getSubcontractors>>[number]
export type WorkOrder = Awaited<ReturnType<typeof getWorkOrders>>[number]