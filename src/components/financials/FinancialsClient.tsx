'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  IndianRupee,
  Plus,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import type { ExpenseWithProject } from '@/app/actions/expenses'
import type { ExpenseCategory, PaymentMode } from '@/lib/supabase/types'

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'labour_wages', label: 'Labour Wages' },
  { value: 'materials', label: 'Materials' },
  { value: 'equipment_hire', label: 'Equipment Hire' },
  { value: 'explosives_purchase', label: 'Explosives Purchase' },
  { value: 'transport', label: 'Transport' },
  { value: 'subcontractor_payment', label: 'Subcontractor Payment' },
  { value: 'royalty', label: 'Royalty' },
  { value: 'tds_paid', label: 'TDS Paid' },
  { value: 'gst_paid', label: 'GST Paid' },
  { value: 'office_admin', label: 'Office / Admin' },
  { value: 'repairs_maintenance', label: 'Repairs & Maintenance' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
]

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'neft_rtgs', label: 'NEFT/RTGS' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi', label: 'UPI' },
]

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'dd/MM/yyyy') } catch { return '—' }
}

export default function FinancialsClient({
  expenses,
  income,
  projects,
}: {
  expenses: ExpenseWithProject[]
  income: any[]
  projects: { id: string; project_name: string }[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showIncomeDialog, setShowIncomeDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [tab, setTab] = useState<'expenses' | 'income'>('expenses')

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = search === '' ||
        e.paid_to?.toLowerCase().includes(search.toLowerCase()) ||
        e.notes?.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter
      const matchesProject = projectFilter === 'all' || e.project_id === projectFilter
      return matchesSearch && matchesCategory && matchesProject
    })
  }, [expenses, search, categoryFilter, projectFilter])

  const totals = useMemo(() => {
    const total = filteredExpenses.reduce((s, e) => s + (e.amount ?? 0), 0)
    const thisMonth = expenses
      .filter(e => {
        const d = new Date(e.expense_date)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((s, e) => s + (e.amount ?? 0), 0)
    return { total, thisMonth }
  }, [filteredExpenses, expenses])

  const incomeTotals = useMemo(() => {
    const total = income.reduce((s, i) => s + (i.amount ?? 0), 0)
    const thisMonth = income
      .filter(i => {
        const d = new Date(i.date_received)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((s, i) => s + (i.amount ?? 0), 0)
    return { total, thisMonth }
  }, [income])

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Entry deleted')
      setDeleteId(null)
      router.refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financials</h1>
          <p className="text-sm text-gray-500">
            {tab === 'expenses' ? `${filteredExpenses.length} expenses` : `${income.length} entries`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTab('expenses')} className={tab === 'expenses' ? 'bg-amber-50 border-amber-200' : ''}>
            <ArrowDownCircle className="mr-2 h-4 w-4 text-red-500" />Expenses
          </Button>
          <Button variant="outline" onClick={() => setShowIncomeDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />Income
          </Button>
          <Button onClick={() => setShowExpenseDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />Add Expense
          </Button>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setTab('expenses')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'expenses' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Expenses
        </button>
        <button
          onClick={() => setTab('income')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'income' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Income / Receipts
        </button>
      </div>

      {tab === 'expenses' ? (
        <>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <p className="text-xs text-red-600">Total (Filtered)</p>
                <p className="text-xl font-bold text-red-700">{formatINR(totals.total)}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <p className="text-xs text-orange-600">This Month</p>
                <p className="text-xl font-bold text-orange-700">{formatINR(totals.thisMonth)}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-xs text-blue-600">Entries</p>
                <p className="text-xl font-bold text-blue-700">{filteredExpenses.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
            </select>
          </div>

          {/* Expenses Table */}
          {filteredExpenses.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-16">
              <ArrowDownCircle className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No expenses found</h3>
              <p className="mt-1 text-sm text-gray-500">Add your first expense entry</p>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium text-gray-500">Date</th>
                        <th className="text-left p-3 font-medium text-gray-500">Category</th>
                        <th className="text-left p-3 font-medium text-gray-500">Project</th>
                        <th className="text-left p-3 font-medium text-gray-500">Paid To</th>
                        <th className="text-right p-3 font-medium text-gray-500">Amount</th>
                        <th className="text-left p-3 font-medium text-gray-500">Mode</th>
                        <th className="text-right p-3 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map(expense => (
                        <tr key={expense.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{formatDate(expense.expense_date)}</td>
                          <td className="p-3">
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                              {expense.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">{expense.project?.project_name ?? '—'}</td>
                          <td className="p-3 text-gray-600">{expense.paid_to ?? '—'}</td>
                          <td className="p-3 text-right font-medium text-red-600">{formatINR(expense.amount)}</td>
                          <td className="p-3 text-gray-500">{expense.payment_mode ?? '—'}</td>
                          <td className="p-3 text-right">
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(expense.id)} className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Income Tab */
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-xs text-green-600">Total Income</p>
                <p className="text-xl font-bold text-green-700">{formatINR(incomeTotals.total)}</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4">
                <p className="text-xs text-emerald-600">This Month</p>
                <p className="text-xl font-bold text-emerald-700">{formatINR(incomeTotals.thisMonth)}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-xs text-blue-600">Entries</p>
                <p className="text-xl font-bold text-blue-700">{income.length}</p>
              </CardContent>
            </Card>
          </div>

          {income.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-16">
              <ArrowUpCircle className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No income entries</h3>
              <p className="mt-1 text-sm text-gray-500">Add your first income/receipt entry</p>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium text-gray-500">Date</th>
                        <th className="text-left p-3 font-medium text-gray-500">Project</th>
                        <th className="text-left p-3 font-medium text-gray-500">RA Bill</th>
                        <th className="text-left p-3 font-medium text-gray-500">Mode</th>
                        <th className="text-right p-3 font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {income.map(entry => (
                        <tr key={entry.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{formatDate(entry.date_received)}</td>
                          <td className="p-3 text-gray-600">{entry.project?.project_name ?? '—'}</td>
                          <td className="p-3 text-gray-600">{entry.ra_bill?.bill_number ?? '—'}</td>
                          <td className="p-3 text-gray-500">{entry.payment_mode ?? '—'}</td>
                          <td className="p-3 text-right font-medium text-green-600">{formatINR(entry.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <form action={`/api/expenses?/create`} method="post" className="space-y-4">
            <input type="hidden" name="action" value="createExpense" />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Date *</label>
                <input type="date" name="expense_date" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Amount (₹) *</label>
                <input type="number" name="amount" min="0" step="1" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Category *</label>
                <select name="category" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Project</label>
                <select name="project_id" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select project (optional)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Paid To</label>
                <input type="text" name="paid_to" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Payment Mode</label>
                <select name="payment_mode" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select mode</option>
                  {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">GST Amount (₹)</label>
                <input type="number" name="gst_amount" min="0" step="1" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">TDS Deducted (₹)</label>
                <input type="number" name="tds_deducted" min="0" step="1" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea name="notes" rows={2} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowExpenseDialog(false)}>Cancel</Button>
              <Button type="submit">Add Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Income Dialog */}
      <Dialog open={showIncomeDialog} onOpenChange={setShowIncomeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Income / Receipt</DialogTitle></DialogHeader>
          <form action={`/api/expenses?/createIncome`} method="post" className="space-y-4">
            <input type="hidden" name="action" value="createIncome" />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Date Received *</label>
                <input type="date" name="date_received" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Amount (₹) *</label>
                <input type="number" name="amount" min="0" step="1" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Project</label>
                <select name="project_id" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select project (optional)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Payment Mode</label>
                <select name="payment_mode" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select mode</option>
                  {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">UTR / Reference No.</label>
                <input type="text" name="reference_no" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Remarks</label>
                <textarea name="remarks" rows={2} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowIncomeDialog(false)}>Cancel</Button>
              <Button type="submit">Add Income</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>This will soft-delete this entry. It can be restored later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}