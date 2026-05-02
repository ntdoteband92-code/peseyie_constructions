import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings } from 'lucide-react'
import type { AppRole } from '@/lib/supabase/types'
import { isAppRole, isAdmin, isManager } from '@/lib/supabase/types'
import CompanyProfileForm from '@/components/settings/CompanyProfileForm'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  let currentRole: AppRole = 'viewer'
  try {
    const adminClient = await createAdminClient()
    const { data } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single() as any
    if (data && isAppRole(data.role)) {
      currentRole = data.role
    }
  } catch (e) {
    console.error('Error getting role:', e)
  }

  const isAdminUser = isAdmin(currentRole)
  const canEditSettings = isAdminUser || isManager(currentRole)

  let orgSettings = null
  try {
    const adminClient = await createAdminClient()
    const { data } = await adminClient
      .from('org_settings')
      .select('*')
      .single()
    orgSettings = data as any
  } catch (e) {
    console.error('Error getting org settings:', e)
  }

  let allUsers: unknown[] = []
  if (isAdminUser) {
    try {
      const adminClient = await createAdminClient()
      const { data } = await adminClient
        .from('profiles')
        .select(`
          id,
          full_name,
          phone,
          is_active,
          created_at,
          user_roles (role)
        `)
        .order('created_at', { ascending: true })
      allUsers = data ?? []
    } catch (e) {
      console.error('Error getting users:', e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          <Settings className="h-5 w-5 text-[#1a1f2e]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Company configuration and user management</p>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="h-10">
          <TabsTrigger value="company" disabled={!canEditSettings}>
            Company Profile
          </TabsTrigger>
          <TabsTrigger value="rates" disabled={!canEditSettings}>
            Default Rates
          </TabsTrigger>
          {isAdminUser && (
            <TabsTrigger value="users">Users</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="company">
          {canEditSettings ? (
            <CompanyProfileForm orgSettings={orgSettings} canEdit={canEditSettings} />
          ) : (
            <div className="text-sm text-gray-500">
              {orgSettings ? (
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
                  {JSON.stringify(orgSettings, null, 2)}
                </pre>
              ) : (
                <p>No organization settings found. Contact admin to configure.</p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rates">
          <div className="text-sm text-gray-500">
            {orgSettings ? (
              <div className="space-y-2">
                <p>Retention: {orgSettings.default_retention_pct}%</p>
                <p>TDS: {orgSettings.default_tds_pct}%</p>
                <p>Labour Cess: {orgSettings.default_labour_cess_pct}%</p>
              </div>
            ) : (
              <p>No rate settings found.</p>
            )}
          </div>
        </TabsContent>

        {isAdminUser && (
          <TabsContent value="users">
            <div className="text-sm text-gray-500">
              <p>{allUsers.length} user(s) found.</p>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto mt-2">
                {JSON.stringify(allUsers.slice(0, 5), null, 2)}
              </pre>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}