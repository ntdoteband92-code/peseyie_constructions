'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardData() {
  const supabase = await createClient()

  const [
    { count: activeProjectsCount, error: pError },
    { data: projects },
    { data: recentBills },
    { data: recentExpenses },
    { data: cashflow },
    { data: orgSettings },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'ongoing').eq('is_deleted', false),
    supabase.from('projects').select('id, project_name, status, contract_value').eq('is_deleted', false).order('created_at', { ascending: false }).limit(10),
    supabase.from('ra_bills').select('*, ra_bill_payments(amount_received), project:projects(project_name)').eq('is_deleted', false).order('created_at', { ascending: false }).limit(10),
    supabase.from('expenses').select('*, project:projects(project_name)').eq('is_deleted', false).order('expense_date', { ascending: false }).limit(10),
    supabase.rpc('get_monthly_cashflow', { months_back: 6 } as any),
    supabase.from('org_settings').select('*').limit(1).single(),
  ]) as any

  const { data: totalContractValue } = await supabase
    .from('projects')
    .select('contract_value')
    .eq('status', 'ongoing')
    .eq('is_deleted', false)

  const contractValueSum = (totalContractValue as any)?.reduce((s: number, p: any) => s + (p.contract_value ?? 0), 0) ?? 0

  const { count: equipmentCount } = await supabase
    .from('equipment')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('is_deleted', false)

  const { data: recentActivity } = await supabase
    .from('diary_entries')
    .select('*, project:projects(project_name), created_by_user:profiles!diary_entries_created_by_fkey(full_name)')
    .eq('is_deleted', false)
    .order('entry_date', { ascending: false })
    .limit(15)

  const billedThisMonth = (recentBills as any)
    ?.filter((b: any) => {
      const billDate = new Date(b.bill_date)
      const now = new Date()
      return billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear()
    })
    ?.reduce((s: number, b: any) => s + (b.gross_amount ?? 0), 0) ?? 0

  const receivedThisMonth = (recentBills as any)
    ?.flatMap((b: any) => (b.ra_bill_payments ?? []))
    ?.filter((p: { payment_date: string }) => {
      const payDate = new Date(p.payment_date)
      const now = new Date()
      return payDate.getMonth() === now.getMonth() && payDate.getFullYear() === now.getFullYear()
    })
    ?.reduce((s: number, p: { amount_received: number }) => s + (p.amount_received ?? 0), 0) ?? 0

  const { data: pendingRetention } = await supabase
    .from('ra_bill_deductions')
    .select('amount')
    .eq('deduction_type', 'retention')
    .eq('is_deleted', false)

  const pendingRetentionSum = (pendingRetention as any)?.reduce((s: number, d: any) => s + (d.amount ?? 0), 0) ?? 0

  const { data: projectStatusCounts } = await supabase
    .from('projects')
    .select('status')
    .eq('is_deleted', false)

  const statusCounts: Record<string, number> = {}
  for (const p of ((projectStatusCounts ?? []) as any)) {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1
  }

  const { data: topExpenseCategories } = await supabase
    .from('expenses')
    .select('category, amount')
    .eq('is_deleted', false)

  const expenseByCategory: Record<string, number> = {}
  for (const e of ((topExpenseCategories ?? []) as any)) {
    expenseByCategory[e.category] = (expenseByCategory[e.category] ?? 0) + (e.amount ?? 0)
  }

  const topCategories = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }))

  return {
    activeProjectsCount: activeProjectsCount ?? 0,
    contractValueSum,
    equipmentCount: equipmentCount ?? 0,
    billedThisMonth,
    receivedThisMonth,
    pendingRetention: pendingRetentionSum,
    statusCounts,
    topCategories,
    cashflow: (cashflow as any) ?? [],
    recentActivity: (recentActivity as any) ?? [],
    projects: (projects as any) ?? [],
  }
}