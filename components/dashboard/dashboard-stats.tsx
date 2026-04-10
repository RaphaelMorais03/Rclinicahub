import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, DollarSign, FileText, TrendingUp } from 'lucide-react'

interface DashboardStatsProps {
  totalAtendimentos: number
  npsMedia: number
  entradas: number
  saidas: number
  examesPendentes: number
}

export function DashboardStats({
  totalAtendimentos,
  npsMedia,
  entradas,
  saidas,
  examesPendentes,
}: DashboardStatsProps) {
  const saldo = entradas - saidas

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Atendimentos
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAtendimentos}</div>
          <p className="text-xs text-muted-foreground">
            Nos &uacute;ltimos registros
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            NPS M&eacute;dio
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{npsMedia.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            Pontua&ccedil;&atilde;o de satisfa&ccedil;&atilde;o
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-accent' : 'text-destructive'}`}>
            {formatCurrency(saldo)}
          </div>
          <p className="text-xs text-muted-foreground">
            Entradas - Sa&iacute;das
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Exames Pendentes
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{examesPendentes}</div>
          <p className="text-xs text-muted-foreground">
            Aguardando conclus&atilde;o
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
