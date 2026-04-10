'use client'

import { useState, useEffect } from 'react'
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
  Shield,
  Plus, 
  Trash2,
  Edit,
  Users,
  UserCheck,
  Stethoscope,
  FlaskConical,
  Building2,
  Check,
  X
} from 'lucide-react'
import type { 
  Atendente, 
  Colaborador, 
  Profissional, 
  CatalogoExame, 
  Parceiro 
} from '@/lib/types'

export default function AdminPage() {
  const { usuario, isAdmin } = useAuth()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState('atendentes')
  const [isLoading, setIsLoading] = useState(true)
  
  // Data states
  const [atendentes, setAtendentes] = useState<Atendente[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [exames, setExames] = useState<CatalogoExame[]>([])
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  
  // Form states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<unknown>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (isAdmin) {
      loadAllData()
    }
  }, [isAdmin])

  const loadAllData = async () => {
    setIsLoading(true)
    
    const [atendentesRes, colaboradoresRes, profissionaisRes, examesRes, parceirosRes] = await Promise.all([
      supabase.from('atendentes').select('*').order('nome'),
      supabase.from('colaboradores').select('*').order('nome'),
      supabase.from('profissionais').select('*').order('nome'),
      supabase.from('catalogo_exames').select('*').order('nome'),
      supabase.from('parceiros').select('*').order('nome')
    ])
    
    if (atendentesRes.data) setAtendentes(atendentesRes.data)
    if (colaboradoresRes.data) setColaboradores(colaboradoresRes.data)
    if (profissionaisRes.data) setProfissionais(profissionaisRes.data)
    if (examesRes.data) setExames(examesRes.data)
    if (parceirosRes.data) setParceiros(parceirosRes.data)
    
    setIsLoading(false)
  }

  const openDialog = (item?: unknown) => {
    setEditingItem(item || null)
    setFormData(item ? { ...item as Record<string, unknown> } : {})
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    setFormData({})
  }

  // CRUD para Atendentes
  const saveAtendente = async () => {
    const data = {
      nome: formData.nome as string,
      apelido: formData.apelido as string || null
    }
    
    if (editingItem) {
      await supabase.from('atendentes').update(data).eq('id', (editingItem as Atendente).id)
    } else {
      await supabase.from('atendentes').insert(data)
    }
    
    closeDialog()
    loadAllData()
  }

  const toggleAtendenteAtivo = async (atendente: Atendente) => {
    await supabase.from('atendentes').update({ ativo: !atendente.ativo }).eq('id', atendente.id)
    loadAllData()
  }

  // CRUD para Colaboradores
  const saveColaborador = async () => {
    const data = {
      nome: formData.nome as string,
      cpf: formData.cpf as string
    }
    
    if (editingItem) {
      await supabase.from('colaboradores').update(data).eq('id', (editingItem as Colaborador).id)
    } else {
      await supabase.from('colaboradores').insert(data)
    }
    
    closeDialog()
    loadAllData()
  }

  const toggleColaboradorAtivo = async (colaborador: Colaborador) => {
    await supabase.from('colaboradores').update({ ativo: !colaborador.ativo }).eq('id', colaborador.id)
    loadAllData()
  }

  // CRUD para Profissionais
  const saveProfissional = async () => {
    const data = {
      nome: formData.nome as string,
      cpf: formData.cpf as string,
      regime: formData.regime as string || 'funcionario',
      categoria: formData.categoria as string || null,
      chave_pix: formData.chave_pix as string || null
    }
    
    if (editingItem) {
      await supabase.from('profissionais').update(data).eq('id', (editingItem as Profissional).id)
    } else {
      await supabase.from('profissionais').insert(data)
    }
    
    closeDialog()
    loadAllData()
  }

  const toggleProfissionalAtivo = async (profissional: Profissional) => {
    await supabase.from('profissionais').update({ ativo: !profissional.ativo }).eq('id', profissional.id)
    loadAllData()
  }

  // CRUD para Exames
  const saveExame = async () => {
    const data = {
      nome: formData.nome as string,
      categoria: formData.categoria as string,
      descricao: formData.descricao as string || null,
      preparo: formData.preparo as string || null,
      preco: parseFloat(formData.preco as string) || 0
    }
    
    if (editingItem) {
      await supabase.from('catalogo_exames').update(data).eq('id', (editingItem as CatalogoExame).id)
    } else {
      await supabase.from('catalogo_exames').insert(data)
    }
    
    closeDialog()
    loadAllData()
  }

  const toggleExameAtivo = async (exame: CatalogoExame) => {
    await supabase.from('catalogo_exames').update({ ativo: !exame.ativo }).eq('id', exame.id)
    loadAllData()
  }

  // CRUD para Parceiros
  const saveParceiro = async () => {
    const data = {
      nome: formData.nome as string,
      localizacao: formData.localizacao as string || null
    }
    
    if (editingItem) {
      await supabase.from('parceiros').update(data).eq('id', (editingItem as Parceiro).id)
    } else {
      await supabase.from('parceiros').insert(data)
    }
    
    closeDialog()
    loadAllData()
  }

  const toggleParceiroAtivo = async (parceiro: Parceiro) => {
    await supabase.from('parceiros').update({ ativo: !parceiro.ativo }).eq('id', parceiro.id)
    loadAllData()
  }

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Acesso Restrito</h2>
          <p className="mt-2 text-muted-foreground">
            Apenas administradores podem acessar esta pagina.
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Administracao</h1>
        <p className="text-muted-foreground">Gerencie cadastros do sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="atendentes" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Atendentes
          </TabsTrigger>
          <TabsTrigger value="colaboradores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Colaboradores
          </TabsTrigger>
          <TabsTrigger value="profissionais" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Profissionais
          </TabsTrigger>
          <TabsTrigger value="exames" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Exames
          </TabsTrigger>
          <TabsTrigger value="parceiros" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Parceiros
          </TabsTrigger>
        </TabsList>

        {/* Atendentes */}
        <TabsContent value="atendentes" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Atendentes</CardTitle>
                <CardDescription>Cadastro de atendentes da recepcao</CardDescription>
              </div>
              <Button onClick={() => openDialog()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" />
                Novo Atendente
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Apelido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atendentes.map(atendente => (
                    <TableRow key={atendente.id}>
                      <TableCell className="font-medium">{atendente.nome}</TableCell>
                      <TableCell>{atendente.apelido || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={atendente.ativo ? 'default' : 'secondary'}>
                          {atendente.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openDialog(atendente)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => toggleAtendenteAtivo(atendente)}
                            className={atendente.ativo ? 'text-destructive' : 'text-green-600'}
                          >
                            {atendente.ativo ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
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

        {/* Colaboradores */}
        <TabsContent value="colaboradores" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Colaboradores</CardTitle>
                <CardDescription>Funcionarios para geracao de recibos</CardDescription>
              </div>
              <Button onClick={() => openDialog()} className="bg-accent text-accent-foreground hover:bg-accent/90">
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
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {colaboradores.map(colaborador => (
                    <TableRow key={colaborador.id}>
                      <TableCell className="font-medium">{colaborador.nome}</TableCell>
                      <TableCell>{colaborador.cpf}</TableCell>
                      <TableCell>
                        <Badge variant={colaborador.ativo ? 'default' : 'secondary'}>
                          {colaborador.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openDialog(colaborador)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => toggleColaboradorAtivo(colaborador)}
                            className={colaborador.ativo ? 'text-destructive' : 'text-green-600'}
                          >
                            {colaborador.ativo ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
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

        {/* Profissionais */}
        <TabsContent value="profissionais" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Profissionais</CardTitle>
                <CardDescription>Medicos e profissionais para fechamento</CardDescription>
              </div>
              <Button onClick={() => openDialog()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" />
                Novo Profissional
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Regime</TableHead>
                    <TableHead>Chave PIX</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profissionais.map(profissional => (
                    <TableRow key={profissional.id}>
                      <TableCell className="font-medium">{profissional.nome}</TableCell>
                      <TableCell>{profissional.cpf}</TableCell>
                      <TableCell>
                        <Badge variant={profissional.regime === 'pj-presumido' ? 'default' : 'secondary'}>
                          {profissional.regime === 'pj-presumido' ? 'PJ Presumido' : 'Funcionario'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{profissional.chave_pix || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={profissional.ativo ? 'default' : 'secondary'}>
                          {profissional.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openDialog(profissional)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => toggleProfissionalAtivo(profissional)}
                            className={profissional.ativo ? 'text-destructive' : 'text-green-600'}
                          >
                            {profissional.ativo ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
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

        {/* Exames */}
        <TabsContent value="exames" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Catalogo de Exames</CardTitle>
                <CardDescription>Exames disponiveis para orcamento</CardDescription>
              </div>
              <Button onClick={() => openDialog()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" />
                Novo Exame
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preco</TableHead>
                    <TableHead>Preparo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exames.map(exame => (
                    <TableRow key={exame.id}>
                      <TableCell className="font-medium">{exame.nome}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{exame.categoria}</Badge>
                      </TableCell>
                      <TableCell>R$ {exame.preco.toFixed(2)}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {exame.preparo || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={exame.ativo ? 'default' : 'secondary'}>
                          {exame.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openDialog(exame)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => toggleExameAtivo(exame)}
                            className={exame.ativo ? 'text-destructive' : 'text-green-600'}
                          >
                            {exame.ativo ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
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

        {/* Parceiros */}
        <TabsContent value="parceiros" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Parceiros</CardTitle>
                <CardDescription>Laboratorios e clinicas parceiras</CardDescription>
              </div>
              <Button onClick={() => openDialog()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" />
                Novo Parceiro
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Localizacao</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parceiros.map(parceiro => (
                    <TableRow key={parceiro.id}>
                      <TableCell className="font-medium">{parceiro.nome}</TableCell>
                      <TableCell>{parceiro.localizacao || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={parceiro.ativo ? 'default' : 'secondary'}>
                          {parceiro.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openDialog(parceiro)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => toggleParceiroAtivo(parceiro)}
                            className={parceiro.ativo ? 'text-destructive' : 'text-green-600'}
                          >
                            {parceiro.ativo ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
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

      {/* Dialog dinamico para formularios */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar' : 'Novo'} {
                activeTab === 'atendentes' ? 'Atendente' :
                activeTab === 'colaboradores' ? 'Colaborador' :
                activeTab === 'profissionais' ? 'Profissional' :
                activeTab === 'exames' ? 'Exame' :
                'Parceiro'
              }
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Atendentes Form */}
            {activeTab === 'atendentes' && (
              <>
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={(formData.nome as string) || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Apelido</label>
                  <Input
                    value={(formData.apelido as string) || ''}
                    onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                    placeholder="Apelido (opcional)"
                  />
                </div>
                <Button className="w-full" onClick={saveAtendente}>Salvar</Button>
              </>
            )}

            {/* Colaboradores Form */}
            {activeTab === 'colaboradores' && (
              <>
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={(formData.nome as string) || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CPF *</label>
                  <Input
                    value={(formData.cpf as string) || ''}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <Button className="w-full" onClick={saveColaborador}>Salvar</Button>
              </>
            )}

            {/* Profissionais Form */}
            {activeTab === 'profissionais' && (
              <>
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={(formData.nome as string) || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CPF *</label>
                  <Input
                    value={(formData.cpf as string) || ''}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Regime *</label>
                  <Select 
                    value={(formData.regime as string) || 'funcionario'} 
                    onValueChange={(v) => setFormData({ ...formData, regime: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="funcionario">Funcionario (CLT)</SelectItem>
                      <SelectItem value="pj-presumido">PJ Presumido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Input
                    value={(formData.categoria as string) || ''}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: Medico, Enfermeiro..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Chave PIX</label>
                  <Input
                    value={(formData.chave_pix as string) || ''}
                    onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                    placeholder="CPF, email, telefone ou chave aleatoria"
                  />
                </div>
                <Button className="w-full" onClick={saveProfissional}>Salvar</Button>
              </>
            )}

            {/* Exames Form */}
            {activeTab === 'exames' && (
              <>
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={(formData.nome as string) || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do exame"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria *</label>
                  <Input
                    value={(formData.categoria as string) || ''}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: Laboratorial, Imagem..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Preco *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={(formData.preco as string) || ''}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descricao</label>
                  <Textarea
                    value={(formData.descricao as string) || ''}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descricao do exame (opcional)"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Preparo</label>
                  <Textarea
                    value={(formData.preparo as string) || ''}
                    onChange={(e) => setFormData({ ...formData, preparo: e.target.value })}
                    placeholder="Instrucoes de preparo (ex: Jejum de 12h)"
                  />
                </div>
                <Button className="w-full" onClick={saveExame}>Salvar</Button>
              </>
            )}

            {/* Parceiros Form */}
            {activeTab === 'parceiros' && (
              <>
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <Input
                    value={(formData.nome as string) || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do parceiro"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Localizacao</label>
                  <Input
                    value={(formData.localizacao as string) || ''}
                    onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                    placeholder="Endereco ou regiao"
                  />
                </div>
                <Button className="w-full" onClick={saveParceiro}>Salvar</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
