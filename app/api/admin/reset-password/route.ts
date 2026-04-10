import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Enviar email de redefinição de senha (apenas admin)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const { data: permissoes } = await supabase
    .from('usuarios_permissoes')
    .select('admin')
    .eq('uid', currentUser.id)
    .single()

  if (!permissoes?.admin) {
    return NextResponse.json({ error: 'Sem permissao de admin' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatorio' }, { status: 400 })
    }

    // Enviar email de redefinição
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`
    })

    if (error) throw error

    // Registrar log
    await supabase.from('logs').insert({
      tipo: 'info',
      msg: `Email de redefinicao enviado para: ${email}`,
      uid: currentUser.id,
      dados: { email }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Email de redefinicao enviado com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao enviar email de redefinicao:', error)
    return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 })
  }
}
