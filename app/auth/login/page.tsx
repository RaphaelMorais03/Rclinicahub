'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Heart, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ocorreu um erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full">
      {/* Lado esquerdo - Branding */}
      <div className="hidden w-1/2 flex-col items-center justify-center bg-primary p-12 lg:flex">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-accent">
            <Heart className="h-12 w-12 text-accent-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground">Amor Saude</h1>
          <p className="mt-2 text-xl text-primary-foreground/80">Pirituba</p>
          <p className="mt-8 max-w-md text-primary-foreground/70">
            Sistema integrado de gestao para clinicas. Controle seus atendimentos, 
            financeiro e exames em um so lugar.
          </p>
        </div>
      </div>

      {/* Lado direito - Formulário */}
      <div className="flex w-full flex-col items-center justify-center bg-background p-8 lg:w-1/2">
        {/* Logo mobile */}
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <Heart className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Amor Saude</h1>
          <p className="text-muted-foreground">Pirituba</p>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground">Bem-vindo</h2>
            <p className="mt-2 text-muted-foreground">
              Faca login para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </Field>
              
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </Field>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90" 
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </FieldGroup>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Ainda nao tem conta?{' '}
            <Link
              href="/auth/sign-up"
              className="font-medium text-accent underline underline-offset-4 hover:text-accent/80"
            >
              Cadastre-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
