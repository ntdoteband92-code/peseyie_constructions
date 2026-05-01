'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateOrgSettings, type OrgSettingsState } from '@/app/actions/settings'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { Loader2, Save, Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OrgSettings {
  company_name?: string
  address?: string | null
  gstin?: string | null
  pan?: string | null
  phone?: string | null
  email?: string | null
  logo_url?: string | null
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      id="save-company-profile-btn"
      className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#1a1f2e',
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Save Changes
    </button>
  )
}

export default function CompanyProfileForm({
  orgSettings,
  canEdit,
}: {
  orgSettings: OrgSettings | null
  canEdit: boolean
}) {
  const [state, formAction] = useActionState<OrgSettingsState, FormData>(
    updateOrgSettings,
    null
  )

  useEffect(() => {
    if (state?.success) toast.success('Company profile updated successfully.')
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-amber-600" />
          <CardTitle>Company Profile</CardTitle>
        </div>
        <CardDescription>
          These details appear on all generated PDFs, bills, and reports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                name="company_name"
                defaultValue={orgSettings?.company_name ?? 'Peseyie Constructions'}
                required
                disabled={!canEdit}
                placeholder="Company legal name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                name="gstin"
                defaultValue={orgSettings?.gstin ?? ''}
                disabled={!canEdit}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pan">PAN</Label>
              <Input
                id="pan"
                name="pan"
                defaultValue={orgSettings?.pan ?? ''}
                disabled={!canEdit}
                placeholder="AAAAA0000A"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={orgSettings?.phone ?? ''}
                disabled={!canEdit}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={orgSettings?.email ?? ''}
                disabled={!canEdit}
                placeholder="info@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Registered Address</Label>
            <textarea
              id="address"
              name="address"
              rows={3}
              defaultValue={orgSettings?.address ?? ''}
              disabled={!canEdit}
              placeholder="Full registered address"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Hidden defaults needed by schema */}
          <input type="hidden" name="default_retention_pct" value="5" />
          <input type="hidden" name="default_tds_pct" value="2" />
          <input type="hidden" name="default_labour_cess_pct" value="1" />

          {canEdit && (
            <div className="flex justify-end">
              <SaveButton />
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
