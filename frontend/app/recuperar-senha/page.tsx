import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react'

export default function RecuperarSenhaPage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-gradient-to-b from-secondary/60 via-background to-background p-6">
      <div className="mb-8">
        <Logo />
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-6" />
          </div>
          <CardTitle className="font-display text-2xl font-bold tracking-tight">
            Recuperação de Acesso
          </CardTitle>
          <CardDescription>
            Como redefinir sua senha no Seu Síndico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3.5">
            <ShieldCheck className="size-5 shrink-0 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Segurança Condominial</p>
              <p className="text-xs leading-relaxed">
                Por motivos de segurança e controle de acesso às unidades e veículos do condomínio, a alteração e redefinição de senhas de moradores é realizada diretamente junto à portaria ou administração.
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed">
            Se você esqueceu sua senha, solicite ao síndico ou à administração a atualização do seu cadastro. Após a alteração, você poderá acessar normalmente com seu nome de usuário.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t p-4">
          <Button
            className="w-full"
            variant="outline"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            <ArrowLeft className="mr-2 size-4" />
            Voltar para o Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
