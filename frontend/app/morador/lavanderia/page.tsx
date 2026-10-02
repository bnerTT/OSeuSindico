'use client'

import { useEffect, useState, useMemo, FormEvent } from 'react'
import { PageHeader } from '@/components/page-header'
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
  WashingMachine,
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
  Weight,
  Coins,
} from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import type { Maquina, ReservaMaquina } from '@/lib/types'
import { formatarData } from '@/lib/utils'

export default function MoradorLavanderiaPage() {
  const { user } = useAuth()
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [reservas, setReservas] = useState<ReservaMaquina[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Sheet de Nova Reserva
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedMaquinaId, setSelectedMaquinaId] = useState<number | ''>('')
  const [dataReserva, setDataReserva] = useState<string>('')
  const [horaInicio, setHoraInicio] = useState<string>('14:00')
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
      const [maquinasRes, reservasRes] = await Promise.all([
        api.get<any>('/maquinas/').catch(() => []),
        api.get<any>('/maquinas/reservas/').catch(() =>
          api.get<any>('/reservas-maquinas/').catch(() => [])
        ),
      ])

      const maquinasList: Maquina[] = Array.isArray(maquinasRes)
        ? maquinasRes
        : maquinasRes?.results || []
      const reservasList: ReservaMaquina[] = Array.isArray(reservasRes)
        ? reservasRes
        : reservasRes?.results || []

      setMaquinas(maquinasList)
      setReservas(reservasList)
    } catch (err) {
      console.error('Falha ao carregar máquinas e reservas:', err)
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

  // Abre a criação com uma máquina pré-selecionada
  const abrirModalReserva = (maquinaId?: number) => {
    if (maquinaId) {
      setSelectedMaquinaId(maquinaId)
    } else if (maquinas.length > 0) {
      setSelectedMaquinaId(maquinas[0].id)
    }
    // Inicializa com a data de hoje ou amanhã
    const agora = new Date()
    agora.setHours(agora.getHours() + 1)
    const proximaHora = agora.getHours()
    const ano = agora.getFullYear()
    const mes = String(agora.getMonth() + 1).padStart(2, '0')
    const dia = String(agora.getDate()).padStart(2, '0')

    setDataReserva(`${ano}-${mes}-${dia}`)
    setHoraInicio(`${String(proximaHora).padStart(2, '0')}:00`)
    setHoraFim(`${String(Math.min(proximaHora + 2, 23)).padStart(2, '0')}:00`)
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

  // Validação 1: Data e hora futura
  const isDataNoPassado = useMemo(() => {
    if (!dataInicioCalculada) return false
    return dataInicioCalculada.getTime() <= Date.now()
  }, [dataInicioCalculada])

  // Validação 2: Término deve ser posterior ao início
  const isTerminoInvalido = useMemo(() => {
    if (!dataInicioCalculada || !dataFimCalculada) return false
    return dataFimCalculada.getTime() <= dataInicioCalculada.getTime()
  }, [dataInicioCalculada, dataFimCalculada])

  // Validação 3: Anti-Colisão (impede 2 moradores reservarem o mesmo horário)
  const conflitoReserva = useMemo(() => {
    if (!selectedMaquinaId || !dataInicioCalculada || !dataFimCalculada) return null

    const inicioNovo = dataInicioCalculada.getTime()
    const fimNovo = dataFimCalculada.getTime()

    // Encontra qualquer reserva existente daquela máquina que colida no tempo
    const reservaConflitante = reservas.find((r) => {
      if (r.maquina !== Number(selectedMaquinaId)) return false

      const inicioExistente = new Date(r.horario_inicio).getTime()
      const fimExistente = new Date(r.horario_final).getTime()

      // Interseção temporal: inicioNovo < fimExistente && fimNovo > inicioExistente
      return inicioNovo < fimExistente && fimNovo > inicioExistente
    })

    return reservaConflitante || null
  }, [selectedMaquinaId, dataInicioCalculada, dataFimCalculada, reservas])

  // Botão de submissão habilitado apenas quando válido
  const isFormValido = useMemo(() => {
    return (
      Boolean(selectedMaquinaId) &&
      Boolean(dataReserva) &&
      Boolean(horaInicio) &&
      Boolean(horaFim) &&
      !isDataNoPassado &&
      !isTerminoInvalido &&
      !conflitoReserva
    )
  }, [selectedMaquinaId, dataReserva, horaInicio, horaFim, isDataNoPassado, isTerminoInvalido, conflitoReserva])

  // Submissão da reserva
  const handleCriarReserva = async (e: FormEvent) => {
    e.preventDefault()
    if (!isFormValido || !dataInicioCalculada || !dataFimCalculada) return

    setFormLoading(true)
    setFormError('')

    try {
      const payload = {
        maquina: Number(selectedMaquinaId),
        morador: user?.id,
        horario_inicio: dataInicioCalculada.toISOString(),
        horario_final: dataFimCalculada.toISOString(),
      }

      await api.post('/maquinas/reservas/', payload).catch(() =>
        api.post('/reservas-maquinas/', payload)
      )

      await carregarDados()
      setSheetOpen(false)
    } catch (err: any) {
      if (err instanceof ApiError) {
        setFormError(err.data?.non_field_errors?.[0] || err.message)
      } else {
        setFormError('Falha ao agendar a máquina. Verifique os dados e tente novamente.')
      }
    } finally {
      setFormLoading(false)
    }
  }

  // Cancelar reserva de máquina
  const handleCancelarReserva = async (reservaId: number) => {
    if (!confirm('Deseja realmente cancelar esta reserva de máquina?')) return

    setCancelandoId(reservaId)
    try {
      await api.delete(`/maquinas/reservas/${reservaId}/`).catch(() =>
        api.delete(`/reservas-maquinas/${reservaId}/`)
      )
      await carregarDados()
    } catch (err) {
      console.error('Falha ao cancelar reserva:', err)
      alert('Não foi possível cancelar a reserva no momento.')
    } finally {
      setCancelandoId(null)
    }
  }

  // Status atual de cada máquina (Em uso agora vs Disponível)
  const getStatusMaquina = (maquinaId: number) => {
    const agora = Date.now()
    const reservaAtual = reservas.find((r) => {
      if (r.maquina !== maquinaId) return false
      const ini = new Date(r.horario_inicio).getTime()
      const fim = new Date(r.horario_final).getTime()
      return agora >= ini && agora <= fim
    })

    if (reservaAtual) {
      const fimHora = new Date(reservaAtual.horario_final).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return { ocupada: true, mensagem: `Em uso até ${fimHora}` }
    }
    return { ocupada: false, mensagem: 'Disponível agora' }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lavanderia & Máquinas"
        description="Consulte as máquinas disponíveis e reserve seus horários de uso de forma rápida e segura."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={carregarDados} disabled={isLoading}>
              <RefreshCw className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => abrirModalReserva()}>
              <WashingMachine className="mr-2 size-4" />
              Reservar Máquina
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="maquinas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="maquinas" className="flex items-center gap-2">
            <WashingMachine className="size-4" />
            <span>Máquinas</span>
          </TabsTrigger>
          <TabsTrigger value="minhas" className="flex items-center gap-2">
            <CalendarCheck2 className="size-4" />
            <span>Minhas Reservas ({minhasReservas.length})</span>
          </TabsTrigger>
          <TabsTrigger value="agenda" className="flex items-center gap-2">
            <Clock className="size-4" />
            <span>Ocupação & Agenda</span>
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: CATÁLOGO DE MÁQUINAS DISPONÍVEIS */}
        <TabsContent value="maquinas" className="space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <RefreshCw className="size-8 animate-spin mb-3 text-primary" />
              <p>Carregando máquinas cadastradas...</p>
            </div>
          ) : maquinas.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="space-y-3">
                <WashingMachine className="size-12 mx-auto text-muted-foreground opacity-50" />
                <CardTitle>Nenhuma máquina disponível no momento</CardTitle>
                <CardDescription>
                  O condomínio ainda não cadastrou máquinas de lavar no sistema.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {maquinas.map((maq) => {
                const statusInfo = getStatusMaquina(maq.id)
                return (
                  <Card key={maq.id} className="overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                          <WashingMachine className="size-6" />
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 ${
                            statusInfo.ocupada
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          <span
                            className={`size-2 rounded-full ${
                              statusInfo.ocupada ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                            }`}
                          />
                          {statusInfo.mensagem}
                        </span>
                      </div>
                      <CardTitle className="text-xl mt-3">Máquina #{maq.numero}</CardTitle>
                      <CardDescription>Lavadora & Secadora Automática</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-3">
                      <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Weight className="size-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Capacidade</p>
                            <p className="font-semibold">{maq.capacidade} kg</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Coins className="size-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Preço por Ciclo</p>
                            <p className="font-semibold">
                              {maq.preco > 0
                                ? Number(maq.preco).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })
                                : 'Gratuito'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button className="w-full" onClick={() => abrirModalReserva(maq.id)}>
                        <CalendarDays className="mr-2 size-4" />
                        Reservar Horário
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ABA 2: MINHAS RESERVAS DE MÁQUINA */}
        <TabsContent value="minhas" className="space-y-4">
          {minhasReservas.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="space-y-3">
                <CalendarDays className="size-12 mx-auto text-muted-foreground opacity-50" />
                <CardTitle>Você ainda não possui reservas de máquina</CardTitle>
                <CardDescription>
                  Selecione uma máquina no catálogo e agende seu horário de lavagem.
                </CardDescription>
                <Button onClick={() => abrirModalReserva()} className="mt-2">
                  <WashingMachine className="mr-2 size-4" />
                  Agendar Primeiro Horário
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {minhasReservas.map((res) => {
                const inicio = new Date(res.horario_inicio)
                const fim = new Date(res.horario_final)
                const jaPassou = fim.getTime() < Date.now()

                return (
                  <Card key={res.id} className="relative overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <WashingMachine className="size-5 text-primary" />
                          <CardTitle className="text-base">
                            Máquina #{res.maquina_numero || res.maquina}
                          </CardTitle>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            jaPassou
                              ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {jaPassou ? 'Concluída' : 'Agendada'}
                        </span>
                      </div>
                      <CardDescription>
                        {formatarData(res.horario_inicio)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm pb-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-4" />
                        <span>
                          {inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} até{' '}
                          {fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {res.maquina_capacidade && (
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <Weight className="size-3.5" />
                          <span>Capacidade máxima: {res.maquina_capacidade} kg</span>
                        </div>
                      )}
                    </CardContent>
                    {!jaPassou && (
                      <CardFooter className="pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-destructive hover:bg-destructive/10"
                          disabled={cancelandoId === res.id}
                          onClick={() => handleCancelarReserva(res.id)}
                        >
                          <XCircle className="mr-2 size-4" />
                          {cancelandoId === res.id ? 'Cancelando...' : 'Cancelar Reserva'}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ABA 3: OCUPAÇÃO & AGENDA POR MÁQUINA */}
        <TabsContent value="agenda" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="size-5 text-primary" />
                Linha do Tempo de Ocupação
              </CardTitle>
              <CardDescription>
                Acompanhe os horários em que cada máquina está reservada para programar sua utilização com tranquilidade.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reservas.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>Nenhuma reserva registrada na lavanderia. Todas as máquinas estão livres!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reservas
                    .filter((r) => new Date(r.horario_final).getTime() >= Date.now())
                    .sort((a, b) => new Date(a.horario_inicio).getTime() - new Date(b.horario_inicio).getTime())
                    .slice(0, 15)
                    .map((r) => {
                      const ini = new Date(r.horario_inicio)
                      const fim = new Date(r.horario_final)
                      const eMinha = r.morador === user?.id

                      return (
                        <div
                          key={r.id}
                          className={`p-3 rounded-lg border flex items-center justify-between text-sm ${
                            eMinha
                              ? 'bg-primary/5 border-primary/30'
                              : 'bg-card border-border'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-muted">
                              <WashingMachine className="size-4 text-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">
                                Máquina #{r.maquina_numero || r.maquina}
                                {eMinha && (
                                  <span className="ml-2 text-xs text-primary font-semibold">
                                    (Sua Reserva)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatarData(r.horario_inicio)} • {ini.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-mono">
                              {eMinha
                                ? 'Reservado por você'
                                : r.morador_apartamento
                                ? `Ap. ${r.morador_apartamento}`
                                : 'Reservado'}
                            </span>
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

      {/* SHEET / MODAL DE RESERVA DE MÁQUINA */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <WashingMachine className="size-5 text-primary" />
              Agendar Máquina de Lavar
            </SheetTitle>
            <SheetDescription>
              Selecione a máquina e o intervalo de horário desejado.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCriarReserva} className="space-y-5 py-6">
            {formError && (
              <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-start gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* SELEÇÃO DA MÁQUINA */}
            <div className="space-y-2">
              <Label htmlFor="maquina-select">Máquina</Label>
              <select
                id="maquina-select"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={selectedMaquinaId}
                onChange={(e) => setSelectedMaquinaId(Number(e.target.value))}
                required
              >
                <option value="" disabled>
                  Selecione uma máquina...
                </option>
                {maquinas.map((maq) => (
                  <option key={maq.id} value={maq.id}>
                    Máquina #{maq.numero} ({maq.capacidade} kg • {maq.preco > 0 ? `R$ ${maq.preco.toFixed(2)}` : 'Gratuito'})
                  </option>
                ))}
              </select>
            </div>

            {/* DATA DA RESERVA (COM MIN={HOJE}) */}
            <div className="space-y-2">
              <Label htmlFor="data-reserva">Data da Utilização</Label>
              <Input
                id="data-reserva"
                type="date"
                min={hojeStr}
                value={dataReserva}
                onChange={(e) => setDataReserva(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Info className="size-3" />
                Somente agendamentos para datas presentes e futuras são permitidos.
              </p>
            </div>

            {/* HORÁRIOS DE INÍCIO E TÉRMINO */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hora-inicio">Início do Ciclo</Label>
                <Input
                  id="hora-inicio"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora-fim">Término do Ciclo</Label>
                <Input
                  id="hora-fim"
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* FEEDBACKS EM TEMPO REAL: DATA PASSADA OU CONFLITO */}
            {isDataNoPassado && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs uppercase tracking-wider">Horário Inválido</p>
                  <p className="text-xs">
                    Não é possível reservar um horário que já passou. Escolha um horário futuro.
                  </p>
                </div>
              </div>
            )}

            {isTerminoInvalido && !isDataNoPassado && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs uppercase tracking-wider">Intervalo Inconsistente</p>
                  <p className="text-xs">
                    O horário de término deve ser posterior ao horário de início.
                  </p>
                </div>
              </div>
            )}

            {conflitoReserva && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-2.5">
                <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-semibold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Conflito de Horário
                  </p>
                  <p className="text-xs mt-0.5">
                    Esta máquina já possui agendamento de{' '}
                    <strong>
                      {new Date(conflitoReserva.horario_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às{' '}
                      {new Date(conflitoReserva.horario_final).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                    . Por favor, escolha outro horário ou outra máquina.
                  </p>
                </div>
              </div>
            )}

            {!isDataNoPassado && !isTerminoInvalido && !conflitoReserva && dataInicioCalculada && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium">Horário disponível para agendamento!</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValido || formLoading}
            >
              {formLoading ? (
                <>
                  <RefreshCw className="mr-2 size-4 animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Confirmar Reserva
                </>
              )}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
