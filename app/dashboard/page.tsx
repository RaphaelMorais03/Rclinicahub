import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Package, 
  Calculator, 
  ClipboardList, 
  Receipt,
  TrendingUp,
  Heart
} from 'lucide-react'
import Link from 'next/link'

async function getDashboardData() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const [gavetaRes, cronogramaRes, caixaRes] = await Promise.all([
    supabase.from('gaveta_exames').select('*').eq('status', 'pendente'),
    supabase.from('cronograma').select('*').eq('data', today),
    supabase.from('caixa').select('*').eq('data', today).single()
  ])
  
  return {
    examesPendentes: gavetaRes.data?.length || 0,
    salasHoje: cronogramaRes.data?.length || 0,
    salasConfirmadas: cronogramaRes.data?.filter(c => c.status === 'pronto').length || 0,
    caixaHoje: caixaRes.data ? (caixaRes.data.dinheiro || 0) + (caixaRes.data.pix || 0) + (caixaRes.data.cartao || 0) : 0
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardData()

  const modules = [
    {
      title: 'Orcamentos',
      description: 'Monte orcamentos de exames com preparos',
      icon: Calculator,
      href: '/dashboard/orcamentos',
      color: 'bg-blue-500'
    },
    {
      title: 'Cronograma',
      description: 'Agenda diaria por sala',
      icon: Calendar,
      href: '/dashboard/cronograma',
      color: 'bg-purple-500',
      badge: stats.salasConfirmadas > 0 ? `${stats.salasConfirmadas}/${stats.salasHoje} prontas` : null
    },
    {
      title: 'Retirada de Exames',
      description: 'Gaveta digital de exames',
      icon: Package,
      href: '/dashboard/gaveta',
      color: 'bg-amber-500',
      badge: stats.examesPendentes > 0 ? `${stats.examesPendentes} pendentes` : null
    },
    {
      title: 'Fechamento Medico',
      description: 'Calculo de repasses com impostos',
      icon: ClipboardList,
      href: '/dashboard/fechamento',
      color: 'bg-green-500'
    },
    {
      title: 'Recibos',
      description: 'Geracao de recibos em lote',
      icon: Receipt,
      href: '/dashboard/recibos',
      color: 'bg-rose-500'
    }
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
          <Heart className="h-8 w-8 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Amor Saude Pirituba</h1>
          <p className="text-muted-foreground">Sistema de Gestao Integrado</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Package className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Exames Pendentes</p>
              <p className="text-2xl font-bold">{stats.examesPendentes}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Salas Hoje</p>
              <p className="text-2xl font-bold">{stats.salasConfirmadas}/{stats.salasHoje}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Caixa Hoje</p>
              <p className="text-2xl font-bold">R$ {stats.caixaHoje.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Modulos do Sistema</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link key={module.title} href={module.href}>
              <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${module.color}`}>
                      <module.icon className="h-6 w-6 text-white" />
                    </div>
                    {module.badge && (
                      <Badge variant="secondary">{module.badge}</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-4">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Info */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Bem-vindo ao Sistema</h3>
              <p className="text-primary-foreground/80">
                Selecione um modulo acima para comecar. Use o menu lateral para navegar entre as funcionalidades.
              </p>
            </div>
            <Heart className="h-12 w-12 text-accent" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
