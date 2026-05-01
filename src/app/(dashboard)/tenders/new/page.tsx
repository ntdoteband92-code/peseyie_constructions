import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyRole } from '@/app/actions/projects'
import { createTender } from '@/app/actions/tenders'
import TenderForm from '@/components/tenders/TenderForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'New Tender' }

export default async function NewTenderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const role = await getMyRole()
  if (!role || !['admin', 'manager', 'accountant'].includes(role)) {
    redirect('/tenders')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/tenders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Tender</h1>
          <p className="text-sm text-gray-500">Register a new tender opportunity</p>
        </div>
      </div>
      <TenderForm />
    </div>
  )
}