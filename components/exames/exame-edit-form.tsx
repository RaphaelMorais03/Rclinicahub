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
import { Textarea } from '@/components/ui/textarea'
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
import { Exame } from '@/lib/types'

interface ExameEditFormProps {
  exame: Exame
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExameEditForm({ exame, open, onOpenChange }: ExameEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'pendente' | 'concluido'>(exame.status)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const nome = formData.get('nome') as string
    const paciente = formData.get('paciente') as string
    const data = formData.get('data') as string
    const observacoes = formData.get('observacoes') as string

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('exames')
      .update({
        nome,
        paciente,
        data,
        observacoes: observacoes || null,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', exame.id)

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
          <DialogTitle>Editar Exame</DialogTitle>
          <DialogDescription>
            Atualize os dados do exame
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nome">Nome do Exame</FieldLabel>
              <Input
                id="nome"
                name="nome"
                placeholder="Ex: Hemograma Completo"
                required
                defaultValue={exame.nome}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="paciente">Nome do Paciente</FieldLabel>
              <Input
                id="paciente"
                name="paciente"
                placeholder="Nome completo do paciente"
                required
                defaultValue={exame.paciente}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="data">Data do Exame</FieldLabel>
              <Input
                id="data"
                name="data"
                type="date"
                required
                defaultValue={exame.data}
              />
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={status} onValueChange={(v) => setStatus(v as 'pendente' | 'concluido')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="concluido">Conclu&iacute;do</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="observacoes">Observa&ccedil;&otilde;es (Opcional)</FieldLabel>
              <Textarea
                id="observacoes"
                name="observacoes"
                placeholder="Observações adicionais sobre o exame"
                rows={3}
                defaultValue={exame.observacoes ?? ''}
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
