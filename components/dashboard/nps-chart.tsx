'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Atendimento } from '@/lib/types'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Empty } from '@/components/ui/empty'
import { BarChart3 } from 'lucide-react'

interface NpsChartProps {
  atendimentos: Atendimento[]
}

export function NpsChart({ atendimentos }: NpsChartProps) {
  // Agrupar NPS por faixa
  const npsData = atendimentos
    .filter((a) => a.nps !== null)
    .reduce(
      (acc, a) => {
        const nps = a.nps!
        if (nps >= 9) acc.promotores++
        else if (nps >= 7) acc.neutros++
        else acc.detratores++
        return acc
      },
      { promotores: 0, neutros: 0, detratores: 0 }
    )

  const chartData = [
    { name: 'Promotores (9-10)', value: npsData.promotores, fill: 'var(--color-chart-2)' },
    { name: 'Neutros (7-8)', value: npsData.neutros, fill: 'var(--color-chart-3)' },
    { name: 'Detratores (0-6)', value: npsData.detratores, fill: 'var(--color-chart-5)' },
  ]

  const hasData = atendimentos.some((a) => a.nps !== null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribui&ccedil;&atilde;o NPS</CardTitle>
        <CardDescription>
          Classifica&ccedil;&atilde;o dos atendimentos por NPS
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <Empty
            icon={BarChart3}
            title="Sem dados de NPS"
            description="Nenhuma avalia&ccedil;&atilde;o NPS foi registrada ainda."
          />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
