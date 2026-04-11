'use client'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { 
  Loader2, 
  Calculator, 
  FileText, 
  Package, 
  Calendar,
  DollarSign,
  Shield,
  ArrowRight,
  LogOut,
  User
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  examesPendentes: number
  salasHoje: number
  salasConfirmadas: number
}

export default function DashboardPage() {
  const { usuario, loading, primeiroNome, isAdmin, isFinanceiro, canAccessOrcamentos, canAccessExames, canAccessCronograma } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [transitionTo, setTransitionTo] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split('T')[0]
      
      const [gavetaRes, cronogramaRes] = await Promise.all([
        supabase.from('gaveta_exames').select('*').eq('status', 'pendente'),
        supabase.from('cronograma').select('*').eq('data', today)
      ])
      
      setStats({
        examesPendentes: gavetaRes.data?.length || 0,
        salasHoje: cronogramaRes.data?.length || 0,
        salasConfirmadas: cronogramaRes.data?.filter(c => c.status === 'pronto').length || 0
      })
      setLoadingStats(false)
    }

    if (!loading && usuario) {
      fetchStats()
    }
  }, [loading, usuario, supabase])

  const handleModuleClick = (href: string, name: string) => {
    setTransitionTo(name)
    setTimeout(() => {
      router.push(href)
    }, 900)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const modules = [
    {
      key: 'orcamentos',
      title: 'Orcamentos',
      description: 'Consulte exames, valores, parceiros e preparos. Gere mensagens para WhatsApp.',
      href: '/dashboard/orcamentos',
    },
    {
      key: 'fechamento',
      title: 'Fechamento Medico',
      description: 'Calculo de repasse, impostos PJ e geracao de recibo consolidado para impressao.',
      href: '/dashboard/fechamento',
    },
    {
      key: 'financeiro',
      title: 'Financeiro',
      description: 'Geracao de recibos em lote para colaboradores. Cadastro e controle de equipe.',
      href: '/dashboard/recibos',
    },
    {
      key: 'exames',
      title: 'Retirada de Exames',
      description: 'Gaveta digital de exames. Cadastre, de baixa e consulte o historico completo.',
      href: '/dashboard/gaveta',
    },
    {
      key: 'cronograma',
      title: 'Cronograma',
      description: 'Agenda diaria por sala, checklist de abertura, notas e controle de caixa.',
      href: '/dashboard/cronograma',
      icon: Calendar,
      specialBg: 'bg-[#1d4ed8]',
    },
    {
      key: 'admin',
      title: 'Painel Admin',
      description: 'Gerenciar usuarios, clinica, atendentes e permissoes de acesso.',
      href: '/dashboard/admin',
      icon: Shield,
      specialBg: 'bg-[#92400e]',
      specialStyle: 'border-[#fde68a] bg-[#fffbeb]',
      titleColor: 'text-[#92400e]',
      arrowColor: 'text-[#92400e]',
    }
  ]

  const visibleModules = modules

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A1F44]" />
      </div>
    )
  }

  return (
    <>
      {/* Overlay de transição */}
      {transitionTo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center flex-col gap-3 bg-[#0A1F44]">
          <span className="text-[54px] animate-pop">🏥</span>
          <span className="text-[12px] text-white/35 tracking-[1.8px] uppercase animate-fadeUp">
            {transitionTo}
          </span>
        </div>
      )}

      <div className="min-h-screen bg-[#f0f4f8]">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b-2 border-[#e2e8f0] px-5 md:px-10 h-16 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-[#0A1F44] text-white text-xl">
              🏥
            </div>
            <div>
              <div className="text-[17px] font-extrabold text-[#0A1F44] tracking-tight">
                Amor Saude
              </div>
              <div className="text-[10px] text-[#94a3b8]">
                Portal Interno - Pirituba
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-[#475569] flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>{primeiroNome || 'Usuario'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-[#C62828] text-white rounded-lg px-4 py-1.5 text-[12px] font-bold flex items-center gap-1.5 hover:bg-[#ad1f1f] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-[1000px] mx-auto px-6 py-12">
          {/* Greeting */}
          <div className="mb-9">
            <div className="text-[13px] text-[#94a3b8] mb-1.5">
              Bem-vindo(a) ao portal
            </div>
            <h1 className="text-[30px] font-black text-[#0A1F44] tracking-tight">
              O que deseja acessar?
            </h1>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visibleModules.map((module) => {
              const IconComponent = module.icon || (
                module.key === 'orcamentos' ? Calculator :
                module.key === 'fechamento' ? FileText :
                module.key === 'financeiro' ? DollarSign :
                module.key === 'exames' ? Package :
                Calendar
              )
              
              return (
                <div
                  key={module.key}
                  onClick={() => handleModuleClick(module.href, module.title)}
                  className={`bg-white border-[1.5px] rounded-[20px] p-7 cursor-pointer transition-all duration-200 flex flex-col gap-3.5 relative overflow-hidden shadow-[0_2px_12px_rgba(10,31,68,0.06)] group hover:border-[#0A1F44] hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(10,31,68,0.13)] ${
                    module.specialStyle || 'border-[#e2e8f0]'
                  }`}
                >
                  {/* Top accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#C62828] scale-x-0 origin-left transition-transform duration-250 group-hover:scale-x-100" />
                  
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-[26px] ${
                    module.specialBg || 'bg-[#0A1F44]'
                  }`}>
                    {module.key === 'orcamentos' && '🏥'}
                    {module.key === 'fechamento' && '🏥'}
                    {module.key === 'financeiro' && '🏥'}
                    {module.key === 'exames' && '🏥'}
                    {module.key === 'cronograma' && <Calendar className="h-5.5 w-5.5" />}
                    {module.key === 'admin' && <Shield className="h-5.5 w-5.5" />}
                  </div>

                  {/* Content */}
                  <div>
                    <h2 className={`text-[18px] font-extrabold tracking-tight mb-0.5 ${
                      module.titleColor || 'text-[#0A1F44]'
                    }`}>
                      {module.title}
                    </h2>
                    <p className="text-[13px] text-[#94a3b8] leading-relaxed">
                      {module.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className={`mt-auto text-[12px] font-bold flex items-center gap-1.5 transition-all duration-180 group-hover:gap-2.5 ${
                    module.arrowColor || 'text-[#C62828]'
                  }`}>
                    <ArrowRight className="h-3 w-3" />
                    {module.key === 'admin' ? 'Gerenciar' : 'Acessar'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Empty state */}
          {visibleModules.length === 0 && (
            <div className="text-center py-12 text-[#94a3b8]">
              <p className="text-[14px]">
                Voce nao tem acesso a nenhum modulo. Contate o administrador.
              </p>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        @keyframes pop {
          from { opacity: 0; transform: scale(0.3); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-pop {
          animation: pop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .animate-fadeUp {
          animation: fadeUp 0.3s 0.22s ease both;
        }
      `}</style>
    </>
  )
}
