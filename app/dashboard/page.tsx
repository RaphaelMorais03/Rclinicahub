'use client'
import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentAtendimentos } from '@/components/dashboard/recent-atendimentos'
import { NpsChart } from '@/components/dashboard/nps-chart'
import { ExamesPendentes } from '@/components/dashboard/exames-pendentes'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Buscar dados para o dashboard
  const { data: atendimentos } = await supabase
    .from('atendimentos')
    .select('*')
    .order('data', { ascending: false })
    .limit(10)

  const { data: examesPendentes } = await supabase
    .from('exames')
    .select('*')
    .eq('status', 'pendente')
    .order('data', { ascending: true })
    .limit(5)

  const { data: financeiro } = await supabase
    .from('financeiro')
    .select('*')

  // Calcular estatísticas
  const totalAtendimentos = atendimentos?.length || 0
  const npsMedia = atendimentos?.length 
    ? atendimentos.filter(a => a.nps !== null).reduce((acc, a) => acc + (a.nps || 0), 0) / 
      atendimentos.filter(a => a.nps !== null).length || 0
    : 0
  
  const entradas = financeiro?.filter(f => f.tipo === 'entrada').reduce((acc, f) => acc + Number(f.valor), 0) || 0
  const saidas = financeiro?.filter(f => f.tipo === 'saida').reduce((acc, f) => acc + Number(f.valor), 0) || 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Vis&atilde;o geral da cl&iacute;nica
        </p>
      </div>

      <DashboardStats
        totalAtendimentos={totalAtendimentos}
        npsMedia={npsMedia}
        entradas={entradas}
        saidas={saidas}
        examesPendentes={examesPendentes?.length || 0}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentAtendimentos atendimentos={atendimentos || []} />
        <NpsChart atendimentos={atendimentos || []} />
      </div>

      <ExamesPendentes exames={examesPendentes || []} />
    </div>
  )
}
