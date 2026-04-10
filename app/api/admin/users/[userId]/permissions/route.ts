import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Atualizar permissões de um usuário (apenas admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createClient()
  const { userId } = await params
  
  // Verificar se usuario atual é admin
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
    const { financeiro, orcamento, exames, cronograma, admin } = body

    // Atualizar permissões
    const { error } = await supabase
      .from('usuarios_permissoes')
      .update({
        financeiro,
        orcamento,
        exames,
        cronograma,
        admin,
        updated_at: new Date().toISOString()
      })
      .eq('uid', userId)

    if (error) throw error

    // Atualizar cargo do usuário se necessário
    let cargo = 'comum'
    if (admin) cargo = 'admin'
    else if (financeiro) cargo = 'financeiro'

    await supabase
      .from('usuarios')
      .update({ cargo })
      .eq('id', userId)

    // Registrar log
    await supabase.from('logs').insert({
      tipo: 'info',
      msg: `Permissoes atualizadas para usuario ${userId}`,
      uid: currentUser.id,
      dados: { userId, permissoes: body }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar permissoes:', error)
    return NextResponse.json({ error: 'Erro ao atualizar permissoes' }, { status: 500 })
  }
}

// Buscar permissões de um usuário
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

  // Permitir que o usuário veja suas próprias permissões ou admin veja de qualquer um
  const { data: adminCheck } = await supabase
    .from('usuarios_permissoes')
    .select('admin')
    .eq('uid', currentUser.id)
    .single()

  if (currentUser.id !== userId && !adminCheck?.admin) {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 })
  }

  try {
    const { data, error } = await supabase
      .from('usuarios_permissoes')
      .select('*')
      .eq('uid', userId)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar permissoes:', error)
    return NextResponse.json({ error: 'Erro ao buscar permissoes' }, { status: 500 })
  }
}
