'use client'

import { useEffect, useState, useMemo, FormEvent } from 'react'
import { PageHeader } from '@/components/page-header'
import { ReservaStatusBadge } from '@/components/status-badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck2,
  XCircle,
  RefreshCw,
  Sparkles,
  Info,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import type { Area, ReservaArea } from '@/lib/types'
import { formatarData } from '@/lib/utils'

export default function MoradorReservasPage() {
  const { user } = useAuth()
  const [areas, setAreas] = useState<Area[]>([])
  const [reservas, setReservas] = useState<ReservaArea[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Sheet de Nova Reserva
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedAreaId, setSelectedAreaId] = useState<number | ''>('')
  const [dataReserva, setDataReserva] = useState<string>('')
  const [horaInicio, setHoraInicio] = useState<string>('12:00')
  const [horaFim, setHoraFim] = useState<string>('16:00')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [cancelandoId, setCancelandoId] = useState<number | null>(null)

  // Data mínima: hoje em formato YYYY-MM-DD
  const hojeStr = useMemo(() => {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, '0')
    const dia = String(hoje.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }, [])

  const carregarDados = async () => {
    setIsLoading(true)
    try {
      const [areasRes, reservasRes] = await Promise.all([
        api.get<any>('/areas/').catch(() => []),
        api.get<any>('/reservas/').catch(() => []),
      ])

      const areasList: Area[] = Array.isArray(areasRes)
        ? areasRes
        : areasRes?.results || []
      const reservasList: ReservaArea[] = Array.isArray(reservasRes)
        ? reservasRes
        : reservasRes?.results || []

      setAreas(areasList)
      setReservas(reservasList)
    } catch (err) {
      console.error('Falha ao carregar áreas e reservas:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Reservas do morador logado
  const minhasReservas = useMemo(() => {
    if (!user?.id) return reservas
    return reservas.filter((r) => r.morador === user.id)
  }, [reservas, user?.id])

  // Abre a criação com uma área pré-selecionada
  const abrirModalReserva = (areaId?: number) => {
    if (areaId) {
      setSelectedAreaId(areaId)
    } else if (areas.length > 0) {
      setSelectedAreaId(areas[0].id)
    }
    // Inicializa com data de amanhã por padrão
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    const ano = amanha.getFullYear()
    const mes = String(amanha.getMonth() + 1).padStart(2, '0')
    const dia = String(amanha.getDate()).padStart(2, '0')
    setDataReserva(`${ano}-${mes}-${dia}`)
    setHoraInicio('10:00')
    setHoraFim('14:00')
    setFormError('')
    setSheetOpen(true)
  }

  // Objeto Date calculado da reserva sendo criada
  const dataInicioCalculada = useMemo(() => {
    if (!dataReserva || !horaInicio) return null
    return new Date(`${dataReserva}T${horaInicio}:00`)
  }, [dataReserva, horaInicio])

  const dataFimCalculada = useMemo(() => {
    if (!dataReserva || !horaFim) return null
    return new Date(`${dataReserva}T${horaFim}:00`)
  }, [dataReserva, horaFim])

  // Validação 1: A data/horário está no passado?
  const isDataNoPassado = useMemo(() => {
    if (!dataInicioCalculada) return false
    return dataInicioCalculada.getTime() <= Date.now()
  }, [dataInicioCalculada])

  // Validação 2: Horário de término é posterior ao de início?
  const isHorarioInvalido = useMemo(() => {
    if (!dataInicioCalculada || !dataFimCalculada) return false
    return dataFimCalculada.getTime() <= dataInicioCalculada.getTime()
  }, [dataInicioCalculada, dataFimCalculada])

  // Reservas ativas da área selecionada na data escolhida
  const reservasDoDiaNaArea = useMemo(() => {
    if (!selectedAreaId || !dataReserva) return []
    return reservas.filter((r) => {
      if (r.area !== Number(selectedAreaId)) return false
      if (r.status === 'cancelada') return false
      const inicioR = new Date(r.data_inicio)
      const dataIsoR = inicioR.toISOString().slice(0, 10)
      const dataLocalR = `${inicioR.getFullYear()}-${String(inicioR.getMonth() + 1).padStart(2, '0')}-${String(inicioR.getDate()).padStart(2, '0')}`
      return dataIsoR === dataReserva || dataLocalR === dataReserva
    })
  }, [reservas, selectedAreaId, dataReserva])

  // Validação 3: Conflito de choque de horários com outra reserva
  const reservaConflitante = useMemo(() => {
    if (!dataInicioCalculada || !dataFimCalculada || !selectedAreaId) return null

    const inicioTime = dataInicioCalculada.getTime()
    const fimTime = dataFimCalculada.getTime()

    for (const r of reservas) {
      if (r.area !== Number(selectedAreaId)) continue
      if (r.status === 'cancelada') continue

      const rInicioTime = new Date(r.data_inicio).getTime()
      const rFimTime = new Date(r.data_fim).getTime()

      // Há sobreposição quando: (inicioNovo < fimExistente) e (fimNovo > inicioExistente)
      if (inicioTime < rFimTime && fimTime > rInicioTime) {
        return r
      }
    }
    return null
  }, [dataInicioCalculada, dataFimCalculada, selectedAreaId, reservas])

  // Submissão do agendamento
  const handleSubmitReserva = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!selectedAreaId) {
      setFormError('Selecione uma área comum para reservar.')
      return
    }

    if (!user?.id) {
      setFormError('Você precisa estar autenticado como morador para reservar.')
      return
    }

    if (!dataInicioCalculada || !dataFimCalculada) {
      setFormError('Preencha a data e os horários de início e término.')
      return
    }

    if (isDataNoPassado) {
      setFormError('Apenas reservas para datas e horários futuros são permitidas.')
      return
    }

    if (isHorarioInvalido) {
      setFormError('O horário de término deve ser posterior ao horário de início.')
      return
    }

    if (reservaConflitante) {
      const hIni = new Date(reservaConflitante.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      const hFim = new Date(reservaConflitante.data_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      setFormError(`Conflito de horário: esta área já possui reserva ativa das ${hIni} às ${hFim} nesta data.`)
      return
    }

    setFormLoading(true)

    try {
      await api.post('/reservas/', {
        area: Number(selectedAreaId),
        morador: user.id,
        data_inicio: dataInicioCalculada.toISOString(),
        data_fim: dataFimCalculada.toISOString(),
        status: 'pendente',
      })

      setSheetOpen(false)
      await carregarDados()
    } catch (err: any) {
      if (err instanceof ApiError) {
        const detalhe = err.data?.conflito || err.data?.data_inicio || err.data?.data_fim || err.message
        setFormError(typeof detalhe === 'string' ? detalhe : JSON.stringify(detalhe))
      } else {
        setFormError(err.message || 'Erro ao registrar reserva.')
      }
    } finally {
      setFormLoading(false)
    }
  }

  // Cancelamento de reserva pelo morador
  const handleCancelarReserva = async (reservaId: number) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta reserva?')) {
      return
    }

    setCancelandoId(reservaId)
    try {
      const reservaAlvo = reservas.find((r) => r.id === reservaId)
      if (reservaAlvo) {
        await api.put(`/reservas/${reservaId}/`, {
          area: reservaAlvo.area,
          morador: reservaAlvo.morador,
          data_inicio: reservaAlvo.data_inicio,
          data_fim: reservaAlvo.data_fim,
          status: 'cancelada',
        })
      }
      await carregarDados()
    } catch (err: any) {
      alert(`Não foi possível cancelar a reserva: ${err.message}`)
    } finally {
      setCancelandoId(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Reservas de Áreas Comuns"
        description="Agende churrasqueira, salão de festas e outros espaços de lazer com garantia de exclusividade"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDados}
              disabled={isLoading}
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={() => abrirModalReserva()}>
              <CalendarCheck2 data-icon="inline-start" />
              Nova Reserva
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="areas" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="areas">Áreas ({areas.length})</TabsTrigger>
          <TabsTrigger value="minhas">Minhas Reservas ({minhasReservas.length})</TabsTrigger>
          <TabsTrigger value="agenda">Ocupação & Agenda</TabsTrigger>
        </TabsList>

        {/* Aba 1: Catálogo de Áreas Disponíveis */}
        <TabsContent value="areas" className="mt-6">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <span className="text-muted-foreground animate-pulse">Carregando áreas comuns cadastradas...</span>
            </div>
          ) : areas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Info className="size-10 text-muted-foreground/60 mb-3" />
                <h3 className="text-base font-semibold">Nenhuma área cadastrada</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  A administração do condomínio ainda não cadastrou áreas de lazer disponíveis para reserva.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {areas.map((area) => (
                <Card key={area.id} className="flex flex-col justify-between transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg font-semibold">{area.nome}</CardTitle>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="size-3" />
                        Disponível
                      </span>
                    </div>
                    <CardDescription className="text-sm mt-1.5 line-clamp-3">
                      {area.descricao || 'Área de convivência do condomínio disponível para eventos dos moradores.'}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-2">
                    <Button
                      className="w-full"
                      onClick={() => abrirModalReserva(area.id)}
                    >
                      <CalendarDays data-icon="inline-start" className="size-4 mr-2" />
                      Reservar Espaço
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Aba 2: Minhas Reservas */}
        <TabsContent value="minhas" className="mt-6">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <span className="text-muted-foreground animate-pulse">Carregando suas reservas...</span>
            </div>
          ) : minhasReservas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="size-10 text-muted-foreground/60 mb-3" />
                <h3 className="text-base font-semibold">Você ainda não possui reservas</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  Selecione uma área comum disponível e agende o melhor horário para seu evento ou confraternização.
                </p>
                <Button className="mt-4" onClick={() => abrirModalReserva()}>
                  Fazer Minha Primeira Reserva
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {minhasReservas.map((reserva) => {
                const areaInfo = areas.find((a) => a.id === reserva.area) || reserva.area_detalhes
                const inicioDate = new Date(reserva.data_inicio)
                const fimDate = new Date(reserva.data_fim)
                const isPassada = fimDate.getTime() < Date.now()
                const podeCancelar = reserva.status !== 'cancelada' && !isPassada

                return (
                  <Card key={reserva.id}>
                    <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <CalendarDays className="size-5" />
                        </span>
                        <div className="flex flex-col">
                          <span className="text-base font-semibold">
                            {areaInfo?.nome || `Área #${reserva.area}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Data: <strong className="text-foreground">{formatarData(reserva.data_inicio, false)}</strong> · Das{' '}
                            {inicioDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às{' '}
                            {fimDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <ReservaStatusBadge status={reserva.status} />

                        {podeCancelar && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={cancelandoId === reserva.id}
                            onClick={() => handleCancelarReserva(reserva.id)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <XCircle className="size-3.5 mr-1" />
                            {cancelandoId === reserva.id ? 'Cancelando...' : 'Cancelar'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Aba 3: Ocupação e Agenda Geral (LGPD Compliant) */}
        <TabsContent value="agenda" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Agenda de Ocupação do Condomínio</CardTitle>
              <CardDescription>
                Consulte as datas e horários já agendados para planejar o seu evento sem choques de horário.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reservas.filter((r) => r.status !== 'cancelada').length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Todas as áreas estão totalmente livres para agendamentos futuros!
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {reservas
                    .filter((r) => r.status !== 'cancelada' && new Date(r.data_fim).getTime() >= Date.now())
                    .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())
                    .map((r) => {
                      const areaInfo = areas.find((a) => a.id === r.area) || r.area_detalhes
                      const dIni = new Date(r.data_inicio)
                      const dFim = new Date(r.data_fim)
                      const isMinha = user?.id === r.morador

                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-lg border p-3 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="size-4 text-muted-foreground" />
                            <div>
                              <span className="font-medium text-foreground">
                                {areaInfo?.nome || `Área #${r.area}`}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {formatarData(r.data_inicio, false)} · Das{' '}
                                {dIni.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às{' '}
                                {dFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isMinha ? (
                              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                Sua reserva
                              </span>
                            ) : (
                              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                Ocupado (Condômino)
                              </span>
                            )}
                            <ReservaStatusBadge status={r.status} />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sheet Modal para Nova Reserva com Validações Exigidas */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
          <SheetHeader className="p-0 mb-6">
            <SheetTitle className="text-xl font-bold">Reservar Área Comum</SheetTitle>
            <SheetDescription>
              Escolha a área desejada, a data e a faixa de horário para uso exclusivo.
            </SheetDescription>
          </SheetHeader>

          {/* Feedback de Erro ou Alerta */}
          {formError && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Mecanismo 1: Alerta em tempo real de data no passado */}
          {isDataNoPassado && (
            <div className="mb-4 rounded-md bg-amber-500/15 p-3 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>
                <strong>Atenção:</strong> A data e o horário selecionados já passaram. Por favor, selecione uma data ou horário futuro.
              </span>
            </div>
          )}

          {/* Mecanismo 2: Alerta em tempo real de colisão de horários */}
          {reservaConflitante && (
            <div className="mb-4 rounded-md bg-rose-500/15 p-3 text-sm text-rose-700 dark:text-rose-400 flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div>
                <strong>Horário Indisponível!</strong>
                <p className="mt-0.5 text-xs">
                  Esta área já possui uma reserva ativa das{' '}
                  {new Date(reservaConflitante.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às{' '}
                  {new Date(reservaConflitante.data_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{' '}
                  nesta data. Escolha outro intervalo ou outra data.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitReserva} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="reserva-area">Área Desejada</Label>
              <select
                id="reserva-area"
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value ? Number(e.target.value) : '')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Selecione uma área...</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reserva-data">Data da Reserva</Label>
              <Input
                id="reserva-data"
                type="date"
                min={hojeStr}
                value={dataReserva}
                onChange={(e) => setDataReserva(e.target.value)}
                required
              />
              <span className="text-xs text-muted-foreground">
                Apenas datas de hoje em diante são permitidas.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reserva-inicio">Horário de Início</Label>
                <Input
                  id="reserva-inicio"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reserva-fim">Horário de Término</Label>
                <Input
                  id="reserva-fim"
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Lista visual de ocupação do dia para auxiliar o morador */}
            {selectedAreaId && dataReserva && (
              <div className="rounded-lg border bg-muted/30 p-3 mt-1">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                  <Clock className="size-3.5 text-primary" />
                  Ocupação nesta área em {dataReserva.split('-').reverse().join('/')}:
                </span>
                {reservasDoDiaNaArea.length === 0 ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    Área totalmente livre nesta data!
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                    {reservasDoDiaNaArea.map((r) => (
                      <li key={r.id} className="flex items-center justify-between">
                        <span>
                          Horário reservado:{' '}
                          <strong className="text-foreground">
                            {new Date(r.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às{' '}
                            {new Date(r.data_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </strong>
                        </span>
                        <ReservaStatusBadge status={r.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  formLoading ||
                  !selectedAreaId ||
                  !dataReserva ||
                  isDataNoPassado ||
                  isHorarioInvalido ||
                  !!reservaConflitante
                }
              >
                {formLoading ? 'Gravando reserva...' : 'Confirmar Reserva'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
