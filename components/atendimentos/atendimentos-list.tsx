'use client'

import { Atendimento } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { Calendar, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AtendimentoEditForm } from './atendimento-edit-form'

interface AtendimentosListProps {
  atendimentos: Atendimento[]
}

export function AtendimentosList({ atendimentos }: AtendimentosListProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editAtendimento, setEditAtendimento] = useState<Atendimento | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    const supabase = createClient()
    await supabase.from('atendimentos').delete().eq('id', deleteId)

    setIsDeleting(false)
    setDeleteId(null)
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Atendimentos</CardTitle>
          <CardDescription>
            {atendimentos.length} atendimento(s) registrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {atendimentos.length === 0 ? (
            <Empty
              icon={Calendar}
              title="Nenhum atendimento"
              description="Nenhum atendimento foi registrado ainda. Clique em 'Novo Atendimento' para adicionar."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atendente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                  <TableHead className="text-center">NPS</TableHead>
                  <TableHead className="text-right">A&ccedil;&otilde;es</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atendimentos.map((atendimento) => (
                  <TableRow key={atendimento.id}>
                    <TableCell className="font-medium">{atendimento.atendente}</TableCell>
                    <TableCell>{formatDate(atendimento.data)}</TableCell>
                    <TableCell className="text-center">{atendimento.quantidade}</TableCell>
                    <TableCell className="text-center">
                      {atendimento.nps !== null ? (
                        <Badge variant={getNpsColor(atendimento.nps)}>
                          {atendimento.nps}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">A&ccedil;&otilde;es</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditAtendimento(atendimento)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(atendimento.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclus&atilde;o</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este atendimento? Esta a&ccedil;&atilde;o n&atilde;o pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editAtendimento && (
        <AtendimentoEditForm
          atendimento={editAtendimento}
          open={!!editAtendimento}
          onOpenChange={() => setEditAtendimento(null)}
        />
      )}
    </>
  )
}
