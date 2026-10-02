'use client'

import { useEffect, useState, useMemo, FormEvent } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { api, ApiError } from '@/lib/api'
import type { Veiculo, Morador, PaginatedResponse } from '@/lib/types'
import { formatarNomeMorador } from '@/lib/utils'
import { Car, CirclePlus, MoreHorizontal, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react'

export default function VeiculosAdmin() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [moradores, setMoradores] = useState<Morador[]>([])
  const [busca, setBusca] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Sheet de Cadastro / Edição
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Campos do formulário
  const [placa, setPlaca] = useState('')
  const [modelo, setModelo] = useState('')
  const [cor, setCor] = useState('')
  const [moradorId, setMoradorId] = useState<number | ''>('')

  const carregarDados = async () => {
    setIsLoading(true)
    try {
      const [veicRes, morRes] = await Promise.all([
        api.get<PaginatedResponse<Veiculo>>('/veiculos/').catch(() => null),
        api.get<PaginatedResponse<Morador>>('/moradores/').catch(() => null),
      ])

      if (veicRes?.results) {
        setVeiculos(veicRes.results)
      }
      if (morRes?.results) {
        setMoradores(morRes.results)
      }
    } catch (err) {
      console.error('Falha ao carregar veículos/moradores:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const abrirCriacao = () => {
    setEditingVeiculo(null)
    setPlaca('')
    setModelo('')
    setCor('')
    setMoradorId('')
    setFormError('')
    setSheetOpen(true)
  }

  const abrirEdicao = (v: Veiculo) => {
    setEditingVeiculo(v)
    setPlaca(v.placa)
    setModelo(v.modelo)
    setCor(v.cor)
    setMoradorId(v.morador)
    setFormError('')
    setSheetOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!moradorId) {
      setFormError('Selecione o morador proprietário do veículo.')
      return
    }

    setFormLoading(true)
    setFormError('')

    try {
      const payload = {
        morador: Number(moradorId),
        placa: placa.trim().toUpperCase(),
        modelo: modelo.trim(),
        cor: cor.trim(),
      }

      if (editingVeiculo) {
        await api.put(`/veiculos/${editingVeiculo.id}/`, payload)
      } else {
        await api.post('/veiculos/', payload)
      }

      setSheetOpen(false)
      await carregarDados()
    } catch (err: any) {
      if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError(err.message || 'Erro ao salvar veículo.')
      }
    } finally {
      setFormLoading(false)
    }
  }

  const handleExcluir = async (id: number) => {
    if (!window.confirm('Deseja realmente remover este veículo?')) {
      return
    }

    try {
      await api.delete(`/veiculos/${id}/`)
      setVeiculos((prev) => prev.filter((v) => v.id !== id))
    } catch (err: any) {
      alert(`Erro ao excluir veículo: ${err.message}`)
    }
  }

  const moradorPorId = useMemo(() => {
    const mapa = new Map<number, Morador>()
    moradores.forEach((m) => mapa.set(m.id, m))
    return mapa
  }, [moradores])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return veiculos
    return veiculos.filter((v) => {
      const morador = moradorPorId.get(v.morador)
      const placaMatch = v.placa.toLowerCase().includes(termo)
      const modeloMatch = v.modelo.toLowerCase().includes(termo)
      const corMatch = v.cor.toLowerCase().includes(termo)
      const aptoMatch = morador?.apartamento?.toLowerCase().includes(termo)
      return placaMatch || modeloMatch || corMatch || aptoMatch
    })
  }, [busca, veiculos, moradorPorId])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Veículos"
        description="Controle e identificação de veículos para liberação de acesso e vagas"
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
            <Button onClick={abrirCriacao}>
              <CirclePlus data-icon="inline-start" />
              Cadastrar veículo
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total de veículos" value={veiculos.length} icon={Car} />
        <StatCard
          label="Unidades com veículos"
          value={new Set(veiculos.map((v) => v.morador)).size}
          icon={Car}
          accent="sky"
        />
        <StatCard
          label="Moradores cadastrados"
          value={moradores.length}
          icon={Car}
          accent="emerald"
        />
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por placa, modelo ou apartamento"
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Morador Responsável</TableHead>
                <TableHead>Apartamento</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    Carregando veículos cadastrados...
                  </TableCell>
                </TableRow>
              ) : filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    Nenhum veículo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((veiculo) => {
                  const morador = moradorPorId.get(veiculo.morador)
                  return (
                    <TableRow key={veiculo.id}>
                      <TableCell className="font-mono text-sm font-semibold tracking-wider text-primary">
                        {veiculo.placa}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {veiculo.modelo}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {veiculo.cor}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatarNomeMorador(veiculo.morador_nome || morador, moradorPorId)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {veiculo.morador_apartamento ? `Apto ${veiculo.morador_apartamento}` : (morador?.apartamento ? `Apto ${morador.apartamento}` : '—')}
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
                              <DropdownMenuItem onClick={() => abrirEdicao(veiculo)}>
                                <Pencil className="size-4 mr-2" />
                                Editar dados
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleExcluir(veiculo.id)}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              >
                                <Trash2 className="size-4 mr-2" />
                                Excluir veículo
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

      {/* Sheet de Cadastro / Edição de Veículo */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6">
          <SheetHeader className="p-0 mb-6">
            <SheetTitle className="text-xl font-bold">
              {editingVeiculo ? 'Editar Veículo' : 'Cadastrar Veículo'}
            </SheetTitle>
            <SheetDescription>
              {editingVeiculo
                ? 'Atualize os dados do veículo registrado na portaria.'
                : 'Insira os dados do veículo e selecione a unidade/morador proprietário.'}
            </SheetDescription>
          </SheetHeader>

          {formError && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="v-placa">Placa do Veículo</Label>
              <Input
                id="v-placa"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="Ex: ABC-1234 ou BRA2E19"
                maxLength={11}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="v-modelo">Modelo</Label>
              <Input
                id="v-modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: Honda Civic, Sandero, Corolla"
                maxLength={11}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="v-cor">Cor</Label>
              <Input
                id="v-cor"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                placeholder="Ex: Preto, Prata, Branco"
                maxLength={11}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="v-morador">Morador Proprietário</Label>
              <select
                id="v-morador"
                value={moradorId}
                onChange={(e) => setMoradorId(e.target.value ? Number(e.target.value) : '')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Selecione o morador...</option>
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
                {formLoading ? 'Salvando...' : editingVeiculo ? 'Salvar alterações' : 'Cadastrar veículo'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
