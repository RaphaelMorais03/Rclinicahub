import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen">
      {/* Barra vermelha no topo */}
      <div className="h-[3px] bg-[#C62828] fixed top-0 left-0 right-0 z-[200]" />
      
      <main className="pt-[3px]">
        {children}
      </main>
    </div>
  )
}
