'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Calculator,
  Plus,
  Search,
  ChevronRight,
  Trash2,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Estimation } from '@/app/actions/estimation'
import { EstimationPDF } from '@/components/estimation/EstimationPDF'
import { pdf } from '@react-pdf/renderer'

const CATEGORIES = ['Labour', 'Material', 'Equipment', 'Subcontract', 'Overhead', 'Other']
const UNITS = ['Cu.m', 'Sq.m', 'Running m', 'MT', 'Quintal', 'Bag', 'Kg', 'Day', 'No.', 'Lump Sum']

function formatINR(n: number) {
  return '₹' + Math.round(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

type LineItem = { description: string; unit: string; quantity: number; rate: number; category: string; amount: number }

function calcTotal(items: LineItem[], overheadsPct: number, profitPct: number) {
  const totalDirectCost = items.reduce((s, i) => s + i.quantity * i.rate, 0)
  const overheadAmount = totalDirectCost * (overheadsPct / 100)
  const profitAmount = (totalDirectCost + overheadAmount) * (profitPct / 100)
  return { totalDirectCost, overheadAmount, profitAmount, grandTotal: totalDirectCost + overheadAmount + profitAmount }
}

export default function EstimationClient({
  estimations: initialEstimations,
  projects,
  varianceData,
}: {
  estimations: Estimation[]
  projects: { id: string; project_name: string }[]
  varianceData: Record<string, any>
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selected, setSelected] = useState<Estimation | null>(null)
  const [items, setItems] = useState<LineItem[]>([
    { description: '', unit: 'Cu.m', quantity: 1, rate: 0, category: 'Material', amount: 0 },
  ])
  const [overheadsPct, setOverheadsPct] = useState(0)
  const [profitPct, setProfitPct] = useState(0)
  const [formName, setFormName] = useState('')
  const [formProject, setFormProject] = useState('')

  const totals = useMemo(() => calcTotal(items, overheadsPct, profitPct), [items, overheadsPct, profitPct])

  const filtered = useMemo(() => {
    return initialEstimations.filter(e => {
      const matchesProject = projectFilter === 'all' || e.project_id === projectFilter
      const matchesSearch = search === '' || e.name?.toLowerCase().includes(search.toLowerCase())
      return matchesProject && matchesSearch
    })
  }, [initialEstimations, search, projectFilter])

  const addItem = () => setItems(prev => [...prev, { description: '', unit: 'Cu.m', quantity: 1, rate: 0, category: 'Material', amount: 0 }])
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      next[i].amount = next[i].quantity * next[i].rate
      return next
    })
  }

  const handleCreate = async () => {
    if (!formName) { toast.error('Estimate name is required'); return }
    if (items.every(i => !i.description)) { toast.error('Add at least one line item'); return }
    try {
      const name = formName
      const project_id = formProject || null
      const total_direct_cost = totals.totalDirectCost
      const overheads_pct = overheadsPct
      const profit_pct = profitPct
      const grand_total = totals.grandTotal

      const res = await fetch('/api/estimation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, project_id, total_direct_cost, overheads_pct, profit_pct, grand_total }),
      })
      if (!res.ok) throw new Error()
      const { id } = await res.json()

      await fetch('/api/estimation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsertItems', estimationId: id, items }),
      })

      toast.success('Estimate created')
      setShowCreateDialog(false)
      resetForm()
      router.refresh()
    } catch {
      toast.error('Failed to create estimate')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this estimate?')) return
    try {
      const res = await fetch(`/api/estimation?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Deleted')
      router.refresh()
    } catch {
      toast.error('Delete failed')
    }
  }

  const handleExportPDF = async (est: Estimation) => {
    try {
      const estItems = est.estimation_items ?? []
      const doc = <EstimationPDF estimation={est} items={estItems} />
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `BOQ-${est.name?.replace(/\s+/g, '-') ?? 'Estimate'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('PDF export failed')
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormProject('')
    setItems([{ description: '', unit: 'Cu.m', quantity: 1, rate: 0, category: 'Material', amount: 0 }])
    setOverheadsPct(0)
    setProfitPct(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cost Estimation (BOQ)</h1>
          <p className="text-sm text-gray-500">{filtered.length} estimates</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />New Estimate
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search estimates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16">
          <Calculator className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No estimates yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first BOQ estimate</p>
          <Button onClick={() => setShowCreateDialog(true)} className="mt-4"><Plus className="mr-2 h-4 w-4" />New Estimate</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(est => {
            const varData = varianceData[est.id]
            return (
              <Card key={est.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{est.name ?? '—'}</h3>
                        {est.tender && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Tender</span>}
                      </div>
                      <p className="text-sm text-gray-500">{est.project?.project_name ?? 'No project linked'}</p>
                      {est.estimation_date && (
                        <p className="text-xs text-gray-400 mt-1">{format(new Date(est.estimation_date), 'dd/MM/yyyy')}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900">{formatINR(est.grand_total ?? 0)}</p>
                      {varData && (
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {varData.variance > 0 ? (
                            <><TrendingUp className="h-3 w-3 text-green-500" /><span className="text-xs text-green-600">{formatINR(varData.variance)} under budget</span></>
                          ) : varData.variance < 0 ? (
                            <><TrendingDown className="h-3 w-3 text-red-500" /><span className="text-xs text-red-600">{formatINR(Math.abs(varData.variance))} over budget</span></>
                          ) : (
                            <><Minus className="h-3 w-3 text-gray-400" /><span className="text-xs text-gray-400">On budget</span></>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleExportPDF(est)}><Download className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(est.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                    <span>Direct Cost: <b>{formatINR(est.total_direct_cost ?? 0)}</b></span>
                    {(est.overheads_pct ?? 0) > 0 && <span>Overheads: <b>{est.overheads_pct}%</b></span>}
                    {(est.profit_pct ?? 0) > 0 && <span>Profit: <b>{est.profit_pct}%</b></span>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Estimate Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={open => { if (!open) { setShowCreateDialog(false); resetForm() } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New BOQ Estimate</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Estimate Name *</label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. CC Road Phase-2 BOQ" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Project (Optional)</label>
                <select value={formProject} onChange={e => setFormProject(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">No project linked</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Overhead %</label>
                <Input type="number" value={overheadsPct} onChange={e => setOverheadsPct(parseFloat(e.target.value) || 0)} min={0} max={100} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Profit %</label>
                <Input type="number" value={profitPct} onChange={e => setProfitPct(parseFloat(e.target.value) || 0)} min={0} max={100} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Grand Total</label>
                <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-lg font-bold text-amber-700">{formatINR(totals.grandTotal)}</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">BOQ Line Items</label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="mr-1 h-3 w-3" />Add Item</Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-2 text-left font-medium text-gray-500 w-8">#</th>
                      <th className="p-2 text-left font-medium text-gray-500">Description</th>
                      <th className="p-2 text-left font-medium text-gray-500 w-20">Category</th>
                      <th className="p-2 text-left font-medium text-gray-500 w-16">Unit</th>
                      <th className="p-2 text-right font-medium text-gray-500 w-24">Qty</th>
                      <th className="p-2 text-right font-medium text-gray-500 w-28">Rate (₹)</th>
                      <th className="p-2 text-right font-medium text-gray-500 w-28">Amount (₹)</th>
                      <th className="p-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-1 text-center text-gray-400">{i + 1}</td>
                        <td className="p-1">
                          <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Item description" className="h-7 text-xs" />
                        </td>
                        <td className="p-1">
                          <select value={item.category} onChange={e => updateItem(i, 'category', e.target.value)} className="h-7 w-full rounded border border-input bg-background px-1 text-xs">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} className="h-7 w-full rounded border border-input bg-background px-1 text-xs">
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          <Input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)} min={0} className="h-7 text-xs text-right" />
                        </td>
                        <td className="p-1">
                          <Input type="number" value={item.rate} onChange={e => updateItem(i, 'rate', parseFloat(e.target.value) || 0)} min={0} className="h-7 text-xs text-right" />
                        </td>
                        <td className="p-1 text-right font-medium text-gray-700 text-xs">{formatINR(item.quantity * item.rate)}</td>
                        <td className="p-1">
                          <button onClick={() => removeItem(i)} className="flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                            <X className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold text-xs">
                      <td colSpan={6} className="p-2 text-right">Total Direct Cost</td>
                      <td className="p-2 text-right">{formatINR(totals.totalDirectCost)}</td>
                      <td />
                    </tr>
                    {overheadsPct > 0 && (
                      <tr className="text-xs text-gray-500">
                        <td colSpan={6} className="p-2 text-right">+ Overheads ({overheadsPct}%)</td>
                        <td className="p-2 text-right">{formatINR(totals.overheadAmount)}</td>
                        <td />
                      </tr>
                    )}
                    {profitPct > 0 && (
                      <tr className="text-xs text-gray-500">
                        <td colSpan={6} className="p-2 text-right">+ Profit ({profitPct}%)</td>
                        <td className="p-2 text-right">{formatINR(totals.profitAmount)}</td>
                        <td />
                      </tr>
                    )}
                    <tr className="bg-amber-50 font-bold text-sm">
                      <td colSpan={6} className="p-2 text-right">Grand Total</td>
                      <td className="p-2 text-right text-amber-700">{formatINR(totals.grandTotal)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm() }}>Cancel</Button>
            <Button onClick={handleCreate}>Create Estimate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}