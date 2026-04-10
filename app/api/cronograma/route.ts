import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Buscar cronograma semanal (leitura pública)
export async function GET() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('crono_agenda')
      .select('*')
      .order('dia')
      .order('sala')
      .order('turno')

    if (error) throw error

    // Organizar por dia
    const cronogramaPorDia = {
      Segunda: [] as typeof data,
      Terca: [] as typeof data,
      Quarta: [] as typeof data,
      Quinta: [] as typeof data,
      Sexta: [] as typeof data,
      Sabado: [] as typeof data,
    }

    data?.forEach(item => {
      if (cronogramaPorDia[item.dia as keyof typeof cronogramaPorDia]) {
        cronogramaPorDia[item.dia as keyof typeof cronogramaPorDia].push(item)
      }
    })

    return NextResponse.json(cronogramaPorDia)
  } catch (error) {
    console.error('Erro ao buscar cronograma:', error)
    return NextResponse.json({ error: 'Erro ao buscar cronograma' }, { status: 500 })
  }
}

// Salvar cronograma semanal (requer autenticação)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { cronograma } = body

    if (!cronograma || typeof cronograma !== 'object') {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 })
    }

    // Deletar cronograma existente
    const { error: deleteError } = await supabase
      .from('crono_agenda')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) throw deleteError

    // Inserir novo cronograma
    const itens: Array<{
      dia: string
      sala: string
      medico: string | null
      especialidade: string | null
      turno: string
    }> = []

    for (const [dia, entradas] of Object.entries(cronograma)) {
      if (Array.isArray(entradas)) {
        for (const entrada of entradas) {
          itens.push({
            dia,
            sala: entrada.sala,
            medico: entrada.medico || null,
            especialidade: entrada.especialidade || null,
            turno: entrada.turno || 'Manha'
          })
        }
      }
    }

    if (itens.length > 0) {
      const { error: insertError } = await supabase
        .from('crono_agenda')
        .insert(itens)

      if (insertError) throw insertError
    }

    // Registrar log
    await supabase.from('logs').insert({
      tipo: 'success',
      msg: 'Cronograma semanal atualizado',
      uid: currentUser.id,
      dados: { totalItens: itens.length }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Cronograma salvo com sucesso',
      totalItens: itens.length
    })
  } catch (error) {
    console.error('Erro ao salvar cronograma:', error)
    return NextResponse.json({ error: 'Erro ao salvar cronograma' }, { status: 500 })
  }
}
