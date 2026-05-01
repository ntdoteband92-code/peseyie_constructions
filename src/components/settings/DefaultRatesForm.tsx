'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { updateOrgSettings, type OrgSettingsState } from '@/app/actions/settings'
import { toast } from 'sonner'
import { Loader2, Save, Percent } from 'lucide-react'
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
  default_retention_pct?: number | null
  default_tds_pct?: number | null
  default_labour_cess_pct?: number | null
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      id="save-default-rates-btn"
      className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#1a1f2e',
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Save Rates
    </button>
  )
}

export default function DefaultRatesForm({
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
    if (state?.success) toast.success('Default rates updated.')
    if (state?.error) toast.error(state.error)
  }, [state])

  const rates = [
    {
      id: 'default_retention_pct',
      name: 'default_retention_pct',
      label: 'Retention Money',
      description: 'Auto-filled on every new RA Bill',
      defaultValue: orgSettings?.default_retention_pct ?? 5,
    },
    {
      id: 'default_tds_pct',
      name: 'default_tds_pct',
      label: 'Income Tax (TDS)',
      description: 'Auto-filled on every new RA Bill',
      defaultValue: orgSettings?.default_tds_pct ?? 2,
    },
    {
      id: 'default_labour_cess_pct',
      name: 'default_labour_cess_pct',
      label: 'Labour Cess',
      description: 'Auto-filled on every new RA Bill',
      defaultValue: orgSettings?.default_labour_cess_pct ?? 1,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-amber-600" />
          <CardTitle>Default Deduction Rates</CardTitle>
        </div>
        <CardDescription>
          These rates auto-fill the RA Bill deduction form. You can override them per-bill.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          {/* Hidden fields to pass through unchanged values */}
          <input type="hidden" name="company_name" value={orgSettings?.company_name ?? 'Peseyie Constructions'} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {rates.map((rate) => (
              <div key={rate.id} className="space-y-1.5">
                <Label htmlFor={rate.id}>{rate.label} %</Label>
                <div className="relative">
                  <Input
                    id={rate.id}
                    name={rate.name}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue={rate.defaultValue}
                    disabled={!canEdit}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{rate.description}</p>
              </div>
            ))}
          </div>

          <div
            className="rounded-lg border p-4 text-sm"
            style={{ background: '#fffbeb', borderColor: '#fde68a' }}
          >
            <p className="font-medium text-amber-900 mb-1">RA Bill deduction example at these rates:</p>
            <p className="text-amber-700">
              Gross Bill ₹10,00,000 → Retention {orgSettings?.default_retention_pct ?? 5}% = ₹{((orgSettings?.default_retention_pct ?? 5) * 10000).toLocaleString('en-IN')},
              TDS {orgSettings?.default_tds_pct ?? 2}% = ₹{((orgSettings?.default_tds_pct ?? 2) * 10000).toLocaleString('en-IN')},
              Labour Cess {orgSettings?.default_labour_cess_pct ?? 1}% = ₹{((orgSettings?.default_labour_cess_pct ?? 1) * 10000).toLocaleString('en-IN')}
            </p>
          </div>

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
