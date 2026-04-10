import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Atualizar dados de um usuário (apenas admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()
  const { userId } = await params
  
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
    const { nome } = body

    const { error } = await supabase
      .from('usuarios')
      .update({ nome, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar usuario:', error)
    return NextResponse.json({ error: 'Erro ao atualizar usuario' }, { status: 500 })
  }
}

// Deletar usuário (apenas admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()
  const { userId } = await params
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  // Não permitir auto-exclusão
  if (currentUser.id === userId) {
    return NextResponse.json({ error: 'Nao pode excluir a si mesmo' }, { status: 400 })
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
    // Buscar dados do usuario antes de deletar (para log)
    const { data: userToDelete } = await supabase
      .from('usuarios')
      .select('email, nome')
      .eq('id', userId)
      .single()

    // Deletar permissões primeiro (FK cascade deve cuidar disso, mas vamos ser explícitos)
    await supabase
      .from('usuarios_permissoes')
      .delete()
      .eq('uid', userId)

    // Deletar da tabela usuarios
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', userId)

    if (error) throw error

    // Tentar deletar do auth (pode requerer admin API)
    try {
      await supabase.auth.admin.deleteUser(userId)
    } catch {
      // Se não tiver permissão de admin API, o usuário ficará apenas desativado
      console.log('Nao foi possivel deletar do auth.users - pode requerer admin API')
    }

    // Registrar log
    await supabase.from('logs').insert({
      tipo: 'warning',
      msg: `Usuario removido: ${userToDelete?.email || userId}`,
      uid: currentUser.id,
      dados: { userId, email: userToDelete?.email, nome: userToDelete?.nome }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar usuario:', error)
    return NextResponse.json({ error: 'Erro ao deletar usuario' }, { status: 500 })
  }
}

// Buscar dados de um usuário
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()
  const { userId } = await params
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        permissoes:usuarios_permissoes(*)
      `)
      .eq('id', userId)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar usuario:', error)
    return NextResponse.json({ error: 'Erro ao buscar usuario' }, { status: 500 })
  }
}
