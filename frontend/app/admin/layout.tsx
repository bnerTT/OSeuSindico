'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell, type NavItem } from '@/components/app-shell'
import { CalendarDays, Car, LayoutDashboard, Package, ShieldAlert, Users, WashingMachine } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import type { PaginatedResponse, Encomenda } from '@/lib/types'
import { Button } from '@/components/ui/button'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, role, isAdmin, isLoading, isAuthenticated } = useAuth()
  const [pendentesCount, setPendentesCount] = useState<number>(0)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (!isAdmin) {
        // Usuário logado mas sem permissão de administrador -> redireciona para a área do morador
        router.push('/morador')
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
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
  }, [isAuthenticated, isAdmin])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-muted-foreground animate-pulse">Verificando permissões de acesso...</span>
      </div>
    )
  }

  // Se não estiver autenticado ou não for administrador, bloqueia a renderização dos filhos
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-8" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Acesso Restrito</h1>
          <p className="text-sm text-muted-foreground">
            A área de administração e portaria é restrita exclusivamente a administradores e síndicos autorizados.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/morador" />}
          >
            Ir para Área do Morador
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Entrar com outra conta
          </Button>
        </div>
      </div>
    )
  }

  const nav: NavItem[] = [
    { title: 'Painel', href: '/admin', icon: LayoutDashboard },
    { title: 'Moradores', href: '/admin/moradores', icon: Users },
    {
      title: 'Encomendas',
      href: '/admin/encomendas',
      icon: Package,
      badge: pendentesCount > 0 ? pendentesCount : undefined,
    },
    { title: 'Veículos', href: '/admin/veiculos', icon: Car },
    { title: 'Áreas & Reservas', href: '/admin/reservas', icon: CalendarDays },
    { title: 'Lavanderia', href: '/admin/lavanderia', icon: WashingMachine },
  ]

  const nomeExibicao = user?.username || 'Administrador'
  const detalheExibicao = 'Síndico / Portaria'
  const iniciaisExibicao = nomeExibicao.substring(0, 2).toUpperCase()

  return (
    <AppShell
      area="Administração"
      areaHref="/admin"
      switchLabel="Ir para área do Morador"
      switchHref="/morador"
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
