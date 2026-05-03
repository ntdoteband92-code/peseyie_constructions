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

const ExpenseSchema = z.object({
  project_id: z.string().uuid().optional().nullable(),
  expense_date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be positive'),
  paid_to: z.string().optional(),
  payment_mode: z.enum(['cash', 'bank_transfer', 'neft_rtgs', 'cheque', 'upi']).optional(),
  gst_amount: z.coerce.number().optional().nullable(),
  gst_invoice_no: z.string().optional(),
  tds_deducted: z.coerce.number().optional().nullable(),
  vendor_id: z.string().uuid().optional().nullable(),
  receipt_url: z.string().optional(),
  notes: z.string().optional(),
})

export type ExpenseFormState = { success?: boolean; error?: string; errors?: Record<string, string[]> } | null

export async function getExpenses(projectId?: string) {
  const supabase = await createAdminClient()
  let query = supabase
    .from('expenses')
    .select('*, project:projects(id, project_name)')
    .eq('is_deleted', false)
    .order('expense_date', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as any
}

export async function getExpense(id: string) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single() as any
  if (error) throw error
  return data as any
}

export async function createExpense(_prevState: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  try {
    await requireRole(['admin', 'manager', 'accountant'])
    const rawData = Object.fromEntries(formData)
    const validated = ExpenseSchema.safeParse(rawData)

    if (!validated.success) {
      return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminClient = await createAdminClient()

    const { error } = await (adminClient.from('expenses') as any).insert({
      ...validated.data,
      created_by: user?.id,
    } as any)

    if (error) return { error: error.message }
    revalidatePath('/financials')
    revalidatePath('/projects')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function updateExpense(id: string, _prevState: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  try {
    await requireRole(['admin', 'manager', 'accountant'])
    const rawData = Object.fromEntries(formData)
    const validated = ExpenseSchema.safeParse(rawData)

    if (!validated.success) {
      return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }
    }

    const adminClient = await createAdminClient()
    const { error } = await (adminClient.from('expenses') as any)
      .update({ ...validated.data, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/financials')
    revalidatePath('/projects')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function deleteExpense(id: string): Promise<{ error?: string }> {
  try {
    await requireRole(['admin', 'manager'])
    const adminClient = await createAdminClient()
    const { error } = await (adminClient.from('expenses') as any).update({ is_deleted: true }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/financials')
    revalidatePath('/projects')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function getExpenseSummary() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('category, amount, expense_date') as any

  if (error) throw error

  const byCategory: Record<string, number> = {}
  let total = 0
  const now = new Date()
  let thisMonth = 0

  for (const e of (data ?? [])) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + (e.amount ?? 0)
    total += e.amount ?? 0
    const d = new Date(e.expense_date)
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      thisMonth += e.amount ?? 0
    }
  }

  return { byCategory, total, thisMonth }
}

// Income entries
const IncomeSchema = z.object({
  project_id: z.string().uuid().optional().nullable(),
  ra_bill_id: z.string().uuid().optional().nullable(),
  date_received: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be positive'),
  payment_mode: z.string().optional(),
  reference_no: z.string().optional(),
  remarks: z.string().optional(),
})

export async function getIncomeEntries(projectId?: string) {
  const supabase = await createAdminClient()
  let query = supabase
    .from('income_entries')
    .select('*, project:projects(id, project_name), ra_bill:ra_bills(id, bill_number)')
    .eq('is_deleted', false)
    .order('date_received', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createIncomeEntry(_prevState: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  try {
    await requireRole(['admin', 'manager', 'accountant'])
    const rawData = Object.fromEntries(formData)
    const validated = IncomeSchema.safeParse(rawData)

    if (!validated.success) {
      return { errors: validated.error.flatten().fieldErrors, error: 'Validation failed' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminClient = await createAdminClient()

    const { error } = await adminClient.from('income_entries').insert({
      ...validated.data,
      created_by: user?.id,
    } as any)

    if (error) return { error: error.message }
    revalidatePath('/financials')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export type ExpenseWithProject = Awaited<ReturnType<typeof getExpenses>>[number]