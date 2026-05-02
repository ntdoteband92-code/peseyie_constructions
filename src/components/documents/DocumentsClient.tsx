'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  FolderOpen,
  Plus,
  Search,
  FileText,
  File,
  Download,
  Eye,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Cloud,
  X,
  ArrowUpCircle,
  Upload,
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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const DOCUMENT_CATEGORIES = [
  { value: 'contract', label: 'Contract' },
  { value: 'drawing', label: 'Drawing' },
  { value: 'boq', label: 'BOQ' },
  { value: 'tender_document', label: 'Tender Document' },
  { value: 'blasting_license', label: 'Blasting License' },
  { value: 'explosive_license', label: 'Explosive License' },
  { value: 'equipment_rc', label: 'Equipment RC' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'fitness_certificate', label: 'Fitness Certificate' },
  { value: 'labour_license', label: 'Labour License' },
  { value: 'govt_correspondence', label: 'Govt. Correspondence' },
  { value: 'ra_bill_copy', label: 'RA Bill Copy' },
  { value: 'photo_report', label: 'Photo Report' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_CATEGORIES.map(c => [c.value, c.label])
)

function getRagStatus(expiryDate: string | null): 'valid' | 'expiring' | 'expired' {
  if (!expiryDate) return 'valid'
  const expiry = new Date(expiryDate)
  const now = new Date()
  const thirtyDays = new Date(now.getTime() + THIRTY_DAYS_MS)
  if (expiry < now) return 'expired'
  if (expiry <= thirtyDays) return 'expiring'
  return 'valid'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try { return format(new Date(dateStr), 'dd/MM/yyyy') } catch { return '—' }
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File
  if (mimeType.startsWith('image/')) return File
  if (mimeType.includes('pdf')) return FileText
  return File
}

export default function DocumentsClient({
  documents,
  projects,
}: {
  documents: any[]
  projects: { id: string; project_name: string }[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'documents' | 'dashboard'>('documents')
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showUpload, setShowUpload] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<any>(null)
  const [versionHistoryDoc, setVersionHistoryDoc] = useState<any>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [showVersionUpload, setShowVersionUpload] = useState(false)

  const documentsWithRag = useMemo(() => {
    return documents.map(doc => ({
      ...doc,
      rag_status: getRagStatus(doc.expiry_date),
    }))
  }, [documents])

  const filteredDocs = useMemo(() => {
    return documentsWithRag.filter(doc => {
      const matchesProject = projectFilter === 'all' || doc.project_id === projectFilter
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
      const searchLower = search.toLowerCase()
      const matchesSearch =
        search === '' ||
        doc.file_name?.toLowerCase().includes(searchLower) ||
        doc.notes?.toLowerCase().includes(searchLower) ||
        doc.project?.project_name?.toLowerCase().includes(searchLower) ||
        CATEGORY_LABELS[doc.category]?.toLowerCase().includes(searchLower)
      return matchesProject && matchesCategory && matchesSearch
    })
  }, [documentsWithRag, search, projectFilter, categoryFilter])

  const expiredDocs = useMemo(() => documentsWithRag.filter(d => d.rag_status === 'expired'), [documentsWithRag])
  const expiringDocs = useMemo(() => documentsWithRag.filter(d => d.rag_status === 'expiring'), [documentsWithRag])
  const validDocs = useMemo(() => documentsWithRag.filter(d => d.rag_status === 'valid'), [documentsWithRag])

  const handleUpload = async (formData: FormData) => {
    try {
      const res = await fetch('/api/documents', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Failed')
      toast.success('Document uploaded successfully')
      setShowUpload(false)
      router.refresh()
    } catch {
      toast.error('Failed to upload document')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Document deleted')
      router.refresh()
    } catch {
      toast.error('Delete failed')
    }
  }

  const openVersionHistory = async (doc: any) => {
    setVersionHistoryDoc(doc)
    setShowVersionUpload(false)
    setLoadingVersions(true)
    try {
      const res = await fetch(`/api/documents/versions?documentId=${doc.id}`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data.versions || [])
      } else {
        setVersions([])
      }
    } catch {
      setVersions([])
    } finally {
      setLoadingVersions(false)
    }
  }

  const handleVersionUpload = async (formData: FormData) => {
    formData.set('document_id', versionHistoryDoc.id)
    try {
      const res = await fetch('/api/documents/versions', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Failed')
      toast.success('New version uploaded')
      setShowVersionUpload(false)
      openVersionHistory(versionHistoryDoc)
      router.refresh()
    } catch {
      toast.error('Failed to upload version')
    }
  }

  const getDocUrl = (doc: any) => {
  if (!doc) return '#'
  return doc.storage_url || doc.file_url || '#'
}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500">{documents.length} documents stored</p>
        </div>
        <div className="flex gap-3">
          <Button variant={tab === 'documents' ? 'default' : 'outline'} onClick={() => setTab('documents')} className={tab === 'documents' ? 'bg-amber-600 hover:bg-amber-700' : ''}>
            <FolderOpen className="mr-2 h-4 w-4" />Documents
          </Button>
          <Button variant={tab === 'dashboard' ? 'default' : 'outline'} onClick={() => setTab('dashboard')} className={tab === 'dashboard' ? 'bg-amber-600 hover:bg-amber-700' : ''}>
            <ShieldAlert className="mr-2 h-4 w-4" />License Dashboard
          </Button>
          <Button onClick={() => setShowUpload(true)}>
            <ArrowUpCircle className="mr-2 h-4 w-4" />Upload Document
          </Button>
        </div>
      </div>

      {/* Documents Tab */}
      {tab === 'documents' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by name, project, category..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">All Categories</option>
              {DOCUMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {filteredDocs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">No documents found</h3>
                <p className="mt-1 text-sm text-gray-500">Upload your first document</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium text-gray-500">Document</th>
                        <th className="text-left p-3 font-medium text-gray-500">Project</th>
                        <th className="text-left p-3 font-medium text-gray-500">Category</th>
                        <th className="text-left p-3 font-medium text-gray-500">Expiry</th>
                        <th className="text-left p-3 font-medium text-gray-500">Status</th>
                        <th className="text-left p-3 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocs.map(doc => (
                        <tr key={doc.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {(() => { const Icon = getFileIcon(doc.mime_type); return <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" /> })()}
                              <div>
                                <div className="font-medium text-gray-900">{doc.file_name || '—'}</div>
                                {doc.notes && <div className="text-xs text-gray-400 truncate max-w-xs">{doc.notes}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-gray-600">{doc.project?.project_name || '—'}</td>
                          <td className="p-3">
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {CATEGORY_LABELS[doc.category] || doc.category || '—'}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">{formatDate(doc.expiry_date)}</td>
                          <td className="p-3">
                            {doc.rag_status === 'expired' && (
                              <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                                <AlertTriangle className="h-3 w-3" />Expired
                              </span>
                            )}
                            {doc.rag_status === 'expiring' && (
                              <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                                <AlertTriangle className="h-3 w-3" />Expiring Soon
                              </span>
                            )}
                            {doc.rag_status === 'valid' && (
                              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                <CheckCircle className="h-3 w-3" />Valid
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              {doc.storage_url || doc.file_url ? (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(doc)}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <a href={getDocUrl(doc)} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="ghost">
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </a>
                                </>
                              ) : (
                                <span className="text-xs text-gray-400 px-2">No file</span>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => openVersionHistory(doc)} title="Version history">
                                <Clock className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(doc.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
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
      )}

      {/* License Dashboard Tab */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />Expired ({expiredDocs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700">Documents past their expiry date. Renew immediately.</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />Expiring Soon ({expiringDocs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700">Documents expiring within 30 days. Plan renewal.</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />Valid ({validDocs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-700">Documents with valid expiry dates.</p>
              </CardContent>
            </Card>
          </div>

          {/* Expiring Soon Section */}
          {expiringDocs.length > 0 && (
            <Card className="border-amber-300">
              <CardHeader>
                <CardTitle className="text-base text-amber-800">Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {expiringDocs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-amber-50">
                      <div className="flex items-center gap-3">
                        {(() => { const Icon = getFileIcon(doc.mime_type); return <Icon className="h-5 w-5 text-amber-600" /> })()}
                        <div>
                          <p className="font-medium text-gray-900">{doc.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {CATEGORY_LABELS[doc.category] || doc.category} &middot; {doc.project?.project_name || 'No project'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-amber-600">Expires: {formatDate(doc.expiry_date)}</p>
                          <p className="text-xs text-amber-500">
                            {Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="border-amber-300 text-amber-700" onClick={() => setPreviewDoc(doc)}>
                          <Eye className="h-3 w-3 mr-1" />View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expired Section */}
          {expiredDocs.length > 0 && (
            <Card className="border-red-300">
              <CardHeader>
                <CardTitle className="text-base text-red-800">Expired Documents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {expiredDocs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-red-50">
                      <div className="flex items-center gap-3">
                        {(() => { const Icon = getFileIcon(doc.mime_type); return <Icon className="h-5 w-5 text-red-600" /> })()}
                        <div>
                          <p className="font-medium text-gray-900">{doc.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {CATEGORY_LABELS[doc.category] || doc.category} &middot; {doc.project?.project_name || 'No project'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-600">Expired: {formatDate(doc.expiry_date)}</p>
                          <p className="text-xs text-red-500">
                            {Math.ceil((Date.now() - new Date(doc.expiry_date).getTime()) / (1000 * 60 * 60 * 24))} days ago
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="border-red-300 text-red-700" onClick={() => setPreviewDoc(doc)}>
                          <Eye className="h-3 w-3 mr-1" />View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Valid Section */}
          {validDocs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Valid Documents ({validDocs.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {validDocs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        {(() => { const Icon = getFileIcon(doc.mime_type); return <Icon className="h-5 w-5 text-green-600" /> })()}
                        <div>
                          <p className="font-medium text-gray-900">{doc.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {CATEGORY_LABELS[doc.category] || doc.category} &middot; {doc.project?.project_name || 'No project'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">Expires: {formatDate(doc.expiry_date)}</p>
                          {doc.expiry_date && (
                            <p className="text-xs text-gray-500">
                              {Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                            </p>
                          )}
                        </div>
                        {getDocUrl(doc) !== '#' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(doc)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <a href={getDocUrl(doc)} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost">
                                <Download className="h-3 w-3" />
                              </Button>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {documents.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">No documents with expiry dates</h3>
                <p className="mt-1 text-sm text-gray-500">Upload documents with expiry dates to track license status</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Upload Document Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <form action={async (formData: FormData) => {
            const file = formData.get('file') as File
            if (!file || file.size === 0) {
              toast.error('Please select a file to upload')
              return
            }
            try {
              const res = await fetch('/api/documents', {
                method: 'POST',
                body: formData
              })
              if (!res.ok) throw new Error('Failed')
              toast.success('Document uploaded successfully')
              setShowUpload(false)
              router.refresh()
            } catch {
              toast.error('Failed to upload document')
            }
          }} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project</label>
              <select name="project_id" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Category *</label>
              <select name="category" required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select category</option>
                {DOCUMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">File Name *</label>
              <input name="file_name" required placeholder="e.g., Blasting License PC001" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Upload File *</label>
              <div className="mt-1 flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-lg bg-gray-50 hover:bg-gray-100">
                  <Upload className="h-4 w-4" /> Choose file
                  <input type="file" name="file" required className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const fileNameInput = e.currentTarget.form?.querySelector('input[name="file_name"]') as HTMLInputElement
                      if (fileNameInput && !fileNameInput.value) fileNameInput.value = file.name
                    }
                  }} />
                </label>
                <span id="file-name" className="text-sm text-gray-600">No file selected</span>
                <script dangerouslySetInnerHTML={{ __html: `
                  document.querySelector('input[type="file"]').addEventListener('change', (e) => {
                    const fileNameEl = document.getElementById('file-name')
                    if (e.target.files.length > 0) fileNameEl.textContent = e.target.files[0].name
                    else fileNameEl.textContent = 'No file selected'
                  })
                ` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Expiry Date</label>
                <input type="date" name="expiry_date" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">File Size (KB)</label>
                <input type="number" name="file_size_kb" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">MIME Type</label>
              <input name="mime_type" placeholder="e.g., application/pdf, image/png" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea name="notes" rows={2} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Additional notes..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
              <Button type="submit">Save Document</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewDoc && (() => { const Icon = getFileIcon(previewDoc?.mime_type); return <Icon className="h-5 w-5" /> })()}
              {previewDoc?.file_name || 'Preview'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {previewDoc?.mime_type?.startsWith('image/') ? (
              <img src={getDocUrl(previewDoc)} alt={previewDoc?.file_name} className="max-h-[60vh] mx-auto rounded-lg object-contain" />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <File className="h-16 w-16 text-gray-300" />
                <p className="mt-4 text-sm text-gray-600">Preview not available for this file type</p>
                {getDocUrl(previewDoc) !== '#' && (
                  <a href={getDocUrl(previewDoc)} target="_blank" rel="noopener noreferrer">
                    <Button className="mt-4"><X className="mr-2 h-4 w-4" />Open in new tab</Button>
                  </a>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>Category: {CATEGORY_LABELS[previewDoc?.category] || previewDoc?.category || '—'}</span>
              <span>Expiry: {formatDate(previewDoc?.expiry_date)}</span>
              <span>Project: {previewDoc?.project?.project_name || '—'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDoc(null)}>Close</Button>
            {getDocUrl(previewDoc) !== '#' && (
              <a href={getDocUrl(previewDoc)} target="_blank" rel="noopener noreferrer">
                <Button><Download className="mr-2 h-4 w-4" />Download</Button>
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={!!versionHistoryDoc} onOpenChange={() => { setVersionHistoryDoc(null); setShowVersionUpload(false) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          {loadingVersions ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-gray-500">Loading versions...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Current Version</h4>
                <Button size="sm" onClick={() => setShowVersionUpload(!showVersionUpload)}>
                  <ArrowUpCircle className="mr-1 h-3 w-3" />New Version
                </Button>
              </div>
              {versions.length === 0 ? (
                <p className="text-sm text-gray-500">No version history yet.</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-medium bg-amber-100 text-amber-700 rounded px-2 py-0.5">v{v.version_number}</div>
                        <div>
                          <p className="text-sm font-medium">{v.file_name || versionHistoryDoc?.file_name}</p>
                          <p className="text-xs text-gray-500">{format(new Date(v.created_at), 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                      </div>
                      {v.file_url && (
                        <a href={v.file_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost"><Download className="h-3 w-3" /></Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {showVersionUpload && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3">Upload New Version</h4>
                  <form action={handleVersionUpload as any} className="space-y-3">
                    <div>
                      <label className="text-xs font-medium">File URL *</label>
                      <input name="file_url" required placeholder="https://..." className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium">File Name</label>
                      <input name="file_name" placeholder="Leave blank to keep original name" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium">File Size (KB)</label>
                        <input type="number" name="file_size_kb" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-medium">MIME Type</label>
                        <input name="mime_type" placeholder="e.g., application/pdf" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">Upload Version</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowVersionUpload(false)}>Cancel</Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setVersionHistoryDoc(null); setShowVersionUpload(false) }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}