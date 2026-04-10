'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Financeiro } from '@/lib/types'

interface FinanceiroEditFormProps {
  item: Financeiro
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FinanceiroEditForm({ item, open, onOpenChange }: FinanceiroEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tipo, setTipo] = useState<'entrada' | 'saida'>(item.tipo)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const descricao = formData.get('descricao') as string
    const valor = parseFloat(formData.get('valor') as string)
    const data = formData.get('data') as string

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('financeiro')
      .update({
        tipo,
        descricao,
        valor,
        data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id)

    if (updateError) {
      setError(updateError.message)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Movimenta&ccedil;&atilde;o</DialogTitle>
          <DialogDescription>
            Atualize os dados da movimenta&ccedil;&atilde;o financeira
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Tipo</FieldLabel>
              <Select value={tipo} onValueChange={(v) => setTipo(v as 'entrada' | 'saida')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Sa&iacute;da</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="descricao">Descri&ccedil;&atilde;o</FieldLabel>
              <Input
                id="descricao"
                name="descricao"
                placeholder="Descrição da movimentação"
                required
                defaultValue={item.descricao}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="valor">Valor (R$)</FieldLabel>
              <Input
                id="valor"
                name="valor"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                required
                defaultValue={item.valor}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="data">Data</FieldLabel>
              <Input
                id="data"
                name="data"
                type="date"
                required
                defaultValue={item.data}
              />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
