import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings } from 'lucide-react'
import CompanyProfileForm from '@/components/settings/CompanyProfileForm'
import UsersTab from '@/components/settings/UsersTab'
import DefaultRatesForm from '@/components/settings/DefaultRatesForm'
import type { AppRole } from '@/lib/supabase/types'
import { isAppRole, isAdmin, isManager } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch current user role via RPC
  const { data } = await supabase.rpc('get_my_role')
  let currentRole: AppRole
  if (data && isAppRole(data)) {
    currentRole = data
  } else {
    currentRole = 'viewer'
  }
  const isAdminUser = isAdmin(currentRole)
  const canEditSettings = isAdminUser || isManager(currentRole)

  // Fetch org settings
  const { data: orgSettings } = await supabase
    .from('org_settings')
    .select('*')
    .single()

  // Fetch all users with profiles + roles (admin only)
  const { data: allUsers } = isAdminUser
    ? await supabase
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
    : { data: [] }

  return (
    <div className="space-y-6">
      {/* Header */}
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

        {/* Company Profile */}
        <TabsContent value="company">
          <CompanyProfileForm orgSettings={orgSettings} canEdit={canEditSettings} />
        </TabsContent>

        {/* Default Rates */}
        <TabsContent value="rates">
          <DefaultRatesForm orgSettings={orgSettings} canEdit={canEditSettings} />
        </TabsContent>

        {/* Users — admin only */}
         {isAdminUser && (
           <TabsContent value="users">
             <UsersTab users={allUsers ?? []} currentUserId={user.id} />
           </TabsContent>
         )}
      </Tabs>
    </div>
  )
}