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
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AtendimentoForm() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const atendente = formData.get('atendente') as string
    const data = formData.get('data') as string
    const quantidade = parseInt(formData.get('quantidade') as string)
    const npsValue = formData.get('nps') as string
    const nps = npsValue ? parseInt(npsValue) : null

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Você precisa estar logado para criar um atendimento')
      setIsLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('atendimentos').insert({
      atendente,
      data,
      quantidade,
      nps,
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
          Novo Atendimento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Atendimento</DialogTitle>
          <DialogDescription>
            Adicione um novo registro de atendimento
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
            <Field>
              <FieldLabel htmlFor="quantidade">Quantidade de Atendimentos</FieldLabel>
              <Input
                id="quantidade"
                name="quantidade"
                type="number"
                min="1"
                placeholder="1"
                required
                defaultValue="1"
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
