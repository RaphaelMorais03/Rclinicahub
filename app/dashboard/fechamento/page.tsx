'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  ClipboardList,
  Plus, 
  Trash2,
  Calculator,
  Copy,
  Check
} from 'lucide-react'
import { calcularImpostosPJ, type Profissional, type FechamentoForm } from '@/lib/types'

interface ItemFechamento {
  quantidade: number
  descricao: string
  valor_unitario: number
}

export default function FechamentoPage() {
  const { usuario, isFinanceiro } = useAuth()
  const supabase = createClient()
  
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null)
  const [itens, setItens] = useState<ItemFechamento[]>([])
  const [novoItem, setNovoItem] = useState<ItemFechamento>({ quantidade: 1, descricao: '', valor_unitario: 0 })
  const [formaPagamento, setFormaPagamento] = useState('pix')
  const [isLoading, setIsLoading] = useState(true)
  const [saved, setSaved] = useState(false)

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
  
  const impostos = selectedProfissional?.regime === 'pj-presumido' 
    ? calcularImpostosPJ(subtotal) 
    : { pis: 0, cofins: 0, csll: 0, irrf: 0, totalImpostos: 0, liquido: subtotal }

  const salvarFechamento = async () => {
    if (!selectedProfissional || !usuario || itens.length === 0) return
    
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
        user_id: usuario.id
      })
      .select()
      .single()
    
    if (fechamento) {
      // Inserir itens
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
    
    if (selectedProfissional.regime === 'pj-presumido') {
      texto += `\nIMPOSTOS PJ PRESUMIDO:\n`
      texto += `PIS (0.65%): R$ ${impostos.pis.toFixed(2)}\n`
      texto += `COFINS (3%): R$ ${impostos.cofins.toFixed(2)}\n`
      texto += `CSLL (2.88%): R$ ${impostos.csll.toFixed(2)}\n`
      texto += `IRRF (4.8%): R$ ${impostos.irrf.toFixed(2)}\n`
      texto += `Total Impostos: R$ ${impostos.totalImpostos.toFixed(2)}\n`
    }
    
    texto += `\nVALOR LIQUIDO: R$ ${impostos.liquido.toFixed(2)}\n`
    texto += `Forma de pagamento: ${formaPagamento.toUpperCase()}`
    
    if (selectedProfissional.chave_pix) {
      texto += `\nChave PIX: ${selectedProfissional.chave_pix}`
    }
    
    navigator.clipboard.writeText(texto)
  }

  const limparFechamento = () => {
    setSelectedProfissional(null)
    setItens([])
    setFormaPagamento('pix')
  }

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
        <div className="text-muted-foreground">Carregando...</div>
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

      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        {/* Painel de entrada */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Dados do Fechamento</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6">
            {/* Selecao do profissional */}
            <div>
              <label className="text-sm font-medium">Profissional</label>
              <Select
                value={selectedProfissional?.id || ''}
                onValueChange={(id) => {
                  const prof = profissionais.find(p => p.id === id)
                  setSelectedProfissional(prof || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional..." />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.map(prof => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.nome} ({prof.regime === 'pj-presumido' ? 'PJ' : 'CLT'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {profissionais.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhum profissional cadastrado. Adicione na area de administracao.
                </p>
              )}
            </div>

            {selectedProfissional && (
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedProfissional.nome}</p>
                    <p className="text-sm text-muted-foreground">CPF: {selectedProfissional.cpf}</p>
                  </div>
                  <Badge variant={selectedProfissional.regime === 'pj-presumido' ? 'default' : 'secondary'}>
                    {selectedProfissional.regime === 'pj-presumido' ? 'PJ Presumido' : 'Funcionario'}
                  </Badge>
                </div>
              </div>
            )}

            {/* Adicionar itens */}
            <div>
              <label className="text-sm font-medium">Adicionar Item</label>
              <div className="mt-2 flex gap-2">
                <Input
                  type="number"
                  min="1"
                  className="w-20"
                  placeholder="Qtd"
                  value={novoItem.quantidade || ''}
                  onChange={(e) => setNovoItem({ ...novoItem, quantidade: parseInt(e.target.value) || 1 })}
                />
                <Input
                  className="flex-1"
                  placeholder="Descricao (ex: Consulta, Procedimento...)"
                  value={novoItem.descricao}
                  onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.01"
                  className="w-28"
                  placeholder="Valor"
                  value={novoItem.valor_unitario || ''}
                  onChange={(e) => setNovoItem({ ...novoItem, valor_unitario: parseFloat(e.target.value) || 0 })}
                />
                <Button onClick={addItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Lista de itens */}
            <div className="flex-1 space-y-2 overflow-auto">
              {itens.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  Adicione itens ao fechamento
                </div>
              ) : (
                itens.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <span className="font-medium">{item.quantidade}x</span>{' '}
                      <span>{item.descricao}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-primary">
                        R$ {(item.quantidade * item.valor_unitario).toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Forma de pagamento */}
            <div>
              <label className="text-sm font-medium">Forma de Pagamento</label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Painel de resumo */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Resumo do Fechamento
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex-1 space-y-4">
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
              </div>

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
                <span className="text-primary">R$ {impostos.liquido.toFixed(2)}</span>
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
                  className="flex-1"
                  onClick={salvarFechamento}
                  disabled={!selectedProfissional || itens.length === 0}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={copiarFechamento}
                  disabled={!selectedProfissional || itens.length === 0}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={limparFechamento}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Tudo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
