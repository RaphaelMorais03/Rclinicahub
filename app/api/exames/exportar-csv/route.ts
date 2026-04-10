import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Exportar histórico de exames retirados como CSV
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  try {
    // Buscar todos os exames retirados
    const { data: exames, error } = await supabase
      .from('exames_retirados')
      .select('*')
      .order('retirado_em', { ascending: false })

    if (error) throw error

    // Gerar CSV
    const headers = [
      'Paciente',
      'Tipo de Exame',
      'Data do Exame',
      'Quem Retirou',
      'Atendente',
      'Data de Retirada'
    ]

    const rows = exames?.map(exame => [
      exame.paciente,
      exame.tipo,
      exame.data_exame || '',
      exame.quem_retirou || '',
      exame.atendente_entregou || '',
      exame.retirado_em ? new Date(exame.retirado_em).toLocaleString('pt-BR') : ''
    ]) || []

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    // Adicionar BOM para UTF-8
    const bom = '\ufeff'

    return new NextResponse(bom + csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="historico_exames_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Erro ao exportar CSV:', error)
    return NextResponse.json({ error: 'Erro ao exportar CSV' }, { status: 500 })
  }
}
