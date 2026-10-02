'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/page-header'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Car, Palette, RefreshCw, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import type { Veiculo, PaginatedResponse } from '@/lib/types'

export default function VeiculosMorador() {
  const { user } = useAuth()
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [permissaoRestrita, setPermissaoRestrita] = useState(false)

  const carregarVeiculos = useCallback(async () => {
    setIsLoading(true)
    setPermissaoRestrita(false)
    try {
      // Tenta obter veículos filtrados do morador logado
      const params = user?.id ? { morador: user.id } : undefined
      const data = await api.get<PaginatedResponse<Veiculo>>('/veiculos/', { params })
      if (data?.results) {
        setVeiculos(data.results)
      } else if (Array.isArray(data)) {
        setVeiculos(data)
      }
    } catch (err: any) {
      if (err.status === 403) {
        setPermissaoRestrita(true)
      } else {
        console.error('Erro ao carregar veículos do morador:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    carregarVeiculos()
  }, [carregarVeiculos])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Meus veículos"
        description="Veículos cadastrados e autorizados para a sua unidade"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={carregarVeiculos}
            disabled={isLoading}
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <span className="text-muted-foreground animate-pulse">Carregando veículos cadastrados...</span>
        </div>
      ) : permissaoRestrita ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldAlert className="text-amber-500" />
            </EmptyMedia>
            <EmptyTitle>Atualização de permissões em andamento</EmptyTitle>
            <EmptyDescription>
              O sistema está sincronizando a permissão de visualização de veículos para o seu perfil. Clique em &quot;Atualizar&quot; para consultar novamente.
            </EmptyDescription>
            <div className="mt-4">
              <Button size="sm" onClick={carregarVeiculos}>
                Tentar novamente
              </Button>
            </div>
          </EmptyHeader>
        </Empty>
      ) : veiculos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Car />
            </EmptyMedia>
            <EmptyTitle>Nenhum veículo cadastrado</EmptyTitle>
            <EmptyDescription>
              Não há veículos vinculados ao seu apartamento ({user?.apartamento ? `Apto ${user.apartamento}` : 'sua unidade'}). Entre em contato com a portaria para cadastrar seu carro ou moto.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {veiculos.map((veiculo) => (
            <Card key={veiculo.id}>
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="font-mono text-xl tracking-wider text-primary">
                  {veiculo.placa}
                </CardTitle>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                  <Car className="size-3.5" />
                  Veículo
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-base font-medium">{veiculo.modelo}</p>
                <Separator />
                <dl className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Palette className="size-4 text-primary" />
                    <dt className="w-16">Cor:</dt>
                    <dd className="font-medium text-foreground">{veiculo.cor}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
