import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Exame } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Empty } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ExamesPendentesProps {
  exames: Exame[]
}

export function ExamesPendentes({ exames }: ExamesPendentesProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Exames Pendentes</CardTitle>
          <CardDescription>
            Exames aguardando conclus&atilde;o
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/exames">
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {exames.length === 0 ? (
          <Empty
            icon={FileText}
            title="Nenhum exame pendente"
            description="Todos os exames est&atilde;o conclu&iacute;dos."
          />
        ) : (
          <div className="space-y-4">
            {exames.map((exame) => (
              <div
                key={exame.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{exame.nome}</span>
                  <span className="text-sm text-muted-foreground">
                    Paciente: {exame.paciente}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(exame.data)}
                  </span>
                  <Badge variant="secondary">Pendente</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
