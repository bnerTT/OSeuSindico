import { Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  showText = true,
}: {
  className?: string
  showText?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Building2 className="size-5" />
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-bold tracking-tight">
            O Seu Síndico
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            Gestão de condomínios
          </span>
        </span>
      )}
    </div>
  )
}
