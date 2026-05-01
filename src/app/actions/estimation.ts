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

export async function getEstimations(projectId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('estimations')
    .select('*, project:projects(project_name), tender:tenders(tender_name)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (projectId) query = query.eq('project_id', projectId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getEstimationById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('estimations')
    .select('*, project:projects(project_name), tender:tenders(tender_name), estimation_items(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createEstimation(_prevState: any, formData: FormData): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const rawData = Object.fromEntries(formData)

    const totalDirectCost = parseFloat(rawData.get('total_direct_cost') as string) || 0
    const overheadsPct = parseFloat(rawData.get('overheads_pct') as string) || 0
    const profitPct = parseFloat(rawData.get('profit_pct') as string) || 0
    const overheadAmount = totalDirectCost * (overheadsPct / 100)
    const profitAmount = (totalDirectCost + overheadAmount) * (profitPct / 100)
    const grandTotal = totalDirectCost + overheadAmount + profitAmount

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('estimations').insert({
      name: rawData.get('name') as string,
      project_id: rawData.get('project_id') as string || null,
      tender_id: rawData.get('tender_id') as string || null,
      estimation_date: new Date().toISOString().split('T')[0],
      total_direct_cost: totalDirectCost,
      overheads_pct: overheadsPct,
      profit_pct: profitPct,
      grand_total: grandTotal,
      created_by: user?.id,
    })
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
    const rawData = Object.fromEntries(formData)

    const totalDirectCost = parseFloat(rawData.get('total_direct_cost') as string) || 0
    const overheadsPct = parseFloat(rawData.get('overheads_pct') as string) || 0
    const profitPct = parseFloat(rawData.get('profit_pct') as string) || 0
    const overheadAmount = totalDirectCost * (overheadsPct / 100)
    const profitAmount = (totalDirectCost + overheadAmount) * (profitPct / 100)
    const grandTotal = totalDirectCost + overheadAmount + profitAmount

    const supabase = await createClient()
    const { error } = await supabase
      .from('estimations')
      .update({
        name: rawData.get('name') as string,
        project_id: rawData.get('project_id') as string || null,
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
    const supabase = await createClient()
    const { error } = await supabase.from('estimations').update({ is_deleted: true }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/estimation')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}

export async function getEstimationItems(estimationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('estimation_items')
    .select('*')
    .eq('estimation_id', estimationId)
    .eq('is_deleted', false)
    .order('id')
  if (error) throw error
  return data
}

export async function upsertEstimationItems(estimationId: string, items: { description: string; unit: string; quantity: number; rate: number; category: string }[]): Promise<any> {
  try {
    await requireRole(['admin', 'manager', 'supervisor'])
    const supabase = await createClient()

    const toUpsert = items.map(item => ({
      estimation_id: estimationId,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.quantity * item.rate,
      category: item.category,
    }))

    await supabase.from('estimation_items').upsert(toUpsert, { onConflict: 'estimation_id,description' })

    const totalDirectCost = items.reduce((s, i) => s + i.quantity * i.rate, 0)
    const { data: est } = await supabase.from('estimations').select('overheads_pct, profit_pct').eq('id', estimationId).single()
    if (est) {
      const overheadAmount = totalDirectCost * ((est.overheads_pct ?? 0) / 100)
      const profitAmount = (totalDirectCost + overheadAmount) * ((est.profit_pct ?? 0) / 100)
      const grandTotal = totalDirectCost + overheadAmount + profitAmount
      await supabase.from('estimations').update({ total_direct_cost: totalDirectCost, grand_total: grandTotal }).eq('id', estimationId)
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

  const toUpsert = items.map(item => ({
    estimation_id: estimationId,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.quantity * item.rate,
    category: item.category,
  }))

  const { error } = await supabase.from('estimation_items').upsert(toUpsert, { onConflict: 'estimation_id,description' })
  if (error) return { error: error.message }

  const totalDirectCost = items.reduce((s, i) => s + i.quantity * i.rate, 0)
  const { data: est } = await supabase.from('estimations').select('overheads_pct, profit_pct').eq('id', estimationId).single()
  if (est) {
    const overheadAmount = totalDirectCost * ((est.overheads_pct ?? 0) / 100)
    const profitAmount = (totalDirectCost + overheadAmount) * ((est.profit_pct ?? 0) / 100)
    const grandTotal = totalDirectCost + overheadAmount + profitAmount
    await supabase.from('estimations').update({ total_direct_cost: totalDirectCost, grand_total: grandTotal }).eq('id', estimationId)
  }

  return { success: true }
}

export async function getProjectFinancials(projectId: string) {
  const supabase = await createClient()

  const [projectResult, billsResult, expensesResult, materialsResult] = await Promise.all([
    supabase.from('projects').select('contract_value, project_name, project_value').eq('id', projectId).single(),
    supabase.from('ra_bills').select('gross_amount, net_payable, certified_amount, status').eq('project_id', projectId).eq('is_deleted', false),
    supabase.from('expenses').select('category, amount').eq('project_id', projectId).eq('is_deleted', false),
    supabase.from('material_inward').select('quantity, unit_rate').eq('project_id', projectId).eq('is_deleted', false),
  ])

  const project = projectResult.data
  const bills = billsResult.data ?? []
  const expenses = expensesResult.data ?? []
  const materials = materialsResult.data ?? []

  const totalBilled = bills.reduce((s: number, b: any) => s + (b.net_payable ?? b.gross_amount ?? 0), 0)
  const totalSpent = expenses.reduce((s: number, e: any) => s + e.amount, 0)
  const totalMaterials = materials.reduce((s: number, m: any) => s + (m.quantity ?? 0) * (m.unit_rate ?? 0), 0)
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