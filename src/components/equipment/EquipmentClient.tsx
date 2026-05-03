'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Truck,
  Plus,
  Search,
  Wrench,
  AlertCircle,
  ArrowRight,
  MoreHorizontal,
  Trash2,
  Edit,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import type { EquipmentItem, VehicleItem } from '@/app/actions/equipment'

const EQUIPMENT_TYPES = [
  'Excavator', 'Poclain', 'Motor Grader', 'Compactor', 'Vibratory Roller',
  'Rock Drill', 'Water Tanker', 'Concrete Mixer', 'Generator', 'Other',
]

const VEHICLE_TYPES = [
  'Tipper', 'Truck', 'Pickup', 'JCB', 'Water Bowser', 'Staff Vehicle', 'Other',
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  under_maintenance: { bg: 'bg-amber-100', text: 'text-amber-800' },
  idle: { bg: 'bg-gray-100', text: 'text-gray-700' },
  hired_out: { bg: 'bg-blue-100', text: 'text-blue-800' },
  decommissioned: { bg: 'bg-red-100', text: 'text-red-800' },
}

function formatINR(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export default function EquipmentClient({
  equipment,
  vehicles,
  projects,
}: {
  equipment: EquipmentItem[]
  vehicles: VehicleItem[]
  projects: { id: string; project_name: string }[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false)
  const [showVehicleDialog, setShowVehicleDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [tab, setTab] = useState<'equipment' | 'vehicles'>('equipment')

  const filteredEquipment = useMemo(() => {
    return equipment.filter(e => {
      const matchesSearch = search === '' ||
        e.equipment_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.registration_no?.toLowerCase().includes(search.toLowerCase()) ||
        e.make?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter
      const matchesType = typeFilter === 'all' || e.equipment_type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [equipment, search, statusFilter, typeFilter])

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = search === '' ||
        v.vehicle_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.registration_no?.toLowerCase().includes(search.toLowerCase()) ||
        v.make?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [vehicles, search, statusFilter])

  const stats = useMemo(() => ({
    total: equipment.length + vehicles.length,
    active: [...equipment, ...vehicles].filter(x => x.status === 'active').length,
    underMaintenance: [...equipment, ...vehicles].filter(x => x.status === 'under_maintenance').length,
    hired: [...equipment, ...vehicles].filter(x => x.ownership === 'hired').length,
  }), [equipment, vehicles])

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/equipment/${id}?type=${tab}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success(`${tab === 'equipment' ? 'Equipment' : 'Vehicle'} deleted`)
      setDeleteId(null)
      router.refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleSubmit = async (formData: FormData, action: string) => {
    try {
      const res = await fetch(`/api/equipment?/create`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Failed to create')
      toast.success('Created successfully')
      setShowEquipmentDialog(false)
      setShowVehicleDialog(false)
      router.refresh()
    } catch {
      toast.error('Failed to create')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment & Fleet</h1>
          <p className="text-sm text-gray-500">{stats.total} total, {stats.active} active, {stats.hired} hired</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTab('equipment')} className={tab === 'equipment' ? 'bg-amber-50 border-amber-200' : ''}>
            Equipment
          </Button>
          <Button variant="outline" onClick={() => setTab('vehicles')} className={tab === 'vehicles' ? 'bg-amber-50 border-amber-200' : ''}>
            Vehicles
          </Button>
          <Button onClick={() => tab === 'equipment' ? setShowEquipmentDialog(true) : setShowVehicleDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add {tab === 'equipment' ? 'Equipment' : 'Vehicle'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Truck className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-xs text-blue-600">Total Fleet</p>
              <p className="text-xl font-bold text-blue-700">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <ArrowRight className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-xs text-green-600">Active</p>
              <p className="text-xl font-bold text-green-700">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Wrench className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-xs text-amber-600">Under Maintenance</p>
              <p className="text-xl font-bold text-amber-700">{stats.underMaintenance}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Truck className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-xs text-purple-600">Hired</p>
              <p className="text-xl font-bold text-purple-700">{stats.hired}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {tab === 'equipment' && (
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="all">All Types</option>
            {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="under_maintenance">Under Maintenance</option>
          <option value="idle">Idle</option>
          <option value="hired_out">Hired Out</option>
          <option value="decommissioned">Decommissioned</option>
        </select>
      </div>

      {/* Grid */}
      {tab === 'equipment' ? (
        filteredEquipment.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16">
            <Truck className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No equipment found</h3>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEquipment.map(item => {
              const status = STATUS_COLORS[item.status ?? 'idle']
              return (
                <Card key={item.id} className="hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{item.equipment_name}</CardTitle>
                        <p className="text-xs text-gray-500">{item.equipment_type}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${status?.bg} ${status?.text}`}>
                        {item.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {item.make && <p className="text-gray-600">{item.make} {item.model}</p>}
                    {item.registration_no && <p className="text-gray-500 font-mono text-xs">{item.registration_no}</p>}
                    {item.ownership === 'hired' && item.hire_firm_name && (
                      <p className="text-xs text-blue-600">Hired: {item.hire_firm_name}</p>
                    )}
                    {item.project && <p className="text-xs text-gray-500">Project: {item.project.project_name}</p>}
                    <div className="pt-2 flex items-center justify-between">
                      <span className={`text-xs rounded px-2 py-0.5 ${item.ownership === 'hired' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                        {item.ownership === 'hired' ? 'Hired' : 'Owned'}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(item.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      ) : (
        filteredVehicles.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16">
            <Truck className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No vehicles found</h3>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map(item => {
              const status = STATUS_COLORS[item.status ?? 'idle']
              const expiring = (key: string) => {
                const val = item[key as keyof typeof item]
                if (!val) return false
                const expiry = new Date(val as string)
                const daysUntil = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return daysUntil > 0 && daysUntil <= 30
              }
              return (
                <Card key={item.id} className="hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{item.vehicle_name}</CardTitle>
                        <p className="text-xs text-gray-500">{item.vehicle_type}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${status?.bg} ${status?.text}`}>
                        {item.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {item.registration_no && <p className="text-gray-500 font-mono text-xs">{item.registration_no}</p>}
                    {item.make && <p className="text-gray-600">{item.make} {item.model}</p>}
                    {item.ownership === 'hired' && item.hire_firm_name && (
                      <p className="text-xs text-blue-600">Hired: {item.hire_firm_name}</p>
                    )}
                    {item.project && <p className="text-xs text-gray-500">Project: {item.project.project_name}</p>}
                    <div className="flex gap-2 pt-2">
                      {expiring('fitness_expiry') && (
                        <span className="text-xs rounded bg-amber-50 text-amber-600 px-2 py-0.5">Fitness Expiring</span>
                      )}
                      {expiring('insurance_expiry') && (
                        <span className="text-xs rounded bg-red-50 text-red-600 px-2 py-0.5">Insurance Expiring</span>
                      )}
                    </div>
                    <div className="pt-2 flex items-center justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(item.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      )}

      {/* Add Equipment Dialog */}
      <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
          <form action={(fd) => handleSubmit(fd, 'equipment')} className="space-y-4">
            <input type="hidden" name="action" value="createEquipment" />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <input name="name" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Type *</label>
                <select name="equipment_type" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Make</label>
                <input name="make" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Model</label>
                <input name="model" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Registration Number</label>
                <input name="registration_no" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Ownership</label>
                <select name="ownership" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="company_owned">Company Owned</option>
                  <option value="hired">Hired</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select name="status" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="active">Active</option>
                  <option value="idle">Idle</option>
                  <option value="under_maintenance">Under Maintenance</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Assigned Project</label>
                <select name="current_project_id" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Not Assigned</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Purchase Cost (₹)</label>
                <input type="number" name="purchase_cost" min="0" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Year of Manufacture</label>
                <input name="year" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEquipmentDialog(false)}>Cancel</Button>
              <Button type="submit">Add Equipment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Vehicle Dialog */}
      <Dialog open={showVehicleDialog} onOpenChange={setShowVehicleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Vehicle</DialogTitle></DialogHeader>
          <form action={(fd) => handleSubmit(fd, 'vehicle')} className="space-y-4">
            <input type="hidden" name="action" value="createVehicle" />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <input name="vehicle_name" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Type *</label>
                <select name="vehicle_type" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Registration Number</label>
                <input name="registration_no" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Make</label>
                <input name="make" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Ownership</label>
                <select name="ownership" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="company_owned">Company Owned</option>
                  <option value="hired">Hired</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select name="status" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="active">Active</option>
                  <option value="idle">Idle</option>
                  <option value="under_maintenance">Under Maintenance</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Assigned Project</label>
                <select name="current_project_id" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Not Assigned</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Fitness Certificate Expiry</label>
                <input type="date" name="fitness_expiry" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Insurance Expiry</label>
                <input type="date" name="insurance_expiry" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Permit Expiry</label>
                <input type="date" name="permit_expiry" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowVehicleDialog(false)}>Cancel</Button>
              <Button type="submit">Add Vehicle</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete?</AlertDialogTitle>
            <AlertDialogDescription>This will soft-delete this entry.</AlertDialogDescription>
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