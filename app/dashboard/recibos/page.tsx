'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  Receipt,
  Plus, 
  Trash2,
  FileText,
  Copy,
  Check,
  Users
} from 'lucide-react'
import type { Colaborador, Recibo } from '@/lib/types'

const CATEGORIAS = [
  'Vale Transporte',
  'Vale Refeicao',
  'Salario',
  'Bonificacao',
  'Comissao',
  'Ajuda de Custo',
  'Adiantamento',
  'Outros'
]

interface ReciboSelecionado {
  colaborador: Colaborador
  categoria: string
  valor: number
}

export default function RecibosPage() {
  const { usuario, isFinanceiro } = useAuth()
  const supabase = createClient()
  
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [recibos, setRecibos] = useState<ReciboSelecionado[]>([])
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('pix')
  const [isLoading, setIsLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedColaborador, setSelectedColaborador] = useState<Colaborador | null>(null)
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [valorRecibo, setValorRecibo] = useState('')

  useEffect(() => {
    loadColaboradores()
  }, [])

  const loadColaboradores = async () => {
    const { data } = await supabase
      .from('colaboradores')
      .select('*')
      .eq('ativo', true)
      .order('nome')
    
    if (data) setColaboradores(data)
    setIsLoading(false)
  }

  const addRecibo = () => {
    if (!selectedColaborador || !selectedCategoria || !valorRecibo) return
    
    setRecibos([...recibos, {
      colaborador: selectedColaborador,
      categoria: selectedCategoria,
      valor: parseFloat(valorRecibo)
    }])
    
    setDialogOpen(false)
    setSelectedColaborador(null)
    setSelectedCategoria('')
    setValorRecibo('')
  }

  const removeRecibo = (index: number) => {
    setRecibos(recibos.filter((_, i) => i !== index))
  }

  const totalRecibos = recibos.reduce((sum, r) => sum + r.valor, 0)

  const salvarRecibos = async () => {
    if (!usuario || recibos.length === 0) return
    
    const recibosData = recibos.map(r => ({
      colaborador_id: r.colaborador.id,
      categoria: r.categoria,
      valor: r.valor,
      forma_pagamento: formaPagamento,
      periodo_inicio: periodoInicio || null,
      periodo_fim: periodoFim || null,
      user_id: usuario.id
    }))
    
    await supabase.from('recibos').insert(recibosData)
    
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const copiarRecibos = () => {
    let texto = `RECIBOS - AMOR SAUDE PIRITUBA\n`
    texto += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`
    if (periodoInicio && periodoFim) {
      texto += `Periodo: ${new Date(periodoInicio).toLocaleDateString('pt-BR')} a ${new Date(periodoFim).toLocaleDateString('pt-BR')}\n`
    }
    texto += `\n`
    
    recibos.forEach((r, i) => {
      texto += `${i + 1}. ${r.colaborador.nome}\n`
      texto += `   CPF: ${r.colaborador.cpf}\n`
      texto += `   ${r.categoria}: R$ ${r.valor.toFixed(2)}\n\n`
    })
    
    texto += `TOTAL: R$ ${totalRecibos.toFixed(2)}\n`
    texto += `Forma de Pagamento: ${formaPagamento.toUpperCase()}`
    
    navigator.clipboard.writeText(texto)
  }

  const limparRecibos = () => {
    setRecibos([])
    setPeriodoInicio('')
    setPeriodoFim('')
  }

  if (!isFinanceiro) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-8 text-center">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
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
          <h1 className="text-3xl font-bold text-foreground">Geracao de Recibos</h1>
          <p className="text-muted-foreground">Gerar recibos em lote para colaboradores</p>
        </div>
        {saved && (
          <Badge className="bg-green-500">
            <Check className="mr-1 h-3 w-3" />
            Recibos salvos!
          </Badge>
        )}
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        {/* Painel de configuracao */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Adicionar Recibos</span>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Recibo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Recibo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Colaborador</label>
                      <Select
                        value={selectedColaborador?.id || ''}
                        onValueChange={(id) => {
                          const col = colaboradores.find(c => c.id === id)
                          setSelectedColaborador(col || null)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {colaboradores.map(col => (
                            <SelectItem key={col.id} value={col.id}>
                              {col.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Categoria</label>
                      <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIAS.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Valor</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={valorRecibo}
                        onChange={(e) => setValorRecibo(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={addRecibo}>
                      Adicionar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            {/* Periodo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Periodo Inicio</label>
                <Input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Periodo Fim</label>
                <Input
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                />
              </div>
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

            <Separator />

            {/* Lista de recibos */}
            <div className="flex-1 space-y-2 overflow-auto">
              {recibos.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="mx-auto h-8 w-8 mb-2" />
                    <p>Nenhum recibo adicionado</p>
                    {colaboradores.length === 0 && (
                      <p className="text-xs mt-2">
                        Cadastre colaboradores na area de administracao
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                recibos.map((recibo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{recibo.colaborador.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {recibo.categoria}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-primary">
                        R$ {recibo.valor.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => removeRecibo(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Painel de resumo */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumo dos Recibos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex-1">
              {/* Resumo por colaborador */}
              {recibos.length > 0 && (
                <div className="space-y-4">
                  {Array.from(new Set(recibos.map(r => r.colaborador.id))).map(colId => {
                    const col = recibos.find(r => r.colaborador.id === colId)?.colaborador
                    const colRecibos = recibos.filter(r => r.colaborador.id === colId)
                    const colTotal = colRecibos.reduce((sum, r) => sum + r.valor, 0)
                    
                    return (
                      <div key={colId} className="rounded-lg bg-muted p-4">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{col?.nome}</p>
                            <p className="text-sm text-muted-foreground">CPF: {col?.cpf}</p>
                          </div>
                          <p className="font-bold text-primary">R$ {colTotal.toFixed(2)}</p>
                        </div>
                        <div className="mt-2 space-y-1">
                          {colRecibos.map((r, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{r.categoria}</span>
                              <span>R$ {r.valor.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total Geral:</span>
                <span className="text-primary">R$ {totalRecibos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Quantidade de recibos:</span>
                <span>{recibos.length}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Colaboradores:</span>
                <span>{new Set(recibos.map(r => r.colaborador.id)).size}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={salvarRecibos}
                  disabled={recibos.length === 0}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={copiarRecibos}
                  disabled={recibos.length === 0}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={limparRecibos}
                disabled={recibos.length === 0}
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
