import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Criar novo usuario (apenas admin)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
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
    const { nome, email, senha, permissoesIniciais } = body

    if (!nome || !email || !senha) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Criar usuario no Supabase Auth com metadados
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome,
        ...permissoesIniciais
      }
    })

    if (authError) {
      // Se o admin API não estiver disponível, tentar signup normal
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome,
            ...permissoesIniciais
          }
        }
      })

      if (signupError) {
        return NextResponse.json({ error: signupError.message }, { status: 400 })
      }

      // Criar registro na tabela usuarios
      if (signupData.user) {
        await supabase.from('usuarios').insert({
          id: signupData.user.id,
          nome,
          email,
          cargo: permissoesIniciais?.admin ? 'admin' : 
                 permissoesIniciais?.financeiro ? 'financeiro' : 'comum'
        })

        // Criar permissões
        await supabase.from('usuarios_permissoes').insert({
          uid: signupData.user.id,
          financeiro: permissoesIniciais?.financeiro ?? false,
          orcamento: permissoesIniciais?.orcamento ?? true,
          exames: permissoesIniciais?.exames ?? true,
          cronograma: permissoesIniciais?.cronograma ?? true,
          admin: permissoesIniciais?.admin ?? false
        })
      }

      return NextResponse.json({ 
        success: true, 
        user: signupData.user,
        message: 'Usuario criado. Email de confirmacao enviado.' 
      })
    }

    // Se usou admin API, criar registro na tabela usuarios
    if (authData.user) {
      await supabase.from('usuarios').insert({
        id: authData.user.id,
        nome,
        email,
        cargo: permissoesIniciais?.admin ? 'admin' : 
               permissoesIniciais?.financeiro ? 'financeiro' : 'comum'
      })

      // Criar permissões
      await supabase.from('usuarios_permissoes').insert({
        uid: authData.user.id,
        financeiro: permissoesIniciais?.financeiro ?? false,
        orcamento: permissoesIniciais?.orcamento ?? true,
        exames: permissoesIniciais?.exames ?? true,
        cronograma: permissoesIniciais?.cronograma ?? true,
        admin: permissoesIniciais?.admin ?? false
      })
    }

    return NextResponse.json({ success: true, user: authData.user })
  } catch (error) {
    console.error('Erro ao criar usuario:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Listar todos os usuarios (apenas admin)
export async function GET() {
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
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select(`
        *,
        permissoes:usuarios_permissoes(*)
      `)
      .order('nome')

    if (error) throw error

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error('Erro ao listar usuarios:', error)
    return NextResponse.json({ error: 'Erro ao listar usuarios' }, { status: 500 })
  }
}
