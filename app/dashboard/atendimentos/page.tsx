import { createClient } from '@/lib/supabase/server'
import { AtendimentosList } from '@/components/atendimentos/atendimentos-list'
import { AtendimentoForm } from '@/components/atendimentos/atendimento-form'

export default async function AtendimentosPage() {
  const supabase = await createClient()
  
  const { data: atendimentos } = await supabase
    .from('atendimentos')
    .select('*')
    .order('data', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Atendimentos</h1>
          <p className="text-muted-foreground">
            Gerencie os atendimentos da cl&iacute;nica
          </p>
        </div>
        <AtendimentoForm />
      </div>

      <AtendimentosList atendimentos={atendimentos || []} />
    </div>
  )
}
