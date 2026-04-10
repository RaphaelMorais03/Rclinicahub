'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  FolderOpen,
  Plus, 
  Search,
  Check,
  Package,
  History,
  ClipboardPaste,
  Upload,
  Trash2,
  Download,
  Wifi,
  WifiOff,
  Loader2,
  FileSpreadsheet
} from 'lucide-react'
import type { GavetaExame, Atendente, ExameRetirado } from '@/lib/types'
import { TIPOS_EXAME, getCorPorTempoEspera } from '@/lib/types'

type FilterStatus = 'todos' | 'hoje' | 'semana' | 'atrasados'
type ActiveTab = 'gaveta' | 'cadastrar' | 'colar' | 'importar' | 'historico'

export default function GavetaPage() {
  const { usuario, user } = useAuth()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('gaveta')
  const [exames, setExames] = useState<GavetaExame[]>([])
  const [historico, setHistorico] = useState<ExameRetirado[]>([])
  const [atendentes, setAtendentes] = useState<Atendente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  
  // Form states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [retiradaDialog, setRetiradaDialog] = useState<GavetaExame | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [novoPaciente, setNovoPaciente] = useState('')
  const [novoTipoExame, setNovoTipoExame] = useState('')
  const [novaDataExame, setNovaDataExame] = useState(new Date().toISOString().split('T')[0])
  const [novaObservacao, setNovaObservacao] = useState('')
  const [novoAtendente, setNovoAtendente] = useState('')
  const [quemRetirou, setQuemRetirou] = useState('')
  const [atendenteEntrega, setAtendenteEntrega] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Colar do AMEI
  const [textoAmei, setTextoAmei] = useState('')
  const [previewAmei, setPreviewAmei] = useState<{paciente: string, tipo: string}[]>([])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [examesRes, atendentesRes, historicoRes] = await Promise.all([
        supabase.from('gaveta_exames').select('*').eq('status', 'pendente').order('created_at', { ascending: false }),
        supabase.from('atendentes').select('*').eq('ativo', true).order('nome'),
        supabase.from('exames_retirados').select('*').order('retirado_em', { ascending: false }).limit(100)
      ])

      if (examesRes.data) setExames(examesRes.data)
      if (atendentesRes.data) setAtendentes(atendentesRes.data)
      if (historicoRes.data) setHistorico(historicoRes.data)
      setIsConnected(true)
    } catch {
      setIsConnected(false)
    }
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()

    // Subscription para atualizações em tempo real
    const channel = supabase
      .channel('gaveta_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gaveta_exames' }, () => {
        loadData()
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadData])

  // Filtros
  const filteredExames = exames.filter(exame => {
    const matchesSearch = exame.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exame.tipo_exame.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTipo = filterTipo === 'todos' || exame.tipo_exame.includes(filterTipo)
    
    const hoje = new Date()
    const dataExame = new Date(exame.data_exame)
    const diffDias = Math.floor((hoje.getTime() - dataExame.getTime()) / (1000 * 60 * 60 * 24))
    
    let matchesStatus = true
    if (filterStatus === 'hoje') matchesStatus = diffDias === 0
    else if (filterStatus === 'semana') matchesStatus = diffDias >= 0 && diffDias <= 7
    else if (filterStatus === 'atrasados') matchesStatus = diffDias > 7
    
    return matchesSearch && matchesTipo && matchesStatus
  })

  const handleAddExame = async () => {
    if (!novoPaciente || !novoTipoExame || !novaDataExame || !user) return
    
    setSaving(true)
    await supabase.from('gaveta_exames').insert({
      paciente: novoPaciente.toUpperCase(),
      tipo_exame: novoTipoExame,
      data_exame: novaDataExame,
      observacoes: novaObservacao || null,
      atendente_cadastro: novoAtendente || null,
      user_id: user.id
    })
    
    setDialogOpen(false)
    setNovoPaciente('')
    setNovoTipoExame('')
    setNovaDataExame(new Date().toISOString().split('T')[0])
    setNovaObservacao('')
    setNovoAtendente('')
    setSaving(false)
    loadData()
  }

  const handleRetirada = async () => {
    if (!retiradaDialog || !quemRetirou) return
    
    setSaving(true)
    
    // Mover para histórico
    await supabase.from('exames_retirados').insert({
      paciente: retiradaDialog.paciente,
      tipo: retiradaDialog.tipo_exame,
      data_exame: retiradaDialog.data_exame,
      quem_retirou: quemRetirou,
      atendente_entregou: atendenteEntrega || null
    })
    
    // Atualizar status na gaveta
    await supabase
      .from('gaveta_exames')
      .update({
        status: 'retirado',
        quem_retirou: quemRetirou,
        atendente_entrega: atendenteEntrega || null,
        data_retirada: new Date().toISOString()
      })
      .eq('id', retiradaDialog.id)
    
    setRetiradaDialog(null)
    setQuemRetirou('')
    setAtendenteEntrega('')
    setSaving(false)
    loadData()
  }

  const handleDeleteHistorico = async () => {
    if (!deleteDialog) return
    await supabase.from('exames_retirados').delete().eq('id', deleteDialog)
    setDeleteDialog(null)
    loadData()
  }

  // Parser do AMEI
  const parseTextoAmei = (texto: string) => {
    const linhas = texto.split('\n').filter(l => l.trim())
    const resultados: {paciente: string, tipo: string}[] = []
    
    for (const linha of linhas) {
      const parts = linha.split('\t')
      if (parts.length >= 2) {
        const paciente = parts[0].trim().toUpperCase()
        let tipo = 'Outros'
        
        const textoLower = linha.toLowerCase()
        if (textoLower.includes('eco') || textoLower.includes('ecocardiograma')) tipo = 'ECO - Ecocardiograma'
        else if (textoLower.includes('eeg') || textoLower.includes('eletroencefalograma')) tipo = 'EEG - Eletroencefalograma'
        else if (textoLower.includes('usg') || textoLower.includes('ultrassom')) tipo = 'USG - Ultrassom'
        else if (textoLower.includes('potencial')) tipo = 'Potencial Evocado'
        else if (textoLower.includes('holter')) tipo = 'Holter'
        else if (textoLower.includes('mapa')) tipo = 'MAPA'
        else if (textoLower.includes('ergom')) tipo = 'Teste Ergométrico'
        
        if (paciente) {
          resultados.push({ paciente, tipo })
        }
      }
    }
    
    return resultados
  }

  const handleColaAmei = () => {
    const parsed = parseTextoAmei(textoAmei)
    setPreviewAmei(parsed)
  }

  const handleImportarAmei = async () => {
    if (!user || previewAmei.length === 0) return
    
    setSaving(true)
    const hoje = new Date().toISOString().split('T')[0]
    
    await supabase.from('gaveta_exames').insert(
      previewAmei.map(item => ({
        paciente: item.paciente,
        tipo_exame: item.tipo,
        data_exame: hoje,
        user_id: user.id
      }))
    )
    
    setTextoAmei('')
    setPreviewAmei([])
    setSaving(false)
    loadData()
    setActiveTab('gaveta')
  }

  const exportarHistoricoCSV = () => {
    const headers = ['Paciente', 'Tipo', 'Data Exame', 'Quem Retirou', 'Atendente', 'Data Retirada']
    const rows = historico.map(h => [
      h.paciente,
      h.tipo,
      h.data_exame || '',
      h.quem_retirou || '',
      h.atendente_entregou || '',
      new Date(h.retirado_em).toLocaleDateString('pt-BR')
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historico_exames_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Contadores
  const pendentes = exames.length
  const hoje = exames.filter(e => {
    const diff = Math.floor((new Date().getTime() - new Date(e.data_exame).getTime()) / (1000 * 60 * 60 * 24))
    return diff === 0
  }).length
  const atrasados = exames.filter(e => {
    const diff = Math.floor((new Date().getTime() - new Date(e.data_exame).getTime()) / (1000 * 60 * 60 * 24))
    return diff > 7
  }).length

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
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Retirada de Exames</h1>
            <p className="text-muted-foreground">Gaveta digital de exames para entrega</p>
          </div>
          {/* Indicador de conexão */}
          <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? 'Conectado' : 'Reconectando...'}
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Package className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-amber-600">{pendentes}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hoje</p>
              <p className="text-2xl font-bold text-green-600">{hoje}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <FolderOpen className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Atrasados</p>
              <p className="text-2xl font-bold text-red-600">{atrasados}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Historico</p>
              <p className="text-2xl font-bold text-primary">{historico.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="gaveta" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Gaveta Digital
          </TabsTrigger>
          <TabsTrigger value="cadastrar" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Cadastrar
          </TabsTrigger>
          <TabsTrigger value="colar" className="flex items-center gap-2">
            <ClipboardPaste className="h-4 w-4" />
            Colar do AMEI
          </TabsTrigger>
          <TabsTrigger value="importar" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar Planilha
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historico
          </TabsTrigger>
        </TabsList>

        {/* =============== GAVETA DIGITAL =============== */}
        <TabsContent value="gaveta" className="flex-1 mt-6">
          {/* Filtros */}
          <div className="mb-4 flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de Exame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                {TIPOS_EXAME.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="atrasados">Atrasados (7+ dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cards de exames */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredExames.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                Nenhum exame pendente encontrado
              </div>
            ) : (
              filteredExames.map(exame => (
                <Card 
                  key={exame.id} 
                  className={`border-l-4 ${getCorPorTempoEspera(exame.data_exame)}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{exame.paciente}</CardTitle>
                    <Badge variant="secondary">{exame.tipo_exame}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Data: {new Date(exame.data_exame).toLocaleDateString('pt-BR')}
                    </p>
                    {exame.observacoes && (
                      <p className="mt-2 text-sm text-muted-foreground truncate">
                        {exame.observacoes}
                      </p>
                    )}
                    <Button
                      size="sm"
                      className="mt-4 w-full bg-green-600 hover:bg-green-700"
                      onClick={() => setRetiradaDialog(exame)}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Dar Baixa
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* =============== CADASTRAR =============== */}
        <TabsContent value="cadastrar" className="mt-6">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Cadastrar Exame</CardTitle>
              <CardDescription>Adicione um novo exame na gaveta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Paciente *</label>
                <Input
                  value={novoPaciente}
                  onChange={(e) => setNovoPaciente(e.target.value)}
                  placeholder="Nome do paciente"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo de Exame *</label>
                <Select value={novoTipoExame} onValueChange={setNovoTipoExame}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_EXAME.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Data do Exame *</label>
                <Input
                  type="date"
                  value={novaDataExame}
                  onChange={(e) => setNovaDataExame(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Atendente Responsavel</label>
                <Select value={novoAtendente} onValueChange={setNovoAtendente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {atendentes.map(a => (
                      <SelectItem key={a.id} value={a.nome}>
                        {a.apelido || a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Observacoes</label>
                <Textarea
                  value={novaObservacao}
                  onChange={(e) => setNovaObservacao(e.target.value)}
                  placeholder="Observacoes sobre o exame..."
                />
              </div>
              <Button 
                className="w-full bg-accent text-accent-foreground" 
                onClick={handleAddExame}
                disabled={!novoPaciente || !novoTipoExame || !novaDataExame || saving}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Adicionar na Gaveta
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============== COLAR DO AMEI =============== */}
        <TabsContent value="colar" className="mt-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Colar do AMEI</CardTitle>
              <CardDescription>Cole os dados copiados do sistema AMEI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={textoAmei}
                onChange={(e) => setTextoAmei(e.target.value)}
                placeholder="Cole aqui os dados copiados do AMEI..."
                rows={8}
              />
              <Button onClick={handleColaAmei} variant="outline" className="w-full">
                <ClipboardPaste className="mr-2 h-4 w-4" />
                Processar Texto
              </Button>

              {previewAmei.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Preview ({previewAmei.length} exames)</h4>
                  <div className="max-h-64 overflow-auto rounded border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Tipo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewAmei.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{item.paciente}</TableCell>
                            <TableCell><Badge variant="secondary">{item.tipo}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button 
                    onClick={handleImportarAmei} 
                    className="mt-4 w-full bg-accent text-accent-foreground"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Importar {previewAmei.length} Exames
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============== IMPORTAR PLANILHA =============== */}
        <TabsContent value="importar" className="mt-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Importar Planilha</CardTitle>
              <CardDescription>Importe exames de planilhas XLSX (ECO, NEURO, USG)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12">
                <FileSpreadsheet className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  Arraste uma planilha XLSX aqui ou clique para selecionar
                </p>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  className="max-w-xs"
                  onChange={() => {
                    // TODO: Implementar importação de planilha
                    alert('Funcionalidade em desenvolvimento')
                  }}
                />
                <p className="text-xs text-muted-foreground mt-4">
                  Somente linhas com status OK e sem data de retirada serao importadas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============== HISTORICO =============== */}
        <TabsContent value="historico" className="flex-1 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historico de Retiradas</CardTitle>
                <CardDescription>Exames ja retirados pelos pacientes</CardDescription>
              </div>
              <Button variant="outline" onClick={exportarHistoricoCSV}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quem Retirou</TableHead>
                    <TableHead>Atendente</TableHead>
                    <TableHead>Data Retirada</TableHead>
                    <TableHead className="w-20">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum exame no historico
                      </TableCell>
                    </TableRow>
                  ) : (
                    historico.map(h => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.paciente}</TableCell>
                        <TableCell><Badge variant="secondary">{h.tipo}</Badge></TableCell>
                        <TableCell>{h.quem_retirou || '-'}</TableCell>
                        <TableCell>{h.atendente_entregou || '-'}</TableCell>
                        <TableCell>{new Date(h.retirado_em).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive"
                            onClick={() => setDeleteDialog(h.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de retirada */}
      <Dialog open={!!retiradaDialog} onOpenChange={() => setRetiradaDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Retirada</DialogTitle>
          </DialogHeader>
          {retiradaDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium">{retiradaDialog.paciente}</p>
                <p className="text-sm text-muted-foreground">{retiradaDialog.tipo_exame}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Quem retirou? *</label>
                <Input
                  value={quemRetirou}
                  onChange={(e) => setQuemRetirou(e.target.value)}
                  placeholder="Nome de quem esta retirando"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Atendente que entregou</label>
                <Select value={atendenteEntrega} onValueChange={setAtendenteEntrega}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {atendentes.map(a => (
                      <SelectItem key={a.id} value={a.nome}>
                        {a.apelido || a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetiradaDialog(null)}>Cancelar</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={handleRetirada}
              disabled={!quemRetirou || saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Confirmar Retirada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de exclusão */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro do historico?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteHistorico}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
