'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Package,
  Plus,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  ShieldAlert,
  Trash2,
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
import { toast } from 'sonner'
import type { Material, ExplosiveEntry } from '@/app/actions/materials'

const MATERIAL_CATEGORIES = [
  'Aggregate', 'Cement', 'Bitumen', 'Steel', 'Sand', 'Pipes', 'Explosive',
  'Detonator', 'Fuel HSD', 'Lubricants', 'Timber', 'Hardware', 'Other',
]

const UNITS = ['mt', 'cft', 'cum', 'bags', 'litres', 'kg', 'nos', 'rmt']

function formatINR(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'dd/MM/yyyy') } catch { return '—' }
}

export default function MaterialsClient({
  materials,
  materialInward,
  explosives,
  projects,
}: {
  materials: Material[]
  materialInward: any[]
  explosives: ExplosiveEntry[]
  projects: { id: string; project_name: string }[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [tab, setTab] = useState<'registry' | 'inward' | 'explosives'>('registry')
  const [showMaterialDialog, setShowMaterialDialog] = useState(false)
  const [showInwardDialog, setShowInwardDialog] = useState(false)
  const [showExplosiveDialog, setShowExplosiveDialog] = useState(false)

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = search === '' || m.material_name?.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [materials, search, categoryFilter])

  const explosivesBalance = useMemo(() => {
    let balance = 0
    for (const e of explosives) {
      if (e.entry_type === 'inward') balance += e.quantity ?? 0
      else if (e.entry_type === 'issue') balance -= e.quantity ?? 0
      else if (e.entry_type === 'return') balance += e.quantity ?? 0
    }
    return balance
  }, [explosives])

  const handleSubmit = async (formData: FormData, action: string) => {
    try {
      const payload = Object.fromEntries(formData)
      const res = await fetch(`/api/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      toast.success('Created successfully')
      setShowMaterialDialog(false)
      setShowInwardDialog(false)
      setShowExplosiveDialog(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create')
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Delete this material?')) return
    try {
      const res = await fetch(`/api/materials?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Material deleted')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleDeleteExplosive = async (id: string) => {
    if (!confirm('Delete this explosive entry?')) return
    try {
      const res = await fetch(`/api/materials?id=${id}&type=explosive`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Explosive entry deleted')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materials & Inventory</h1>
          <p className="text-sm text-gray-500">{materials.length} materials, {explosivesBalance}kg explosives</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTab('registry')} className={tab === 'registry' ? 'bg-amber-50 border-amber-200' : ''}>
            <Package className="mr-2 h-4 w-4" />Registry
          </Button>
          <Button variant="outline" onClick={() => setTab('inward')} className={tab === 'inward' ? 'bg-amber-50 border-amber-200' : ''}>
            <ArrowDownCircle className="mr-2 h-4 w-4" />Inward
          </Button>
          <Button variant="outline" onClick={() => setShowExplosiveDialog(true)} className="border-red-200 text-red-600 hover:bg-red-50">
            <ShieldAlert className="mr-2 h-4 w-4" />Explosives
          </Button>
          <Button onClick={() => setShowMaterialDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />Add Material
          </Button>
        </div>
      </div>

      {tab === 'registry' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">All Categories</option>
              {MATERIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {filteredMaterials.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No materials found</h3>
            </CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMaterials.map(m => (
                <Card key={m.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{m.material_name}</h3>
                        <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 mt-1">{m.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded">{m.unit}</span>
                        <button onClick={() => handleDeleteMaterial(m.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {m.standard_rate && (
                      <p className="text-sm text-gray-600 mt-2">Rate: {formatINR(m.standard_rate)}/{m.unit}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'inward' && (
        <>
          <Button variant="outline" onClick={() => setShowInwardDialog(true)} className="mb-4">
            <Plus className="mr-2 h-4 w-4" />Record Material Inward
          </Button>

          {materialInward.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-16">
              <ArrowDownCircle className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No inward records</h3>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-500">Date</th>
                      <th className="text-left p-3 font-medium text-gray-500">Material</th>
                      <th className="text-left p-3 font-medium text-gray-500">Project</th>
                      <th className="text-right p-3 font-medium text-gray-500">Qty</th>
                      <th className="text-right p-3 font-medium text-gray-500">Amount</th>
                      <th className="text-left p-3 font-medium text-gray-500">Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialInward.map(i => (
                      <tr key={i.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{formatDate(i.inward_date)}</td>
                        <td className="p-3">{i.material?.material_name ?? '—'}</td>
                        <td className="p-3 text-gray-600">{i.project?.project_name ?? '—'}</td>
                        <td className="p-3 text-right">{i.quantity} {i.material?.unit}</td>
                        <td className="p-3 text-right font-medium text-red-600">{formatINR(i.total_amount)}</td>
                        <td className="p-3 text-gray-500">{i.vendor_id ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Explosives Dialog */}
      {showExplosiveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                Explosives Register
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowExplosiveDialog(false)}>×</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-red-800">Current Magazine Balance: {explosivesBalance} kg</p>
                <p className="text-xs text-red-600 mt-1">This balance must always be accurate for regulatory compliance.</p>
              </div>

              {explosives.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-2 font-medium text-gray-500">Date</th>
                        <th className="text-left p-2 font-medium text-gray-500">Type</th>
                        <th className="text-left p-2 font-medium text-gray-500">In</th>
                        <th className="text-left p-2 font-medium text-gray-500">Out</th>
                        <th className="text-left p-2 font-medium text-gray-500">Balance</th>
                        <th className="text-left p-2 font-medium text-gray-500">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {explosives.map((e, i) => {
                        let balance = 0
                        for (let j = 0; j <= i; j++) {
                          const entry = explosives[j]
                          if (entry.entry_type === 'inward') balance += entry.quantity ?? 0
                          else if (entry.entry_type === 'issue') balance -= entry.quantity ?? 0
                          else if (entry.entry_type === 'return') balance += entry.quantity ?? 0
                        }
                        return (
                          <tr key={e.id} className="border-b">
                            <td className="p-2">{formatDate(e.entry_date)}</td>
                            <td className="p-2">{e.explosive_type}</td>
                            <td className="p-2 text-green-600">{e.entry_type === 'inward' ? `${e.quantity}kg` : '—'}</td>
                            <td className="p-2 text-red-600">{e.entry_type === 'issue' ? `${e.quantity}kg` : '—'}</td>
                            <td className="p-2 font-medium">{balance}kg</td>
                            <td className="p-2 text-gray-500 text-xs">{e.source_dealer || e.invoice_no || '—'}</td>
                            <td className="p-2">
                              <button onClick={() => handleDeleteExplosive(e.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <form action={(fd) => handleSubmit(fd, 'explosive')} className="space-y-4 border-t pt-4">
                <input type="hidden" name="action" value="createExplosive" />
                <h4 className="text-sm font-medium">Add New Entry</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium">Entry Type *</label>
                    <select name="entry_type" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="inward">Inward (Received)</option>
                      <option value="issue">Issue (For Blasting)</option>
                      <option value="return">Return to Magazine</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Explosive Type *</label>
                    <select name="explosive_type" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select type</option>
                      <option value="ANFO">ANFO</option>
                      <option value="Slurry">Slurry</option>
                      <option value="Detonators">Detonators</option>
                      <option value="Cord">Cord</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date *</label>
                    <input type="date" name="entry_date" required defaultValue={new Date().toISOString().split('T')[0]} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Quantity (kg) *</label>
                    <input type="number" name="quantity" min="0" step="0.1" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Source / Issued To</label>
                    <input name="source_dealer" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="For issue: who received" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Invoice / Transport Permit</label>
                    <input name="invoice_no" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                </div>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">Add Entry</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Material Dialog */}
      <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Material</DialogTitle></DialogHeader>
          <form action={(fd) => handleSubmit(fd, 'material')} className="space-y-4">
            <input type="hidden" name="action" value="createMaterial" />
            <div>
              <label className="text-sm font-medium">Material Name *</label>
              <input name="material_name" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Category *</label>
              <select name="category" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {MATERIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Unit *</label>
              <select name="unit" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Standard Rate (₹)</label>
              <input type="number" name="standard_rate" min="0" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMaterialDialog(false)}>Cancel</Button>
              <Button type="submit">Add Material</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Inward Dialog */}
      <Dialog open={showInwardDialog} onOpenChange={setShowInwardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Material Inward</DialogTitle></DialogHeader>
          <form action={(fd) => handleSubmit(fd, 'inward')} className="space-y-4">
            <input type="hidden" name="action" value="createInward" />
            <div>
              <label className="text-sm font-medium">Material *</label>
              <select name="material_id" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select material</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.material_name} ({m.unit})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Project *</label>
              <select name="project_id" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Quantity (units) *</label>
                <input type="number" name="quantity" min="1" required placeholder="Enter quantity" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Rate per Unit (₹)</label>
                <input type="number" name="rate_per_unit" min="0" required placeholder="₹ per unit" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Date *</label>
              <input type="date" name="inward_date" required defaultValue={new Date().toISOString().split('T')[0]} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Supplier</label>
              <input name="vendor_id" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Invoice Number</label>
              <input name="invoice_no" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowInwardDialog(false)}>Cancel</Button>
              <Button type="submit">Record Inward</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}