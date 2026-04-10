'use client'

import { createClient } from '@/lib/supabase/client'
import { Usuario } from '@/lib/types'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setUsuario(usuarioData)
      }

      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const { data: usuarioData } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setUsuario(usuarioData)
        } else {
          setUsuario(null)
        }

        if (event === 'SIGNED_OUT') {
          router.push('/auth/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const isAdmin = usuario?.cargo === 'admin'
  const isFinanceiro = usuario?.cargo === 'financeiro' || usuario?.cargo === 'admin'

  return {
    user,
    usuario,
    loading,
    signOut,
    isAdmin,
    isFinanceiro,
  }
}
