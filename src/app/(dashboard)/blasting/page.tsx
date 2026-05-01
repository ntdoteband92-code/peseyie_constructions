import type { Metadata } from 'next'
import ModulePlaceholder from '@/components/layout/ModulePlaceholder'
import { Flame } from 'lucide-react'

export const metadata: Metadata = { title: 'Blasting Operations' }

export default function BlastingPage() {
  return (
    <ModulePlaceholder
      icon={Flame}
      title="Blasting Operations"
      description="Per-blast shot records, explosive consumption log, and blasting summary per project."
      phase={5}
      features={['Per-blast record (holes, depth, pattern, explosive qty)', 'Detonator count and initiation system', 'Misfire tracking and action taken', '500m clearance confirmation (mandatory)', 'Police/authority intimation reference', 'Blasting summary (total shots, explosive used, CUM blasted)']}
    />
  )
}
