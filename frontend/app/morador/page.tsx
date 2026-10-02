'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { EncomendaStatusBadge } from '@/components/status-badges'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowRight, CalendarDays, Car, Clock, Package, WashingMachine } from 'lucide-react'
import { formatarData } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import type { Encomenda, Veiculo, PaginatedResponse, ReservaArea } from '@/lib/types'

export default function MoradorHome() {

  const { user, isLoading: authLoading } = useAuth()
  const [encomendas, setEncomendas] = useState<Encomenda[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [reservasCount, setReservasCount] = useState<number>(0)
  const [maquinasReservasCount, setMaquinasReservasCount] = useState<number>(0)
  const [aguardandoCount, setAguardandoCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function carregarDados() {
      setIsLoading(true)
      try {
        // Encomendas gerais do morador logado
        const [todasRes, pendentesRes] = await Promise.all([
          api.get<PaginatedResponse<Encomenda>>('/encomendas/').catch(() => null),
          api.get<PaginatedResponse<Encomenda>>('/encomendas/', { params: { retirada: 'false' } }).catch(() => null),
        ])

        if (todasRes?.results) {
          setEncomendas(todasRes.results)
        }
        if (pendentesRes?.count !== undefined) {
          setAguardandoCount(pendentesRes.count)
        } else if (todasRes?.results) {
          setAguardandoCount(todasRes.results.filter((e) => !e.data_retirada).length)
        }

        // Busca veículos vinculados ao morador
        try {
          const veiculosRes = await api.get<PaginatedResponse<Veiculo>>('/veiculos/', {
            params: user?.id ? { morador: user.id } : undefined,
          })
          if (veiculosRes?.results) {
            setVeiculos(veiculosRes.results)
          } else if (Array.isArray(veiculosRes)) {
            setVeiculos(veiculosRes)
          }
        } catch {
          setVeiculos([])
        }

        // Busca reservas vinculadas ao morador
        try {
          const reservasRes = await api.get<any>('/reservas/', {
            params: user?.id ? { morador: user.id } : undefined,
          })
          const rList = Array.isArray(reservasRes) ? reservasRes : reservasRes?.results || []
          const ativas = rList.filter((r: any) => r.status !== 'cancelada')
          setReservasCount(ativas.length)
        } catch {
          setReservasCount(0)
        }

        // Busca reservas de máquinas vinculadas ao morador
        try {
          const maqRes = await api.get<any>('/maquinas/reservas/').catch(() =>
            api.get<any>('/reservas-maquinas/').catch(() => [])
          )
          const mList = Array.isArray(maqRes) ? maqRes : maqRes?.results || []
          const agora = Date.now()
          const ativas = mList.filter(
            (r: any) => r.morador === user?.id && new Date(r.horario_final).getTime() >= agora
          )
          setMaquinasReservasCount(ativas.length)
        } catch {
          setMaquinasReservasCount(0)
        }
      } catch (err) {
        console.error('Erro ao carregar dados do morador:', err)
      } finally {
        setIsLoading(false)
      }
    }

    carregarDados()
  }, [user?.id])

  if (authLoading || isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-muted-foreground animate-pulse">Carregando painel do morador...</span>
      </div>
    )
  }

  const nomeMorador = user?.nome || user?.username || 'Morador'
  const apto = user?.apartamento ? `Apto ${user.apartamento}` : 'Unidade'

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title={`Olá, ${nomeMorador}`}
        description={`${apto} · Residencial Parque das Águas`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Encomendas a retirar"
          value={aguardandoCount}
          hint="Aguardando na portaria"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          label="Veículos cadastrados"
          value={veiculos.length}
          hint="Vinculados à sua unidade"
          icon={Car}
          accent="sky"
        />
        <StatCard
          label="Áreas de lazer"
          value={reservasCount}
          hint="Reservas ativas"
          icon={CalendarDays}
          accent="emerald"
        />
        <StatCard
          label="Lavanderia"
          value={maquinasReservasCount}
          hint="Máquinas agendadas"
          icon={WashingMachine}
          accent="purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Encomendas recentes</CardTitle>
              <CardDescription>
                Últimas movimentações na portaria
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/morador/encomendas" />}
            >
              Ver todas
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {encomendas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhuma encomenda registrada para o seu apartamento no momento.
              </p>
            ) : (
              encomendas.slice(0, 5).map((encomenda, index) => {
                const isAguardando = !encomenda.data_retirada
                return (
                  <div key={encomenda.id}>
                    {index > 0 && <Separator className="my-1" />}
                    <div className="flex items-center gap-3 py-2.5">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Package className="size-5" />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          Código: {encomenda.codigo}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          Recebida em: {formatarData(encomenda.data_chegada, true)}
                        </span>
                      </div>
                      <div className="ml-auto">
                        <EncomendaStatusBadge
                          status={isAguardando ? 'aguardando' : 'retirada'}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meus veículos</CardTitle>
            <CardDescription>Veículos vinculados à unidade</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {veiculos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum veículo registrado na portaria.
              </p>
            ) : (
              veiculos.map((veiculo) => (
                <div
                  key={veiculo.id}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">
                      {veiculo.placa}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {veiculo.modelo} · {veiculo.cor}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}