'use client'

import { useEffect, useState, useMemo, FormEvent } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  WashingMachine,
  Plus,
  RefreshCw,
  Clock,
  CalendarDays,
  Trash2,
  Edit2,
  AlertTriangle,
  Weight,
  Coins,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
  Info,
} from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import type { Maquina, ReservaMaquina, Morador } from '@/lib/types'
import { formatarData } from '@/lib/utils'

export default function AdminLavanderiaPage() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [reservas, setReservas] = useState<ReservaMaquina[]>([])
  const [moradores, setMoradores] = useState<Morador[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busca, setBusca] = useState('')

  // Sheet de Cadastro / Edição de Máquina
  const [sheetMaquinaOpen, setSheetMaquinaOpen] = useState(false)
  const [editingMaquina, setEditingMaquina] = useState<Maquina | null>(null)
  const [numeroMaquina, setNumeroMaquina] = useState<number | ''>('')
  const [capacidadeMaquina, setCapacidadeMaquina] = useState<number | ''>('')
  const [precoMaquina, setPrecoMaquina] = useState<number | ''>('')
  const [maquinaLoading, setMaquinaLoading] = useState(false)
  const [maquinaError, setMaquinaError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  const carregarDados = async () => {
    setIsLoading(true)
    try {
      const [maquinasRes, reservasRes, moradoresRes] = await Promise.all([
        api.get<any>('/maquinas/').catch(() => api.get<any>('/api/maquinas/').catch(() => [])),
        api.get<any>('/maquinas/reservas/').catch(() =>
          api.get<any>('/reservas-maquinas/').catch(() =>
            api.get<any>('/api/maquinas/reservas/').catch(() => [])
          )
        ),
        api.get<any>('/moradores/').catch(() => api.get<any>('/api/moradores/').catch(() => [])),
      ])

      const maquinasList: Maquina[] = Array.isArray(maquinasRes)
        ? maquinasRes
        : maquinasRes?.results || []
      const reservasList: ReservaMaquina[] = Array.isArray(reservasRes)
        ? reservasRes
        : reservasRes?.results || []
      const moradoresList: Morador[] = Array.isArray(moradoresRes)
        ? moradoresRes
        : moradoresRes?.results || []

      setMaquinas(maquinasList)
      setReservas(reservasList)
      setMoradores(moradoresList)
    } catch (err) {
      console.error('Falha ao carregar dados da lavanderia:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Abertura do modal de máquina
  const handleOpenNovaMaquina = () => {
    setEditingMaquina(null)
    const proximoNumero = maquinas.length > 0 ? Math.max(...maquinas.map((m) => m.numero)) + 1 : 1
    setNumeroMaquina(proximoNumero)
    setCapacidadeMaquina(10.5)
    setPrecoMaquina(15.0)
    setMaquinaError('')
    setSheetMaquinaOpen(true)
  }

  const handleOpenEditarMaquina = (maq: Maquina) => {
    setEditingMaquina(maq)
    setNumeroMaquina(maq.numero)
    setCapacidadeMaquina(maq.capacidade)
    setPrecoMaquina(maq.preco)
    setMaquinaError('')
    setSheetMaquinaOpen(true)
  }

  // Salvar Máquina (Criar ou Editar)
  const handleSalvarMaquina = async (e: FormEvent) => {
    e.preventDefault()
    if (!numeroMaquina || !capacidadeMaquina) return

    setMaquinaLoading(true)
    setMaquinaError('')

    const payload = {
      numero: Number(numeroMaquina),
      capacidade: Number(capacidadeMaquina),
      preco: Number(precoMaquina || 0),
    }

    try {
      if (editingMaquina) {
        await api.put(`/maquinas/${editingMaquina.id}/`, payload).catch(() =>
          api.put(`/api/maquinas/${editingMaquina.id}/`, payload)
        )
      } else {
        await api.post('/maquinas/', payload).catch(() =>
          api.post('/api/maquinas/', payload)
        )
      }
      await carregarDados()
      setSheetMaquinaOpen(false)
    } catch (err: any) {
      console.error('Erro ao salvar máquina:', err)
      if (err instanceof ApiError) {
        const errorDetail =
          err.data?.detail ||
          err.data?.erro ||
          err.data?.Erro ||
          (err.data && typeof err.data === 'object'
            ? Object.entries(err.data)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                .join(' | ')
            : err.message)
        setMaquinaError(errorDetail || 'Erro ao salvar máquina.')
      } else {
        setMaquinaError('Falha ao conectar com o servidor.')
      }
    } finally {
      setMaquinaLoading(false)
    }
  }

  // Excluir Máquina
  const handleExcluirMaquina = async (maquinaId: number) => {
    if (!confirm('Deseja realmente remover esta máquina? Todas as reservas vinculadas serão canceladas.')) return

    try {
      await api.delete(`/maquinas/${maquinaId}/`).catch(() =>
        api.delete(`/api/maquinas/${maquinaId}/`)
      )
      await carregarDados()
    } catch (err) {
      console.error('Falha ao excluir máquina:', err)
      alert('Não foi possível excluir a máquina no momento.')
    }
  }

  // Cancelar Reserva como Administrador
  const handleCancelarReserva = async (reservaId: number) => {
    if (!confirm('Deseja cancelar esta reserva de máquina?')) return

    setActionLoadingId(reservaId)
    try {
      await api.delete(`/maquinas/reservas/${reservaId}/`).catch(() =>
        api.delete(`/reservas-maquinas/${reservaId}/`).catch(() =>
          api.delete(`/api/maquinas/reservas/${reservaId}/`)
        )
      )
      await carregarDados()
    } catch (err) {
      console.error('Falha ao cancelar reserva:', err)
      alert('Não foi possível cancelar a reserva.')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Estatísticas operacionais
  const stats = useMemo(() => {
    const totalMaquinas = maquinas.length
    const agora = Date.now()

    const maquinasEmUso = maquinas.filter((m) => {
      return reservas.some((r) => {
        if (r.maquina !== m.id) return false
        const ini = new Date(r.horario_inicio).getTime()
        const fim = new Date(r.horario_final).getTime()
        return agora >= ini && agora <= fim
      })
    }).length

    const reservasFuturas = reservas.filter(
      (r) => new Date(r.horario_final).getTime() >= agora
    ).length

    return {
      totalMaquinas,
      maquinasEmUso,
      reservasFuturas,
    }
  }, [maquinas, reservas])

  // Filtragem de reservas para a tabela
  const reservasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase()
    return reservas
      .filter((r) => {
        if (!termo) return true
        const nome = r.morador_nome?.toLowerCase() || ''
        const ap = r.morador_apartamento?.toLowerCase() || ''
        const maq = `máquina ${r.maquina_numero || r.maquina}`.toLowerCase()
        return nome.includes(termo) || ap.includes(termo) || maq.includes(termo)
      })
      .sort((a, b) => new Date(b.horario_inicio).getTime() - new Date(a.horario_inicio).getTime())
  }, [reservas, busca])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Máquinas & Lavanderia"
        description="Cadastre as máquinas do condomínio para que fiquem disponíveis para reserva pelos moradores."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={carregarDados} disabled={isLoading}>
              <RefreshCw className={`mr-2 size-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button size="sm" onClick={handleOpenNovaMaquina} className="bg-primary font-semibold shadow-sm">
              <Plus className="mr-2 size-4" />
              Cadastrar Nova Máquina
            </Button>
          </div>
        }
      />

      {/* MÉTRICAS OPERACIONAIS */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Máquinas Cadastradas"
          value={stats.totalMaquinas}
          hint="Disponíveis para os moradores"
          icon={WashingMachine}
          accent="purple"
        />
        <StatCard
          label="Máquinas em Uso Agora"
          value={stats.maquinasEmUso}
          hint="Ciclo de lavagem em andamento"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          label="Reservas Agendadas"
          value={stats.reservasFuturas}
          hint="Agendamentos feitos por moradores"
          icon={CalendarDays}
          accent="emerald"
        />
      </div>

      {/* ABAS: MÁQUINAS É A PRIMEIRA E PRINCIPAL! */}
      <Tabs defaultValue="maquinas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="maquinas" className="flex items-center gap-2 font-medium">
            <WashingMachine className="size-4" />
            <span>Máquinas Cadastradas ({maquinas.length})</span>
          </TabsTrigger>
          <TabsTrigger value="reservas" className="flex items-center gap-2 font-medium">
            <CalendarDays className="size-4" />
            <span>Reservas dos Moradores ({reservas.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: GESTÃO E CADASTRO DE MÁQUINAS */}
        <TabsContent value="maquinas" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border shadow-xs">
            <div className="space-y-1">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <WashingMachine className="size-5 text-primary" />
                Equipamentos da Lavanderia Coletiva
              </h3>
              <p className="text-sm text-muted-foreground">
                Cadastre as máquinas para que apareçam imediatamente no aplicativo dos moradores para agendamento.
              </p>
            </div>
            <Button onClick={handleOpenNovaMaquina} className="shrink-0">
              <Plus className="mr-2 size-4" />
              Cadastrar Máquina
            </Button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <RefreshCw className="size-8 animate-spin mb-3 text-primary" />
              <p>Carregando máquinas cadastradas...</p>
            </div>
          ) : maquinas.length === 0 ? (
            <Card className="text-center py-16 border-dashed border-2">
              <CardContent className="space-y-4 max-w-md mx-auto">
                <div className="p-4 rounded-full bg-primary/10 text-primary w-fit mx-auto">
                  <WashingMachine className="size-12" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl">Nenhuma máquina cadastrada ainda</CardTitle>
                  <CardDescription>
                    Cadastre a primeira máquina de lavar para disponibilizar o serviço de lavanderia para todos os moradores do condomínio.
                  </CardDescription>
                </div>
                <Button size="lg" onClick={handleOpenNovaMaquina} className="mt-2 font-semibold">
                  <Plus className="mr-2 size-5" />
                  Cadastrar Primeira Máquina
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {maquinas.map((maq) => (
                <Card key={maq.id} className="relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <WashingMachine className="size-6" />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-foreground"
                          title="Editar parâmetros"
                          onClick={() => handleOpenEditarMaquina(maq)}
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10"
                          title="Remover máquina"
                          onClick={() => handleExcluirMaquina(maq.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-xl mt-3 flex items-center justify-between">
                      <span>Máquina #{maq.numero}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Disponível
                      </span>
                    </CardTitle>
                    <CardDescription>Lavadora & Secadora Coletiva</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-3">
                    <div className="grid grid-cols-2 gap-2 text-sm bg-muted/40 p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Weight className="size-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[11px] text-muted-foreground">Capacidade</p>
                          <p className="font-semibold">{maq.capacidade} kg</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Coins className="size-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[11px] text-muted-foreground">Preço por Ciclo</p>
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
                  <CardFooter className="pt-2 border-t bg-muted/10">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      Visível para reserva no portal do morador
                    </p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA 2: RESERVAS REALIZADAS PELOS MORADORES */}
        <TabsContent value="reservas" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Painel de Reservas dos Moradores</CardTitle>
                  <CardDescription>
                    Monitore os horários em que cada máquina está reservada para uso.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar por morador, ap ou máquina..."
                    className="pl-8 text-sm"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground flex justify-center items-center gap-2">
                  <RefreshCw className="size-4 animate-spin" />
                  Carregando reservas...
                </div>
              ) : reservasFiltradas.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhuma reserva de máquina encontrada.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Máquina</TableHead>
                        <TableHead>Morador</TableHead>
                        <TableHead>Apartamento</TableHead>
                        <TableHead>Data & Horário</TableHead>
                        <TableHead>Tarifa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservasFiltradas.map((r) => {
                        const ini = new Date(r.horario_inicio)
                        const fim = new Date(r.horario_final)
                        const jaConcluida = fim.getTime() < Date.now()
                        const emAndamento = Date.now() >= ini.getTime() && Date.now() <= fim.getTime()

                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-semibold">
                              Máquina #{r.maquina_numero || r.maquina}
                            </TableCell>
                            <TableCell>{r.morador_nome || 'Morador'}</TableCell>
                            <TableCell>
                              <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">
                                {r.morador_apartamento ? `Ap. ${r.morador_apartamento}` : '—'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{formatarData(r.horario_inicio)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {ini.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às{' '}
                                  {fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {r.maquina_preco && r.maquina_preco > 0
                                ? Number(r.maquina_preco).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })
                                : 'Gratuito'}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                  emAndamento
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : jaConcluida
                                    ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}
                              >
                                {emAndamento ? 'Em Uso' : jaConcluida ? 'Concluída' : 'Agendada'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {!jaConcluida && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10"
                                  disabled={actionLoadingId === r.id}
                                  onClick={() => handleCancelarReserva(r.id)}
                                >
                                  <XCircle className="mr-1.5 size-4" />
                                  Cancelar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL / SHEET DE CADASTRO E EDIÇÃO DE MÁQUINA */}
      <Sheet open={sheetMaquinaOpen} onOpenChange={setSheetMaquinaOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <WashingMachine className="size-5 text-primary" />
              {editingMaquina ? `Editar Máquina #${editingMaquina.numero}` : 'Cadastrar Nova Máquina'}
            </SheetTitle>
            <SheetDescription>
              {editingMaquina
                ? 'Atualize os dados e capacidade desta máquina de lavar.'
                : 'Insira os dados da máquina para disponibilizá-la aos moradores para agendamento.'}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSalvarMaquina} className="space-y-4 py-6">
            {maquinaError && (
              <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-start gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>{maquinaError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="num-maq">Número de Identificação da Máquina</Label>
              <Input
                id="num-maq"
                type="number"
                min="1"
                placeholder="Ex: 1, 2, 3..."
                value={numeroMaquina}
                onChange={(e) => setNumeroMaquina(e.target.value ? Number(e.target.value) : '')}
                required
              />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Info className="size-3" />
                Identificador visual que o morador verá no painel.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cap-maq">Capacidade de Carga (em kg)</Label>
              <Input
                id="cap-maq"
                type="number"
                step="0.5"
                min="1"
                placeholder="Ex: 10.5"
                value={capacidadeMaquina}
                onChange={(e) => setCapacidadeMaquina(e.target.value ? Number(e.target.value) : '')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco-maq">Tarifa / Preço por Ciclo (R$)</Label>
              <Input
                id="preco-maq"
                type="number"
                step="0.50"
                min="0"
                placeholder="Ex: 15.00 (ou 0 para gratuito)"
                value={precoMaquina}
                onChange={(e) => setPrecoMaquina(e.target.value ? Number(e.target.value) : '')}
              />
              <p className="text-[11px] text-muted-foreground">
                Informe 0 caso o condomínio não cobre pelo uso.
              </p>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={maquinaLoading}>
              {maquinaLoading ? (
                <>
                  <RefreshCw className="mr-2 size-4 animate-spin" />
                  Salvando Máquina...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  {editingMaquina ? 'Atualizar Máquina' : 'Cadastrar e Disponibilizar Máquina'}
                </>
              )}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
