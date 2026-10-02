'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ArrowRight,
  Lock,
  AtSign,
  AlertCircle,
  CreditCard,
  Calendar,
  Home,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { api, ApiError } from '@/lib/api'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()
  const { login } = useAuth()

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setSuccessMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    const formData = new FormData(event.currentTarget)
    const username = (formData.get('username') as string)?.trim()
    const password = formData.get('password') as string

    // Campos exclusivos do cadastro
    const cpf = (formData.get('cpf') as string)?.replace(/\D/g, '') // remove pontuação
    const data_nascimento = formData.get('data_nascimento') as string
    const apartamento = (formData.get('apartamento') as string)?.trim()

    try {
      if (isLogin) {
        const { redirectTo } = await login({ username, password })
        router.push(redirectTo)
      } else {
        // Cadastro de novo morador
        await api.post('/moradores/', {
          username,
          password,
          cpf: cpf || undefined,
          data_nascimento,
          apartamento,
        }, { skipAuth: true })

        setSuccessMessage('Cadastro realizado com sucesso! Faça login com suas credenciais.')
        setIsLogin(true)
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(err.message || 'Ocorreu um erro ao processar sua solicitação.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col bg-gradient-to-b from-secondary/60 via-background to-background">
      {/* Header com Logo e Acesso à Área da Administração */}
      <header className="w-full border-b bg-card/60 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin" />}
            className="gap-2 font-medium border-primary/20 hover:border-primary/40 hover:bg-primary/5"
          >
            <ShieldCheck className="size-4 text-primary" />
            <span>Área da Administração</span>
          </Button>
        </div>
      </header>

      {/* Conteúdo Centralizado de Login / Cadastro */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg transition-all">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="font-display text-2xl font-bold tracking-tight">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? 'Insira suas credenciais para acessar o Seu Síndico'
              : 'Preencha os dados abaixo para se cadastrar na plataforma'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0" />
                <p>{successMessage}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="seu_usuario"
                  className="pl-9"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                />
              </div>
            </div>

            {/* Campos exibidos apenas no Cadastro */}
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="cpf"
                      name="cpf"
                      placeholder="000.000.000-00"
                      className="pl-9"
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Nascimento</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="data_nascimento"
                        name="data_nascimento"
                        type="date"
                        className="pl-9"
                        required={!isLogin}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apartamento">Apartamento</Label>
                    <div className="relative">
                      <Home className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="apartamento"
                        name="apartamento"
                        placeholder="Ex: 101A"
                        className="pl-9"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {isLogin && (
                  <Link
                    href="/recuperar-senha"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button
              className="mt-4 w-full"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                'Carregando...'
              ) : (
                <>
                  {isLogin ? 'Entrar' : 'Cadastrar'}
                  <ArrowRight data-icon="inline-end" className="ml-2 size-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 mt-2">
          <p className="text-sm text-muted-foreground">
            {isLogin ? 'Ainda não tem uma conta? ' : 'Já possui uma conta? '}
            <button
              type="button"
              onClick={toggleAuthMode}
              className="font-medium text-primary hover:underline"
              disabled={isLoading}
            >
              {isLogin ? 'Cadastre-se' : 'Faça login'}
            </button>
          </p>
        </CardFooter>
      </Card>
      </main>
    </div>
  )
}