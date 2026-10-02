'use client'

import type { ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/logo'
import { ArrowLeftRight, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export type NavItem = {
  title: string
  href: string
  icon: ComponentType<{ className?: string }>
  badge?: number
}

type AppShellProps = {
  area: 'Morador' | 'Administração'
  areaHref: string
  switchLabel?: string
  switchHref?: string
  nav: NavItem[]
  user: { nome: string; detalhe: string; iniciais: string }
  children: React.ReactNode
}

export function AppShell({
  area,
  switchLabel,
  switchHref,
  nav,
  user: userProp,
  children,
}: AppShellProps) {
  const pathname = usePathname()
  const { user: authUser, isAdmin, logout } = useAuth()

  // Se estiver na área do morador, só pode alternar para admin se for realmente administrador
  const podeAlternar =
    !!switchLabel &&
    !!switchHref &&
    (area === 'Administração' || isAdmin)

  // Prioriza dados reais do contexto de autenticação quando disponíveis
  const nomeExibicao = authUser?.username || userProp.nome
  const detalheExibicao = authUser?.is_staff
    ? 'Administração / Síndico'
    : authUser?.apartamento
    ? `Apto ${authUser.apartamento}`
    : userProp.detalhe

  const iniciaisExibicao = authUser?.username
    ? authUser.username.substring(0, 2).toUpperCase()
    : userProp.iniciais

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Logo />
        </SidebarHeader>
        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupLabel>Área do {area}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((item) => {
                  const active =
                    item.href === pathname ||
                    (item.href !== '/morador' &&
                      item.href !== '/admin' &&
                      pathname.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        render={<Link href={item.href} />}
                      >
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      {item.badge ? (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-2 p-3">
          <SidebarMenu>
            {podeAlternar && switchLabel && switchHref && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={switchLabel}
                  render={<Link href={switchHref} />}
                >
                  <ArrowLeftRight className="size-4" />
                  <span>{switchLabel}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sair da conta"
                onClick={logout}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-4" />
                <span>Sair da conta</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <Separator />
          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {iniciaisExibicao}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-medium">{nomeExibicao}</span>
              <span className="truncate text-xs text-muted-foreground">
                {detalheExibicao}
              </span>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <Badge variant="outline" className="font-medium">
            Área do {area}
          </Badge>
          <span className="ml-auto text-sm text-muted-foreground">
            Residencial Parque das Águas
          </span>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
