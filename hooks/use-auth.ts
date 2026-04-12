'use client'

import { createClient } from '@/lib/supabase/client'
import { Usuario, UsuarioPermissoes } from '@/lib/types'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

export interface AuthState {
  user: User | null
  usuario: Usuario | null
  permissoes: UsuarioPermissoes | null
  loading: boolean
  signOut: () => Promise<void>
  isAdmin: boolean
  isFinanceiro: boolean
  canAccessOrcamentos: boolean
  canAccessExames: boolean
  canAccessCronograma: boolean
  primeiroNome: string
  refreshPermissoes: () => Promise<void>
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [permissoes, setPermissoes] = useState<UsuarioPermissoes | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchUserData = useCallback(async (authUser: User) => {
    try {
      // Buscar dados do usuário
      const { data: usuarioData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      setUsuario(usuarioData)

      // Buscar permissões
      const { data: permissoesData, error: permError } = await supabase
        .from('usuarios_permissoes')
        .select('*')
        .eq('uid', authUser.id)
        .single()
      
      setPermissoes(permissoesData)

      // Atualizar último acesso (ignorar erros)
      try {
        await supabase.rpc('update_ultimo_acesso', { user_uid: authUser.id })
      } catch {
        // Ignorar erro de RPC
      }
    } catch {
      // Ignorar erros
    }
  }, [supabase])

  const refreshPermissoes = useCallback(async () => {
    if (user) {
      const { data: permissoesData } = await supabase
        .from('usuarios_permissoes')
        .select('*')
        .eq('uid', user.id)
        .single()
      
      setPermissoes(permissoesData)
    }
  }, [user, supabase])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await fetchUserData(user)
      }

      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserData(session.user)
        } else {
          setUsuario(null)
          setPermissoes(null)
        }

        if (event === 'SIGNED_OUT') {
          router.push('/auth/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router, fetchUserData])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Todos os módulos liberados para todos os usuários autenticados
  const isAdmin = true
  const isFinanceiro = true
  const canAccessOrcamentos = true
  const canAccessExames = true
  const canAccessCronograma = true

  // Extrair primeiro nome
  const primeiroNome = usuario?.nome?.split(' ')[0] || ''

  return {
    user,
    usuario,
    permissoes,
    loading,
    signOut,
    isAdmin,
    isFinanceiro,
    canAccessOrcamentos,
    canAccessExames,
    canAccessCronograma,
    primeiroNome,
    refreshPermissoes,
  }
}
