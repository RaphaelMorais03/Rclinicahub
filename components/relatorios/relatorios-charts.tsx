'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Atendimento, Financeiro, Exame } from '@/lib/types'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

interface RelatoriosChartsProps {
  atendimentos: Atendimento[]
  financeiro: Financeiro[]
  exames: Exame[]
}

export function RelatoriosCharts({ atendimentos, financeiro, exames }: RelatoriosChartsProps) {
  // Agrupar atendimentos por mês
  const atendimentosPorMes = atendimentos.reduce((acc, a) => {
    const mes = new Date(a.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    const existing = acc.find(item => item.mes === mes)
    if (existing) {
      existing.quantidade += a.quantidade
    } else {
      acc.push({ mes, quantidade: a.quantidade })
    }
    return acc
  }, [] as { mes: string; quantidade: number }[])

  // Agrupar financeiro por mês
  const financeiroPorMes = financeiro.reduce((acc, f) => {
    const mes = new Date(f.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    const existing = acc.find(item => item.mes === mes)
    if (existing) {
      if (f.tipo === 'entrada') {
        existing.entradas += Number(f.valor)
      } else {
        existing.saidas += Number(f.valor)
      }
    } else {
      acc.push({
        mes,
        entradas: f.tipo === 'entrada' ? Number(f.valor) : 0,
        saidas: f.tipo === 'saida' ? Number(f.valor) : 0,
      })
    }
    return acc
  }, [] as { mes: string; entradas: number; saidas: number }[])

  // Status dos exames
  const examesStatus = [
    { name: 'Pendentes', value: exames.filter(e => e.status === 'pendente').length, fill: 'var(--color-chart-3)' },
    { name: 'Concluídos', value: exames.filter(e => e.status === 'concluido').length, fill: 'var(--color-chart-2)' },
  ]

  // NPS médio por período
  const npsPorMes = atendimentos
    .filter(a => a.nps !== null)
    .reduce((acc, a) => {
      const mes = new Date(a.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      const existing = acc.find(item => item.mes === mes)
      if (existing) {
        existing.total += a.nps!
        existing.count++
        existing.media = existing.total / existing.count
      } else {
        acc.push({ mes, total: a.nps!, count: 1, media: a.nps! })
      }
      return acc
    }, [] as { mes: string; total: number; count: number; media: number }[])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Atendimentos por M&ecirc;s</CardTitle>
          <CardDescription>Evolu&ccedil;&atilde;o dos atendimentos ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={atendimentosPorMes}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Bar dataKey="quantidade" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NPS M&eacute;dio por M&ecirc;s</CardTitle>
          <CardDescription>Evolu&ccedil;&atilde;o da satisfa&ccedil;&atilde;o dos pacientes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={npsPorMes}>
              <XAxis dataKey="mes" />
              <YAxis domain={[0, 10]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}
                formatter={(value: number) => [value.toFixed(1), 'NPS Médio']}
              />
              <Line type="monotone" dataKey="media" stroke="var(--color-chart-2)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo Financeiro</CardTitle>
          <CardDescription>Compara&ccedil;&atilde;o de entradas e sa&iacute;das</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={financeiroPorMes}>
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="entradas" name="Entradas" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status dos Exames</CardTitle>
          <CardDescription>Distribui&ccedil;&atilde;o de exames por status</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={examesStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {examesStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
