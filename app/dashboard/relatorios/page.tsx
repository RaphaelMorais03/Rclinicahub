import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RelatoriosCharts } from '@/components/relatorios/relatorios-charts'

export default async function RelatoriosPage() {
  const supabase = await createClient()

  // Verificar se usuário tem permissão
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('cargo')
    .eq('id', user.id)
    .single()

  if (!usuario || (usuario.cargo !== 'admin' && usuario.cargo !== 'financeiro')) {
    redirect('/dashboard')
  }

  // Buscar dados para relatórios
  const { data: atendimentos } = await supabase
    .from('atendimentos')
    .select('*')
    .order('data', { ascending: true })

  const { data: financeiro } = await supabase
    .from('financeiro')
    .select('*')
    .order('data', { ascending: true })

  const { data: exames } = await supabase
    .from('exames')
    .select('*')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Relat&oacute;rios</h1>
        <p className="text-muted-foreground">
          An&aacute;lise de dados e m&eacute;tricas da cl&iacute;nica
        </p>
      </div>

      <RelatoriosCharts 
        atendimentos={atendimentos || []} 
        financeiro={financeiro || []} 
        exames={exames || []}
      />
    </div>
  )
}
