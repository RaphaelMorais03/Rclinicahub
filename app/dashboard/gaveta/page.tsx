'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FolderOpen,
  Plus, 
  Search,
  Check,
  Package,
  Calendar,
  User
} from 'lucide-react'
import type { GavetaExame, Atendente } from '@/lib/types'

export default function GavetaPage() {
  const { usuario } = useAuth()
  const supabase = createClient()
  
  const [exames, setExames] = useState<GavetaExame[]>([])
  const [atendentes, setAtendentes] = useState<Atendente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('pendente')
  const [isLoading, setIsLoading] = useState(true)
  
  // Form states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [retiradaDialog, setRetiradaDialog] = useState<GavetaExame | null>(null)
  const [novoPaciente, setNovoPaciente] = useState('')
  const [novoTipoExame, setNovoTipoExame] = useState('')
  const [novaDataExame, setNovaDataExame] = useState('')
  const [novaObservacao, setNovaObservacao] = useState('')
  const [novoAtendente, setNovoAtendente] = useState('')
  const [quemRetirou, setQuemRetirou] = useState('')
  const [atendenteEntrega, setAtendenteEntrega] = useState('')

  useEffect(() => {
    loadData()
  }, [filterStatus])

  const loadData = async () => {
    setIsLoading(true)
    
    let query = supabase
      .from('gaveta_exames')
      .select('*')
      .order('data_exame', { ascending: false })
    
    if (filterStatus !== 'todos') {
      query = query.eq('status', filterStatus)
    }
    
    const [examesRes, atendentesRes] = await Promise.all([
      query,
      supabase.from('atendentes').select('*').eq('ativo', true).order('nome')
    ])

    if (examesRes.data) setExames(examesRes.data)
    if (atendentesRes.data) setAtendentes(atendentesRes.data)
    setIsLoading(false)
  }

  const filteredExames = exames.filter(exame => 
    exame.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exame.tipo_exame.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddExame = async () => {
    if (!novoPaciente || !novoTipoExame || !novaDataExame || !usuario) return
    
    await supabase.from('gaveta_exames').insert({
      paciente: novoPaciente,
      tipo_exame: novoTipoExame,
      data_exame: novaDataExame,
      observacoes: novaObservacao || null,
      atendente_cadastro: novoAtendente || null,
      user_id: usuario.id
    })
    
    setDialogOpen(false)
    setNovoPaciente('')
    setNovoTipoExame('')
    setNovaDataExame('')
    setNovaObservacao('')
    setNovoAtendente('')
    loadData()
  }

  const handleRetirada = async () => {
    if (!retiradaDialog || !quemRetirou) return
    
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
    loadData()
  }

  const pendentes = exames.filter(e => e.status === 'pendente').length
  const retirados = exames.filter(e => e.status === 'retirado').length

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
          <h1 className="text-3xl font-bold text-foreground">Retirada de Exames</h1>
          <p className="text-muted-foreground">Gaveta digital de exames para entrega</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Exame
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Exame na Gaveta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                <Input
                  value={novoTipoExame}
                  onChange={(e) => setNovoTipoExame(e.target.value)}
                  placeholder="Ex: Hemograma, Raio-X..."
                />
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
                <label className="text-sm font-medium">Atendente</label>
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
              <Button className="w-full" onClick={handleAddExame}>
                Adicionar na Gaveta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
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
              <p className="text-sm text-muted-foreground">Retirados</p>
              <p className="text-2xl font-bold text-green-600">{retirados}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total na Gaveta</p>
              <p className="text-2xl font-bold text-primary">{exames.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente ou exame..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="retirado">Retirados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de exames */}
      <Card className="flex-1">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Exame</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observacoes</TableHead>
                <TableHead className="w-32">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExames.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Nenhum exame encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredExames.map(exame => (
                  <TableRow key={exame.id}>
                    <TableCell className="font-medium">{exame.paciente}</TableCell>
                    <TableCell>{exame.tipo_exame}</TableCell>
                    <TableCell>
                      {new Date(exame.data_exame).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={exame.status === 'pendente' ? 'secondary' : 'default'}
                        className={exame.status === 'retirado' ? 'bg-green-500' : 'bg-amber-500'}
                      >
                        {exame.status === 'pendente' ? 'Pendente' : 'Retirado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {exame.observacoes || '-'}
                    </TableCell>
                    <TableCell>
                      {exame.status === 'pendente' && (
                        <Button
                          size="sm"
                          onClick={() => setRetiradaDialog(exame)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Entregar
                        </Button>
                      )}
                      {exame.status === 'retirado' && (
                        <span className="text-xs text-muted-foreground">
                          {exame.quem_retirou}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={handleRetirada}
                disabled={!quemRetirou}
              >
                <Check className="mr-2 h-4 w-4" />
                Confirmar Retirada
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
