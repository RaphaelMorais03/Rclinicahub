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
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function ExameForm() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Você precisa estar logado para criar um exame')
      setIsLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('exames').insert({
      nome,
      paciente,
      data,
      observacoes: observacoes || null,
      status: 'pendente',
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
          Novo Exame
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Exame</DialogTitle>
          <DialogDescription>
            Registre um novo exame para acompanhamento
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
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="paciente">Nome do Paciente</FieldLabel>
              <Input
                id="paciente"
                name="paciente"
                placeholder="Nome completo do paciente"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="data">Data do Exame</FieldLabel>
              <Input
                id="data"
                name="data"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="observacoes">Observa&ccedil;&otilde;es (Opcional)</FieldLabel>
              <Textarea
                id="observacoes"
                name="observacoes"
                placeholder="Observações adicionais sobre o exame"
                rows={3}
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
