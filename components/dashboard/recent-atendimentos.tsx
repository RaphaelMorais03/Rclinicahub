import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Atendimento } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Empty } from '@/components/ui/empty'
import { Calendar } from 'lucide-react'

interface RecentAtendimentosProps {
  atendimentos: Atendimento[]
}

export function RecentAtendimentos({ atendimentos }: RecentAtendimentosProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getNpsColor = (nps: number | null) => {
    if (nps === null) return 'secondary'
    if (nps >= 9) return 'default'
    if (nps >= 7) return 'secondary'
    return 'destructive'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atendimentos Recentes</CardTitle>
        <CardDescription>
          &Uacute;ltimos atendimentos registrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {atendimentos.length === 0 ? (
          <Empty
            icon={Calendar}
            title="Nenhum atendimento"
            description="Nenhum atendimento foi registrado ainda."
          />
        ) : (
          <div className="space-y-4">
            {atendimentos.slice(0, 5).map((atendimento) => (
              <div
                key={atendimento.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{atendimento.atendente}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(atendimento.data)} - {atendimento.quantidade} atendimento(s)
                  </span>
                </div>
                {atendimento.nps !== null && (
                  <Badge variant={getNpsColor(atendimento.nps)}>
                    NPS: {atendimento.nps}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
