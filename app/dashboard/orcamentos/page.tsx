'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
} from '@/components/ui/dialog'
import { 
  Calculator,
  Plus, 
  Trash2, 
  Search,
  FileText,
  Copy,
  Printer,
  MessageCircle,
  Download,
  Building2,
  Info,
  ArrowUpDown,
  Check
} from 'lucide-react'
import type { CatalogoExame, Parceiro, ParceiroPreco, ExamePreco } from '@/lib/types'

interface OrcamentoItem {
  exame: CatalogoExame
  parceiro?: Parceiro
  preco: number
  preparo?: string
}

// Dados estaticos de exemplo (podem ser carregados do banco depois)
const EXAMES_PADRAO: Array<{
  id: string
  nome: string
  categoria: string
  preparo: string | null
  preco_ct: number
  preco_part: number
}> = [
  { id: 'eco-trans', nome: 'Ecocardiograma Transtoracico', categoria: 'Cardiologia', preparo: null, preco_ct: 180, preco_part: 250 },
  { id: 'eco-stress', nome: 'Ecocardiograma de Estresse', categoria: 'Cardiologia', preparo: 'Jejum de 4 horas. Nao tomar cafe ou medicamentos estimulantes.', preco_ct: 350, preco_part: 450 },
  { id: 'holter-24h', nome: 'Holter 24 horas', categoria: 'Cardiologia', preparo: null, preco_ct: 200, preco_part: 280 },
  { id: 'mapa', nome: 'MAPA - Monit. Amb. da Pressao', categoria: 'Cardiologia', preparo: null, preco_ct: 200, preco_part: 280 },
  { id: 'ecg', nome: 'Eletrocardiograma', categoria: 'Cardiologia', preparo: null, preco_ct: 50, preco_part: 80 },
  { id: 'teste-ergo', nome: 'Teste Ergometrico', categoria: 'Cardiologia', preparo: 'Jejum de 2 horas. Trazer roupa leve e tenis.', preco_ct: 250, preco_part: 350 },
  
  { id: 'eeg', nome: 'Eletroencefalograma', categoria: 'Neurologia', preparo: 'Lavar cabelo no dia. Nao usar creme ou gel.', preco_ct: 180, preco_part: 250 },
  { id: 'pe-visual', nome: 'Potencial Evocado Visual', categoria: 'Neurologia', preparo: null, preco_ct: 200, preco_part: 280 },
  { id: 'pe-audit', nome: 'Potencial Evocado Auditivo', categoria: 'Neurologia', preparo: null, preco_ct: 200, preco_part: 280 },
  { id: 'enmg', nome: 'Eletroneuromiografia', categoria: 'Neurologia', preparo: 'Nao usar cremes no dia do exame.', preco_ct: 350, preco_part: 450 },
  
  { id: 'usg-abd-total', nome: 'USG Abdomen Total', categoria: 'Ultrassom', preparo: 'Jejum de 8 horas. Bexiga cheia.', preco_ct: 120, preco_part: 180 },
  { id: 'usg-abd-sup', nome: 'USG Abdomen Superior', categoria: 'Ultrassom', preparo: 'Jejum de 8 horas.', preco_ct: 100, preco_part: 150 },
  { id: 'usg-tireoide', nome: 'USG Tireoide', categoria: 'Ultrassom', preparo: null, preco_ct: 100, preco_part: 150 },
  { id: 'usg-mama', nome: 'USG Mama Bilateral', categoria: 'Ultrassom', preparo: null, preco_ct: 120, preco_part: 180 },
  { id: 'usg-pelve', nome: 'USG Pelve', categoria: 'Ultrassom', preparo: 'Bexiga cheia.', preco_ct: 100, preco_part: 150 },
  { id: 'usg-transvag', nome: 'USG Transvaginal', categoria: 'Ultrassom', preparo: 'Bexiga vazia.', preco_ct: 120, preco_part: 180 },
  { id: 'usg-prostata', nome: 'USG Prostata', categoria: 'Ultrassom', preparo: 'Bexiga cheia.', preco_ct: 120, preco_part: 180 },
  { id: 'usg-rins', nome: 'USG Rins e Vias Urinarias', categoria: 'Ultrassom', preparo: null, preco_ct: 100, preco_part: 150 },
  
  { id: 'rx-torax', nome: 'Raio-X Torax', categoria: 'Radiologia', preparo: null, preco_ct: 50, preco_part: 80 },
  { id: 'rx-coluna', nome: 'Raio-X Coluna', categoria: 'Radiologia', preparo: null, preco_ct: 60, preco_part: 100 },
  { id: 'rx-seios', nome: 'Raio-X Seios da Face', categoria: 'Radiologia', preparo: null, preco_ct: 50, preco_part: 80 },
  
  { id: 'espiro', nome: 'Espirometria', categoria: 'Pneumologia', preparo: 'Nao fumar 4 horas antes. Nao usar broncodilatador.', preco_ct: 100, preco_part: 150 },
  
  { id: 'endo-dig', nome: 'Endoscopia Digestiva Alta', categoria: 'Gastroenterologia', preparo: 'Jejum de 8 horas. Acompanhante obrigatorio.', preco_ct: 400, preco_part: 550 },
  { id: 'colon', nome: 'Colonoscopia', categoria: 'Gastroenterologia', preparo: 'Dieta e preparo intestinal. Acompanhante obrigatorio.', preco_ct: 600, preco_part: 800 },
  
  { id: 'densito', nome: 'Densitometria Ossea', categoria: 'Reumatologia', preparo: null, preco_ct: 150, preco_part: 220 },
  
  { id: 'mamografia', nome: 'Mamografia Digital', categoria: 'Ginecologia', preparo: 'Nao usar desodorante ou talco.', preco_ct: 120, preco_part: 180 },
]

const PARCEIROS_PADRAO = [
  { id: 'amorsaude', nome: 'Amor Saude Pirituba', localizacao: 'Pirituba' },
  { id: 'lavoisier', nome: 'Lavoisier', localizacao: 'Varias unidades' },
  { id: 'delboni', nome: 'Delboni Auriemo', localizacao: 'Varias unidades' },
  { id: 'fleury', nome: 'Fleury', localizacao: 'Varias unidades' },
]

type SortOption = 'default' | 'price-asc' | 'name-asc'

export default function OrcamentosPage() {
  const { permissoes } = useAuth()
  const [examesBanco, setExamesBanco] = useState<CatalogoExame[]>([])
  const [precosBanco, setPrecosBanco] = useState<ExamePreco[]>([])
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [selectedParceiro, setSelectedParceiro] = useState<string>('todos')
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [orcamentoItens, setOrcamentoItens] = useState<OrcamentoItem[]>([])
  const [pacienteNome, setPacienteNome] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showPreparoModal, setShowPreparoModal] = useState(false)
  const [showParceirosModal, setShowParceirosModal] = useState(false)
  const [selectedExameInfo, setSelectedExameInfo] = useState<typeof EXAMES_PADRAO[0] | null>(null)
  const [copiedMessage, setCopiedMessage] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    
    try {
      const [examesRes, precosRes, parceirosRes] = await Promise.all([
        supabase.from('catalogo_exames').select('*').eq('ativo', true).order('nome'),
        supabase.from('exames_precos').select('*'),
        supabase.from('parceiros').select('*').eq('ativo', true).order('nome')
      ])

      if (examesRes.data) setExamesBanco(examesRes.data)
      if (precosRes.data) setPrecosBanco(precosRes.data)
      if (parceirosRes.data && parceirosRes.data.length > 0) {
        setParceiros(parceirosRes.data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
    setIsLoading(false)
  }

  // Combina exames do banco com os padroes
  const exames = useMemo(() => {
    // Se tem exames no banco, usa eles. Senao, usa os padroes
    if (examesBanco.length > 0) {
      return examesBanco.map(e => ({
        id: e.id,
        nome: e.nome,
        categoria: e.categoria,
        preparo: e.preparo,
        preco_ct: e.preco,
        preco_part: e.preco * 1.4 // Particular 40% mais caro por padrao
      }))
    }
    
    // Aplica precos customizados do banco aos exames padrao
    return EXAMES_PADRAO.map(exame => {
      const precoCustom = precosBanco.find(p => p.exam_id === exame.id)
      return {
        ...exame,
        preco_ct: precoCustom?.ct ?? exame.preco_ct,
        preco_part: precoCustom?.part ?? exame.preco_part
      }
    })
  }, [examesBanco, precosBanco])

  const parceirosLista = parceiros.length > 0 ? parceiros : PARCEIROS_PADRAO

  const categorias = [...new Set(exames.map(e => e.categoria))]

  const filteredExames = useMemo(() => {
    let filtered = exames.filter(exame => {
      const matchSearch = exame.nome.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCategory = selectedCategory === 'todos' || exame.categoria === selectedCategory
      return matchSearch && matchCategory
    })

    // Ordenacao
    if (sortBy === 'price-asc') {
      filtered = [...filtered].sort((a, b) => a.preco_ct - b.preco_ct)
    } else if (sortBy === 'name-asc') {
      filtered = [...filtered].sort((a, b) => a.nome.localeCompare(b.nome))
    }

    return filtered
  }, [exames, searchTerm, selectedCategory, sortBy])

  // Destaque do termo de busca
  const highlightText = (text: string, term: string) => {
    if (!term) return text
    const regex = new RegExp(`(${term})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-accent/30 text-accent-foreground rounded px-0.5">{part}</mark> : part
    )
  }

  const addToOrcamento = (exame: typeof EXAMES_PADRAO[0], parceiroId?: string) => {
    const parceiro = parceiroId ? parceirosLista.find(p => p.id === parceiroId) : undefined
    const preco = exame.preco_ct

    setOrcamentoItens([...orcamentoItens, {
      exame: {
        id: exame.id,
        nome: exame.nome,
        categoria: exame.categoria,
        preparo: exame.preparo,
        preco: preco,
        ativo: true,
        created_at: '',
        updated_at: ''
      },
      parceiro: parceiro ? {
        id: parceiro.id,
        nome: parceiro.nome,
        localizacao: parceiro.localizacao || null,
        ativo: true,
        created_at: ''
      } : undefined,
      preco,
      preparo: exame.preparo || undefined
    }])
  }

  const removeFromOrcamento = (index: number) => {
    setOrcamentoItens(orcamentoItens.filter((_, i) => i !== index))
  }

  const total = orcamentoItens.reduce((sum, item) => sum + item.preco, 0)

  const copiarOrcamento = () => {
    let texto = `ORCAMENTO - AMOR SAUDE PIRITUBA\n`
    if (pacienteNome) texto += `Paciente: ${pacienteNome}\n`
    texto += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`
    texto += `EXAMES:\n`
    
    orcamentoItens.forEach((item, index) => {
      texto += `${index + 1}. ${item.exame.nome}`
      if (item.parceiro) texto += ` (${item.parceiro.nome})`
      texto += ` - R$ ${item.preco.toFixed(2)}\n`
      if (item.preparo) texto += `   Preparo: ${item.preparo}\n`
    })
    
    texto += `\nTOTAL: R$ ${total.toFixed(2)}`
    
    navigator.clipboard.writeText(texto)
    setCopiedMessage(true)
    setTimeout(() => setCopiedMessage(false), 2000)
  }

  const gerarMensagemWhatsApp = () => {
    let mensagem = `Ola! Segue orcamento de exames:\n\n`
    if (pacienteNome) mensagem += `*Paciente:* ${pacienteNome}\n\n`
    
    // Agrupa por parceiro
    const porParceiro = orcamentoItens.reduce((acc, item) => {
      const key = item.parceiro?.nome || 'Amor Saude Pirituba'
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {} as Record<string, OrcamentoItem[]>)

    Object.entries(porParceiro).forEach(([parceiro, itens]) => {
      mensagem += `*${parceiro}:*\n`
      itens.forEach(item => {
        mensagem += `- ${item.exame.nome}: R$ ${item.preco.toFixed(2)}\n`
        if (item.preparo) {
          mensagem += `  _Preparo: ${item.preparo}_\n`
        }
      })
      mensagem += '\n'
    })

    mensagem += `*TOTAL: R$ ${total.toFixed(2)}*`
    
    navigator.clipboard.writeText(mensagem)
    setCopiedMessage(true)
    setTimeout(() => setCopiedMessage(false), 2000)
  }

  const exportarExcel = () => {
    // Gera CSV simples (pode ser aberto no Excel)
    let csv = 'Exame,Parceiro,Preco,Preparo\n'
    orcamentoItens.forEach(item => {
      csv += `"${item.exame.nome}","${item.parceiro?.nome || 'Amor Saude'}","${item.preco.toFixed(2)}","${item.preparo || ''}"\n`
    })
    csv += `"","TOTAL","${total.toFixed(2)}",""\n`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `orcamento_${pacienteNome || 'sem_nome'}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const imprimirOrcamento = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orcamento - Amor Saude</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #1a2744; margin: 0; font-size: 24px; }
          .header p { color: #666; margin: 5px 0; }
          .info { margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #1a2744; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .preparo { font-size: 12px; color: #c41e3a; margin-top: 5px; }
          .total { font-size: 20px; font-weight: bold; text-align: right; color: #1a2744; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AMOR SAUDE PIRITUBA</h1>
          <p>Portal Interno - Orcamento de Exames</p>
        </div>
        
        <div class="info">
          ${pacienteNome ? `<strong>Paciente:</strong> ${pacienteNome}<br>` : ''}
          <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Exame</th>
              <th>Local</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${orcamentoItens.map((item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>
                  ${item.exame.nome}
                  ${item.preparo ? `<div class="preparo">Preparo: ${item.preparo}</div>` : ''}
                </td>
                <td>${item.parceiro?.nome || 'Amor Saude'}</td>
                <td>R$ ${item.preco.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">TOTAL: R$ ${total.toFixed(2)}</div>

        <div class="footer">
          Orcamento gerado em ${new Date().toLocaleString('pt-BR')}<br>
          Amor Saude Pirituba - Seu cuidado, nossa prioridade
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const limparOrcamento = () => {
    setOrcamentoItens([])
    setPacienteNome('')
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Carregando catalogo de exames...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Sistema de Orcamentos</h1>
          <p className="text-sm text-muted-foreground md:text-base">Monte orcamentos de exames com preparos e parceiros</p>
        </div>
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-2">
        {/* Painel de Exames */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Catalogo de Exames ({filteredExames.length})
            </CardTitle>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar exame..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas categorias</SelectItem>
                    {categorias.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-36">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Padrao</SelectItem>
                    <SelectItem value="price-asc">Menor preco</SelectItem>
                    <SelectItem value="name-asc">A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="space-y-1 p-4 pt-0">
                {filteredExames.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-muted-foreground">
                    Nenhum exame encontrado
                  </div>
                ) : (
                  filteredExames.map(exame => (
                    <div
                      key={exame.id}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{highlightText(exame.nome, searchTerm)}</span>
                          <Badge variant="secondary" className="text-xs">
                            {exame.categoria}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span className="text-primary font-medium">
                            CT: R$ {exame.preco_ct.toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">
                            Part: R$ {exame.preco_part.toFixed(2)}
                          </span>
                        </div>
                        {exame.preparo && (
                          <button
                            className="mt-1 text-xs text-accent hover:underline flex items-center gap-1"
                            onClick={() => {
                              setSelectedExameInfo(exame)
                              setShowPreparoModal(true)
                            }}
                          >
                            <Info className="h-3 w-3" />
                            Ver preparo
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedExameInfo(exame)
                            setShowParceirosModal(true)
                          }}
                          title="Ver parceiros"
                        >
                          <Building2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addToOrcamento(exame)}
                          title="Adicionar ao orcamento"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Painel do Orcamento */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5" />
              Orcamento ({orcamentoItens.length} itens)
            </CardTitle>
            <Input
              placeholder="Nome do paciente (opcional)"
              value={pacienteNome}
              onChange={(e) => setPacienteNome(e.target.value)}
            />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            <ScrollArea className="flex-1 h-[calc(100vh-500px)]">
              <div className="space-y-2 p-4 pt-0">
                {orcamentoItens.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-muted-foreground">
                    Clique em + para adicionar exames
                  </div>
                ) : (
                  orcamentoItens.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between rounded-lg border bg-muted/30 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.exame.nome}</div>
                        {item.parceiro && (
                          <div className="text-sm text-accent flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {item.parceiro.nome}
                          </div>
                        )}
                        {item.preparo && (
                          <div className="mt-1 rounded bg-accent/10 p-2 text-xs text-accent">
                            Preparo: {item.preparo}
                          </div>
                        )}
                        <div className="mt-1 font-bold text-primary">
                          R$ {item.preco.toFixed(2)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeFromOrcamento(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-4 space-y-4">
              <div className="flex items-center justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-primary">R$ {total.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={copiarOrcamento}
                  disabled={orcamentoItens.length === 0}
                  className="relative"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={gerarMensagemWhatsApp}
                  disabled={orcamentoItens.length === 0}
                  className="text-green-600 hover:text-green-700"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={imprimirOrcamento}
                  disabled={orcamentoItens.length === 0}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  onClick={exportarExcel}
                  disabled={orcamentoItens.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={limparOrcamento}
                disabled={orcamentoItens.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Orcamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Preparo */}
      <Dialog open={showPreparoModal} onOpenChange={setShowPreparoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preparo do Exame</DialogTitle>
          </DialogHeader>
          {selectedExameInfo && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">{selectedExameInfo.nome}</h4>
                <Badge variant="secondary">{selectedExameInfo.categoria}</Badge>
              </div>
              {selectedExameInfo.preparo ? (
                <div className="rounded-lg bg-accent/10 p-4 text-accent">
                  <p className="font-medium mb-2">Instrucoes de Preparo:</p>
                  <p>{selectedExameInfo.preparo}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Este exame nao requer preparo especial.</p>
              )}
              <Button 
                className="w-full" 
                onClick={() => {
                  addToOrcamento(selectedExameInfo)
                  setShowPreparoModal(false)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar ao Orcamento
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Parceiros */}
      <Dialog open={showParceirosModal} onOpenChange={setShowParceirosModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Parceiro</DialogTitle>
          </DialogHeader>
          {selectedExameInfo && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">{selectedExameInfo.nome}</h4>
                <p className="text-sm text-muted-foreground">
                  Preco base: R$ {selectedExameInfo.preco_ct.toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                {parceirosLista.map(parceiro => (
                  <Button
                    key={parceiro.id}
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => {
                      addToOrcamento(selectedExameInfo, parceiro.id)
                      setShowParceirosModal(false)
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {parceiro.nome}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {parceiro.localizacao}
                    </span>
                  </Button>
                ))}
                <Separator />
                <Button
                  className="w-full"
                  onClick={() => {
                    addToOrcamento(selectedExameInfo)
                    setShowParceirosModal(false)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar sem parceiro
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
