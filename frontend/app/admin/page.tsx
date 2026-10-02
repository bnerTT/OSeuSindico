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
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { formatarData, censurarCPF, formatarNomeMorador, obterIniciais } from '@/lib/utils'
import { ArrowRight, Car, Check, Clock, Package, RefreshCw, Users } from 'lucide-react'
import { api } from '@/lib/api'
import type { Morador, Encomenda, Veiculo, PaginatedResponse } from '@/lib/types'

export default function AdminHome() {
  const [moradores, setMoradores] = useState<Morador[]>([])
  const [totalMoradores, setTotalMoradores] = useState(0)
  const [encomendasPendentes, setEncomendasPendentes] = useState<Encomenda[]>([])
  const [totalPendentes, setTotalPendentes] = useState(0)
  const [totalEncomendas, setTotalEncomendas] = useState(0)
  const [totalVeiculos, setTotalVeiculos] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [dandoBaixaId, setDandoBaixaId] = useState<number | null>(null)

  const carregarDadosDashboard = async () => {
    setIsLoading(true)
    try {
      const [moradoresRes, pendentesRes, todasEncRes, veiculosRes] = await Promise.all([
        api.get<PaginatedResponse<Morador>>('/moradores/').catch(() => null),
        api.get<PaginatedResponse<Encomenda>>('/encomendas/', { params: { retirada: 'false' } }).catch(() => null),
        api.get<PaginatedResponse<Encomenda>>('/encomendas/').catch(() => null),
        api.get<PaginatedResponse<Veiculo>>('/veiculos/').catch(() => null),
      ])

      if (moradoresRes) {
        setMoradores(moradoresRes.results || [])
        setTotalMoradores(moradoresRes.count || moradoresRes.results?.length || 0)
      }

      if (pendentesRes) {
        setEncomendasPendentes(pendentesRes.results || [])
        setTotalPendentes(pendentesRes.count || pendentesRes.results?.length || 0)
      }

      if (todasEncRes) {
        setTotalEncomendas(todasEncRes.count || todasEncRes.results?.length || 0)
      }

      if (veiculosRes) {
        setTotalVeiculos(veiculosRes.count || veiculosRes.results?.length || 0)
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard admin:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarDadosDashboard()
  }, [])

  const handleDarBaixa = async (encomenda: Encomenda) => {
    setDandoBaixaId(encomenda.id)
    try {
      await api.put(`/encomendas/${encomenda.id}/`, {
        codigo: encomenda.codigo,
        morador: encomenda.morador,
        data_retirada: new Date().toISOString(),
      })

      // Remove da lista de pendentes localmente
      setEncomendasPendentes((prev) => prev.filter((e) => e.id !== encomenda.id))
      setTotalPendentes((prev) => Math.max(0, prev - 1))
    } catch (err: any) {
      alert(`Erro ao dar baixa na encomenda: ${err.message}`)
    } finally {
      setDandoBaixaId(null)
    }
  }

  // Mapeia moradores por ID para visualização rápida nas encomendas
  const moradorPorId = new Map<number, Morador>()
  moradores.forEach((m) => moradorPorId.set(m.id, m))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Painel da administração"
        description="Visão geral e controle operacional do condomínio"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDadosDashboard}
              disabled={isLoading}
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/admin/encomendas" />}
            >
              <Package data-icon="inline-start" />
              Registrar encomenda
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Moradores cadastrados"
          value={totalMoradores}
          hint="Unidades ativas"
          icon={Users}
        />
        <StatCard
          label="Encomendas pendentes"
          value={totalPendentes}
          hint="Aguardando retirada"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          label="Total de encomendas"
          value={totalEncomendas}
          hint="Histórico geral"
          icon={Package}
          accent="emerald"
        />
        <StatCard
          label="Veículos cadastrados"
          value={totalVeiculos}
          hint="Carros e motos registrados"
          icon={Car}
          accent="sky"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Encomendas aguardando retirada</CardTitle>
              <CardDescription>
                Pendências ativas na portaria ({encomendasPendentes.length})
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/admin/encomendas" />}
            >
              Gerenciar
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground animate-pulse">
                Carregando pendências...
              </p>
            ) : encomendasPendentes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma encomenda aguardando retirada no momento.
              </p>
            ) : (
              encomendasPendentes.slice(0, 6).map((encomenda, index) => {
                const moradorDestino = moradorPorId.get(encomenda.morador)
                const nomeDestino = formatarNomeMorador(encomenda.morador_nome || moradorDestino, moradorPorId)
                const aptoTexto = encomenda.morador_apartamento || moradorDestino?.apartamento ? `Apto ${encomenda.morador_apartamento || moradorDestino?.apartamento}` : ''

                return (
                  <div key={encomenda.id}>
                    {index > 0 && <Separator className="my-1" />}
                    <div className="flex items-center gap-3 py-2">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Package className="size-5" />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          Código: {encomenda.codigo}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {nomeDestino}{aptoTexto ? ` (${aptoTexto})` : ''} · Chegou em: {formatarData(encomenda.data_chegada, true)}
                        </span>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <EncomendaStatusBadge status="aguardando" />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={dandoBaixaId === encomenda.id}
                          onClick={() => handleDarBaixa(encomenda)}
                          className="h-8 text-xs font-medium text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                        >
                          <Check className="mr-1 size-3.5" />
                          {dandoBaixaId === encomenda.id ? 'Baixando...' : 'Dar baixa'}
                        </Button>
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
            <CardTitle>Moradores cadastrados</CardTitle>
            <CardDescription>Cadastros recentes no condomínio</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground animate-pulse">
                Carregando moradores...
              </p>
            ) : moradores.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum morador registrado.
              </p>
            ) : (
              moradores.slice(0, 5).map((morador) => (
                <div key={morador.id} className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {obterIniciais(formatarNomeMorador(morador))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-sm font-medium">
                      {formatarNomeMorador(morador)}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      Apto {morador.apartamento} · CPF: {censurarCPF(morador.cpf)}
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
