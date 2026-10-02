import type { ComponentType } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'primary',
}: {
  label: string
  value: string | number
  hint?: string
  icon: ComponentType<{ className?: string }>
  accent?: 'primary' | 'amber' | 'emerald' | 'sky'
}) {
  const accentClass = {
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
    emerald:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
  }[accent]

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            accentClass,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-bold leading-none tracking-tight">
            {value}
          </span>
          <span className="text-sm font-medium text-foreground/70">
            {label}
          </span>
          {hint && (
            <span className="text-xs text-muted-foreground">{hint}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
