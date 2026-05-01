'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { AppRole } from '@/lib/supabase/types'

const RaBillSchema = z.object({
  bill_number: z.string().min(1, 'Bill number is required'),
  bill_date: z.string().min(1, 'Bill date is required'),
  submitted_to: z.string().optional(),
  work_done_upto: z.string().optional(),
  gross_amount: z.coerce.number().min(0),
  certified_amount: z.coerce.number().optional().nullable(),
  status: z.enum(['draft', 'submitted', 'under_measurement', 'certified', 'payment_released', 'partially_paid']).default('draft'),
  remarks: z.string().optional(),
})

export type RaBillFormState = {
  success?: boolean
  error?: string
  errors?: Record<string, string[]>
} | null

async function requireRole(allowedRoles: AppRole[]): Promise<AppRole> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_role')
  if (error) throw error
  if (!data || !allowedRoles.includes(data)) {
    throw new Error('Unauthorized')
  }
  return data
}

export async function getRaBills(projectId: string) {
  const supabase = await createClient()
  const { data: bills, error } = await supabase
    .from('ra_bills')
    .select(`
      *,
      ra_bill_deductions(*),
      ra_bill_payments(*)
    `)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return bills
}

export async function getRaBill(id: string) {
  const supabase = await createClient()
  const { data: bill, error } = await supabase
    .from('ra_bills')
    .select(`
      *,
      ra_bill_deductions(*),
      ra_bill_payments(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return bill
}

export async function getNextBillNumber(projectId: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ra_bills')
    .select('bill_number', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('is_deleted', false)

  if (error) throw error
  const count = (data?.length ?? 0) + 1
  return `RA-${count}`
}

export async function createRaBill(
  projectId: string,
  _prevState: RaBillFormState,
  formData: FormData
): Promise<RaBillFormState> {
  try {
    await requireRole(['admin', 'manager', 'accountant'])

    const rawData = Object.fromEntries(formData)
    const validated = RaBillSchema.safeParse(rawData)

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        error: 'Validation failed',
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const deductionsRaw = formData.getAll('deduction_type') as string[]
    const deductionAmountsRaw = formData.getAll('deduction_amount') as string[]
    const deductionPercentagesRaw = formData.getAll('deduction_percentage') as string[]

    const deductions = deductionsRaw
      .map((type, i) => ({
        deduction_type: type,
        amount: parseFloat(deductionAmountsRaw[i] || '0') || 0,
        percentage: parseFloat(deductionPercentagesRaw[i] || '') || null,
      }))
      .filter((d) => d.deduction_type && d.amount > 0)

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0)
    const netPayable = validated.data.gross_amount - totalDeductions

    const { data: bill, error: billError } = await supabase
      .from('ra_bills')
      .insert({
        ...validated.data,
        project_id: projectId,
        net_payable: netPayable,
        created_by: user?.id,
      })
      .select('id')
      .single()

    if (billError) return { error: billError.message }

    if (deductions.length > 0) {
      const deductionRecords = deductions.map((d) => ({
        ra_bill_id: bill.id,
        deduction_type: d.deduction_type,
        amount: d.amount,
        percentage: d.percentage,
      }))

      const { error: dedError } = await supabase
        .from('ra_bill_deductions')
        .insert(deductionRecords)

      if (dedError) return { error: dedError.message }
    }

    revalidatePath(`/projects/${projectId}/bills`)
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function updateRaBillStatus(
  billId: string,
  projectId: string,
  status: string
): Promise<{ error?: string }> {
  try {
    await requireRole(['admin', 'manager', 'accountant'])

    const supabase = await createClient()
    const { error } = await supabase
      .from('ra_bills')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', billId)

    if (error) return { error: error.message }

    revalidatePath(`/projects/${projectId}/bills`)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function addRaBillPayment(
  billId: string,
  projectId: string,
  data: {
    amount_received: number
    payment_date: string
    reference_no?: string
  }
): Promise<{ error?: string }> {
  try {
    await requireRole(['admin', 'manager', 'accountant'])

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('ra_bill_payments').insert({
      ra_bill_id: billId,
      amount_received: data.amount_received,
      payment_date: data.payment_date,
      reference_no: data.reference_no,
      created_by: user?.id,
    })

    if (error) return { error: error.message }

    const { data: bill } = await supabase
      .from('ra_bills')
      .select('id, ra_bill_payments(amount_received)')
      .eq('id', billId)
      .single()

    if (bill?.ra_bill_payments) {
      const totalReceived = (bill.ra_bill_payments as { amount_received: number }[])
        .reduce((sum, p) => sum + p.amount_received, 0)

      const { data: billFull } = await supabase
        .from('ra_bills')
        .select('net_payable')
        .eq('id', billId)
        .single()

      const netPayable = billFull?.net_payable ?? 0
      const newStatus = totalReceived >= netPayable ? 'payment_released' : 'partially_paid'

      await supabase
        .from('ra_bills')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', billId)
    }

    revalidatePath(`/projects/${projectId}/bills`)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function deleteRaBill(
  billId: string,
  projectId: string
): Promise<{ error?: string }> {
  try {
    await requireRole(['admin', 'manager'])

    const supabase = await createClient()
    const { error } = await supabase
      .from('ra_bills')
      .update({ is_deleted: true })
      .eq('id', billId)

    if (error) return { error: error.message }

    revalidatePath(`/projects/${projectId}/bills`)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function getRaBillPDFData(id: string) {
  const supabase = await createClient()
  const { data: bill, error } = await supabase
    .from('ra_bills')
    .select(`
      *,
      project:projects(project_name, project_code, client_name, location),
      ra_bill_deductions(*),
      ra_bill_payments(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return bill
}

export type RaBillWithRelations = Awaited<ReturnType<typeof getRaBills>>[number]