'use client'

import { Exame } from '@/lib/types'
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
import { FileText, MoreHorizontal, Pencil, Trash2, CheckCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { ExameEditForm } from './exame-edit-form'

interface ExamesListProps {
  exames: Exame[]
}

export function ExamesList({ exames }: ExamesListProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editExame, setEditExame] = useState<Exame | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    const supabase = createClient()
    await supabase.from('exames').delete().eq('id', deleteId)

    setIsDeleting(false)
    setDeleteId(null)
    router.refresh()
  }

  const handleConcluir = async (id: string) => {
    const supabase = createClient()
    await supabase
      .from('exames')
      .update({ status: 'concluido', updated_at: new Date().toISOString() })
      .eq('id', id)
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Exames</CardTitle>
          <CardDescription>
            {exames.length} exame(s) registrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exames.length === 0 ? (
            <Empty
              icon={FileText}
              title="Nenhum exame"
              description="Nenhum exame foi registrado ainda. Clique em 'Novo Exame' para adicionar."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Exame</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">A&ccedil;&otilde;es</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exames.map((exame) => (
                  <TableRow key={exame.id}>
                    <TableCell className="font-medium">{exame.nome}</TableCell>
                    <TableCell>{exame.paciente}</TableCell>
                    <TableCell>{formatDate(exame.data)}</TableCell>
                    <TableCell>
                      <Badge variant={exame.status === 'concluido' ? 'default' : 'secondary'}>
                        {exame.status === 'concluido' ? 'Conclu\u00EDdo' : 'Pendente'}
                      </Badge>
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
                          {exame.status === 'pendente' && (
                            <>
                              <DropdownMenuItem onClick={() => handleConcluir(exame.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marcar como Conclu&iacute;do
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => setEditExame(exame)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(exame.id)}
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
              Tem certeza que deseja excluir este exame? Esta a&ccedil;&atilde;o n&atilde;o pode ser desfeita.
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

      {editExame && (
        <ExameEditForm
          exame={editExame}
          open={!!editExame}
          onOpenChange={() => setEditExame(null)}
        />
      )}
    </>
  )
}
