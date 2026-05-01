'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Zap,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  X,
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
import type { BlastLog } from '@/app/actions/blast-logs'

const BLAST_TYPES = ['Primary Blasting', 'Secondary Blasting', 'Trim Blasting', 'Smooth Wall Blasting', 'Pre-Splitting']
const EXPLOSIVE_TYPES = ['ANFO', 'Emulsion Explosive', 'Slurry Explosive', 'Dynamite', 'Powder', 'Other']
const WEATHER_OPTIONS = ['Clear', 'Cloudy', 'Rain', 'Fog', 'Windy', 'Hot', 'Cold']

export default function BlastLogsClient({
  blastLogs: initialLogs,
  projects,
}: {
  blastLogs: BlastLog[]
  projects: { id: string; project_name: string }[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [showDialog, setShowDialog] = useState(false)

  const filteredLogs = useMemo(() => {
    return initialLogs.filter(log => {
      const matchesProject = projectFilter === 'all' || log.project_id === projectFilter
      const matchesSearch = search === '' ||
        log.location?.toLowerCase().includes(search.toLowerCase()) ||
        log.blast_type?.toLowerCase().includes(search.toLowerCase())
      return matchesProject && matchesSearch
    })
  }, [initialLogs, search, projectFilter])

  const handleSubmit = async (formData: FormData) => {
    try {
      const res = await fetch('/api/blast-logs', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Failed')
      toast.success('Blast log created')
      setShowDialog(false)
      router.refresh()
    } catch {
      toast.error('Failed to create blast log')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blast log?')) return
    try {
      const res = await fetch(`/api/blast-logs?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Deleted')
      router.refresh()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blast Logs</h1>
          <p className="text-sm text-gray-500">{filteredLogs.length} records</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />Record Blast
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by location or type..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
        </select>
      </div>

      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Zap className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No blast logs found</h3>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-500">Date/Time</th>
                  <th className="text-left p-3 font-medium text-gray-500">Project</th>
                  <th className="text-left p-3 font-medium text-gray-500">Location</th>
                  <th className="text-left p-3 font-medium text-gray-500">Type</th>
                  <th className="text-left p-3 font-medium text-gray-500">Explosive</th>
                  <th className="text-left p-3 font-medium text-gray-500">Safety</th>
                  <th className="text-left p-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{log.blast_date ? format(new Date(log.blast_date), 'dd/MM/yy') : '—'}</div>
                      <div className="text-xs text-gray-500">{log.blast_time ?? ''}</div>
                    </td>
                    <td className="p-3 text-gray-600">{log.project?.project_name ?? '—'}</td>
                    <td className="p-3 font-medium">{log.location ?? '—'}</td>
                    <td className="p-3"><span className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-600">{log.blast_type ?? '—'}</span></td>
                    <td className="p-3">
                      {log.explosive_type ? (
                        <div>
                          <div className="text-xs text-gray-500">{log.explosive_type}</div>
                          {log.explosive_qty_kg && <div className="text-xs text-gray-500">{log.explosive_qty_kg} kg</div>}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        {log.fly_rock_incident && (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3" />Fly rock
                          </span>
                        )}
                        {log.complaints_received && (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="h-3 w-3" />Complaint
                          </span>
                        )}
                        {!log.fly_rock_incident && !log.complaints_received && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />Clear
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(log.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Blast Operation</DialogTitle></DialogHeader>
          <form action={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Project *</label>
                <select name="project_id" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Blast Date *</label>
                <input type="date" name="blast_date" required defaultValue={new Date().toISOString().split('T')[0]} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Blast Time *</label>
                <input type="time" name="blast_time" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Location / Chainage *</label>
                <input name="location" required placeholder="e.g., CH 0+500 to 0+600" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Blast Type *</label>
                <select name="blast_type" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select type</option>
                  {BLAST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Weather</label>
                <select name="weather_condition" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select</option>
                  {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Blast Pattern</h4>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-xs text-gray-500">Drill Depth (m)</label>
                  <input type="number" step="0.1" name="drill_depth_m" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">No. of Holes</label>
                  <input type="number" name="no_of_holes" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Spacing (m)</label>
                  <input type="number" step="0.1" name="spacing_m" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Burden (m)</label>
                  <input type="number" step="0.1" name="burden_m" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Explosives Used</h4>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-xs text-gray-500">Type</label>
                  <select name="explosive_type" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select</option>
                    {EXPLOSIVE_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Qty (kg)</label>
                  <input type="number" step="0.1" name="explosive_qty_kg" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Detonator Type</label>
                  <input name="detonator_type" placeholder="e.g., MS, ND" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">No. of Detonators</label>
                  <input type="number" name="no_of_detonators" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Safety & Monitoring</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-xs text-gray-500">Total Charge (kg)</label>
                  <input type="number" step="0.1" name="total_charge_kg" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">PPV (mm/s)</label>
                  <input type="number" step="0.1" name="peak_particle_velocity_mm_s" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Air Overpressure (dB)</label>
                  <input type="number" name="air_overpressure_db" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Incidents</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="fly_rock_incident" value="true" className="h-4 w-4 rounded" />
                    Fly Rock Incident
                  </label>
                  {false && (
                    <input type="number" name="fly_rock_distance_m" placeholder="Distance (m)" className="rounded-lg border border-input bg-background px-3 py-1 text-sm" />
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="noise_incident" value="true" className="h-4 w-4 rounded" />
                    Noise Incident
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="complaints_received" value="true" className="h-4 w-4 rounded" />
                    Complaints Received
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="ground_vibration_measured" value="true" className="h-4 w-4 rounded" />
                    Ground Vibration Measured
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Personnel</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-xs text-gray-500">Shot Firer Name</label>
                  <input name="shot_firer_name" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">License No.</label>
                  <input name="shot_firer_license_no" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Supervisor on Duty</label>
                  <input name="supervisor_on_duty" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Result Summary</label>
              <textarea name="result_summary" rows={2} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Brief summary of blast outcome..." />
            </div>

            <div>
              <label className="text-sm font-medium">Remarks</label>
              <input name="remarks" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit">Save Blast Log</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}