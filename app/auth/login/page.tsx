'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const supabase = createClient()

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
      return 'E-mail ou senha incorretos.'
    }
    if (errorMessage.includes('Email not confirmed')) {
      return 'E-mail nao confirmado. Verifique sua caixa de entrada.'
    }
    if (errorMessage.includes('Too many requests') || errorMessage.includes('rate limit')) {
      return 'Muitas tentativas. Aguarde alguns minutos.'
    }
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Erro de conexao. Tente novamente.'
    }
    return 'Ocorreu um erro ao fazer login. Tente novamente.'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!email.trim()) {
      setError('Informe o e-mail.')
      return
    }
    if (!password) {
      setError('Informe a senha.')
      return
    }

    setIsLoading(true)

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

  if (checkingSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A1F44]" />
          <p className="text-[#94a3b8]">Verificando sessao...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-4">
      <div className="w-full max-w-[380px]">
        {/* Logo e marca */}
        <div className="mb-8">
          <h1 className="text-[28px] font-black tracking-tight text-[#0A1F44] mb-1">
            Amor Saude
          </h1>
          <p className="text-[13px] text-[#94a3b8]">Portal Interno - Pirituba</p>
        </div>

        {/* Tag */}
        <div className="text-[10px] font-extrabold tracking-[1.5px] uppercase text-[#C62828] mb-2.5">
          Acesso ao sistema
        </div>
        
        {/* Título */}
        <h2 className="text-[28px] font-black tracking-tight text-[#0A1F44] mb-1.5">
          Entrar no Portal
        </h2>
        <p className="text-[13px] text-[#94a3b8] mb-8">
          Use seu e-mail e senha para acessar
        </p>

        <form onSubmit={handleLogin}>
          {/* Campo E-mail */}
          <div className="mb-4">
            <label className="block text-[11px] font-bold tracking-[0.7px] uppercase text-[#64748b] mb-2">
              E-mail
            </label>
            <div 
              className={`flex items-center border-[1.5px] rounded-xl bg-[#f8fafc] transition-all duration-200 ${
                error ? 'border-[#C62828] shadow-[0_0_0_3px_rgba(198,40,40,0.08)]' : 'border-[#e2e8f0] focus-within:border-[#0A1F44] focus-within:shadow-[0_0_0_3px_rgba(10,31,68,0.08)] focus-within:bg-white'
              }`}
            >
              <span className="px-3.5 text-[#94a3b8]">
                <Mail className="h-3.5 w-3.5" />
              </span>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="flex-1 py-3.5 pr-3.5 bg-transparent text-[14px] text-[#1e293b] placeholder:text-[#cbd5e1] outline-none"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div className="mb-4">
            <label className="block text-[11px] font-bold tracking-[0.7px] uppercase text-[#64748b] mb-2">
              Senha
            </label>
            <div 
              className={`flex items-center border-[1.5px] rounded-xl bg-[#f8fafc] transition-all duration-200 ${
                error ? 'border-[#C62828] shadow-[0_0_0_3px_rgba(198,40,40,0.08)]' : 'border-[#e2e8f0] focus-within:border-[#0A1F44] focus-within:shadow-[0_0_0_3px_rgba(10,31,68,0.08)] focus-within:bg-white'
              }`}
            >
              <span className="px-3.5 text-[#94a3b8]">
                <Lock className="h-3.5 w-3.5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="flex-1 py-3.5 bg-transparent text-[14px] text-[#1e293b] placeholder:text-[#cbd5e1] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-3.5 text-[#94a3b8] hover:text-[#0A1F44] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="flex items-center gap-2 bg-[#fff5f5] border border-[#fecaca] rounded-xl px-3.5 py-3 mb-4.5 animate-shake">
              <AlertCircle className="h-4 w-4 text-[#C62828] flex-shrink-0" />
              <span className="text-[13px] font-medium text-[#C62828]">{error}</span>
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#0A1F44] text-white rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_18px_rgba(10,31,68,0.26)] hover:bg-[#122b5e] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Autenticando...
              </>
            ) : (
              'Entrar no Portal'
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        .animate-shake {
          animation: shake 0.38s ease;
        }
      `}</style>
    </div>
  )
}
