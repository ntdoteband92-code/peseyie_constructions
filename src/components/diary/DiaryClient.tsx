'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import {
  BookOpen,
  Plus,
  Search,
  Cloud,
  Sun,
  CloudRain,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { DiaryEntry, Document } from '@/app/actions/diary'

const WEATHER_OPTIONS = ['Clear', 'Cloudy', 'Rain', 'Heavy Rain', 'Fog']

const DOCUMENT_CATEGORIES = [
  'contract', 'drawing', 'boq', 'tender_document', 'blasting_license',
  'explosive_license', 'equipment_rc', 'insurance', 'fitness_certificate',
  'labour_license', 'govt_correspondence', 'ra_bill_copy', 'photo_report', 'other',
]

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const now = new Date()
const thirtyDaysFromNow = new Date(now.getTime() + THIRTY_DAYS_MS)

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'dd/MM/yyyy') } catch { return '—' }
}

const WEATHER_ICONS: Record<string, React.ElementType> = {
  Clear: Sun,
  Cloudy: Cloud,
  Rain: CloudRain,
  'Heavy Rain': CloudRain,
  Fog: Cloud,
}

export default function CombinedClient({
  diaryEntries,
  documents,
  expiringDocs,
  projects,
}: {
  diaryEntries: DiaryEntry[]
  documents: Document[]
  expiringDocs: Document[]
  projects: { id: string; project_name: string }[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [tab, setTab] = useState<'diary' | 'documents'>('diary')
  const [showDiaryDialog, setShowDiaryDialog] = useState(false)
  const [showDocDialog, setShowDocDialog] = useState(false)

  const filteredDiary = useMemo(() => {
    return diaryEntries.filter(d => {
      const matchesProject = projectFilter === 'all' || d.project_id === projectFilter
      const matchesSearch = search === '' || d.work_done?.toLowerCase().includes(search.toLowerCase())
      return matchesProject && matchesSearch
    })
  }, [diaryEntries, search, projectFilter])

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      const matchesSearch = search === '' || d.file_name?.toLowerCase().includes(search.toLowerCase())
      return matchesSearch
    })
  }, [documents, search])

  const handleSubmit = async (formData: FormData, action: string) => {
    try {
      const res = await fetch(`/api/diary?/create`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Failed')
      toast.success('Created successfully')
      setShowDiaryDialog(false)
      setShowDocDialog(false)
      router.refresh()
    } catch {
      toast.error('Failed to create')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {tab === 'diary' ? 'Site Diary' : 'Documents'}
          </h1>
          <p className="text-sm text-gray-500">
            {tab === 'diary' ? `${filteredDiary.length} entries` : `${filteredDocs.length} documents`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTab('diary')} className={tab === 'diary' ? 'bg-amber-50 border-amber-200' : ''}>
            <BookOpen className="mr-2 h-4 w-4" />Diary
          </Button>
          <Button variant="outline" onClick={() => setTab('documents')} className={tab === 'documents' ? 'bg-amber-50 border-amber-200' : ''}>
            Documents
          </Button>
          <Button onClick={() => tab === 'diary' ? setShowDiaryDialog(true) : setShowDocDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {tab === 'diary' ? 'Add Entry' : 'Upload Document'}
          </Button>
        </div>
      </div>

      {/* Expiring Documents Alert */}
      {expiringDocs.length > 0 && tab === 'documents' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-3">
            <Cloud className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">{expiringDocs.length} documents expiring soon</p>
              <p className="text-xs text-amber-600">Check the documents list below</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {tab === 'diary' && (
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
          </select>
        )}
      </div>

      {/* Diary Tab */}
      {tab === 'diary' && (
        filteredDiary.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No diary entries</h3>
            <p className="mt-1 text-sm text-gray-500">Start logging daily site activities</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filteredDiary.map(entry => {
              const WeatherIcon = entry.weather_am ? WEATHER_ICONS[entry.weather_am] || Cloud : Cloud
              return (
                <Card key={entry.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs text-blue-600 font-medium">
                          {entry.entry_date ? format(new Date(entry.entry_date), 'dd') : '—'}
                        </span>
                        <span className="text-xs text-blue-500">
                          {entry.entry_date ? format(new Date(entry.entry_date), 'MMM') : ''}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{entry.project?.project_name ?? '—'}</span>
                          {entry.weather_am && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <WeatherIcon className="h-3 w-3" />
                              {entry.weather_am} / {entry.weather_pm ?? entry.weather_am}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{entry.work_done}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {entry.workers_count && <span>👷 {entry.workers_count} workers</span>}
                          {entry.equipment_on_site && <span>🚜 {entry.equipment_on_site}</span>}
                          {entry.created_by_user && <span>By {entry.created_by_user.full_name}</span>}
                          <span>{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      )}

      {/* Documents Tab */}
      {tab === 'documents' && (
        filteredDocs.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">No documents found</h3>
          </CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-500">Document</th>
                    <th className="text-left p-3 font-medium text-gray-500">Project</th>
                    <th className="text-left p-3 font-medium text-gray-500">Category</th>
                    <th className="text-left p-3 font-medium text-gray-500">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map(doc => {
                    const isExpiring = doc.expiry_date && new Date(doc.expiry_date) <= thirtyDaysFromNow
                    const isExpired = doc.expiry_date && new Date(doc.expiry_date) < now
                    return (
                      <tr key={doc.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{doc.file_name}</td>
                        <td className="p-3 text-gray-600">{doc.project?.project_name ?? '—'}</td>
                        <td className="p-3"><span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{doc.category}</span></td>
                        <td className="p-3">
                          {doc.expiry_date ? (
                            <span className={`text-xs px-2 py-0.5 rounded ${isExpired ? 'bg-red-50 text-red-600' : isExpiring ? 'bg-amber-50 text-amber-600' : 'text-gray-500'}`}>
                              {formatDate(doc.expiry_date)}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )
      )}

      {/* Add Diary Entry Dialog */}
      <Dialog open={showDiaryDialog} onOpenChange={setShowDiaryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Site Diary Entry</DialogTitle></DialogHeader>
          <form action={(fd) => handleSubmit(fd, 'diary')} className="space-y-4">
            <input type="hidden" name="action" value="createDiary" />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Project *</label>
                <select name="project_id" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <input type="date" name="entry_date" required defaultValue={new Date().toISOString().split('T')[0]} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Weather AM</label>
                <select name="weather_am" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select</option>
                  {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Weather PM</label>
                <select name="weather_pm" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select</option>
                  {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Work Done Today *</label>
                <textarea name="work_done" required rows={3} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Describe work activities, sections worked on, chainage progress..." />
              </div>
              <div>
                <label className="text-sm font-medium">Workers Count</label>
                <input type="number" name="workers_count" min="0" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Equipment on Site</label>
                <input name="equipment_on_site" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Visitors / Inspections</label>
                <input name="visitors" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Materials Received</label>
                <input name="materials_received" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Issues / Observations</label>
                <input name="issues" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDiaryDialog(false)}>Cancel</Button>
              <Button type="submit">Add Entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog open={showDocDialog} onOpenChange={setShowDocDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <form action={(fd) => handleSubmit(fd, 'document')} className="space-y-4">
            <input type="hidden" name="action" value="createDocument" />
            <div>
              <label className="text-sm font-medium">Document Name *</label>
              <input name="file_name" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Category *</label>
              <select name="category" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {DOCUMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
              <label className="text-sm font-medium">File URL *</label>
              <input name="storage_url" required placeholder="https://..." className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Expiry Date</label>
              <input type="date" name="expiry_date" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <input name="notes" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDocDialog(false)}>Cancel</Button>
              <Button type="submit">Upload</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}