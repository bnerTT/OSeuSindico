'use client'

import { useEffect, useMemo, useState, FormEvent } from 'react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import type { Morador, PaginatedResponse } from '@/lib/types'
import { censurarCPF, formatarNomeMorador, obterIniciais } from '@/lib/utils'

export default function MoradoresAdmin() {
  const [moradores, setMoradores] = useState<Morador[]>([])
  const [busca, setBusca] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Controle do Sheet de Criação / Edição
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingMorador, setEditingMorador] = useState<Morador | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Campos do formulário
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [cpf, setCpf] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [apartamento, setApartamento] = useState('')

  const carregarMoradores = async () => {
    setIsLoading(true)
    try {
      const data = await api.get<PaginatedResponse<Morador>>('/moradores/')
      if (data?.results) {
        setMoradores(data.results)
      }
    } catch (err) {
      console.error('Falha ao carregar moradores:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarMoradores()
  }, [])

  const abrirCriacao = () => {
    setEditingMorador(null)
    setUsername('')
    setPassword('')
    setCpf('')
    setDataNascimento('')
    setApartamento('')
    setFormError('')
    setSheetOpen(true)
  }

  const abrirEdicao = (m: Morador) => {
    setEditingMorador(m)
    setUsername(m.username || `morador_${m.id}`)
    setPassword('') // opcional na edição
    setCpf(m.cpf || '')
    setDataNascimento(m.data_nascimento || '')
    setApartamento(m.apartamento || '')
    setFormError('')
    setSheetOpen(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    const cleanCpf = cpf.replace(/\D/g, '')

    try {
      if (editingMorador) {
        // Atualização (PUT /moradores/<id>/)
        const payload: Record<string, any> = {
          username: username.trim(),
          cpf: cleanCpf || undefined,
          data_nascimento: dataNascimento,
          apartamento: apartamento.trim(),
        }
        if (password) {
          payload.password = password
        }

        await api.put(`/moradores/${editingMorador.id}/`, payload)
      } else {
        // Criação (POST /moradores/)
        await api.post('/moradores/', {
          username: username.trim(),
          password,
          cpf: cleanCpf || undefined,
          data_nascimento: dataNascimento,
          apartamento: apartamento.trim(),
        })
      }

      setSheetOpen(false)
      await carregarMoradores()
    } catch (err: any) {
      if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError(err.message || 'Erro ao salvar morador.')
      }
    } finally {
      setFormLoading(false)
    }
  }

  const handleExcluir = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este morador do sistema?')) {
      return
    }

    try {
      await api.delete(`/moradores/${id}/`)
      setMoradores((prev) => prev.filter((m) => m.id !== id))
    } catch (err: any) {
      alert(`Erro ao excluir morador: ${err.message}`)
    }
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return moradores
    return moradores.filter((m) => {
      const nomeCompleto = formatarNomeMorador(m).toLowerCase()
      const aptoMatch = m.apartamento?.toLowerCase().includes(termo)
      const cpfMatch = m.cpf?.includes(termo)
      const userMatch = m.username?.toLowerCase().includes(termo)
      const nomeMatch = nomeCompleto.includes(termo)
      return aptoMatch || cpfMatch || userMatch || nomeMatch
    })
  }, [busca, moradores])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Moradores"
        description="Gerencie o cadastro das unidades e moradores do condomínio"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={carregarMoradores}
              disabled={isLoading}
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={abrirCriacao}>
              <UserPlus data-icon="inline-start" />
              Novo morador
            </Button>
          </div>
        }
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por unidade, CPF ou usuário"
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Morador</TableHead>
                <TableHead>Unidade (Apartamento)</TableHead>
                <TableHead className="hidden md:table-cell">CPF (Protegido LGPD)</TableHead>
                <TableHead className="hidden lg:table-cell">Data de Nascimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    Carregando lista de moradores...
                  </TableCell>
                </TableRow>
              ) : filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                    Nenhum morador encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map((morador) => (
                  <TableRow key={morador.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {obterIniciais(formatarNomeMorador(morador))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium">
                            {formatarNomeMorador(morador)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Morador cadastrado
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        Apto {morador.apartamento}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">
                      {censurarCPF(morador.cpf)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {morador.data_nascimento || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Abrir ações</span>
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => abrirEdicao(morador)}>
                              <Pencil data-icon="inline-start" className="size-4 mr-2" />
                              Editar cadastro
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleExcluir(morador.id)}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash2 data-icon="inline-start" className="size-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sheet Lateral para Cadastro/Edição de Morador */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
          <SheetHeader className="p-0 mb-6">
            <SheetTitle className="text-xl font-bold">
              {editingMorador ? 'Editar Morador' : 'Novo Morador'}
            </SheetTitle>
            <SheetDescription>
              {editingMorador
                ? 'Atualize os dados cadastrais da unidade e morador.'
                : 'Preencha as informações para registrar um novo morador no condomínio.'}
            </SheetDescription>
          </SheetHeader>

          {formError && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="m-username">Nome de usuário (Login)</Label>
              <Input
                id="m-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: joao_silva"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-apartamento">Apartamento / Unidade</Label>
              <Input
                id="m-apartamento"
                value={apartamento}
                onChange={(e) => setApartamento(e.target.value)}
                placeholder="Ex: 302B"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-cpf">CPF (opcional)</Label>
              <Input
                id="m-cpf"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-nascimento">Data de Nascimento</Label>
              <Input
                id="m-nascimento"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-password">
                {editingMorador ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha de Acesso'}
              </Label>
              <Input
                id="m-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editingMorador}
                placeholder={editingMorador ? '••••••••' : 'Defina a senha do morador'}
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Salvando...' : editingMorador ? 'Salvar alterações' : 'Cadastrar morador'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
