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
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Atendimento } from '@/lib/types'

interface AtendimentoEditFormProps {
  atendimento: Atendimento
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AtendimentoEditForm({ atendimento, open, onOpenChange }: AtendimentoEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const atendenteValue = formData.get('atendente') as string
    const data = formData.get('data') as string
    const quantidade = parseInt(formData.get('quantidade') as string)
    const npsValue = formData.get('nps') as string
    const nps = npsValue ? parseInt(npsValue) : null

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('atendimentos')
      .update({
        atendente: atendenteValue,
        data,
        quantidade,
        nps,
        updated_at: new Date().toISOString(),
      })
      .eq('id', atendimento.id)

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
          <DialogTitle>Editar Atendimento</DialogTitle>
          <DialogDescription>
            Atualize os dados do atendimento
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="atendente">Nome do Atendente</FieldLabel>
              <Input
                id="atendente"
                name="atendente"
                placeholder="Nome do atendente"
                required
                defaultValue={atendimento.atendente}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="data">Data</FieldLabel>
              <Input
                id="data"
                name="data"
                type="date"
                required
                defaultValue={atendimento.data}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="quantidade">Quantidade de Atendimentos</FieldLabel>
              <Input
                id="quantidade"
                name="quantidade"
                type="number"
                min="1"
                placeholder="1"
                required
                defaultValue={atendimento.quantidade}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="nps">NPS (0-10) - Opcional</FieldLabel>
              <Input
                id="nps"
                name="nps"
                type="number"
                min="0"
                max="10"
                placeholder="Nota de 0 a 10"
                defaultValue={atendimento.nps ?? ''}
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
