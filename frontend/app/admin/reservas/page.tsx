'use client'

import { useEffect, useState, useMemo, FormEvent } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { ReservaStatusBadge } from '@/components/status-badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CalendarDays,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import type { Area, ReservaArea, Morador } from '@/lib/types'
import { formatarData, formatarNomeMorador, censurarCPF } from '@/lib/utils'

export default function AdminReservasPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [reservas, setReservas] = useState<ReservaArea[]>([])
  const [moradores, setMoradores] = useState<Morador[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busca, setBusca] = useState('')

  // Sheet de Cadastro / Edição de Área
  const [areaSheetOpen, setAreaSheetOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [nomeArea, setNomeArea] = useState('')
  const [descricaoArea, setDescricaoArea] = useState('')
  const [areaFormLoading, setAreaFormLoading] = useState(false)
  const [areaFormError, setAreaFormError] = useState('')

  // Ações de alteração de status
  const [processandoId, setProcessandoId] = useState<number | null>(null)

  const carregarDados = async () => {
    setIsLoading(true)
    try {
      const [areasRes, reservasRes, morRes] = await Promise.all([
        api.get<any>('/areas/').catch(() => []),
        api.get<any>('/reservas/').catch(() => []),
        api.get<any>('/moradores/').catch(() => []),
      ])

      const areasList: Area[] = Array.isArray(areasRes)
        ? areasRes
        : areasRes?.results || []
      const reservasList: ReservaArea[] = Array.isArray(reservasRes)
        ? reservasRes
        : reservasRes?.results || []
      const moradoresList: Morador[] = Array.isArray(morRes)
        ? morRes
        : morRes?.results || []

      setAreas(areasList)
      setReservas(reservasList)
      setMoradores(moradoresList)
    } catch (err) {
      console.error('Falha ao carregar áreas e reservas da administração:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const moradorPorId = useMemo(() => {
    const map = new Map<number, Morador>()
    moradores.forEach((m) => map.set(m.id, m))
    return map
  }, [moradores])

  const areaPorId = useMemo(() => {
    const map = new Map<number, Area>()
    areas.forEach((a) => map.set(a.id, a))
    return map
  }, [areas])

  // Abertura do formulário de área
  const abrirCriacaoArea = () => {
    setEditingArea(null)
    setNomeArea('')
    setDescricaoArea('')
    setAreaFormError('')
    setAreaSheetOpen(true)
  }

  const abrirEdicaoArea = (area: Area) => {
    setEditingArea(area)
    setNomeArea(area.nome)
    setDescricaoArea(area.descricao || '')
    setAreaFormError('')
    setAreaSheetOpen(true)
  }

  const handleSubmitArea = async (e: FormEvent) => {
    e.preventDefault()
    setAreaFormLoading(true)
    setAreaFormError('')

    try {
      if (editingArea) {
        await api.put(`/areas/${editingArea.id}/`, {
          nome: nomeArea.trim(),
          descricao: descricaoArea.trim(),
        })
      } else {
        await api.post('/areas/', {
          nome: nomeArea.trim(),
          descricao: descricaoArea.trim(),
        })
      }

      setAreaSheetOpen(false)
      await carregarDados()
    } catch (err: any) {
      if (err instanceof ApiError) {
        setAreaFormError(err.message)
      } else {
        setAreaFormError(err.message || 'Erro ao salvar área.')
      }
    } finally {
      setAreaFormLoading(false)
    }
  }

  const handleExcluirArea = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover esta área comum? Todas as reservas vinculadas serão afetadas.')) {
      return
    }

    try {
      await api.delete(`/areas/${id}/`)
      await carregarDados()
    } catch (err: any) {
      alert(`Erro ao excluir área: ${err.message}`)
    }
  }

  const handleAlterarStatusReserva = async (reserva: ReservaArea, novoStatus: 'confirmada' | 'cancelada') => {
    setProcessandoId(reserva.id)
    try {
      await api.put(`/reservas/${reserva.id}/`, {
        area: reserva.area,
        morador: reserva.morador,
        data_inicio: reserva.data_inicio,
        data_fim: reserva.data_fim,
        status: novoStatus,
      })
      await carregarDados()
    } catch (err: any) {
      alert(`Erro ao atualizar status da reserva: ${err.message}`)
    } finally {
      setProcessandoId(null)
    }
  }

  const handleExcluirReserva = async (id: number) => {
    if (!window.confirm('Deseja excluir permanentemente este registro de reserva?')) {
      return
    }

    try {
      await api.delete(`/reservas/${id}/`)
      setReservas((prev) => prev.filter((r) => r.id !== id))
    } catch (err: any) {
      alert(`Erro ao excluir reserva: ${err.message}`)
    }
  }

  // Contadores para os StatCards
  const totalPendentes = useMemo(
    () => reservas.filter((r) => r.status === 'pendente').length,
    [reservas]
  )

  const totalConfirmadas = useMemo(
    () => reservas.filter((r) => r.status === 'confirmada').length,
    [reservas]
  )

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return reservas
    return reservas.filter((r) => {
      const area = areaPorId.get(r.area) || r.area_detalhes
      const morador = moradorPorId.get(r.morador)
      const nomeMorador = formatarNomeMorador(r.morador_nome || morador, moradorPorId).toLowerCase()
      const areaMatch = area?.nome?.toLowerCase().includes(termo)
      const aptoMatch = (r.morador_apartamento || morador?.apartamento || '').toLowerCase().includes(termo)
      const statusMatch = r.status.toLowerCase().includes(termo)
      return areaMatch || nomeMorador.includes(termo) || aptoMatch || statusMatch
    })
  }, [busca, reservas, areaPorId, moradorPorId])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Gestão de Áreas & Reservas"
        description="Controle e aprovação de reservas de espaços comuns do condomínio"
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
            <Button onClick={abrirCriacaoArea}>
              <Plus data-icon="inline-start" />
              Cadastrar Nova Área
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Áreas de Lazer"
          value={areas.length}
          hint="Espaços cadastrados"
          icon={Sparkles}
        />
        <StatCard
          label="Reservas Pendentes"
          value={totalPendentes}
          hint="Aguardando confirmação"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          label="Reservas Confirmadas"
          value={totalConfirmadas}
          hint="Eventos agendados"
          icon={CalendarDays}
          accent="emerald"
        />
      </div>

      <Tabs defaultValue="reservas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="reservas">Reservas ({reservas.length})</TabsTrigger>
          <TabsTrigger value="areas">Áreas Cadastradas ({areas.length})</TabsTrigger>
        </TabsList>

        {/* Aba 1: Tabela de Reservas */}
        <TabsContent value="reservas" className="mt-6 flex flex-col gap-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por área, morador ou apartamento"
              className="pl-9"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Área Comum</TableHead>
                    <TableHead>Morador Solicitante</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Data e Horário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                        Carregando reservas registradas...
                      </TableCell>
                    </TableRow>
                  ) : filtrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                        Nenhuma reserva encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtrados.map((reserva) => {
                      const area = areaPorId.get(reserva.area) || reserva.area_detalhes
                      const morador = moradorPorId.get(reserva.morador)
                      const nomeMorador = formatarNomeMorador(reserva.morador_nome || morador, moradorPorId)
                      const apto = reserva.morador_apartamento || morador?.apartamento
                      const dIni = new Date(reserva.data_inicio)
                      const dFim = new Date(reserva.data_fim)

                      return (
                        <TableRow key={reserva.id}>
                          <TableCell className="font-semibold text-primary">
                            {area?.nome || `Área #${reserva.area}`}
                          </TableCell>
                          <TableCell>
                            <span className="block text-sm font-medium">
                              {nomeMorador}
                            </span>
                            {morador?.cpf && (
                              <span className="block text-xs text-muted-foreground">
                                CPF: {censurarCPF(morador.cpf)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {apto ? `Apto ${apto}` : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <span className="block font-medium text-foreground">
                              {formatarData(reserva.data_inicio, false)}
                            </span>
                            <span>
                              {dIni.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às{' '}
                              {dFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <ReservaStatusBadge status={reserva.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {reserva.status === 'pendente' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={processandoId === reserva.id}
                                  onClick={() => handleAlterarStatusReserva(reserva, 'confirmada')}
                                  className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 h-8 text-xs"
                                >
                                  <CheckCircle className="size-3.5 mr-1" />
                                  Confirmar
                                </Button>
                              )}
                              {reserva.status !== 'cancelada' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={processandoId === reserva.id}
                                  onClick={() => handleAlterarStatusReserva(reserva, 'cancelada')}
                                  className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 h-8 text-xs"
                                >
                                  <XCircle className="size-3.5 mr-1" />
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon" className="size-8">
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">Ações</span>
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end">
                                <DropdownMenuGroup>
                                  <DropdownMenuItem
                                    onClick={() => handleExcluirReserva(reserva.id)}
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                  >
                                    <Trash2 className="size-4 mr-2" />
                                    Excluir Registro
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 2: Gestão de Áreas de Convivência */}
        <TabsContent value="areas" className="mt-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Áreas Comuns Cadastradas</CardTitle>
                <CardDescription>
                  Espaços físicos de lazer do condomínio habilitados para reserva pelos moradores.
                </CardDescription>
              </div>
              <Button size="sm" onClick={abrirCriacaoArea}>
                <Plus data-icon="inline-start" className="size-4 mr-1.5" />
                Nova Área
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Área</TableHead>
                    <TableHead>Descrição e Recursos</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-28 text-center text-muted-foreground">
                        Nenhuma área cadastrada no momento. Clique no botão acima para adicionar a primeira.
                      </TableCell>
                    </TableRow>
                  ) : (
                    areas.map((area) => (
                      <TableRow key={area.id}>
                        <TableCell className="font-semibold text-foreground">
                          {area.nome}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {area.descricao || 'Sem descrição cadastrada'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => abrirEdicaoArea(area)}
                            >
                              <Pencil className="size-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleExcluirArea(area.id)}
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Excluir</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sheet de Criação / Edição de Área */}
      <Sheet open={areaSheetOpen} onOpenChange={setAreaSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6">
          <SheetHeader className="p-0 mb-6">
            <SheetTitle className="text-xl font-bold">
              {editingArea ? 'Editar Área Comum' : 'Cadastrar Nova Área'}
            </SheetTitle>
            <SheetDescription>
              Insira o nome e os recursos do espaço comum do condomínio.
            </SheetDescription>
          </SheetHeader>

          {areaFormError && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {areaFormError}
            </div>
          )}

          <form onSubmit={handleSubmitArea} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="area-nome">Nome da Área</Label>
              <Input
                id="area-nome"
                value={nomeArea}
                onChange={(e) => setNomeArea(e.target.value)}
                placeholder="Ex: Churrasqueira Gourmet, Salão de Festas"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="area-desc">Descrição / Regras de Uso</Label>
              <textarea
                id="area-desc"
                value={descricaoArea}
                onChange={(e) => setDescricaoArea(e.target.value)}
                placeholder="Ex: Capacidade para 30 pessoas, com freezer, churrasqueira e mesas."
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAreaSheetOpen(false)}
                disabled={areaFormLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={areaFormLoading}>
                {areaFormLoading ? 'Salvando...' : editingArea ? 'Salvar Alterações' : 'Cadastrar Área'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
