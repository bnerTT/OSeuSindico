import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  type StatusEncomenda,
  type TipoVeiculo,
  statusEncomendaLabel,
  tipoVeiculoLabel,
} from '@/lib/mock-data'
import { Bike, Car, CircleCheck, CircleX, Clock, Undo2 } from 'lucide-react'
import type { ReservaStatus } from '@/lib/types'

const encomendaStyles: Record<StatusEncomenda, string> = {
  aguardando:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  retirada:
    'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300',
  devolvida:
    'border-transparent bg-muted text-muted-foreground',
}

const encomendaIcon: Record<StatusEncomenda, typeof Clock> = {
  aguardando: Clock,
  retirada: CircleCheck,
  devolvida: Undo2,
}

export function EncomendaStatusBadge({ status }: { status: StatusEncomenda }) {
  const Icon = encomendaIcon[status]
  return (
    <Badge className={cn('gap-1 font-medium', encomendaStyles[status])}>
      <Icon className="size-3.5" />
      {statusEncomendaLabel[status]}
    </Badge>
  )
}

const veiculoIcon: Record<TipoVeiculo, typeof Car> = {
  carro: Car,
  moto: Bike,
  bicicleta: Bike,
}

export function VeiculoTipoBadge({ tipo }: { tipo: TipoVeiculo }) {
  const Icon = veiculoIcon[tipo]
  return (
    <Badge variant="secondary" className="gap-1 font-medium">
      <Icon className="size-3.5" />
      {tipoVeiculoLabel[tipo]}
    </Badge>
  )
}

const reservaStyles: Record<ReservaStatus, string> = {
  pendente:
    'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  confirmada:
    'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300',
  cancelada:
    'border-transparent bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300',
}

const reservaLabels: Record<ReservaStatus, string> = {
  pendente: 'Pendente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
}

const reservaIcons: Record<ReservaStatus, typeof Clock> = {
  pendente: Clock,
  confirmada: CircleCheck,
  cancelada: CircleX,
}

export function ReservaStatusBadge({ status }: { status: ReservaStatus }) {
  const Icon = reservaIcons[status] || Clock
  return (
    <Badge className={cn('gap-1 font-medium', reservaStyles[status] || reservaStyles.pendente)}>
      <Icon className="size-3.5" />
      {reservaLabels[status] || status}
    </Badge>
  )
}

