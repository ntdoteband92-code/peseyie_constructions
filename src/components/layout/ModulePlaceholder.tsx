import { cn } from '@/lib/utils'
import { CircleCheck } from 'lucide-react'

interface ModulePlaceholderProps {
  icon: React.ElementType
  title: string
  description: string
  phase: number
  features: string[]
}

const PHASE_COLORS: Record<number, { bg: string; border: string; text: string; badge: string }> = {
  2: { bg: 'bg-blue-50/50', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-700' },
  3: { bg: 'bg-violet-50/50', border: 'border-violet-200', text: 'text-violet-900', badge: 'bg-violet-100 text-violet-700' },
  4: { bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-700' },
  5: { bg: 'bg-orange-50/50', border: 'border-orange-200', text: 'text-orange-900', badge: 'bg-orange-100 text-orange-700' },
  6: { bg: 'bg-pink-50/50', border: 'border-pink-200', text: 'text-pink-900', badge: 'bg-pink-100 text-pink-700' },
  7: { bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-700' },
}

export default function ModulePlaceholder({
  icon: Icon,
  title,
  description,
  phase,
  features,
}: ModulePlaceholderProps) {
  const colors = PHASE_COLORS[phase] ?? PHASE_COLORS[7]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          <Icon className="h-5 w-5 text-[#1a1f2e]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      {/* Placeholder card */}
      <div
        className={cn(
          'rounded-2xl border border-dashed p-10 text-center',
          colors.bg,
          colors.border
        )}
      >
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-4',
            colors.badge
          )}
        >
          Phase {phase}
        </span>

        <h2 className={cn('text-lg font-semibold mb-2', colors.text)}>
          {title} — Coming in Phase {phase}
        </h2>
        <p className="text-sm text-gray-500 max-w-lg mx-auto mb-6">
          {description}
        </p>

        {/* Feature list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto text-left">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-2">
              <CircleCheck className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
              <span className="text-sm text-gray-600">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
