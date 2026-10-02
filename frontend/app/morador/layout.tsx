'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell, type NavItem } from '@/components/app-shell'
import { CalendarDays, Car, LayoutDashboard, Package, WashingMachine } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import type { PaginatedResponse, Encomenda } from '@/lib/types'

export default function MoradorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAdmin, isLoading, isAuthenticated } = useAuth()
  const [pendentesCount, setPendentesCount] = useState<number>(0)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      api.get<PaginatedResponse<Encomenda>>('/encomendas/', {
        params: { retirada: 'false' },
      })
        .then((res) => {
          if (res && typeof res.count === 'number') {
            setPendentesCount(res.count)
          }
        })
        .catch(() => {
          // ignora erro silenciosamente
        })
    }
  }, [isAuthenticated])

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-muted-foreground animate-pulse">Carregando ambiente do morador...</span>
      </div>
    )
  }

  const nav: NavItem[] = [
    { title: 'Início', href: '/morador', icon: LayoutDashboard },
    {
      title: 'Encomendas',
      href: '/morador/encomendas',
      icon: Package,
      badge: pendentesCount > 0 ? pendentesCount : undefined,
    },
    { title: 'Veículos', href: '/morador/veiculos', icon: Car },
    { title: 'Reservas de Áreas', href: '/morador/reservas', icon: CalendarDays },
    { title: 'Lavanderia', href: '/morador/lavanderia', icon: WashingMachine },
  ]

  const nomeExibicao = user.nome || user.username || (user.apartamento ? `Morador ${user.apartamento}` : 'Morador')
  const detalheExibicao = user.apartamento ? `Apto ${user.apartamento}` : 'Unidade Residencial'
  const iniciaisExibicao = nomeExibicao.substring(0, 2).toUpperCase()

  return (
    <AppShell
      area="Morador"
      areaHref="/morador"
      switchLabel={isAdmin ? 'Ir para Administração' : undefined}
      switchHref={isAdmin ? '/admin' : undefined}
      nav={nav}
      user={{
        nome: nomeExibicao,
        detalhe: detalheExibicao,
        iniciais: iniciaisExibicao,
      }}
    >
      {children}
    </AppShell>
  )
}