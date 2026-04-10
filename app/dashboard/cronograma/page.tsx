'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus, 
  Check,
  MessageSquare,
  Trash2,
  Clock
} from 'lucide-react'
import type { Cronograma, CronogramaNota, Caixa } from '@/lib/types'

const SALAS = ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Sala 5']

const CHECKLIST_PADRAO = [
  'Abrir portas e janelas',
  'Ligar ar condicionado',
  'Verificar materiais',
  'Organizar recepcao',
  'Conferir agenda do dia'
]

export default function CronogramaPage() {
  const { usuario } = useAuth()
  const supabase = createClient()
  
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [cronograma, setCronograma] = useState<Cronograma[]>([])
  const [notas, setNotas] = useState<CronogramaNota[]>([])
  const [checklist, setChecklist] = useState<{item: string, concluido: boolean}[]>([])
  const [caixa, setCaixa] = useState<Caixa | null>(null)
  const [novaNota, setNovaNota] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  // Dialog states
  const [dialogSala, setDialogSala] = useState<string | null>(null)
  const [novoMedico, setNovoMedico] = useState('')
  const [novaEspecialidade, setNovaEspecialidade] = useState('')
  const [novoHorarioInicio, setNovoHorarioInicio] = useState('')
  const [novoHorarioFim, setNovoHorarioFim] = useState('')

  const dateStr = selectedDate.toISOString().split('T')[0]

  useEffect(() => {
    loadData()
  }, [dateStr])

  const loadData = async () => {
    setIsLoading(true)
    
    const [cronogramaRes, notasRes, caixaRes] = await Promise.all([
      supabase.from('cronograma').select('*').eq('data', dateStr),
      supabase.from('cronograma_notas').select('*').eq('data', dateStr).order('created_at'),
      supabase.from('caixa').select('*').eq('data', dateStr).single()
    ])

    if (cronogramaRes.data) setCronograma(cronogramaRes.data)
    if (notasRes.data) setNotas(notasRes.data)
    if (caixaRes.data) setCaixa(caixaRes.data)
    
    // Carregar checklist do localStorage ou usar padrao
    const savedChecklist = localStorage.getItem(`checklist-${dateStr}`)
    if (savedChecklist) {
      setChecklist(JSON.parse(savedChecklist))
    } else {
      setChecklist(CHECKLIST_PADRAO.map(item => ({ item, concluido: false })))
    }
    
    setIsLoading(false)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const getSalaInfo = (sala: string) => {
    return cronograma.find(c => c.sala === sala)
  }

  const toggleSalaStatus = async (sala: string) => {
    const salaInfo = getSalaInfo(sala)
    
    if (salaInfo) {
      await supabase
        .from('cronograma')
        .update({ status: salaInfo.status === 'pronto' ? 'pendente' : 'pronto' })
        .eq('id', salaInfo.id)
    }
    
    loadData()
  }

  const saveSala = async () => {
    if (!dialogSala || !usuario) return
    
    const salaInfo = getSalaInfo(dialogSala)
    
    if (salaInfo) {
      await supabase
        .from('cronograma')
        .update({
          medico: novoMedico || null,
          especialidade: novaEspecialidade || null,
          horario_inicio: novoHorarioInicio || null,
          horario_fim: novoHorarioFim || null
        })
        .eq('id', salaInfo.id)
    } else {
      await supabase.from('cronograma').insert({
        data: dateStr,
        sala: dialogSala,
        medico: novoMedico || null,
        especialidade: novaEspecialidade || null,
        horario_inicio: novoHorarioInicio || null,
        horario_fim: novoHorarioFim || null,
        user_id: usuario.id
      })
    }
    
    setDialogSala(null)
    loadData()
  }

  const openSalaDialog = (sala: string) => {
    const info = getSalaInfo(sala)
    setDialogSala(sala)
    setNovoMedico(info?.medico || '')
    setNovaEspecialidade(info?.especialidade || '')
    setNovoHorarioInicio(info?.horario_inicio || '')
    setNovoHorarioFim(info?.horario_fim || '')
  }

  const addNota = async () => {
    if (!novaNota.trim() || !usuario) return
    
    await supabase.from('cronograma_notas').insert({
      data: dateStr,
      texto: novaNota,
      tipo: 'comum',
      user_id: usuario.id
    })
    
    setNovaNota('')
    loadData()
  }

  const toggleNotaConcluida = async (nota: CronogramaNota) => {
    await supabase
      .from('cronograma_notas')
      .update({ concluido: !nota.concluido })
      .eq('id', nota.id)
    loadData()
  }

  const deleteNota = async (id: string) => {
    await supabase.from('cronograma_notas').delete().eq('id', id)
    loadData()
  }

  const toggleChecklist = (index: number) => {
    const newChecklist = [...checklist]
    newChecklist[index].concluido = !newChecklist[index].concluido
    setChecklist(newChecklist)
    localStorage.setItem(`checklist-${dateStr}`, JSON.stringify(newChecklist))
  }

  const saveCaixa = async (field: 'dinheiro' | 'pix' | 'cartao', value: string) => {
    const numValue = parseFloat(value) || 0
    
    if (caixa) {
      await supabase
        .from('caixa')
        .update({ [field]: numValue })
        .eq('id', caixa.id)
    } else if (usuario) {
      await supabase.from('caixa').insert({
        data: dateStr,
        [field]: numValue,
        user_id: usuario.id
      })
    }
    
    loadData()
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header com navegacao de data */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cronograma</h1>
          <p className="text-muted-foreground">Agenda diaria por sala</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
            <Calendar className="h-5 w-5" />
            <span className="font-medium capitalize">{formatDate(selectedDate)}</span>
          </div>
          <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-3">
        {/* Salas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Salas do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {SALAS.map(sala => {
                  const info = getSalaInfo(sala)
                  return (
                    <div
                      key={sala}
                      className={`rounded-lg border-2 p-4 transition-colors ${
                        info?.status === 'pronto' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold">{sala}</h3>
                        <div className="flex items-center gap-2">
                          {info?.status === 'pronto' && (
                            <Badge className="bg-green-500">Pronto</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openSalaDialog(sala)}
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                      
                      {info?.medico ? (
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="font-medium">{info.medico}</div>
                          {info.especialidade && (
                            <div className="text-muted-foreground">{info.especialidade}</div>
                          )}
                          {info.horario_inicio && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {info.horario_inicio} - {info.horario_fim || '?'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Sem agenda definida
                        </div>
                      )}
                      
                      <Button
                        size="sm"
                        variant={info?.status === 'pronto' ? 'secondary' : 'default'}
                        className="mt-3 w-full"
                        onClick={() => toggleSalaStatus(sala)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {info?.status === 'pronto' ? 'Desmarcar' : 'Marcar Pronto'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel lateral */}
        <div className="space-y-6">
          {/* Checklist de Abertura */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist de Abertura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Checkbox
                      checked={item.concluido}
                      onCheckedChange={() => toggleChecklist(index)}
                    />
                    <span className={item.concluido ? 'line-through text-muted-foreground' : ''}>
                      {item.item}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notas / Recados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Recados do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notas.map(nota => (
                  <div
                    key={nota.id}
                    className={`flex items-start justify-between rounded-lg p-2 ${
                      nota.concluido ? 'bg-muted/50' : 'bg-accent/10'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={nota.concluido}
                        onCheckedChange={() => toggleNotaConcluida(nota)}
                        className="mt-0.5"
                      />
                      <span className={nota.concluido ? 'line-through text-muted-foreground' : ''}>
                        {nota.texto}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive"
                      onClick={() => deleteNota(nota.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Novo recado..."
                    value={novaNota}
                    onChange={(e) => setNovaNota(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNota()}
                  />
                  <Button size="icon" onClick={addNota}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Caixa do Dia */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Caixa do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Dinheiro</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={caixa?.dinheiro || ''}
                    onBlur={(e) => saveCaixa('dinheiro', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">PIX</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={caixa?.pix || ''}
                    onBlur={(e) => saveCaixa('pix', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Cartao</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={caixa?.cartao || ''}
                    onBlur={(e) => saveCaixa('cartao', e.target.value)}
                  />
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-primary">
                      R$ {((caixa?.dinheiro || 0) + (caixa?.pix || 0) + (caixa?.cartao || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para editar sala */}
      <Dialog open={!!dialogSala} onOpenChange={() => setDialogSala(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {dialogSala}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Medico</label>
              <Input
                value={novoMedico}
                onChange={(e) => setNovoMedico(e.target.value)}
                placeholder="Nome do medico"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Especialidade</label>
              <Input
                value={novaEspecialidade}
                onChange={(e) => setNovaEspecialidade(e.target.value)}
                placeholder="Ex: Cardiologia"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Horario Inicio</label>
                <Input
                  type="time"
                  value={novoHorarioInicio}
                  onChange={(e) => setNovoHorarioInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Horario Fim</label>
                <Input
                  type="time"
                  value={novoHorarioFim}
                  onChange={(e) => setNovoHorarioFim(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full" onClick={saveSala}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
