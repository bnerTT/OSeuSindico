'use client'

import { useEffect, useState, useMemo, FormEvent } from 'react'
import { PageHeader } from '@/components/page-header'
import { EncomendaStatusBadge } from '@/components/status-badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { formatarData, censurarCPF, formatarNomeMorador } from '@/lib/utils'
import { api, ApiError } from '@/lib/api'
import type { Encomenda, Morador, PaginatedResponse } from '@/lib/types'
import { Check, MoreHorizontal, PackagePlus, RefreshCw, Trash2 } from 'lucide-react'

export default function EncomendasAdmin() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([])
  const [moradores, setMoradores] = useState<Morador[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dandoBaixaId, setDandoBaixaId] = useState<number | null>(null)

  // Sheet de Cadastro de Encomenda
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [codigo, setCodigo] = useState('')
  const [moradorSelecionado, setMoradorSelecionado] = useState<number | ''>('')

  const carregarDados = async () => {
    setIsLoading(true)
    try {
      const [encRes, morRes] = await Promise.all([
        api.get<PaginatedResponse<Encomenda>>('/encomendas/').catch(() => null),
        api.get<PaginatedResponse<Morador>>('/moradores/').catch(() => null),
      ])

      if (encRes?.results) {
        setEncomendas(encRes.results)
      }
      if (morRes?.results) {
        setMoradores(morRes.results)
      }
    } catch (err) {
      console.error('Falha ao carregar encomendas/moradores:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const handleDarBaixa = async (encomenda: Encomenda) => {
    setDandoBaixaId(encomenda.id)
    try {
      const dataAtualIso = new Date().toISOString()
      await api.put(`/encomendas/${encomenda.id}/`, {
        codigo: encomenda.codigo,
        morador: encomenda.morador,
        data_retirada: dataAtualIso,
      })

      // Atualiza o estado local
      setEncomendas((prev) =>
        prev.map((e) =>
          e.id === encomenda.id ? { ...e, data_retirada: dataAtualIso } : e
        )
      )
    } catch (err: any) {
      alert(`Erro ao dar baixa: ${err.message}`)
    } finally {
      setDandoBaixaId(null)
    }
  }

  const handleExcluir = async (id: number) => {
    if (!window.confirm('Deseja realmente excluir este registro de encomenda?')) {
      return
    }

    try {
      await api.delete(`/encomendas/${id}/`)
      setEncomendas((prev) => prev.filter((e) => e.id !== id))
    } catch (err: any) {
      alert(`Erro ao excluir encomenda: ${err.message}`)
    }
  }

  const handleSubmitCriacao = async (e: FormEvent) => {
    e.preventDefault()
    if (!moradorSelecionado) {
      setFormError('Selecione o morador / apartamento destinatário.')
      return
    }

    setFormLoading(true)
    setFormError('')

    try {
      await api.post('/encomendas/', {
        codigo: codigo.trim(),
        morador: Number(moradorSelecionado),
      })

      setSheetOpen(false)
      setCodigo('')
      setMoradorSelecionado('')
      await carregarDados()
    } catch (err: any) {
      if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError(err.message || 'Erro ao registrar encomenda.')
      }
    } finally {
      setFormLoading(false)
    }
  }

  // Mapa para consulta rápida de morador
  const moradorPorId = useMemo(() => {
    const mapa = new Map<number, Morador>()
    moradores.forEach((m) => mapa.set(m.id, m))
    return mapa
  }, [moradores])

  const aguardando = useMemo(
    () => encomendas.filter((e) => !e.data_retirada),
    [encomendas]
  )

  const concluidas = useMemo(
    () => encomendas.filter((e) => !!e.data_retirada),
    [encomendas]
  )

  function TabelaEncomendas({ lista }: { lista: Encomenda[] }) {
    if (lista.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma encomenda nesta categoria.
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código / Rastreio</TableHead>
                <TableHead>Morador Destinatário</TableHead>
                <TableHead className="hidden md:table-cell">Recebida na Portaria</TableHead>
                <TableHead className="hidden lg:table-cell">Data de Retirada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((encomenda) => {
                const moradorDestino = moradorPorId.get(encomenda.morador)
                const nomeMorador = formatarNomeMorador(encomenda.morador_nome || moradorDestino, moradorPorId)
                const aptoMorador = encomenda.morador_apartamento || moradorDestino?.apartamento
                const isAguardando = !encomenda.data_retirada

                return (
                  <TableRow key={encomenda.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {encomenda.codigo}
                    </TableCell>
                    <TableCell>
                      <span className="block text-sm font-medium">
                        {nomeMorador}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {aptoMorador ? `Apto ${aptoMorador}` : 'Unidade residencial'}
                        {moradorDestino?.cpf ? ` · CPF: ${censurarCPF(moradorDestino.cpf)}` : ''}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatarData(encomenda.data_chegada, true)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {encomenda.data_retirada
                        ? formatarData(encomenda.data_retirada, true)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <EncomendaStatusBadge
                        status={isAguardando ? 'aguardando' : 'retirada'}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {isAguardando ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={dandoBaixaId === encomenda.id}
                          onClick={() => handleDarBaixa(encomenda)}
                          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                        >
                          <Check className="mr-1 size-3.5" />
                          {dandoBaixaId === encomenda.id ? 'Baixando...' : 'Dar baixa'}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Retirada
                        </span>
                      )}
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
                              onClick={() => handleExcluir(encomenda.id)}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash2 className="size-4 mr-2" />
                              Excluir encomenda
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Encomendas da Portaria"
        description="Recebimento, controle e baixa de entregas do condomínio"
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
            <Button onClick={() => setSheetOpen(true)}>
              <PackagePlus data-icon="inline-start" />
              Registrar encomenda
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <span className="text-muted-foreground animate-pulse">Carregando encomendas da portaria...</span>
        </div>
      ) : (
        <Tabs defaultValue="aguardando">
          <TabsList>
            <TabsTrigger value="aguardando">
              Aguardando ({aguardando.length})
            </TabsTrigger>
            <TabsTrigger value="concluidas">
              Concluídas ({concluidas.length})
            </TabsTrigger>
            <TabsTrigger value="todas">Todas ({encomendas.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="aguardando" className="mt-4">
            <TabelaEncomendas lista={aguardando} />
          </TabsContent>
          <TabsContent value="concluidas" className="mt-4">
            <TabelaEncomendas lista={concluidas} />
          </TabsContent>
          <TabsContent value="todas" className="mt-4">
            <TabelaEncomendas lista={encomendas} />
          </TabsContent>
        </Tabs>
      )}

      {/* Sheet de Registro de Encomenda */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6">
          <SheetHeader className="p-0 mb-6">
            <SheetTitle className="text-xl font-bold">
              Registrar Encomenda
            </SheetTitle>
            <SheetDescription>
              Insira o código da encomenda e selecione a unidade destinatária na portaria.
            </SheetDescription>
          </SheetHeader>

          {formError && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitCriacao} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="enc-codigo">Código de Rastreio / Etiqueta</Label>
              <Input
                id="enc-codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: BR123456789BR ou Pacote Mercado Livre"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="enc-morador">Destinatário (Morador / Apartamento)</Label>
              <select
                id="enc-morador"
                value={moradorSelecionado}
                onChange={(e) => setMoradorSelecionado(e.target.value ? Number(e.target.value) : '')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Selecione a unidade...</option>
                {moradores.map((m) => (
                  <option key={m.id} value={m.id}>
                    {formatarNomeMorador(m)} — Apto {m.apartamento}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Registrando...' : 'Registrar encomenda'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
