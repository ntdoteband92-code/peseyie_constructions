import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTender, updateTender } from '@/app/actions/tenders'
import TenderForm from '@/components/tenders/TenderForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const tender = await getTender(id).catch(() => null)
  return { title: tender ? `Edit: ${tender.tender_name}` : 'Edit Tender' }
}

export default async function EditTenderPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const tender = await getTender(id).catch(() => null)
  if (!tender) notFound()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href={`/tenders/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Tender</h1>
          <p className="text-sm text-gray-500">{tender.tender_name}</p>
        </div>
      </div>
      <TenderForm tender={tender} isEdit />
    </div>
  )
}