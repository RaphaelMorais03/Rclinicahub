'use client'

import { Financeiro } from '@/lib/types'
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
import { DollarSign, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
import { FinanceiroEditForm } from './financeiro-edit-form'

interface FinanceiroListProps {
  financeiro: Financeiro[]
}

export function FinanceiroList({ financeiro }: FinanceiroListProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<Financeiro | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    const supabase = createClient()
    await supabase.from('financeiro').delete().eq('id', deleteId)

    setIsDeleting(false)
    setDeleteId(null)
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Movimenta&ccedil;&otilde;es</CardTitle>
          <CardDescription>
            {financeiro.length} registro(s) financeiro(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {financeiro.length === 0 ? (
            <Empty
              icon={DollarSign}
              title="Nenhuma movimenta&ccedil;&atilde;o"
              description="Nenhuma movimenta&ccedil;&atilde;o financeira foi registrada ainda."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descri&ccedil;&atilde;o</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">A&ccedil;&otilde;es</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financeiro.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant={item.tipo === 'entrada' ? 'default' : 'destructive'}>
                        {item.tipo === 'entrada' ? 'Entrada' : 'Sa&iacute;da'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.descricao}</TableCell>
                    <TableCell>{formatDate(item.data)}</TableCell>
                    <TableCell className={`text-right font-medium ${item.tipo === 'entrada' ? 'text-accent' : 'text-destructive'}`}>
                      {item.tipo === 'entrada' ? '+' : '-'} {formatCurrency(Number(item.valor))}
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
                          <DropdownMenuItem onClick={() => setEditItem(item)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(item.id)}
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
              Tem certeza que deseja excluir este registro financeiro? Esta a&ccedil;&atilde;o n&atilde;o pode ser desfeita.
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

      {editItem && (
        <FinanceiroEditForm
          item={editItem}
          open={!!editItem}
          onOpenChange={() => setEditItem(null)}
        />
      )}
    </>
  )
}
