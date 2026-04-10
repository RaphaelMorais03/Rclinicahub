'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  ClipboardList,
  Plus, 
  Trash2,
  Calculator,
  Copy,
  Check,
  Printer,
  Download,
  Upload,
  Search,
  Edit,
  Loader2,
  Users
} from 'lucide-react'
import { calcularImpostosPJ, calcularRepasse, type Profissional, FORMAS_PAGAMENTO } from '@/lib/types'

interface ItemFechamento {
  quantidade: number
  descricao: string
  valor_unitario: number
}

type ActiveTab = 'fechamento' | 'profissionais'

export default function FechamentoPage() {
  const { usuario, user, isFinanceiro } = useAuth()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('fechamento')
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null)
  const [itens, setItens] = useState<ItemFechamento[]>([])
  const [novoItem, setNovoItem] = useState<ItemFechamento>({ quantidade: 1, descricao: '', valor_unitario: 0 })
  const [formaPagamento, setFormaPagamento] = useState('PIX')
  const [observacoes, setObservacoes] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Dialog para profissional
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProfissional, setEditingProfissional] = useState<Profissional | null>(null)
  const [formProfissional, setFormProfissional] = useState({
    nome: '',
    cpf: '',
    especialidade: '',
    percentual: '100',
    tipo: 'medico' as 'medico' | 'terapeuta' | 'parceiro',
    regime: 'funcionario' as 'funcionario' | 'pj-presumido',
    chave_pix: ''
  })

  useEffect(() => {
    loadProfissionais()
  }, [])

  const loadProfissionais = async () => {
    const { data } = await supabase
      .from('profissionais')
      .select('*')
      .eq('ativo', true)
      .order('nome')
    
    if (data) setProfissionais(data)
    setIsLoading(false)
  }

  const addItem = () => {
    if (!novoItem.descricao || novoItem.valor_unitario <= 0) return
    setItens([...itens, novoItem])
    setNovoItem({ quantidade: 1, descricao: '', valor_unitario: 0 })
  }

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const subtotal = itens.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0)
  
  // Calcular repasse baseado no percentual do profissional
  const percentualRepasse = selectedProfissional?.percentual || 100
  const valorRepasse = calcularRepasse(subtotal, percentualRepasse)
  
  const impostos = selectedProfissional?.regime === 'pj-presumido' 
    ? calcularImpostosPJ(valorRepasse) 
    : { pis: 0, cofins: 0, csll: 0, irrf: 0, totalImpostos: 0, liquido: valorRepasse }

  const salvarFechamento = async () => {
    if (!selectedProfissional || !user || itens.length === 0) return
    
    setSaving(true)
    const { data: fechamento, error } = await supabase
      .from('fechamentos')
      .insert({
        profissional_id: selectedProfissional.id,
        subtotal,
        pis: impostos.pis,
        cofins: impostos.cofins,
        csll: impostos.csll,
        irrf: impostos.irrf,
        liquido: impostos.liquido,
        forma_pagamento: formaPagamento,
        user_id: user.id
      })
      .select()
      .single()
    
    if (fechamento) {
      await supabase.from('fechamento_itens').insert(
        itens.map(item => ({
          fechamento_id: fechamento.id,
          quantidade: item.quantidade,
          descricao: item.descricao,
          valor_unitario: item.valor_unitario,
          valor_total: item.quantidade * item.valor_unitario
        }))
      )
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  // Função para converter número em extenso
  const numeroExtenso = (valor: number): string => {
    const unidades = ['', 'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']
    
    const inteiro = Math.floor(valor)
    const centavos = Math.round((valor - inteiro) * 100)
    
    let extenso = ''
    
    if (inteiro >= 1000) {
      const milhares = Math.floor(inteiro / 1000)
      extenso += milhares === 1 ? 'mil' : `${unidades[milhares]} mil`
      const resto = inteiro % 1000
      if (resto > 0) extenso += ' e '
      else return extenso + ' reais'
    }
    
    const resto = inteiro % 1000
    if (resto >= 100) {
      if (resto === 100) extenso += 'cem'
      else extenso += centenas[Math.floor(resto / 100)]
      const dezena = resto % 100
      if (dezena > 0) extenso += ' e '
    }
    
    const dezena = resto % 100
    if (dezena >= 20) {
      extenso += dezenas[Math.floor(dezena / 10)]
      const unidade = dezena % 10
      if (unidade > 0) extenso += ' e ' + unidades[unidade]
    } else if (dezena >= 10) {
      const especiais = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
      extenso += especiais[dezena - 10]
    } else if (dezena > 0) {
      extenso += unidades[dezena]
    }
    
    if (inteiro > 0) extenso += inteiro === 1 ? ' real' : ' reais'
    
    if (centavos > 0) {
      if (inteiro > 0) extenso += ' e '
      extenso += `${centavos} centavo${centavos > 1 ? 's' : ''}`
    }
    
    return extenso || 'zero reais'
  }

  const gerarRecibo = () => {
    if (!selectedProfissional) return
    
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo - ${selectedProfissional.nome}</title>
          <style>
            @page { size: A4; margin: 2cm; }
            body { 
              font-family: 'Times New Roman', serif; 
              font-size: 14px; 
              line-height: 1.6;
              color: #333;
            }
            .container { max-width: 700px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; }
            .titulo { text-align: center; font-size: 20px; font-weight: bold; margin: 30px 0; text-transform: uppercase; }
            .dados { margin: 20px 0; }
            .dados p { margin: 8px 0; }
            .tabela { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .tabela th, .tabela td { border: 1px solid #ccc; padding: 10px; text-align: left; }
            .tabela th { background: #f5f5f5; }
            .tabela .valor { text-align: right; }
            .total { font-size: 18px; font-weight: bold; text-align: right; margin: 20px 0; }
            .extenso { font-style: italic; margin: 10px 0; padding: 10px; background: #f9f9f9; }
            .assinatura { margin-top: 80px; text-align: center; }
            .assinatura .linha { border-top: 1px solid #333; width: 300px; margin: 0 auto; }
            .assinatura p { margin: 10px 0; }
            .obs { margin-top: 30px; padding: 15px; background: #f5f5f5; border-left: 4px solid #333; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AMOR SAUDE PIRITUBA</h1>
              <p>Portal Interno - Sistema de Fechamento Medico</p>
            </div>
            
            <div class="titulo">RECIBO DE PAGAMENTO</div>
            
            <div class="dados">
              <p><strong>Profissional:</strong> ${selectedProfissional.nome}</p>
              <p><strong>CPF:</strong> ${selectedProfissional.cpf}</p>
              ${selectedProfissional.especialidade ? `<p><strong>Especialidade:</strong> ${selectedProfissional.especialidade}</p>` : ''}
              <p><strong>Regime:</strong> ${selectedProfissional.regime === 'pj-presumido' ? 'PJ Presumido' : 'Funcionario (CLT)'}</p>
              <p><strong>Data:</strong> ${dataAtual}</p>
            </div>
            
            <table class="tabela">
              <thead>
                <tr>
                  <th>Qtd</th>
                  <th>Descricao</th>
                  <th class="valor">Valor Unit.</th>
                  <th class="valor">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itens.map(item => `
                  <tr>
                    <td>${item.quantidade}</td>
                    <td>${item.descricao}</td>
                    <td class="valor">R$ ${item.valor_unitario.toFixed(2)}</td>
                    <td class="valor">R$ ${(item.quantidade * item.valor_unitario).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              <p>Subtotal: R$ ${subtotal.toFixed(2)}</p>
              ${percentualRepasse < 100 ? `<p>Repasse (${percentualRepasse}%): R$ ${valorRepasse.toFixed(2)}</p>` : ''}
              ${selectedProfissional.regime === 'pj-presumido' ? `
                <p style="font-size: 12px; color: #666;">Impostos retidos: R$ ${impostos.totalImpostos.toFixed(2)}</p>
              ` : ''}
              <p style="font-size: 22px; color: #000;">VALOR LIQUIDO: R$ ${impostos.liquido.toFixed(2)}</p>
            </div>
            
            <div class="extenso">
              <strong>Valor por extenso:</strong> ${numeroExtenso(impostos.liquido)}
            </div>
            
            <p><strong>Forma de Pagamento:</strong> ${formaPagamento}</p>
            ${selectedProfissional.chave_pix ? `<p><strong>Chave PIX:</strong> ${selectedProfissional.chave_pix}</p>` : ''}
            
            ${observacoes ? `<div class="obs"><strong>Observacoes:</strong><br/>${observacoes}</div>` : ''}
            
            <div class="assinatura">
              <div class="linha"></div>
              <p>${selectedProfissional.nome}</p>
              <p style="font-size: 12px;">CPF: ${selectedProfissional.cpf}</p>
            </div>
          </div>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    printWindow?.document.write(printContent)
    printWindow?.document.close()
    printWindow?.print()
  }

  const copiarFechamento = () => {
    if (!selectedProfissional) return
    
    let texto = `FECHAMENTO - ${selectedProfissional.nome}\n`
    texto += `CPF: ${selectedProfissional.cpf}\n`
    texto += `Regime: ${selectedProfissional.regime === 'pj-presumido' ? 'PJ Presumido' : 'Funcionario'}\n\n`
    texto += `ITENS:\n`
    
    itens.forEach((item, i) => {
      texto += `${i + 1}. ${item.quantidade}x ${item.descricao} - R$ ${(item.quantidade * item.valor_unitario).toFixed(2)}\n`
    })
    
    texto += `\nSUBTOTAL: R$ ${subtotal.toFixed(2)}\n`
    if (percentualRepasse < 100) {
      texto += `REPASSE (${percentualRepasse}%): R$ ${valorRepasse.toFixed(2)}\n`
    }
    
    if (selectedProfissional.regime === 'pj-presumido') {
      texto += `\nIMPOSTOS PJ PRESUMIDO:\n`
      texto += `PIS (0.65%): R$ ${impostos.pis.toFixed(2)}\n`
      texto += `COFINS (3%): R$ ${impostos.cofins.toFixed(2)}\n`
      texto += `CSLL (2.88%): R$ ${impostos.csll.toFixed(2)}\n`
      texto += `IRRF (4.8%): R$ ${impostos.irrf.toFixed(2)}\n`
      texto += `Total Impostos: R$ ${impostos.totalImpostos.toFixed(2)}\n`
    }
    
    texto += `\nVALOR LIQUIDO: R$ ${impostos.liquido.toFixed(2)}\n`
    texto += `Forma de pagamento: ${formaPagamento}`
    
    if (selectedProfissional.chave_pix) {
      texto += `\nChave PIX: ${selectedProfissional.chave_pix}`
    }
    
    navigator.clipboard.writeText(texto)
  }

  const limparFechamento = () => {
    setSelectedProfissional(null)
    setItens([])
    setFormaPagamento('PIX')
    setObservacoes('')
  }

  // ============== PROFISSIONAIS CRUD ==============
  const openDialogProfissional = (prof?: Profissional) => {
    if (prof) {
      setEditingProfissional(prof)
      setFormProfissional({
        nome: prof.nome,
        cpf: prof.cpf,
        especialidade: prof.especialidade || '',
        percentual: (prof.percentual || 100).toString(),
        tipo: prof.tipo || 'medico',
        regime: prof.regime,
        chave_pix: prof.chave_pix || ''
      })
    } else {
      setEditingProfissional(null)
      setFormProfissional({
        nome: '',
        cpf: '',
        especialidade: '',
        percentual: '100',
        tipo: 'medico',
        regime: 'funcionario',
        chave_pix: ''
      })
    }
    setDialogOpen(true)
  }

  const saveProfissional = async () => {
    setSaving(true)
    const data = {
      nome: formProfissional.nome,
      cpf: formProfissional.cpf,
      especialidade: formProfissional.especialidade || null,
      percentual: parseFloat(formProfissional.percentual) || 100,
      tipo: formProfissional.tipo,
      regime: formProfissional.regime,
      chave_pix: formProfissional.chave_pix || null
    }

    if (editingProfissional) {
      await supabase.from('profissionais').update(data).eq('id', editingProfissional.id)
    } else {
      await supabase.from('profissionais').insert(data)
    }

    setDialogOpen(false)
    setSaving(false)
    loadProfissionais()
  }

  const deleteProfissional = async (id: string) => {
    await supabase.from('profissionais').update({ ativo: false }).eq('id', id)
    loadProfissionais()
  }

  const exportarProfissionais = () => {
    const data = JSON.stringify(profissionais, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `profissionais_${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const importarProfissionais = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (Array.isArray(data)) {
          for (const prof of data) {
            await supabase.from('profissionais').insert({
              nome: prof.nome,
              cpf: prof.cpf,
              especialidade: prof.especialidade,
              percentual: prof.percentual || 100,
              tipo: prof.tipo || 'medico',
              regime: prof.regime || 'funcionario',
              chave_pix: prof.chave_pix
            })
          }
          loadProfissionais()
        }
      } catch {
        alert('Erro ao importar arquivo')
      }
    }
    reader.readAsText(file)
  }

  const filteredProfissionais = profissionais.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf.includes(searchTerm)
  )

  if (!isFinanceiro) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-8 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Acesso Restrito</h2>
          <p className="mt-2 text-muted-foreground">
            Apenas usuarios com cargo financeiro ou admin podem acessar esta pagina.
          </p>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fechamento Medico</h1>
          <p className="text-muted-foreground">Calcular repasses com impostos PJ Presumido</p>
        </div>
        {saved && (
          <Badge className="bg-green-500">
            <Check className="mr-1 h-3 w-3" />
            Salvo com sucesso!
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="fechamento" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Fechamento
          </TabsTrigger>
          <TabsTrigger value="profissionais" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Profissionais
          </TabsTrigger>
        </TabsList>

        {/* =============== FECHAMENTO =============== */}
        <TabsContent value="fechamento" className="flex-1 mt-6">
          <div className="grid flex-1 gap-6 lg:grid-cols-2">
            {/* Painel de entrada */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Etapa 1 - Selecionar Profissional</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="max-h-40 overflow-auto space-y-2">
                  {filteredProfissionais.map(prof => (
                    <div
                      key={prof.id}
                      onClick={() => setSelectedProfissional(prof)}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors hover:border-accent ${
                        selectedProfissional?.id === prof.id ? 'border-accent bg-accent/10' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{prof.nome}</p>
                          <p className="text-sm text-muted-foreground">{prof.especialidade || prof.tipo}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={prof.regime === 'pj-presumido' ? 'default' : 'secondary'}>
                            {prof.regime === 'pj-presumido' ? 'PJ' : 'CLT'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{prof.percentual}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedProfissional && (
                  <>
                    <Separator />
                    <div>
                      <CardTitle className="text-base mb-4">Etapa 2 - Lancamento</CardTitle>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          className="w-16"
                          placeholder="Qtd"
                          value={novoItem.quantidade || ''}
                          onChange={(e) => setNovoItem({ ...novoItem, quantidade: parseInt(e.target.value) || 1 })}
                        />
                        <Input
                          className="flex-1"
                          placeholder="Descricao"
                          value={novoItem.descricao}
                          onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          className="w-24"
                          placeholder="Valor"
                          value={novoItem.valor_unitario || ''}
                          onChange={(e) => setNovoItem({ ...novoItem, valor_unitario: parseFloat(e.target.value) || 0 })}
                        />
                        <Button onClick={addItem}><Plus className="h-4 w-4" /></Button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 overflow-auto max-h-40">
                      {itens.map((item, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg border p-2">
                          <span className="text-sm">{item.quantidade}x {item.descricao}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">R$ {(item.quantidade * item.valor_unitario).toFixed(2)}</span>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeItem(index)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Forma de Pagamento</Label>
                        <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FORMAS_PAGAMENTO.map(f => (
                              <SelectItem key={f} value={f}>{f}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Observacoes</Label>
                        <Textarea
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Observacoes..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Painel de resumo */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Etapa 3 - Resultado
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between text-lg">
                    <span>Total Bruto:</span>
                    <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
                  </div>

                  {selectedProfissional && percentualRepasse < 100 && (
                    <div className="flex justify-between text-lg text-amber-600">
                      <span>Repasse ({percentualRepasse}%):</span>
                      <span className="font-bold">R$ {valorRepasse.toFixed(2)}</span>
                    </div>
                  )}

                  {selectedProfissional?.regime === 'pj-presumido' && subtotal > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="font-medium text-muted-foreground">Impostos PJ Presumido:</p>
                        <div className="rounded-lg bg-destructive/10 p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>PIS (0.65%)</span>
                            <span className="text-destructive">- R$ {impostos.pis.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>COFINS (3%)</span>
                            <span className="text-destructive">- R$ {impostos.cofins.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>CSLL (2.88%)</span>
                            <span className="text-destructive">- R$ {impostos.csll.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>IRRF (4.8%)</span>
                            <span className="text-destructive">- R$ {impostos.irrf.toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Total Impostos</span>
                            <span className="text-destructive">- R$ {impostos.totalImpostos.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex justify-between text-2xl font-bold">
                    <span>Valor Liquido:</span>
                    <span className="text-green-600">R$ {impostos.liquido.toFixed(2)}</span>
                  </div>

                  {selectedProfissional?.chave_pix && (
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm text-muted-foreground">Chave PIX:</p>
                      <p className="font-mono">{selectedProfissional.chave_pix}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-accent text-accent-foreground"
                      onClick={salvarFechamento}
                      disabled={!selectedProfissional || itens.length === 0 || saving}
                    >
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={gerarRecibo}
                      disabled={!selectedProfissional || itens.length === 0}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Recibo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={copiarFechamento}
                      disabled={!selectedProfissional || itens.length === 0}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="destructive" className="w-full" onClick={limparFechamento}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =============== PROFISSIONAIS =============== */}
        <TabsContent value="profissionais" className="flex-1 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciar Profissionais</CardTitle>
                <CardDescription>Medicos, terapeutas e parceiros</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportarProfissionais}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                <label>
                  <input type="file" accept=".json" onChange={importarProfissionais} className="hidden" />
                  <Button variant="outline" asChild>
                    <span><Upload className="mr-2 h-4 w-4" />Importar</span>
                  </Button>
                </label>
                <Button onClick={() => openDialogProfissional()} className="bg-accent text-accent-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {profissionais.map(prof => (
                  <div key={prof.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{prof.nome}</p>
                        <p className="text-sm text-muted-foreground">{prof.cpf}</p>
                        <p className="text-sm text-muted-foreground">{prof.especialidade}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openDialogProfissional(prof)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteProfissional(prof.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Badge variant={prof.regime === 'pj-presumido' ? 'default' : 'secondary'}>
                        {prof.regime === 'pj-presumido' ? 'PJ' : 'CLT'}
                      </Badge>
                      <Badge variant="outline">{prof.percentual}%</Badge>
                      <Badge variant="outline">{prof.tipo}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de profissional */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProfissional ? 'Editar' : 'Novo'} Profissional</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formProfissional.nome}
                  onChange={(e) => setFormProfissional({ ...formProfissional, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>CPF *</Label>
                <Input
                  value={formProfissional.cpf}
                  onChange={(e) => setFormProfissional({ ...formProfissional, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Especialidade</Label>
                <Input
                  value={formProfissional.especialidade}
                  onChange={(e) => setFormProfissional({ ...formProfissional, especialidade: e.target.value })}
                />
              </div>
              <div>
                <Label>Percentual de Repasse (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formProfissional.percentual}
                  onChange={(e) => setFormProfissional({ ...formProfissional, percentual: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={formProfissional.tipo} onValueChange={(v) => setFormProfissional({ ...formProfissional, tipo: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medico">Medico</SelectItem>
                    <SelectItem value="terapeuta">Terapeuta</SelectItem>
                    <SelectItem value="parceiro">Parceiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Regime</Label>
                <Select value={formProfissional.regime} onValueChange={(v) => setFormProfissional({ ...formProfissional, regime: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="funcionario">Funcionario (CLT)</SelectItem>
                    <SelectItem value="pj-presumido">PJ Presumido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Chave PIX</Label>
              <Input
                value={formProfissional.chave_pix}
                onChange={(e) => setFormProfissional({ ...formProfissional, chave_pix: e.target.value })}
                placeholder="CPF, email, telefone ou chave aleatoria"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveProfissional} disabled={saving || !formProfissional.nome || !formProfissional.cpf}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
