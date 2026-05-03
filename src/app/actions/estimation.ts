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

export async function getEstimations(projectId?: string) {
  const supabase = await createAdminClient()
  let query = supabase
    .from('estimations')
    .select('*, project:projects(project_name), tender:tenders(tender_name)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) throw error
  return data as any
}

export async function getEstimationById(id: string) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('estimations')
    .select('*, project:projects(project_name), tender:tenders(tender_name), estimation_items(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as any
}

export async function createEstimation(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData) as Record<string, string | File>

    const totalDirectCost = parseFloat((rawData['total_direct_cost'] as string) || '0') || 0
    const overheadsPct = parseFloat((rawData['overheads_pct'] as string) || '0') || 0
    const profitPct = parseFloat((rawData['profit_pct'] as string) || '0') || 0
    const overheadAmount = totalDirectCost * (overheadsPct / 100)
    const profitAmount = (totalDirectCost + overheadAmount) * (profitPct / 100)
    const grandTotal = totalDirectCost + overheadAmount + profitAmount

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminClient = await createAdminClient()
    const { error } = await adminClient.from('estimations').insert({
      name: rawData['name'] as string,
      project_id: (rawData['project_id'] as string) || null,
      tender_id: (rawData['tender_id'] as string) || null,
      estimation_date: new Date().toISOString().split('T')[0],
      total_direct_cost: totalDirectCost,
      overheads_pct: overheadsPct,
      profit_pct: profitPct,
      grand_total: grandTotal,
      created_by: user?.id,
    } as any)
    if (error) return { error: error.message }
    revalidatePath('/estimation')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function updateEstimation(id: string, _prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData) as Record<string, string | File>

    const totalDirectCost = parseFloat((rawData['total_direct_cost'] as string) || '0') || 0
    const overheadsPct = parseFloat((rawData['overheads_pct'] as string) || '0') || 0
    const profitPct = parseFloat((rawData['profit_pct'] as string) || '0') || 0
    const overheadAmount = totalDirectCost * (overheadsPct / 100)
    const profitAmount = (totalDirectCost + overheadAmount) * (profitPct / 100)
    const grandTotal = totalDirectCost + overheadAmount + profitAmount

    const adminClient = await createAdminClient()
    const { error } = await (adminClient.from('estimations') as any)
      .update({
        name: rawData['name'] as string,
        project_id: (rawData['project_id'] as string) || null,
        total_direct_cost: totalDirectCost,
        overheads_pct: overheadsPct,
        profit_pct: profitPct,
        grand_total: grandTotal,
      })
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/estimation')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function deleteEstimation(id: string): Promise<any> {
  try {
    await requireRole(['admin', 'manager'])
    const adminClient = await createAdminClient()
    const { error } = await (adminClient.from('estimations') as any).update({ is_deleted: true }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/estimation')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function getEstimationItems(estimationId: string) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('estimation_items')
    .select('*')
    .eq('estimation_id', estimationId)
    .eq('is_deleted', false)
    .order('id')
  if (error) throw error
  return data as any
}

export async function upsertEstimationItems(estimationId: string, items: { description: string; unit: string; quantity: number; rate: number; category: string }[]): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    const toUpsert = items.map(item => ({
      estimation_id: estimationId,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.quantity * item.rate,
      category: item.category,
    }))

    await adminClient.from('estimation_items').upsert(toUpsert as any, { onConflict: 'estimation_id,description' })

    const totalDirectCost = items.reduce((s, i) => s + i.quantity * i.rate, 0)
    const { data: est } = await adminClient.from('estimations').select('overheads_pct, profit_pct').eq('id', estimationId).single() as any
    if (est) {
      const overheadAmount = totalDirectCost * ((est.overheads_pct ?? 0) / 100)
      const profitAmount = (totalDirectCost + overheadAmount) * ((est.profit_pct ?? 0) / 100)
      const grandTotal = totalDirectCost + overheadAmount + profitAmount
await (adminClient.from('estimations') as any).update({ total_direct_cost: totalDirectCost, grand_total: grandTotal }).eq('id', estimationId)
    }

    revalidatePath('/estimation')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function createOrUpdateEstimationItems(estimationId: string, items: { description: string; unit: string; quantity: number; rate: number; category: string }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const adminClient = await createAdminClient()
  const toUpsert = items.map(item => ({
    estimation_id: estimationId,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.quantity * item.rate,
    category: item.category,
  }))

  const { error } = await adminClient.from('estimation_items').upsert(toUpsert as any, { onConflict: 'estimation_id,description' })
  if (error) return { error: error.message }

  const totalDirectCost = items.reduce((s, i) => s + i.quantity * i.rate, 0)
  const { data: est } = await adminClient.from('estimations').select('overheads_pct, profit_pct').eq('id', estimationId).single() as any
  if (est) {
    const overheadAmount = totalDirectCost * ((est.overheads_pct ?? 0) / 100)
    const profitAmount = (totalDirectCost + overheadAmount) * ((est.profit_pct ?? 0) / 100)
    const grandTotal = totalDirectCost + overheadAmount + profitAmount
    await (adminClient.from('estimations') as any).update({ total_direct_cost: totalDirectCost, grand_total: grandTotal }).eq('id', estimationId)
  }

  return { success: true }
}

export async function getProjectFinancials(projectId: string) {
  const supabase = await createAdminClient()

  const [projectResult, billsResult, expensesResult, materialsResult] = await Promise.all([
    supabase.from('projects').select('contract_value, project_name').eq('id', projectId).single() as any,
    supabase.from('ra_bills').select('gross_amount, net_payable, certified_amount, status').eq('project_id', projectId).eq('is_deleted', false) as any,
    supabase.from('expenses').select('category, amount').eq('project_id', projectId).eq('is_deleted', false) as any,
    supabase.from('material_inward').select('quantity, rate_per_unit').eq('project_id', projectId).eq('is_deleted', false) as any,
  ])

  const project = projectResult.data
  const bills = billsResult.data ?? []
  const expenses = expensesResult.data ?? []
  const materials = materialsResult.data ?? []

  const totalBilled = bills.reduce((s: number, b: any) => s + (b.net_payable ?? b.gross_amount ?? 0), 0)
  const totalSpent = expenses.reduce((s: number, e: any) => s + e.amount, 0)
  const totalMaterials = materials.reduce((s: number, m: any) => s + (m.quantity ?? 0) * (m.rate_per_unit ?? 0), 0)
  const contractValue = project?.contract_value ?? project?.project_value ?? 0

  const netMargin = totalBilled - totalSpent
  const marginPct = contractValue > 0 ? (netMargin / contractValue) * 100 : 0

  const expByCategory: Record<string, number> = {}
  expenses.forEach((e: any) => { expByCategory[e.category] = (expByCategory[e.category] ?? 0) + e.amount })

  return {
    contractValue,
    totalBilled,
    totalSpent,
    totalMaterials,
    netMargin,
    marginPct,
    expByCategory,
  }
}

export type Estimation = Awaited<ReturnType<typeof getEstimations>>[number]