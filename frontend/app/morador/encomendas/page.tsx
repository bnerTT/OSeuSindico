'use client'

import { useEffect, useState, useMemo } from 'react'
import { PageHeader } from '@/components/page-header'
import { EncomendaStatusBadge } from '@/components/status-badges'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { formatarData } from '@/lib/utils'
import { api } from '@/lib/api'
import type { Encomenda, PaginatedResponse } from '@/lib/types'
import { Package, PackageOpen, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

function ListaEncomendas({ lista }: { lista: Encomenda[] }) {
  if (lista.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageOpen />
          </EmptyMedia>
          <EmptyTitle>Nenhuma encomenda</EmptyTitle>
          <EmptyDescription>
            Não há encomendas nesta categoria no momento.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {lista.map((encomenda) => {
        const isAguardando = !encomenda.data_retirada
        return (
          <Card key={encomenda.id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    Encomenda #{encomenda.id}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    Código: {encomenda.codigo}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Recebida na portaria em: {formatarData(encomenda.data_chegada, true)}
                </span>
                {encomenda.data_retirada && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    Retirada em: {formatarData(encomenda.data_retirada, true)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 sm:ml-auto">
                <EncomendaStatusBadge status={isAguardando ? 'aguardando' : 'retirada'} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default function EncomendasMorador() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const carregarEncomendas = async () => {
    setIsLoading(true)
    try {
      const data = await api.get<PaginatedResponse<Encomenda>>('/encomendas/')
      if (data?.results) {
        setEncomendas(data.results)
      }
    } catch (err) {
      console.error('Falha ao carregar encomendas do morador:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarEncomendas()
  }, [])

  const aguardando = useMemo(
    () => encomendas.filter((e) => !e.data_retirada),
    [encomendas]
  )

  const retiradas = useMemo(
    () => encomendas.filter((e) => !!e.data_retirada),
    [encomendas]
  )

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Minhas encomendas"
        description="Acompanhe o status das suas entregas e recebimentos na portaria"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={carregarEncomendas}
            disabled={isLoading}
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <span className="text-muted-foreground animate-pulse">Carregando encomendas...</span>
        </div>
      ) : (
        <Tabs defaultValue="aguardando">
          <TabsList>
            <TabsTrigger value="aguardando">
              A retirar ({aguardando.length})
            </TabsTrigger>
            <TabsTrigger value="historico">
              Histórico ({retiradas.length})
            </TabsTrigger>
            <TabsTrigger value="todas">Todas ({encomendas.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="aguardando" className="mt-4">
            <ListaEncomendas lista={aguardando} />
          </TabsContent>
          <TabsContent value="historico" className="mt-4">
            <ListaEncomendas lista={retiradas} />
          </TabsContent>
          <TabsContent value="todas" className="mt-4">
            <ListaEncomendas lista={encomendas} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
