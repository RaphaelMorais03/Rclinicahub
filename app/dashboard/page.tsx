'use client'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Calendar, 
  Package, 
  Calculator, 
  ClipboardList, 
  Receipt,
  TrendingUp,
  Heart,
  Settings,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface DashboardStats {
  examesPendentes: number
  salasHoje: number
  salasConfirmadas: number
  caixaHoje: number
}

export default function DashboardPage() {
  const { usuario, permissoes, loading, primeiroNome, isAdmin, isFinanceiro, canAccessOrcamentos, canAccessExames, canAccessCronograma } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [transitionOut, setTransitionOut] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      
      const [gavetaRes, cronogramaRes, caixaRes] = await Promise.all([
        supabase.from('gaveta_exames').select('*').eq('status', 'pendente'),
        supabase.from('cronograma').select('*').eq('data', today),
        supabase.from('operacao_caixa').select('*').eq('data', today).single()
      ])
      
      setStats({
        examesPendentes: gavetaRes.data?.length || 0,
        salasHoje: cronogramaRes.data?.length || 0,
        salasConfirmadas: cronogramaRes.data?.filter(c => c.status === 'pronto').length || 0,
        caixaHoje: caixaRes.data ? (caixaRes.data.entradas || 0) - (caixaRes.data.saidas || 0) : 0
      })
      setLoadingStats(false)
    }

    if (!loading && usuario) {
      fetchStats()
    }
  }, [loading, usuario])

  const handleModuleClick = () => {
    setTransitionOut(true)
  }

  // Definir módulos com base nas permissões
  const allModules = [
    {
      key: 'orcamentos',
      title: 'Orcamentos',
      description: 'Monte orcamentos de exames com preparos',
      icon: Calculator,
      href: '/dashboard/orcamentos',
      color: 'bg-blue-500',
      canAccess: canAccessOrcamentos
    },
    {
      key: 'cronograma',
      title: 'Cronograma',
      description: 'Agenda diaria por sala e checklist',
      icon: Calendar,
      href: '/dashboard/cronograma',
      color: 'bg-purple-500',
      badge: stats?.salasConfirmadas !== undefined && stats.salasHoje > 0 ? `${stats.salasConfirmadas}/${stats.salasHoje} prontas` : null,
      canAccess: canAccessCronograma
    },
    {
      key: 'exames',
      title: 'Retirada de Exames',
      description: 'Gaveta digital de exames',
      icon: Package,
      href: '/dashboard/gaveta',
      color: 'bg-amber-500',
      badge: stats?.examesPendentes ? `${stats.examesPendentes} pendentes` : null,
      canAccess: canAccessExames
    },
    {
      key: 'fechamento',
      title: 'Fechamento Medico',
      description: 'Calculo de repasses com impostos',
      icon: ClipboardList,
      href: '/dashboard/fechamento',
      color: 'bg-green-500',
      canAccess: isFinanceiro
    },
    {
      key: 'recibos',
      title: 'Recibos',
      description: 'Geracao de recibos em lote',
      icon: Receipt,
      href: '/dashboard/recibos',
      color: 'bg-rose-500',
      canAccess: isFinanceiro
    },
    {
      key: 'admin',
      title: 'Administracao',
      description: 'Usuarios, atendentes e configuracoes',
      icon: Settings,
      href: '/dashboard/admin',
      color: 'bg-slate-700',
      canAccess: isAdmin
    }
  ]

  const modules = allModules.filter(m => m.canAccess)

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <>
      {/* Overlay de transição */}
      {transitionOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 transition-opacity">
          <Loader2 className="h-12 w-12 animate-spin text-accent" />
        </div>
      )}

      <div className="flex flex-col gap-6 p-6">
        {/* Header com saudação */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <Heart className="h-8 w-8 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Ola, {primeiroNome || 'Usuario'}!
            </h1>
            <p className="text-muted-foreground">Amor Saude Pirituba - Portal Interno</p>
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
                {loadingStats ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.examesPendentes || 0}</p>
                )}
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
                {loadingStats ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.salasConfirmadas || 0}/{stats?.salasHoje || 0}</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {isFinanceiro && (
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Caixa</p>
                  {loadingStats ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">R$ {(stats?.caixaHoje || 0).toFixed(2)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modules Grid */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Seus Modulos</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Link key={module.key} href={module.href} onClick={handleModuleClick}>
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
                  {modules.length === 0 
                    ? 'Voce nao tem acesso a nenhum modulo. Contate o administrador.'
                    : 'Selecione um modulo acima para comecar. Use o menu lateral para navegar entre as funcionalidades.'}
                </p>
              </div>
              <Heart className="h-12 w-12 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
