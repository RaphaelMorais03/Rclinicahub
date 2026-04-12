'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Receipt,
  Plus, 
  Trash2,
  FileText,
  Copy,
  Check,
  Users,
  Printer,
  Search,
  Edit,
  Loader2,
  Home
} from 'lucide-react'
import Link from 'next/link'
import type { Colaborador } from '@/lib/types'
import { CATEGORIAS_RECIBO, FORMAS_PAGAMENTO } from '@/lib/types'

type ActiveTab = 'recibos' | 'colaboradores'

export default function RecibosPage() {
  const { usuario, user, isFinanceiro } = useAuth()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('recibos')
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [categoria, setCategoria] = useState('Salário')
  const [formaPagamento, setFormaPagamento] = useState('PIX')
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0])
  const [valorFixo, setValorFixo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null)
  const [formColaborador, setFormColaborador] = useState({
    nome: '',
    cpf: '',
    cargo: '',
    valor_padrao: ''
  })

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

  const filteredColaboradores = colaboradores.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf.includes(searchTerm)
  )

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const selectAll = () => {
    if (selectedIds.size === filteredColaboradores.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredColaboradores.map(c => c.id)))
    }
  }

  const selectedColaboradores = colaboradores.filter(c => selectedIds.has(c.id))

  const getValorRecibo = (colaborador: Colaborador): number => {
    if (valorFixo) return parseFloat(valorFixo)
    return colaborador.valor_padrao || 0
  }

  const totalRecibos = selectedColaboradores.reduce((sum, c) => sum + getValorRecibo(c), 0)

  const salvarRecibos = async () => {
    if (!user || selectedColaboradores.length === 0) return
    
    setSaving(true)
    const recibosData = selectedColaboradores.map(c => ({
      colaborador_id: c.id,
      categoria,
      valor: getValorRecibo(c),
      forma_pagamento: formaPagamento,
      periodo_inicio: dataPagamento,
      periodo_fim: dataPagamento,
      user_id: user.id
    }))
    
    await supabase.from('recibos').insert(recibosData)
    setSaving(false)
    setSelectedIds(new Set())
  }

  const imprimirRecibos = () => {
    if (selectedColaboradores.length === 0) return

    const dataFormatada = new Date(dataPagamento).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const recibosHtml = selectedColaboradores.map(colaborador => {
      const valor = getValorRecibo(colaborador)
      return `
        <div class="recibo">
          <div class="header">
            <h2>AMOR SAUDE PIRITUBA</h2>
            <p>CNPJ: XX.XXX.XXX/XXXX-XX</p>
          </div>
          <h3 class="titulo">RECIBO DE PAGAMENTO</h3>
          <div class="dados">
            <p><strong>Colaborador:</strong> ${colaborador.nome}</p>
            <p><strong>CPF:</strong> ${colaborador.cpf}</p>
            ${colaborador.cargo ? `<p><strong>Cargo:</strong> ${colaborador.cargo}</p>` : ''}
            <p><strong>Data:</strong> ${dataFormatada}</p>
          </div>
          <div class="valor-box">
            <p class="categoria">${categoria}</p>
            <p class="valor">R$ ${valor.toFixed(2)}</p>
          </div>
          <p class="pagamento"><strong>Forma de Pagamento:</strong> ${formaPagamento}</p>
          <div class="assinatura">
            <div class="linha"></div>
            <p>Assinatura do Colaborador</p>
          </div>
        </div>
      `
    }).join('<div class="page-break"></div>')

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibos - ${new Date().toLocaleDateString('pt-BR')}</title>
          <style>
            @page { size: A4; margin: 1.5cm; }
            body { font-family: Arial, sans-serif; font-size: 14px; }
            .recibo { padding: 20px; border: 1px solid #ccc; margin-bottom: 20px; page-break-inside: avoid; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header h2 { margin: 0; }
            .header p { margin: 5px 0; color: #666; }
            .titulo { text-align: center; margin: 20px 0; text-transform: uppercase; }
            .dados { margin: 15px 0; }
            .dados p { margin: 5px 0; }
            .valor-box { background: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; }
            .categoria { font-size: 12px; color: #666; margin: 0; }
            .valor { font-size: 24px; font-weight: bold; margin: 5px 0; }
            .pagamento { margin: 15px 0; }
            .assinatura { margin-top: 50px; text-align: center; }
            .assinatura .linha { border-top: 1px solid #333; width: 250px; margin: 0 auto; }
            .assinatura p { margin-top: 5px; font-size: 12px; }
            .page-break { page-break-after: always; }
          </style>
        </head>
        <body>
          ${recibosHtml}
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    printWindow?.document.write(printContent)
    printWindow?.document.close()
    printWindow?.print()
  }

  // ============== COLABORADORES CRUD ==============
  const openDialogColaborador = (colab?: Colaborador) => {
    if (colab) {
      setEditingColaborador(colab)
      setFormColaborador({
        nome: colab.nome,
        cpf: colab.cpf,
        cargo: colab.cargo || '',
        valor_padrao: (colab.valor_padrao || 0).toString()
      })
    } else {
      setEditingColaborador(null)
      setFormColaborador({
        nome: '',
        cpf: '',
        cargo: '',
        valor_padrao: ''
      })
    }
    setDialogOpen(true)
  }

  const saveColaborador = async () => {
    setSaving(true)
    const data = {
      nome: formColaborador.nome,
      cpf: formColaborador.cpf.replace(/\D/g, ''),
      cargo: formColaborador.cargo || null,
      valor_padrao: parseFloat(formColaborador.valor_padrao) || 0
    }

    if (editingColaborador) {
      await supabase.from('colaboradores').update(data).eq('id', editingColaborador.id)
    } else {
      await supabase.from('colaboradores').insert(data)
    }

    setDialogOpen(false)
    setSaving(false)
    loadColaboradores()
  }

  const deleteColaborador = async (id: string) => {
    await supabase.from('colaboradores').update({ ativo: false }).eq('id', id)
    loadColaboradores()
  }

  // Máscara de CPF
  const formatCPF = (value: string) => {
    const nums = value.replace(/\D/g, '').slice(0, 11)
    if (nums.length <= 3) return nums
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`
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
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Geracao de Recibos</h1>
          <p className="text-muted-foreground">Gerar recibos em lote para colaboradores</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="recibos" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Gerar Recibos
          </TabsTrigger>
          <TabsTrigger value="colaboradores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Colaboradores
          </TabsTrigger>
        </TabsList>

        {/* =============== GERAR RECIBOS =============== */}
        <TabsContent value="recibos" className="flex-1 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Lista de colaboradores */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Colaboradores</CardTitle>
                    <CardDescription>Selecione os colaboradores para gerar recibos</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-48 pl-9"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      {selectedIds.size === filteredColaboradores.length ? 'Desmarcar' : 'Selecionar'} Todos
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead className="text-right">Valor Padrao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredColaboradores.map(colab => (
                        <TableRow 
                          key={colab.id} 
                          className={`cursor-pointer ${selectedIds.has(colab.id) ? 'bg-accent/10' : ''}`}
                          onClick={() => toggleSelect(colab.id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(colab.id)}
                              onCheckedChange={() => toggleSelect(colab.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{colab.nome}</TableCell>
                          <TableCell>{formatCPF(colab.cpf)}</TableCell>
                          <TableCell>{colab.cargo || '-'}</TableCell>
                          <TableCell className="text-right">R$ {(colab.valor_padrao || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredColaboradores.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      Nenhum colaborador encontrado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Painel de configuracao */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Configuracao do Recibo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <div className="space-y-4 flex-1">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={categoria} onValueChange={setCategoria}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS_RECIBO.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                    <Label>Data de Pagamento</Label>
                    <Input
                      type="date"
                      value={dataPagamento}
                      onChange={(e) => setDataPagamento(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Valor Fixo (opcional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Usar valor padrao de cada colaborador"
                      value={valorFixo}
                      onChange={(e) => setValorFixo(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Se vazio, usa o valor padrao cadastrado
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Selecionados:</span>
                      <Badge variant="secondary">{selectedIds.size}</Badge>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">R$ {totalRecibos.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Button
                    className="w-full bg-accent text-accent-foreground"
                    onClick={imprimirRecibos}
                    disabled={selectedIds.size === 0}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Recibos ({selectedIds.size})
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={salvarRecibos}
                    disabled={selectedIds.size === 0 || saving}
                  >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Salvar no Historico
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =============== COLABORADORES =============== */}
        <TabsContent value="colaboradores" className="flex-1 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciar Colaboradores</CardTitle>
                <CardDescription>Funcionarios para geracao de recibos</CardDescription>
              </div>
              <Button onClick={() => openDialogColaborador()} className="bg-accent text-accent-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Novo Colaborador
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="text-right">Valor Padrao</TableHead>
                    <TableHead className="w-24">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colaboradores.map(colab => (
                    <TableRow key={colab.id}>
                      <TableCell className="font-medium">{colab.nome}</TableCell>
                      <TableCell>{formatCPF(colab.cpf)}</TableCell>
                      <TableCell>{colab.cargo || '-'}</TableCell>
                      <TableCell className="text-right">R$ {(colab.valor_padrao || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openDialogColaborador(colab)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteColaborador(colab.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de colaborador */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingColaborador ? 'Editar' : 'Novo'} Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Completo *</Label>
              <Input
                value={formColaborador.nome}
                onChange={(e) => setFormColaborador({ ...formColaborador, nome: e.target.value })}
              />
            </div>
            <div>
              <Label>CPF *</Label>
              <Input
                value={formatCPF(formColaborador.cpf)}
                onChange={(e) => setFormColaborador({ ...formColaborador, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <Label>Cargo/Funcao</Label>
              <Input
                value={formColaborador.cargo}
                onChange={(e) => setFormColaborador({ ...formColaborador, cargo: e.target.value })}
                placeholder="Ex: Recepcionista"
              />
            </div>
            <div>
              <Label>Valor Padrao do Recibo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formColaborador.valor_padrao}
                onChange={(e) => setFormColaborador({ ...formColaborador, valor_padrao: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveColaborador} disabled={saving || !formColaborador.nome || !formColaborador.cpf}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
