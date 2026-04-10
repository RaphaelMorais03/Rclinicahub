'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
} from '@/components/ui/dialog'
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
  X,
  Image as ImageIcon,
  DollarSign,
  Key,
  Search,
  Loader2,
  Upload,
  Mail,
  Save
} from 'lucide-react'
import type { 
  Atendente, 
  Colaborador, 
  Profissional, 
  CatalogoExame, 
  Parceiro,
  Usuario,
  UsuarioPermissoes,
  Clinica,
  Logo,
  ExamePreco,
  AcessoFinanceiro
} from '@/lib/types'

type TabType = 'usuarios' | 'clinica' | 'atendentes' | 'acessos' | 'precos' | 'logo'

interface UsuarioComPermissoes extends Usuario {
  usuarios_permissoes?: UsuarioPermissoes[]
}

export default function AdminPage() {
  const { usuario, isAdmin, user, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<TabType>('usuarios')
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Data states
  const [usuarios, setUsuarios] = useState<UsuarioComPermissoes[]>([])
  const [atendentes, setAtendentes] = useState<Atendente[]>([])
  const [clinica, setClinica] = useState<Clinica | null>(null)
  const [logo, setLogo] = useState<Logo | null>(null)
  const [examesPrecos, setExamesPrecos] = useState<ExamePreco[]>([])
  const [acessosFinanceiro, setAcessosFinanceiro] = useState<AcessoFinanceiro[]>([])
  
  // Form states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [permissoesDialogOpen, setPermissoesDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<unknown>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [editingPermissoes, setEditingPermissoes] = useState<Partial<UsuarioPermissoes>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Logo upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (isAdmin) {
      loadAllData()
    }
  }, [isAdmin])

  const loadAllData = async () => {
    setIsLoading(true)
    
    const [usuariosRes, atendentesRes, clinicaRes, logoRes, precosRes, acessosRes] = await Promise.all([
      supabase.from('usuarios').select('*, usuarios_permissoes(*)').order('nome'),
      supabase.from('atendentes').select('*').order('nome'),
      supabase.from('clinica').select('*').single(),
      supabase.from('logo').select('*').order('atualizado_em', { ascending: false }).limit(1).single(),
      supabase.from('exames_precos').select('*').order('exam_id'),
      supabase.from('acesso_financeiro').select('*').order('adicionado_em', { ascending: false })
    ])
    
    if (usuariosRes.data) setUsuarios(usuariosRes.data)
    if (atendentesRes.data) setAtendentes(atendentesRes.data)
    if (clinicaRes.data) setClinica(clinicaRes.data)
    if (logoRes.data) {
      setLogo(logoRes.data)
      setLogoPreview(logoRes.data.data_url)
    }
    if (precosRes.data) setExamesPrecos(precosRes.data)
    if (acessosRes.data) setAcessosFinanceiro(acessosRes.data)
    
    setIsLoading(false)
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
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

  const openPermissoesDialog = (usuario: UsuarioComPermissoes) => {
    setEditingItem(usuario)
    const perms = usuario.usuarios_permissoes?.[0] || {}
    setEditingPermissoes({
      financeiro: perms.financeiro || false,
      orcamento: perms.orcamento !== false,
      exames: perms.exames !== false,
      cronograma: perms.cronograma !== false,
      admin: perms.admin || false
    })
    setPermissoesDialogOpen(true)
  }

  // ============== USUARIOS ==============
  const createUsuario = async () => {
    setSaving(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email as string,
        password: formData.senha as string,
        email_confirm: true,
        user_metadata: {
          nome: formData.nome as string
        }
      })
      
      if (authError) throw authError
      
      // Criar registro na tabela usuarios
      await supabase.from('usuarios').insert({
        id: authData.user.id,
        nome: formData.nome as string,
        email: formData.email as string,
        cargo: 'comum'
      })
      
      // Log de auditoria
      await supabase.from('logs').insert({
        tipo: 'success',
        msg: `Usuario criado: ${formData.email}`,
        uid: user?.id,
        dados: { email: formData.email }
      })
      
      showMessage('success', 'Usuario criado com sucesso!')
      closeDialog()
      loadAllData()
    } catch (error) {
      showMessage('error', 'Erro ao criar usuario: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const updateUsuarioNome = async () => {
    setSaving(true)
    try {
      const usuarioEdit = editingItem as UsuarioComPermissoes
      await supabase.from('usuarios').update({ nome: formData.nome as string }).eq('id', usuarioEdit.id)
      showMessage('success', 'Nome atualizado!')
      closeDialog()
      loadAllData()
    } catch (error) {
      showMessage('error', 'Erro ao atualizar: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const deleteUsuario = async () => {
    setSaving(true)
    try {
      const usuarioEdit = editingItem as UsuarioComPermissoes
      await supabase.from('usuarios').delete().eq('id', usuarioEdit.id)
      await supabase.from('logs').insert({
        tipo: 'warning',
        msg: `Usuario removido: ${usuarioEdit.email}`,
        uid: user?.id
      })
      showMessage('success', 'Usuario removido!')
      setDeleteDialogOpen(false)
      setEditingItem(null)
      loadAllData()
    } catch (error) {
      showMessage('error', 'Erro ao remover: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const savePermissoes = async () => {
    setSaving(true)
    try {
      const usuarioEdit = editingItem as UsuarioComPermissoes
      
      const { error } = await supabase.from('usuarios_permissoes').upsert({
        uid: usuarioEdit.id,
        financeiro: editingPermissoes.financeiro || false,
        orcamento: editingPermissoes.orcamento !== false,
        exames: editingPermissoes.exames !== false,
        cronograma: editingPermissoes.cronograma !== false,
        admin: editingPermissoes.admin || false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'uid' })
      
      if (error) throw error
      
      await supabase.from('logs').insert({
        tipo: 'info',
        msg: `Permissoes atualizadas: ${usuarioEdit.email}`,
        uid: user?.id,
        dados: permissoes
      })
      
      showMessage('success', 'Permissoes atualizadas!')
      setPermissoesDialogOpen(false)
      loadAllData()
    } catch (error) {
      showMessage('error', 'Erro ao salvar permissoes: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // ============== CLINICA ==============
  const saveClinica = async () => {
    setSaving(true)
    try {
      const data = {
        nome: formData.nome as string,
        cnpj: formData.cnpj as string || null,
        endereco: formData.endereco as string || null,
        telefone: formData.telefone as string || null,
        horario: formData.horario as string || null,
        empresa: formData.empresa as string || null,
        atualizado_em: new Date().toISOString()
      }
      
      if (clinica?.id) {
        await supabase.from('clinica').update(data).eq('id', clinica.id)
      } else {
        await supabase.from('clinica').insert(data)
      }
      
      await supabase.from('logs').insert({
        tipo: 'info',
        msg: 'Dados da clinica atualizados',
        uid: user?.id
      })
      
      showMessage('success', 'Dados salvos!')
      loadAllData()
    } catch (error) {
      showMessage('error', 'Erro ao salvar: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // ============== ATENDENTES ==============
  const saveAtendente = async () => {
    setSaving(true)
    try {
      // Verificar duplicata
      const { data: existing } = await supabase
        .from('atendentes')
        .select('id')
        .eq('nome', formData.nome as string)
        .neq('id', (editingItem as Atendente)?.id || '')
        .single()
      
      if (existing) {
        showMessage('error', 'Ja existe um atendente com este nome!')
        setSaving(false)
        return
      }
      
      const data = {
        nome: formData.nome as string,
        apelido: formData.apelido as string || null
      }
      
      if (editingItem) {
        await supabase.from('atendentes').update(data).eq('id', (editingItem as Atendente).id)
      } else {
        await supabase.from('atendentes').insert(data)
        await supabase.from('logs').insert({
          tipo: 'success',
          msg: `Atendente adicionado: ${data.nome}`,
          uid: user?.id
        })
      }
      
      showMessage('success', 'Atendente salvo!')
      closeDialog()
      loadAllData()
    } catch (error) {
      showMessage('error', 'Erro ao salvar: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const deleteAtendente = async () => {
    setSaving(true)
    try {
      const atendente = editingItem as Atendente
      await supabase.from('atendentes').delete().eq('id', atendente.id)
      await supabase.from('logs').insert({
        tipo: 'warning',
        msg: `Atendente removido: ${atendente.nome}`,
        uid: user?.id
      })
      showMessage('success', 'Atendente removido!')
      setDeleteDialogOpen(false)
      loadAllData()
    } catch (error) {
      showMessage('error', 'Erro ao remover: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // ============== ACESSOS ==============
  const enviarResetSenha = async (email: string) => {
    setSaving(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      if (error) throw error
      showMessage('success', `Email de redefinicao enviado para ${email}`)
    } catch (error) {
      showMessage('error', 'Erro ao enviar: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const addAcessoFinanceiro = async () => {
    setSaving(true)
    try {
      await supabase.from('acesso_financeiro').insert({
        email: formData.email as string
      })
      showMessage('success', 'Acesso adicionado!')
      closeDialog()
      loadAllData()
    } catch (error) {
      showMessage('error', 'Erro ao adicionar: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const removeAcessoFinanceiro = async (id: string) => {
    await supabase.from('acesso_financeiro').delete().eq('id', id)
    loadAllData()
  }

  // ============== PRECOS EXAMES ==============
  const savePrecoExame = async () => {
    setSaving(true)
    try {
      const data = {
        exam_id: formData.exam_id as string,
        ct: parseFloat(formData.ct as string) || null,
        part: parseFloat(formData.part as string) || null,
        editado_em: new Date().toISOString()
      }
      
      await supabase.from('exames_precos').upsert(data, { onConflict: 'exam_id' })
      showMessage('success', 'Preco atualizado!')
      closeDialog()
      loadAllData()
    } catch (error) {
      showMessage('error', 'Erro ao salvar: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // ============== LOGO ==============
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const saveLogo = async () => {
    if (!logoPreview) return
    
    setSaving(true)
    try {
      const versao = Date.now().toString()
      
      if (logo?.id) {
        await supabase.from('logo').update({
          data_url: logoPreview,
          versao,
          atualizado_em: new Date().toISOString()
        }).eq('id', logo.id)
      } else {
        await supabase.from('logo').insert({
          data_url: logoPreview,
          versao
        })
      }
      
      await supabase.from('logs').insert({
        tipo: 'info',
        msg: 'Logo atualizada',
        uid: user?.id
      })
      
      showMessage('success', 'Logo salva! Todos os usuarios verao a nova logo.')
      loadAllData()
    } catch (error) {
      showMessage('error', 'Erro ao salvar: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // Filtro de usuarios
  const filteredUsuarios = usuarios.filter(u => 
    u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Aguardar carregamento das permissões antes de verificar acesso
  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
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
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Mensagem de feedback */}
      {message && (
        <div className={`fixed right-4 top-4 z-50 rounded-lg p-4 shadow-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-foreground">Administracao</h1>
        <p className="text-muted-foreground">Gerencie usuarios, permissoes e configuracoes do sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="flex-1">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="clinica" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clinica</span>
          </TabsTrigger>
          <TabsTrigger value="atendentes" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Atendentes</span>
          </TabsTrigger>
          <TabsTrigger value="acessos" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Acessos</span>
          </TabsTrigger>
          <TabsTrigger value="precos" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Precos</span>
          </TabsTrigger>
          <TabsTrigger value="logo" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Logo</span>
          </TabsTrigger>
        </TabsList>

        {/* =============== USUARIOS =============== */}
        <TabsContent value="usuarios" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuarios do Sistema</CardTitle>
                <CardDescription>Gerencie usuarios e suas permissoes</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pl-9"
                  />
                </div>
                <Button onClick={() => openDialog()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Ultimo Acesso</TableHead>
                    <TableHead>Permissoes</TableHead>
                    <TableHead className="w-40">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsuarios.map(u => {
                    const perms = u.usuarios_permissoes?.[0]
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.nome}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.ultimo_acesso 
                            ? new Date(u.ultimo_acesso).toLocaleDateString('pt-BR', { 
                                day: '2-digit', month: '2-digit', year: '2-digit', 
                                hour: '2-digit', minute: '2-digit' 
                              })
                            : 'Nunca'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {perms?.admin && <Badge variant="destructive">Admin</Badge>}
                            {perms?.financeiro && <Badge variant="secondary">Financeiro</Badge>}
                            {perms?.orcamento && <Badge variant="outline">Orcamento</Badge>}
                            {perms?.exames && <Badge variant="outline">Exames</Badge>}
                            {perms?.cronograma && <Badge variant="outline">Cronograma</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openDialog(u)} title="Editar nome">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openPermissoesDialog(u)} title="Permissoes">
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-destructive"
                              onClick={() => { setEditingItem(u); setDeleteDialogOpen(true) }}
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============== CLINICA =============== */}
        <TabsContent value="clinica" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Clinica</CardTitle>
              <CardDescription>Informacoes exibidas nos recibos e documentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label>Nome da Clinica</Label>
                    <Input
                      value={formData.nome as string || clinica?.nome || ''}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Amor Saude Pirituba"
                    />
                  </div>
                  <div>
                    <Label>CNPJ</Label>
                    <Input
                      value={formData.cnpj as string || clinica?.cnpj || ''}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <Label>Razao Social</Label>
                    <Input
                      value={formData.empresa as string || clinica?.empresa || ''}
                      onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                      placeholder="Razao social completa"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Endereco</Label>
                    <Textarea
                      value={formData.endereco as string || clinica?.endereco || ''}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Rua, numero, bairro, cidade - UF"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={formData.telefone as string || clinica?.telefone || ''}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(11) 0000-0000"
                    />
                  </div>
                  <div>
                    <Label>Horario de Funcionamento</Label>
                    <Input
                      value={formData.horario as string || clinica?.horario || ''}
                      onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                      placeholder="Seg a Sex: 8h as 18h"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={saveClinica} disabled={saving} className="mt-6 bg-accent text-accent-foreground">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar Dados
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============== ATENDENTES =============== */}
        <TabsContent value="atendentes" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Atendentes</CardTitle>
                <CardDescription>Usados nos dropdowns de todos os sistemas</CardDescription>
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
                            className="text-destructive"
                            onClick={() => { setEditingItem(atendente); setDeleteDialogOpen(true) }}
                          >
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

        {/* =============== ACESSOS =============== */}
        <TabsContent value="acessos" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Reset de senha */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Redefinir Senha
                </CardTitle>
                <CardDescription>Envie e-mail de redefinicao para um usuario</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usuarios.map(u => (
                    <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{u.nome}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => enviarResetSenha(u.email)}
                        disabled={saving}
                      >
                        Enviar Reset
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Acesso financeiro legado */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Acesso Financeiro (Legado)
                  </CardTitle>
                  <CardDescription>Lista de e-mails com acesso ao modulo financeiro</CardDescription>
                </div>
                <Button size="sm" onClick={() => { setFormData({}); openDialog() }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {acessosFinanceiro.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                      <span>{a.email}</span>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeAcessoFinanceiro(a.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {acessosFinanceiro.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum acesso legado configurado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =============== PRECOS =============== */}
        <TabsContent value="precos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Precos de Exames</CardTitle>
                <CardDescription>Precos customizados sobrescrevem os valores padrao</CardDescription>
              </div>
              <Button onClick={() => openDialog()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" />
                Novo Preco
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar exame..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md pl-9"
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID do Exame</TableHead>
                    <TableHead>Preco CT/Convenio</TableHead>
                    <TableHead>Preco Particular</TableHead>
                    <TableHead>Editado Em</TableHead>
                    <TableHead className="w-20">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examesPrecos
                    .filter(p => p.exam_id.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(preco => (
                    <TableRow key={preco.exam_id}>
                      <TableCell className="font-medium">{preco.exam_id}</TableCell>
                      <TableCell>R$ {preco.ct?.toFixed(2) || '-'}</TableCell>
                      <TableCell>R$ {preco.part?.toFixed(2) || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(preco.editado_em).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => openDialog(preco)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =============== LOGO =============== */}
        <TabsContent value="logo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo do Sistema</CardTitle>
              <CardDescription>A logo aparece em todos os documentos e recibos gerados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6">
                {/* Preview */}
                <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>

                {/* Upload */}
                <div className="flex flex-col items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar Imagem
                  </Button>
                  <p className="text-sm text-muted-foreground">PNG, JPG ou SVG. Recomendado: 200x200px</p>
                </div>

                {/* Salvar */}
                {logoPreview && logoPreview !== logo?.data_url && (
                  <Button onClick={saveLogo} disabled={saving} className="bg-accent text-accent-foreground">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Nova Logo
                  </Button>
                )}

                {logo?.versao && (
                  <p className="text-xs text-muted-foreground">Versao: {logo.versao}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de formulario */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar' : 'Novo'} {
                activeTab === 'usuarios' ? 'Usuario' :
                activeTab === 'atendentes' ? 'Atendente' :
                activeTab === 'precos' ? 'Preco de Exame' :
                activeTab === 'acessos' ? 'Acesso Financeiro' :
                'Item'
              }
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Usuario Form */}
            {activeTab === 'usuarios' && (
              <>
                <div>
                  <Label>Nome Completo *</Label>
                  <Input
                    value={(formData.nome as string) || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                {!editingItem && (
                  <>
                    <div>
                      <Label>E-mail *</Label>
                      <Input
                        type="email"
                        value={(formData.email as string) || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div>
                      <Label>Senha *</Label>
                      <Input
                        type="password"
                        value={(formData.senha as string) || ''}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        placeholder="Senha inicial"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Atendente Form */}
            {activeTab === 'atendentes' && (
              <>
                <div>
                  <Label>Nome Completo *</Label>
                  <Input
                    value={(formData.nome as string) || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label>Apelido</Label>
                  <Input
                    value={(formData.apelido as string) || ''}
                    onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                    placeholder="Apelido para exibicao (opcional)"
                  />
                </div>
              </>
            )}

            {/* Preco Exame Form */}
            {activeTab === 'precos' && (
              <>
                <div>
                  <Label>ID do Exame *</Label>
                  <Input
                    value={(formData.exam_id as string) || ''}
                    onChange={(e) => setFormData({ ...formData, exam_id: e.target.value })}
                    placeholder="Ex: ECO-001"
                    disabled={!!editingItem}
                  />
                </div>
                <div>
                  <Label>Preco CT/Convenio (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={(formData.ct as string) || ''}
                    onChange={(e) => setFormData({ ...formData, ct: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Preco Particular (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={(formData.part as string) || ''}
                    onChange={(e) => setFormData({ ...formData, part: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </>
            )}

            {/* Acesso Financeiro Form */}
            {activeTab === 'acessos' && !editingItem && (
              <div>
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  value={(formData.email as string) || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button 
              onClick={() => {
                if (activeTab === 'usuarios') {
                  editingItem ? updateUsuarioNome() : createUsuario()
                } else if (activeTab === 'atendentes') {
                  saveAtendente()
                } else if (activeTab === 'precos') {
                  savePrecoExame()
                } else if (activeTab === 'acessos') {
                  addAcessoFinanceiro()
                }
              }}
              disabled={saving}
              className="bg-accent text-accent-foreground"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de permissoes */}
      <Dialog open={permissoesDialogOpen} onOpenChange={setPermissoesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permissoes de {(editingItem as UsuarioComPermissoes)?.nome}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Orcamentos</Label>
                <p className="text-sm text-muted-foreground">Acesso ao modulo de orcamentos</p>
              </div>
              <Switch
                checked={editingPermissoes.orcamento !== false}
                onCheckedChange={(v) => setEditingPermissoes({ ...editingPermissoes, orcamento: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Exames</Label>
                <p className="text-sm text-muted-foreground">Acesso a gaveta de exames</p>
              </div>
              <Switch
                checked={editingPermissoes.exames !== false}
                onCheckedChange={(v) => setEditingPermissoes({ ...editingPermissoes, exames: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Cronograma</Label>
                <p className="text-sm text-muted-foreground">Acesso ao cronograma e caixa</p>
              </div>
              <Switch
                checked={editingPermissoes.cronograma !== false}
                onCheckedChange={(v) => setEditingPermissoes({ ...editingPermissoes, cronograma: v })}
              />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <Label>Financeiro</Label>
                <p className="text-sm text-muted-foreground">Acesso a fechamento e recibos</p>
              </div>
              <Switch
                checked={editingPermissoes.financeiro || false}
                onCheckedChange={(v) => setEditingPermissoes({ ...editingPermissoes, financeiro: v })}
              />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <Label className="text-destructive">Administrador</Label>
                <p className="text-sm text-muted-foreground">Acesso total ao sistema</p>
              </div>
              <Switch
                checked={editingPermissoes.admin || false}
                onCheckedChange={(v) => setEditingPermissoes({ ...editingPermissoes, admin: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissoesDialogOpen(false)}>Cancelar</Button>
            <Button onClick={savePermissoes} disabled={saving} className="bg-accent text-accent-foreground">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar Permissoes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmacao de exclusao */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este item? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (activeTab === 'usuarios') deleteUsuario()
                else if (activeTab === 'atendentes') deleteAtendente()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
