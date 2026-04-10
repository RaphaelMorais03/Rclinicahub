'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Heart, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Detectar sessão ativa e redirecionar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      } else {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [supabase, router])

  const getErrorMessage = (errorMessage: string): string => {
    if (errorMessage.includes('Invalid login credentials')) {
      return 'E-mail ou senha incorretos. Verifique suas credenciais.'
    }
    if (errorMessage.includes('Email not confirmed')) {
      return 'E-mail nao confirmado. Verifique sua caixa de entrada.'
    }
    if (errorMessage.includes('Too many requests') || errorMessage.includes('rate limit')) {
      return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
    }
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Erro de conexao. Verifique sua internet e tente novamente.'
    }
    if (errorMessage.includes('User not found')) {
      return 'Usuario nao encontrado. Verifique o e-mail digitado.'
    }
    return 'Ocorreu um erro ao fazer login. Tente novamente.'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
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
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
      setError(getErrorMessage(errorMsg))
    } finally {
      setIsLoading(false)
    }
  }

  // Tela de carregamento enquanto verifica sessão
  if (checkingSession) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Verificando sessao...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo e marca */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent">
            <Heart className="h-10 w-10 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary">Amor Saude</h1>
          <p className="mt-1 text-lg text-muted-foreground">Portal Interno - Pirituba</p>
        </div>

        {/* Card do formulário */}
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-card-foreground">Entrar no Sistema</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
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
                    disabled={isLoading}
                  />
                </div>
              </Field>
              
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
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
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </FieldGroup>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sistema exclusivo para colaboradores da clinica.
        </p>
      </div>
    </div>
  )
}
