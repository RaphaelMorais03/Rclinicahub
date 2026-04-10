'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function FinanceiroForm() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada')
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Você precisa estar logado')
      setIsLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('financeiro').insert({
      tipo,
      descricao,
      valor,
      data,
      user_id: user.id,
    })

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Movimenta&ccedil;&atilde;o
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Movimenta&ccedil;&atilde;o</DialogTitle>
          <DialogDescription>
            Registre uma entrada ou sa&iacute;da financeira
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
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="data">Data</FieldLabel>
              <Input
                id="data"
                name="data"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
