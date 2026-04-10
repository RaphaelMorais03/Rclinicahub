import { createClient } from '@/lib/supabase/server'
import { FinanceiroList } from '@/components/financeiro/financeiro-list'
import { FinanceiroForm } from '@/components/financeiro/financeiro-form'
import { FinanceiroSummary } from '@/components/financeiro/financeiro-summary'
import { redirect } from 'next/navigation'

export default async function FinanceiroPage() {
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
  
  const { data: financeiro } = await supabase
    .from('financeiro')
    .select('*')
    .order('data', { ascending: false })

  const entradas = financeiro?.filter(f => f.tipo === 'entrada').reduce((acc, f) => acc + Number(f.valor), 0) || 0
  const saidas = financeiro?.filter(f => f.tipo === 'saida').reduce((acc, f) => acc + Number(f.valor), 0) || 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie as entradas e sa&iacute;das financeiras
          </p>
        </div>
        <FinanceiroForm />
      </div>

      <FinanceiroSummary entradas={entradas} saidas={saidas} />

      <FinanceiroList financeiro={financeiro || []} />
    </div>
  )
}
