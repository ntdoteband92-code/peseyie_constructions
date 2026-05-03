'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  FileText,
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
import type { Subcontractor, WorkOrder } from '@/app/actions/subcontractors'

const TRADE_OPTIONS = [
  'Earthwork', 'Granular Sub Base (GSB)', 'Wet Mix Macadam', 'Bituminous Work',
  'Concrete Work', 'Steel Fabrication', ' RCC Work', 'Brick/Block Work',
  'Plastering', 'Flooring', 'Roofing', 'Painting', 'Plumbing', 'Electrical',
  'Horticulture/Landscaping', 'Fencing', 'Bridge Works', 'Culvert Construction',
  'Demolition', 'Other',
]

function SubForm({
  edit,
  onSubmit,
  onCancel,
}: {
  edit?: Subcontractor | null
  onSubmit: (fd: FormData) => void
  onCancel: () => void
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={edit?.id ?? ''} />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Name *</label>
          <input name="firm_name" required defaultValue={edit?.firm_name} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Trade *</label>
          <select name="specialty" required defaultValue={edit?.specialty} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">Select trade</option>
            {TRADE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input name="contact_phone" defaultValue={edit?.contact_phone ?? ''} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input name="email" type="email" defaultValue={edit?.email ?? ''} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Address</label>
          <input name="address" defaultValue={edit?.address ?? ''} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Aadhaar No.</label>
          <input name="pan" defaultValue={edit?.pan ?? ''} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">GST No.</label>
          <input name="gstin" defaultValue={edit?.gstin ?? ''} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_active" value="true" defaultChecked={edit?.is_active !== false} className="h-4 w-4 rounded" />
          <label className="text-sm font-medium">Active</label>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{edit ? 'Update' : 'Add'} Subcontractor</Button>
      </DialogFooter>
    </form>
  )
}

function WOForm({
  edit,
  onSubmit,
  onCancel,
  projects,
  subcontractors,
}: {
  edit?: WorkOrder | null
  onSubmit: (fd: FormData) => void
  onCancel: () => void
  projects: { id: string; project_name: string }[]
  subcontractors: Subcontractor[]
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={edit?.id ?? ''} />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Project *</label>
          <select name="project_id" required defaultValue={edit?.project_id} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">Select project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Subcontractor *</label>
          <select name="subcontractor_id" required defaultValue={edit?.subcontractor_id} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">Select subcontractor</option>
            {subcontractors.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.firm_name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Work Description *</label>
          <input name="work_description" required defaultValue={edit?.work_description} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Location / Chainage</label>
          <textarea name="location_chainage" rows={2} defaultValue={edit?.location_chainage ?? ''} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Total Value (₹) *</label>
          <input type="number" name="total_value" required min="0" step="0.01" defaultValue={edit?.total_value} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <select name="status" defaultValue={edit?.status ?? 'pending'} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Start Date *</label>
          <input type="date" name="start_date" required defaultValue={edit?.start_date ?? new Date().toISOString().split('T')[0]} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">End Date</label>
          <input type="date" name="end_date" defaultValue={edit?.end_date ?? ''} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Remarks</label>
          <input name="remarks" defaultValue={edit?.remarks ?? ''} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{edit ? 'Update' : 'Create'} Work Order</Button>
      </DialogFooter>
    </form>
  )
}

export default function SubcontractorsClient({
  subcontractors: initialSubcontractors,
  workOrders: initialWorkOrders,
  projects,
}: {
  subcontractors: Subcontractor[]
  workOrders: WorkOrder[]
  projects: { id: string; project_name: string }[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tradeFilter, setTradeFilter] = useState<string>('all')
  const [tab, setTab] = useState<'registry' | 'work-orders'>('registry')
  const [showSubDialog, setShowSubDialog] = useState(false)
  const [showWODialog, setShowWODialog] = useState(false)
  const [editSub, setEditSub] = useState<Subcontractor | null>(null)
  const [editWO, setEditWO] = useState<WorkOrder | null>(null)

  const filteredSubcontractors = useMemo(() => {
    return initialSubcontractors.filter(s => {
      const matchesSearch = search === '' || s.firm_name?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? s.is_active : !s.is_active)
      const matchesTrade = tradeFilter === 'all' || s.specialty === tradeFilter
      return matchesSearch && matchesStatus && matchesTrade
    })
  }, [initialSubcontractors, search, statusFilter, tradeFilter])

  const filteredWorkOrders = useMemo(() => {
    return initialWorkOrders.filter(wo => {
      const matchesSearch = search === '' || wo.work_description?.toLowerCase().includes(search.toLowerCase())
      return matchesSearch
    })
  }, [initialWorkOrders, search])

  const handleSubmit = async (formData: FormData, type: 'sub' | 'wo') => {
    try {
      const payload = Object.fromEntries(formData)
      const action = type === 'sub' ? 'createSubcontractor' : 'createWorkOrder'
      const res = await fetch('/api/subcontractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      toast.success(type === 'sub' ? 'Subcontractor added' : 'Work order created')
      setShowSubDialog(false)
      setShowWODialog(false)
      setEditSub(null)
      setEditWO(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed')
    }
  }

  const handleDelete = async (id: string, type: 'sub' | 'wo') => {
    if (!confirm('Are you sure you want to delete this?')) return
    try {
      const res = await fetch(`/api/subcontractors?id=${id}&type=${type}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Deleted successfully')
      router.refresh()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setTab('registry')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'registry' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Subcontractor Registry
        </button>
        <button
          onClick={() => setTab('work-orders')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'work-orders' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Work Orders
        </button>
      </div>

      {/* Registry Tab */}
      {tab === 'registry' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subcontractors..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={tradeFilter}
                onChange={e => setTradeFilter(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg"
              >
                <option value="all">All Trades</option>
                {TRADE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <Button onClick={() => { setEditSub(null); setShowSubDialog(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSubcontractors.map(sub => (
              <Card key={sub.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{sub.firm_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{sub.specialty}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${sub.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {sub.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
{sub.contact_phone && (
                        <p className="text-xs text-gray-500">📞 {sub.contact_phone}</p>
                      )}
                  {sub.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {sub.email}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => { setEditSub(sub); setShowSubDialog(true) }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(sub.id, 'sub')}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSubcontractors.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No subcontractors found</p>
            </div>
          )}
        </>
      )}

      {/* Work Orders Tab */}
      {tab === 'work-orders' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work orders..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => { setEditWO(null); setShowWODialog(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Work Order
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-500">Project</th>
                    <th className="text-left p-3 font-medium text-gray-500">Subcontractor</th>
                    <th className="text-left p-3 font-medium text-gray-500">Work Description</th>
                    <th className="text-left p-3 font-medium text-gray-500">Value</th>
                    <th className="text-left p-3 font-medium text-gray-500">Status</th>
                    <th className="text-left p-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkOrders.map(wo => (
                    <tr key={wo.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{projects.find(p => p.id === wo.project_id)?.project_name ?? '—'}</td>
                      <td className="p-3">{initialSubcontractors.find(s => s.id === wo.subcontractor_id)?.firm_name ?? '—'}</td>
                      <td className="p-3 max-w-xs truncate">{wo.work_description}</td>
                      <td className="p-3">₹{wo.total_value?.toLocaleString() ?? 0}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          wo.status === 'completed' ? 'bg-green-100 text-green-700' :
                          wo.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          wo.status === 'terminated' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {wo.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => { setEditWO(wo); setShowWODialog(true) }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(wo.id, 'wo')}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {filteredWorkOrders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No work orders found</p>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Subcontractor Dialog */}
      <Dialog open={showSubDialog} onOpenChange={open => { if (!open) { setShowSubDialog(false); setEditSub(null) } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editSub ? 'Edit Subcontractor' : 'Add Subcontractor'}</DialogTitle></DialogHeader>
          <SubForm
            edit={editSub}
            onSubmit={fd => handleSubmit(fd, 'sub')}
            onCancel={() => { setShowSubDialog(false); setEditSub(null) }}
          />
        </DialogContent>
      </Dialog>

      {/* Add/Edit Work Order Dialog */}
      <Dialog open={showWODialog} onOpenChange={open => { if (!open) { setShowWODialog(false); setEditWO(null) } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editWO ? 'Edit Work Order' : 'Create Work Order'}</DialogTitle></DialogHeader>
          <WOForm
            edit={editWO}
            onSubmit={fd => handleSubmit(fd, 'wo')}
            onCancel={() => { setShowWODialog(false); setEditWO(null) }}
            projects={projects}
            subcontractors={initialSubcontractors}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}