import { createClient } from '@/lib/supabase/server'
import { ExamesList } from '@/components/exames/exames-list'
import { ExameForm } from '@/components/exames/exame-form'
import { ExamesSummary } from '@/components/exames/exames-summary'

export default async function ExamesPage() {
  const supabase = await createClient()
  
  const { data: exames } = await supabase
    .from('exames')
    .select('*')
    .order('data', { ascending: false })

  const pendentes = exames?.filter(e => e.status === 'pendente').length || 0
  const concluidos = exames?.filter(e => e.status === 'concluido').length || 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Exames</h1>
          <p className="text-muted-foreground">
            Gerencie os exames dos pacientes
          </p>
        </div>
        <ExameForm />
      </div>

      <ExamesSummary pendentes={pendentes} concluidos={concluidos} />

      <ExamesList exames={exames || []} />
    </div>
  )
}
