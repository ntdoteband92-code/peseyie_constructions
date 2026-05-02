'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Zap,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Shield,
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

const BLAST_TYPES = ['Primary Blasting', 'Secondary Blasting', 'Trim Blasting', 'Smooth Wall Blasting', 'Pre-Splitting']
const EXPLOSIVE_TYPES = ['ANFO', 'Emulsion Explosive', 'Slurry Explosive', 'Dynamite', 'Powder', 'Other']
const WEATHER_OPTIONS = ['Clear', 'Cloudy', 'Rain', 'Fog', 'Windy', 'Hot', 'Cold']
const INITIATION_SYSTEMS = ['Electric', 'Non-Electric (NONEL)', 'Electronic', 'Detonating Cord', 'Combined']

export default function BlastLogsClient({
  blastLogs,
  blastSummary,
  projects,
}: {
  blastLogs: any[]
  blastSummary: any[]
  projects: { id: string; project_name: string }[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [tab, setTab] = useState<'logs' | 'summary'>('logs')
  const [showDialog, setShowDialog] = useState(false)

  const filteredLogs = useMemo(() => {
    return blastLogs.filter(log => {
      const matchesProject = projectFilter === 'all' || log.project_id === projectFilter
      const matchesSearch = search === '' ||
        log.location?.toLowerCase().includes(search.toLowerCase()) ||
        log.blast_type?.toLowerCase().includes(search.toLowerCase()) ||
        log.shot_firer_name?.toLowerCase().includes(search.toLowerCase())
      return matchesProject && matchesSearch
    })
  }, [blastLogs, search, projectFilter])

  const handleSubmit = async (formData: FormData) => {
    try {
      const res = await fetch('/api/blast-logs', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Failed')
      toast.success('Blast record created successfully')
      setShowDialog(false)
      router.refresh()
    } catch {
      toast.error('Failed to create blast record')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blast record?')) return
    try {
      const res = await fetch(`/api/blast-logs?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Record deleted')
      router.refresh()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blasting Operations</h1>
          <p className="text-sm text-gray-500">{blastLogs.length} blast records</p>
        </div>
        <div className="flex gap-3">
          <Button variant={tab === 'logs' ? 'default' : 'outline'} onClick={() => setTab('logs')} className={tab === 'logs' ? 'bg-amber-600 hover:bg-amber-700' : ''}>
            <FileText className="mr-2 h-4 w-4" />Records
          </Button>
          <Button variant={tab === 'summary' ? 'default' : 'outline'} onClick={() => setTab('summary')} className={tab === 'summary' ? 'bg-amber-600 hover:bg-amber-700' : ''}>
            <Zap className="mr-2 h-4 w-4" />Summary
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />Record Blast
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by location, type, shot firer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
        </select>
      </div>

      {/* Records Tab */}
      {tab === 'logs' && (
        filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Zap className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No blast records found</h3>
              <p className="mt-1 text-sm text-gray-500">Start by recording a blast operation</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-500">Date / Time</th>
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
                            {log.fly_rock_incident ? (
                              <span className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="h-3 w-3" />Fly rock</span>
                            ) : log.misfires > 0 ? (
                              <span className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3 w-3" />{log.misfires} misfire(s)</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" />Clear</span>
                            )}
                            {log.clearance_confirmed && (
                              <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" />500m cleared</span>
                            )}
                            {log.complaints_received && (
                              <span className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3 w-3" />Complaint</span>
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
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Summary Tab */}
      {tab === 'summary' && (
        blastSummary.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Zap className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No blasting summary available</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {blastSummary.map((s: any) => (
              <Card key={s.project_id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    {s.project_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Total Shots</p>
                      <p className="text-lg font-bold text-gray-900">{s.total_shots}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs text-purple-600">Explosive Used</p>
                      <p className="text-lg font-bold text-purple-700">{s.total_explosive_kg.toFixed(1)} kg</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600">Total Charge</p>
                      <p className="text-lg font-bold text-blue-700">{s.total_charge_kg.toFixed(1)} kg</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-green-600">CUM Blasted</p>
                      <p className="text-lg font-bold text-green-700">{s.total_volume_cum.toFixed(1)} cum</p>
                    </div>
                  </div>
                  {s.total_misfires > 0 && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-medium">{s.total_misfires} misfire(s) recorded</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 pt-1">
                    Last blast: {s.last_blast_date ? format(new Date(s.last_blast_date), 'dd/MM/yyyy') : '—'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Record Blast Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Blast Operation</DialogTitle></DialogHeader>
          <form action={handleSubmit as any} className="space-y-6">
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
              <h4 className="text-sm font-medium text-gray-700 mb-3">Explosives & Detonators</h4>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-xs text-gray-500">Explosive Type</label>
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
                <div>
                  <label className="text-xs text-gray-500">Initiation System</label>
                  <select name="initiation_system" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select</option>
                    {INITIATION_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Total Charge (kg)</label>
                  <input type="number" step="0.1" name="total_charge_kg" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Volume Blasted (CUM)</label>
                  <input type="number" step="0.1" name="volume_blasted_cum" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Safety & Monitoring</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-xs text-gray-500">PPV (mm/s)</label>
                  <input type="number" step="0.1" name="peak_particle_velocity_mm_s" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Air Overpressure (dB)</label>
                  <input type="number" name="air_overpressure_db" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Temperature (°C)</label>
                  <input type="number" name="temperature_c" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Incidents & Safety Compliance</h4>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="ground_vibration_measured" value="true" className="h-4 w-4 rounded" />
                    Ground Vibration Measured
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="clearance_confirmed" value="true" className="h-4 w-4 rounded" />
                    500m Clearance Confirmed *
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="fly_rock_incident" value="true" className="h-4 w-4 rounded" />
                    Fly Rock Incident
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="noise_incident" value="true" className="h-4 w-4 rounded" />
                    Noise Incident
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="complaints_received" value="true" className="h-4 w-4 rounded" />
                    Complaints Received
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-gray-500">No. of Misfires</label>
                    <input type="number" name="misfires" min="0" defaultValue={0} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Fly Rock Distance (m)</label>
                    <input type="number" step="0.1" name="fly_rock_distance_m" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Misfire Action Taken</label>
                  <input name="misfire_action" placeholder="Describe action taken for misfire(s)" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Police / Authority Intimation Reference</label>
                  <input name="police_intimation" placeholder="e.g., Police Ref No. 123/2026, Dt. 01/05/2026" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
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
              <Button type="submit">Save Blast Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}