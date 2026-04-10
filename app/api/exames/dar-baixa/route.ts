import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Dar baixa em exame (mover de pendente para retirado)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { exameId, quemRetirou, atendenteEntregou } = body

    if (!exameId || !atendenteEntregou) {
      return NextResponse.json({ 
        error: 'ID do exame e atendente sao obrigatorios' 
      }, { status: 400 })
    }

    // Buscar dados do exame pendente
    const { data: examePendente, error: fetchError } = await supabase
      .from('gaveta_exames')
      .select('*')
      .eq('id', exameId)
      .eq('status', 'pendente')
      .single()

    if (fetchError || !examePendente) {
      return NextResponse.json({ 
        error: 'Exame nao encontrado ou ja retirado' 
      }, { status: 404 })
    }

    // Inserir no histórico de retirados
    const { error: insertError } = await supabase
      .from('exames_retirados')
      .insert({
        paciente: examePendente.paciente,
        tipo: examePendente.tipo_exame,
        data_exame: examePendente.data_exame,
        quem_retirou: quemRetirou || 'Proprio paciente',
        atendente_entregou: atendenteEntregou
      })

    if (insertError) throw insertError

    // Atualizar status do exame para retirado na gaveta
    const { error: updateError } = await supabase
      .from('gaveta_exames')
      .update({
        status: 'retirado',
        quem_retirou: quemRetirou || 'Proprio paciente',
        atendente_entrega: atendenteEntregou,
        data_retirada: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', exameId)

    if (updateError) throw updateError

    // Registrar log
    await supabase.from('logs').insert({
      tipo: 'success',
      msg: `Exame retirado: ${examePendente.paciente} - ${examePendente.tipo_exame}`,
      uid: currentUser.id,
      dados: { 
        paciente: examePendente.paciente, 
        tipo: examePendente.tipo_exame,
        atendente: atendenteEntregou
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Baixa registrada com sucesso' 
    })
  } catch (error) {
    console.error('Erro ao dar baixa no exame:', error)
    return NextResponse.json({ error: 'Erro ao dar baixa no exame' }, { status: 500 })
  }
}
