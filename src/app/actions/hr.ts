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

// Employees / Workers
const EmployeeSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  contact_number: z.string().optional(),
  emergency_contact: z.string().optional(),
  address: z.string().optional(),
  id_proof_type: z.string().optional(),
  id_proof_number: z.string().optional(),
  joining_date: z.string().optional(),
  employment_type: z.enum(['direct', 'contractual']).default('direct'),
  wage_type: z.enum(['daily_rate', 'monthly_salary']).default('daily_rate'),
  wage_rate: z.coerce.number().optional(),
  pf_applicable: z.boolean().optional(),
  esi_applicable: z.boolean().optional(),
  bank_account_no: z.string().optional(),
  bank_ifsc: z.string().optional(),
  status: z.enum(['active', 'inactive', 'left']).default('active'),
})

export async function getEmployees() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('is_deleted', false)
    .order('full_name')
  if (error) throw error
  return (data ?? []) as any
}

export async function getEmployee(id: string) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase.from('employees').select('*').eq('id', id).single() as any
  if (error) throw error
  return data as any
}

export async function createEmployee(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    const validated = EmployeeSchema.safeParse(rawData)
    if (!validated.success) return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminClient = await createAdminClient()
    const { error } = await adminClient.from('employees').insert({ ...validated.data, created_by: user?.id } as any)
    if (error) return { error: error.message }
    revalidatePath('/hr')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

// Attendance / Muster Roll
const AttendanceSchema = z.object({
  project_id: z.string().uuid().min(1, 'Project is required'),
  work_date: z.string().min(1, 'Date is required'),
  employee_id: z.string().uuid().min(1, 'Employee is required'),
  status: z.enum(['present', 'absent', 'half_day', 'overtime', 'leave']),
  ot_hours: z.coerce.number().optional().nullable(),
})

export async function getAttendance(projectId: string, month: string) {
  const supabase = await createAdminClient()
  const startDate = `${month}-01`
  const endDate = `${month}-31`
  const { data, error } = await supabase
    .from('attendance')
    .select('*, employee:employees(full_name, wage_rate, wage_type)')
    .eq('project_id', projectId)
    .gte('work_date', startDate)
    .lte('work_date', endDate)
    .eq('is_deleted', false)
    .order('work_date')
  if (error) throw error
  return data
}

export async function markAttendance(entries: {
  project_id: string
  entry_date: string
  employee_id: string
  status: string
  ot_hours?: number
}[]): Promise<{ error?: string }> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminClient = await createAdminClient()

    const records = entries.map(e => ({
      ...e,
      created_by: user?.id,
    }))

    const { error } = await adminClient.from('attendance').upsert(records as any, {
      onConflict: 'project_id,work_date,employee_id',
    })
    if (error) return { error: error.message }
    revalidatePath('/hr')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

// Labour Advances
const AdvanceSchema = z.object({
  employee_id: z.string().uuid().min(1, 'Employee is required'),
  project_id: z.string().uuid().min(1, 'Project is required'),
  amount_given: z.coerce.number().min(1, 'Amount must be positive'),
  advance_date: z.string().min(1, 'Date is required'),
  reason: z.string().optional(),
})

export async function getAdvances(employeeId?: string) {
  const supabase = await createAdminClient()
  let query = supabase
    .from('advance_records')
    .select('*, employee:employees(full_name), project:projects(project_name)')
    .eq('is_deleted', false)
    .order('advance_date', { ascending: false })
  if (employeeId) query = query.eq('employee_id', employeeId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createAdvance(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)
    const validated = AdvanceSchema.safeParse(rawData)
    if (!validated.success) return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminClient = await createAdminClient()
    const { error } = await adminClient.from('advance_records').insert({
      ...validated.data,
      created_by: user?.id,
    } as any)
    if (error) return { error: error.message }
    revalidatePath('/hr')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function getOutstandingAdvances() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('advance_records')
    .select('*, employee:employees(full_name)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export type Employee = Awaited<ReturnType<typeof getEmployees>>[number]
export type AttendanceRecord = Awaited<ReturnType<typeof getAttendance>>[number]