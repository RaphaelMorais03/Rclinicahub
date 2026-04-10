'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus, 
  Check,
  MessageSquare,
  Trash2,
  Clock,
  ClipboardList,
  DollarSign,
  FileText,
  Loader2,
  Save,
  Printer,
  Edit,
  CalendarDays
} from 'lucide-react'
import type { Cronograma, CronogramaNota, OperacaoCaixa, OperacaoVale, OperacaoChecklist, CronoAgenda, Atendente } from '@/lib/types'
import { CHECKLIST_PADRAO } from '@/lib/types'

const SALAS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'US', 'FISIO']
const DIAS_SEMANA = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'] as const

type ActiveTab = 'agenda' | 'semana' | 'abertura' | 'caixa'

export default function CronogramaPage() {
  const { usuario, user } = useAuth()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('agenda')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Agenda diária
  const [cronograma, setCronograma] = useState<Cronograma[]>([])
  const [notas, setNotas] = useState<CronogramaNota[]>([])
  const [novaNota, setNovaNota] = useState('')
  
  // Agenda semanal
  const [agendaSemanal, setAgendaSemanal] = useState<CronoAgenda[]>([])
  
  // Checklist
  const [checklist, setChecklist] = useState<OperacaoChecklist[]>([])
  const [editingChecklist, setEditingChecklist] = useState(false)
  const [novoCheckItem, setNovoCheckItem] = useState({ titulo: '', instrucao: '', icone: 'check' })
  
  // Caixa
  const [caixa, setCaixa] = useState<OperacaoCaixa | null>(null)
  const [vales, setVales] = useState<OperacaoVale[]>([])
  const [novoVale, setNovoVale] = useState({ paciente: '', cpf: '', especialidade: '', valor: '' })
  const [relatorioAmei, setRelatorioAmei] = useState('')
  const [relatorioProcessado, setRelatorioProcessado] = useState<{
    credito: number
    debito: number
    pix: number
    dinheiro: number
    total: number
    linhas: string[]
  } | null>(null)
  
  // Atendentes
  const [atendentes, setAtendentes] = useState<Atendente[]>([])
  const [atendenteRelatorio, setAtendenteRelatorio] = useState('')
  
  // Dialog states
  const [dialogSala, setDialogSala] = useState<string | null>(null)
  const [novoMedico, setNovoMedico] = useState('')
  const [novaEspecialidade, setNovaEspecialidade] = useState('')
  const [novoHorarioInicio, setNovoHorarioInicio] = useState('')
  const [novoHorarioFim, setNovoHorarioFim] = useState('')

  const dateStr = selectedDate.toISOString().split('T')[0]

  const loadData = useCallback(async () => {
    setIsLoading(true)
    
    const [cronogramaRes, notasRes, caixaRes, valesRes, checkRes, semanalRes, atendentesRes] = await Promise.all([
      supabase.from('cronograma').select('*').eq('data', dateStr),
      supabase.from('cronograma_notas').select('*').eq('data', dateStr).order('created_at'),
      supabase.from('operacao_caixa').select('*').eq('data', dateStr).single(),
      supabase.from('operacao_vales').select('*').eq('data', dateStr).order('created_at'),
      supabase.from('operacao_checklist').select('*').eq('data', dateStr),
      supabase.from('crono_agenda').select('*').order('sala'),
      supabase.from('atendentes').select('*').eq('ativo', true).order('nome')
    ])

    if (cronogramaRes.data) setCronograma(cronogramaRes.data)
    if (notasRes.data) setNotas(notasRes.data)
    if (caixaRes.data) setCaixa(caixaRes.data)
    if (valesRes.data) setVales(valesRes.data)
    if (semanalRes.data) setAgendaSemanal(semanalRes.data)
    if (atendentesRes.data) setAtendentes(atendentesRes.data)
    
    // Checklist: usar do banco ou criar padrão
    if (checkRes.data && checkRes.data.length > 0) {
      setChecklist(checkRes.data)
    } else {
      setChecklist(CHECKLIST_PADRAO.map(item => ({
        id: item.id,
        data: dateStr,
        item_id: item.id,
        titulo: item.titulo,
        instrucao: item.instrucao,
        icone: item.icone,
        feito: false,
        user_id: null,
        created_at: new Date().toISOString()
      })))
    }
    
    setIsLoading(false)
  }, [supabase, dateStr])

  useEffect(() => {
    loadData()
  }, [loadData])

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
    if (!dialogSala || !user) return
    
    setSaving(true)
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
        user_id: user.id
      })
    }
    
    setSaving(false)
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

  // ============== CHECKLIST ==============
  const toggleCheckItem = async (item: OperacaoChecklist) => {
    setSaving(true)
    
    const { error } = await supabase.from('operacao_checklist').upsert({
      data: dateStr,
      item_id: item.item_id,
      titulo: item.titulo,
      instrucao: item.instrucao,
      icone: item.icone,
      feito: !item.feito,
      user_id: user?.id
    }, { onConflict: 'data,item_id' })
    
    if (!error) {
      setChecklist(prev => prev.map(c => c.item_id === item.item_id ? { ...c, feito: !c.feito } : c))
    }
    
    setSaving(false)
  }

  const addCheckItem = async () => {
    if (!novoCheckItem.titulo) return
    
    const newItem: OperacaoChecklist = {
      id: crypto.randomUUID(),
      data: dateStr,
      item_id: `custom_${Date.now()}`,
      titulo: novoCheckItem.titulo,
      instrucao: novoCheckItem.instrucao || null,
      icone: novoCheckItem.icone,
      feito: false,
      user_id: user?.id || null,
      created_at: new Date().toISOString()
    }
    
    await supabase.from('operacao_checklist').insert(newItem)
    setChecklist(prev => [...prev, newItem])
    setNovoCheckItem({ titulo: '', instrucao: '', icone: 'check' })
  }

  const removeCheckItem = async (itemId: string) => {
    await supabase.from('operacao_checklist').delete().eq('item_id', itemId).eq('data', dateStr)
    setChecklist(prev => prev.filter(c => c.item_id !== itemId))
  }

  const resetChecklist = () => {
    setChecklist(prev => prev.map(c => ({ ...c, feito: false })))
    // Também atualizar no banco
    checklist.forEach(item => {
      supabase.from('operacao_checklist').upsert({
        ...item,
        feito: false
      }, { onConflict: 'data,item_id' })
    })
  }

  // ============== CAIXA ==============
  const saveCaixa = async (field: 'entradas' | 'saidas', value: string) => {
    const numValue = parseFloat(value) || 0
    
    if (caixa) {
      await supabase.from('operacao_caixa').update({ [field]: numValue }).eq('id', caixa.id)
    } else if (user) {
      await supabase.from('operacao_caixa').insert({
        data: dateStr,
        [field]: numValue
      })
    }
    
    loadData()
  }

  const addVale = async () => {
    if (!novoVale.paciente || !novoVale.valor) return
    
    await supabase.from('operacao_vales').insert({
      data: dateStr,
      paciente: novoVale.paciente,
      cpf: novoVale.cpf || null,
      especialidade: novoVale.especialidade || null,
      valor: parseFloat(novoVale.valor) || 0
    })
    
    setNovoVale({ paciente: '', cpf: '', especialidade: '', valor: '' })
    loadData()
  }

  // ============== RELATÓRIO AMEI ==============
  const processarRelatorioAmei = () => {
    const linhas = relatorioAmei.split('\n').filter(l => l.trim())
    let credito = 0, debito = 0, pix = 0, dinheiro = 0
    const linhasProcessadas: string[] = []
    
    for (const linha of linhas) {
      const textoLower = linha.toLowerCase()
      const match = linha.match(/R?\$?\s*([\d.,]+)/g)
      const valor = match ? parseFloat(match[0].replace(/[^\d,.-]/g, '').replace(',', '.')) : 0
      
      if (textoLower.includes('credito') || textoLower.includes('crédito')) {
        credito += valor
        linhasProcessadas.push(`Crédito: R$ ${valor.toFixed(2)}`)
      } else if (textoLower.includes('debito') || textoLower.includes('débito')) {
        debito += valor
        linhasProcessadas.push(`Débito: R$ ${valor.toFixed(2)}`)
      } else if (textoLower.includes('pix')) {
        pix += valor
        linhasProcessadas.push(`PIX: R$ ${valor.toFixed(2)}`)
      } else if (textoLower.includes('dinheiro') || textoLower.includes('especie')) {
        dinheiro += valor
        linhasProcessadas.push(`Dinheiro: R$ ${valor.toFixed(2)}`)
      }
    }
    
    setRelatorioProcessado({
      credito,
      debito,
      pix,
      dinheiro,
      total: credito + debito + pix + dinheiro,
      linhas: linhasProcessadas
    })
  }

  const imprimirRelatorio = () => {
    if (!relatorioProcessado) return
    
    const printContent = `
      <html>
        <head>
          <title>Relatório de Caixa - ${dateStr}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .total { font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <h1>Relatório de Caixa</h1>
          <p><strong>Data:</strong> ${new Date(dateStr).toLocaleDateString('pt-BR')}</p>
          <p><strong>Atendente:</strong> ${atendenteRelatorio || '-'}</p>
          <table>
            <tr><th>Forma de Pagamento</th><th>Valor</th></tr>
            <tr><td>Cartão de Crédito</td><td>R$ ${relatorioProcessado.credito.toFixed(2)}</td></tr>
            <tr><td>Cartão de Débito</td><td>R$ ${relatorioProcessado.debito.toFixed(2)}</td></tr>
            <tr><td>PIX</td><td>R$ ${relatorioProcessado.pix.toFixed(2)}</td></tr>
            <tr><td>Dinheiro</td><td>R$ ${relatorioProcessado.dinheiro.toFixed(2)}</td></tr>
            <tr class="total"><td>TOTAL</td><td>R$ ${relatorioProcessado.total.toFixed(2)}</td></tr>
          </table>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    printWindow?.document.write(printContent)
    printWindow?.document.close()
    printWindow?.print()
  }

  // Contador de médicos do dia
  const medicosHoje = cronograma.filter(c => c.medico).length

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header com navegacao de data */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cronograma</h1>
          <p className="text-muted-foreground">Agenda diaria e semanal por sala</p>
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
          {medicosHoje > 0 && (
            <Badge variant="secondary" className="ml-2">
              {medicosHoje} medico{medicosHoje > 1 ? 's' : ''} hoje
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agenda" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agenda (Diaria)
          </TabsTrigger>
          <TabsTrigger value="semana" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Semana
          </TabsTrigger>
          <TabsTrigger value="abertura" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Abertura
          </TabsTrigger>
          <TabsTrigger value="caixa" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Caixa
          </TabsTrigger>
        </TabsList>

        {/* =============== AGENDA DIARIA =============== */}
        <TabsContent value="agenda" className="flex-1 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Salas */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Salas do Dia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {SALAS.map(sala => {
                      const info = getSalaInfo(sala)
                      return (
                        <div
                          key={sala}
                          className={`rounded-lg border-2 p-3 transition-colors cursor-pointer hover:border-accent ${
                            info?.status === 'pronto' 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-border'
                          }`}
                          onClick={() => openSalaDialog(sala)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold">Sala {sala}</h3>
                            {info?.status === 'pronto' && (
                              <Badge className="bg-green-500 text-xs">OK</Badge>
                            )}
                          </div>
                          
                          {info?.medico ? (
                            <div className="space-y-1 text-sm">
                              <div className="font-medium truncate">{info.medico}</div>
                              {info.especialidade && (
                                <div className="text-muted-foreground truncate">{info.especialidade}</div>
                              )}
                              {info.horario_inicio && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {info.horario_inicio}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Vazia
                            </div>
                          )}
                          
                          {info?.medico && (
                            <Button
                              size="sm"
                              variant={info?.status === 'pronto' ? 'secondary' : 'default'}
                              className="mt-2 w-full text-xs"
                              onClick={(e) => { e.stopPropagation(); toggleSalaStatus(sala) }}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              {info?.status === 'pronto' ? 'Configurada' : 'Configurar'}
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  Recados do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-80 overflow-auto">
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
                          onCheckedChange={async () => {
                            await supabase.from('cronograma_notas').update({ concluido: !nota.concluido }).eq('id', nota.id)
                            loadData()
                          }}
                          className="mt-0.5"
                        />
                        <span className={`text-sm ${nota.concluido ? 'line-through text-muted-foreground' : ''}`}>
                          {nota.texto}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={async () => {
                          await supabase.from('cronograma_notas').delete().eq('id', nota.id)
                          loadData()
                        }}
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
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && novaNota.trim() && user) {
                          await supabase.from('cronograma_notas').insert({
                            data: dateStr,
                            texto: novaNota,
                            tipo: 'comum',
                            user_id: user.id
                          })
                          setNovaNota('')
                          loadData()
                        }
                      }}
                    />
                    <Button size="icon" onClick={async () => {
                      if (novaNota.trim() && user) {
                        await supabase.from('cronograma_notas').insert({
                          data: dateStr,
                          texto: novaNota,
                          tipo: 'comum',
                          user_id: user.id
                        })
                        setNovaNota('')
                        loadData()
                      }
                    }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =============== SEMANA =============== */}
        <TabsContent value="semana" className="flex-1 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cronograma Semanal</CardTitle>
                <CardDescription>Visualizacao de Segunda a Sabado</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Importar PDF
                </Button>
                <Button variant="outline">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Colar Texto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted">Sala</th>
                      {DIAS_SEMANA.map(dia => (
                        <th key={dia} className="border p-2 bg-muted">{dia}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SALAS.map(sala => (
                      <tr key={sala}>
                        <td className="border p-2 font-medium bg-muted/50">{sala}</td>
                        {DIAS_SEMANA.map(dia => {
                          const agenda = agendaSemanal.find(a => a.sala === sala && a.dia === dia)
                          return (
                            <td key={dia} className="border p-2 text-center">
                              {agenda?.medico ? (
                                <div>
                                  <div className="font-medium text-xs">{agenda.medico}</div>
                                  <div className="text-xs text-muted-foreground">{agenda.especialidade}</div>
                                </div>
                              ) : '-'}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============== ABERTURA/CHECKLIST =============== */}
        <TabsContent value="abertura" className="flex-1 mt-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Checklist de Abertura</CardTitle>
                <CardDescription>Itens a verificar ao abrir a clinica</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingChecklist(!editingChecklist)}>
                  <Edit className="mr-1 h-3 w-3" />
                  {editingChecklist ? 'Concluir' : 'Editar'}
                </Button>
                <Button variant="outline" size="sm" onClick={resetChecklist}>
                  Resetar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklist.map(item => (
                  <div 
                    key={item.item_id} 
                    className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                      item.feito ? 'bg-green-50 border-green-300' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={item.feito}
                        onCheckedChange={() => toggleCheckItem(item)}
                      />
                      <div>
                        <p className={`font-medium ${item.feito ? 'line-through text-muted-foreground' : ''}`}>
                          {item.titulo}
                        </p>
                        {item.instrucao && (
                          <p className="text-sm text-muted-foreground">{item.instrucao}</p>
                        )}
                      </div>
                    </div>
                    {editingChecklist && item.item_id.startsWith('custom_') && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeCheckItem(item.item_id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {editingChecklist && (
                  <div className="mt-4 rounded-lg border border-dashed p-4">
                    <h4 className="font-medium mb-2">Adicionar novo item</h4>
                    <div className="space-y-2">
                      <Input
                        placeholder="Titulo do item"
                        value={novoCheckItem.titulo}
                        onChange={(e) => setNovoCheckItem({ ...novoCheckItem, titulo: e.target.value })}
                      />
                      <Input
                        placeholder="Instrucao (opcional)"
                        value={novoCheckItem.instrucao}
                        onChange={(e) => setNovoCheckItem({ ...novoCheckItem, instrucao: e.target.value })}
                      />
                      <Button onClick={addCheckItem} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Item
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============== CAIXA =============== */}
        <TabsContent value="caixa" className="flex-1 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Entradas e Saídas */}
            <Card>
              <CardHeader>
                <CardTitle>Movimentacao do Caixa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Entradas (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      defaultValue={caixa?.entradas || ''}
                      onBlur={(e) => saveCaixa('entradas', e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div>
                    <Label>Saidas (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      defaultValue={caixa?.saidas || ''}
                      onBlur={(e) => saveCaixa('saidas', e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Saldo:</span>
                      <span className={((caixa?.entradas || 0) - (caixa?.saidas || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        R$ {((caixa?.entradas || 0) - (caixa?.saidas || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vales/Trocos */}
            <Card>
              <CardHeader>
                <CardTitle>Vales e Trocos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Paciente"
                      value={novoVale.paciente}
                      onChange={(e) => setNovoVale({ ...novoVale, paciente: e.target.value })}
                    />
                    <Input
                      placeholder="CPF"
                      value={novoVale.cpf}
                      onChange={(e) => setNovoVale({ ...novoVale, cpf: e.target.value })}
                    />
                    <Input
                      placeholder="Especialidade/Medico"
                      value={novoVale.especialidade}
                      onChange={(e) => setNovoVale({ ...novoVale, especialidade: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Valor"
                      value={novoVale.valor}
                      onChange={(e) => setNovoVale({ ...novoVale, valor: e.target.value })}
                    />
                  </div>
                  <Button onClick={addVale} className="w-full" disabled={!novoVale.paciente || !novoVale.valor}>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Vale
                  </Button>

                  <div className="max-h-40 overflow-auto space-y-2">
                    {vales.map(vale => (
                      <div key={vale.id} className="flex items-center justify-between rounded bg-muted p-2 text-sm">
                        <div>
                          <span className="font-medium">{vale.paciente}</span>
                          <span className="ml-2 text-muted-foreground">R$ {vale.valor.toFixed(2)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{vale.hora}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Relatório do AMEI */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Relatorio de Caixa (AMEI)</CardTitle>
                <CardDescription>Cole os dados do sistema AMEI para gerar o relatorio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Cole aqui os dados copiados do AMEI..."
                      value={relatorioAmei}
                      onChange={(e) => setRelatorioAmei(e.target.value)}
                      rows={8}
                    />
                    <div>
                      <Label>Atendente Responsavel</Label>
                      <Select value={atendenteRelatorio} onValueChange={setAtendenteRelatorio}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {atendentes.map(a => (
                            <SelectItem key={a.id} value={a.nome}>{a.apelido || a.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={processarRelatorioAmei} className="w-full">
                      Processar Relatorio
                    </Button>
                  </div>

                  {relatorioProcessado && (
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <h4 className="font-medium mb-3">Resumo por Forma de Pagamento</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Cartao de Credito:</span>
                            <span className="font-medium">R$ {relatorioProcessado.credito.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cartao de Debito:</span>
                            <span className="font-medium">R$ {relatorioProcessado.debito.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PIX:</span>
                            <span className="font-medium">R$ {relatorioProcessado.pix.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Dinheiro:</span>
                            <span className="font-medium">R$ {relatorioProcessado.dinheiro.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 text-lg font-bold">
                            <span>TOTAL:</span>
                            <span className="text-green-600">R$ {relatorioProcessado.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={imprimirRelatorio} className="w-full">
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Relatorio
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para editar sala */}
      <Dialog open={!!dialogSala} onOpenChange={() => setDialogSala(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sala {dialogSala}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Medico</Label>
              <Input
                value={novoMedico}
                onChange={(e) => setNovoMedico(e.target.value)}
                placeholder="Nome do medico"
              />
            </div>
            <div>
              <Label>Especialidade</Label>
              <Input
                value={novaEspecialidade}
                onChange={(e) => setNovaEspecialidade(e.target.value)}
                placeholder="Ex: Cardiologia"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Horario Inicio</Label>
                <Input
                  type="time"
                  value={novoHorarioInicio}
                  onChange={(e) => setNovoHorarioInicio(e.target.value)}
                />
              </div>
              <div>
                <Label>Horario Fim</Label>
                <Input
                  type="time"
                  value={novoHorarioFim}
                  onChange={(e) => setNovoHorarioFim(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogSala(null)}>Cancelar</Button>
            <Button onClick={saveSala} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
