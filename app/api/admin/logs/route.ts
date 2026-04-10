import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Listar logs de auditoria (apenas admin)
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('logs')
      .select(`
        *,
        usuario:usuarios(nome, email)
      `, { count: 'exact' })
      .order('ts', { ascending: false })
      .range(offset, offset + limit - 1)

    if (tipo) {
      query = query.eq('tipo', tipo)
    }

    if (dataInicio) {
      query = query.gte('ts', dataInicio)
    }

    if (dataFim) {
      query = query.lte('ts', dataFim)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ logs: data, total: count })
  } catch (error) {
    console.error('Erro ao listar logs:', error)
    return NextResponse.json({ error: 'Erro ao listar logs' }, { status: 500 })
  }
}

// Limpar logs antigos (apenas admin - logs com mais de 30 dias)
export async function DELETE(request: NextRequest) {
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
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - 30)

    const { error, count } = await supabase
      .from('logs')
      .delete({ count: 'exact' })
      .lt('ts', dataLimite.toISOString())

    if (error) throw error

    // Registrar a limpeza
    await supabase.from('logs').insert({
      tipo: 'info',
      msg: `Limpeza de logs: ${count} registros removidos (mais de 30 dias)`,
      uid: currentUser.id,
      dados: { quantidade: count }
    })

    return NextResponse.json({ 
      success: true, 
      message: `${count} logs removidos` 
    })
  } catch (error) {
    console.error('Erro ao limpar logs:', error)
    return NextResponse.json({ error: 'Erro ao limpar logs' }, { status: 500 })
  }
}
