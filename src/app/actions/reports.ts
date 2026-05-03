'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
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

export async function getReportSummary() {
  const supabase = await createAdminClient()

  const { count: projectCount, data: projectList } = await supabase
    .from('projects')
    .select('id, project_name, status', { count: 'exact' })
    .eq('is_deleted', false)
  console.log(`DEBUG: Found ${projectCount} projects in database:`, projectList)

  const cacheBuster = Date.now()

  const [projectsResult, raBillsResult, expensesResult, workersResult, materialsResult, diaryResult] = await Promise.all([
    supabase.from('projects').select('id, project_name, status, contract_value, start_date, expected_end_date', { count: 'exact' }).eq('is_deleted', false),
    supabase.from('ra_bills').select('id, bill_number, bill_date, gross_amount, status, project_id', { count: 'exact' }).eq('is_deleted', false),
    supabase.from('expenses').select('amount, category, project_id, expense_date', { count: 'exact' }).eq('is_deleted', false),
    supabase.from('employees').select('id, full_name, role, wage_rate, is_active', { count: 'exact' }).eq('is_deleted', false),
    supabase.from('material_inward').select('id, quantity, rate_per_unit, project_id, inward_date', { count: 'exact' }).eq('is_deleted', false),
    supabase.from('diary_entries').select('id, entry_date, project_id', { count: 'exact' }).eq('is_deleted', false),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('is_deleted', false).then(res => console.log(`[${cacheBuster}] Projects count:`, res.count)),
  ])

  const projects = projectsResult.data ?? []
  const raBills = raBillsResult.data ?? []
  const expenses = expensesResult.data ?? []
  const workers = workersResult.data ?? []
  const materials = materialsResult.data ?? []
  const diaryEntries = diaryResult.data ?? []

  const activeWorkers = workers.filter((w: any) => w.is_active).length

  const totalProjectValue = projects.reduce((sum: number, p: any) => sum + (p.contract_value ?? 0), 0)
  const totalRAbills = raBills.reduce((sum: number, b: any) => sum + (b.gross_amount ?? 0), 0)
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount ?? 0), 0)

  const projectExpenseMap: Record<string, number> = {}
  expenses.forEach((e: any) => {
    if (e.project_id) {
      projectExpenseMap[e.project_id] = (projectExpenseMap[e.project_id] ?? 0) + e.amount
    }
  })

  const projectMaterialsMap: Record<string, number> = {}
  materials.forEach((m: any) => {
    if (m.project_id) {
      projectMaterialsMap[m.project_id] = (projectMaterialsMap[m.project_id] ?? 0) + (m.quantity ?? 0) * (m.rate_per_unit ?? 0)
    }
  })

  const projectDiaryCount: Record<string, number> = {}
  diaryEntries.forEach((d: any) => {
    if (d.project_id) {
      projectDiaryCount[d.project_id] = (projectDiaryCount[d.project_id] ?? 0) + 1
    }
  })

  const projectSummary = projects.map((p: any) => {
    const projectBills = raBills.filter((b: any) => b.project_id === p.id)
    const billedAmount = projectBills.reduce((sum: number, b: any) => sum + (b.gross_amount ?? 0), 0)
    return {
      id: p.id,
      name: p.project_name,
      status: p.status,
      value: p.contract_value ?? 0,
      start_date: p.start_date,
      end_date: p.expected_end_date,
      ra_bills_count: projectBills.length,
      billed_amount: billedAmount,
      billed_pct: p.contract_value ? Math.round((billedAmount / p.contract_value) * 100) : 0,
      total_expenses: projectExpenseMap[p.id] ?? 0,
      total_materials: projectMaterialsMap[p.id] ?? 0,
      diary_entries: projectDiaryCount[p.id] ?? 0,
    }
  })

  const expenseByCategory = Object.entries(
    expenses.reduce((acc: Record<string, number>, e: any) => {
      const cat = e.category ?? 'Other'
      acc[cat] = (acc[cat] ?? 0) + e.amount
      return acc
    }, {})
  ).map(([category, amount]) => ({ category, amount: amount as number })).sort((a, b) => b.amount - a.amount)

  const raBillStatusSummary = {
    pending: raBills.filter((b: any) => b.status === 'draft').reduce((s: number, b: any) => s + (b.gross_amount ?? 0), 0),
    certified: raBills.filter((b: any) => b.status === 'certified').reduce((s: number, b: any) => s + (b.gross_amount ?? 0), 0),
    approved: raBills.filter((b: any) => b.status === 'payment_released').reduce((s: number, b: any) => s + (b.gross_amount ?? 0), 0),
    paid: raBills.filter((b: any) => b.status === 'partially_paid').reduce((s: number, b: any) => s + (b.gross_amount ?? 0), 0),
    rejected: raBills.filter((b: any) => b.status === 'submitted').reduce((s: number, b: any) => s + (b.gross_amount ?? 0), 0),
    count: raBills.length,
  }

  return {
    stats: {
      total_projects: projects.length,
      active_projects: projects.filter((p: any) => p.status !== 'completed' && p.status !== 'terminated').length,
      totalProjectValue,
      total_ra_bills: totalRAbills,
      total_expenses: totalExpenses,
      active_workers: activeWorkers,
      total_workers: workers.length,
      total_ra_bill_count: raBills.length,
    },
    projectSummary,
    expenseByCategory,
    raBillStatusSummary,
  }
}

export type ReportSummary = Awaited<ReturnType<typeof getReportSummary>>