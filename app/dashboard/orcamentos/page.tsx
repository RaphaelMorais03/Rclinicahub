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
  Calculator,
  Plus, 
  Trash2, 
  Search,
  FileText,
  Copy,
  Printer
} from 'lucide-react'
import type { CatalogoExame, Parceiro, ParceiroPreco } from '@/lib/types'

interface OrcamentoItem {
  exame: CatalogoExame
  parceiro?: Parceiro
  preco: number
  preparo?: string
}

export default function OrcamentosPage() {
  const { usuario } = useAuth()
  const [exames, setExames] = useState<CatalogoExame[]>([])
  const [parceiros, setParceiros] = useState<Parceiro[]>([])
  const [precosParceiros, setPrecosParceiros] = useState<ParceiroPreco[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [orcamentoItens, setOrcamentoItens] = useState<OrcamentoItem[]>([])
  const [pacienteNome, setPacienteNome] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    
    const [examesRes, parceirosRes, precosRes] = await Promise.all([
      supabase.from('catalogo_exames').select('*').eq('ativo', true).order('nome'),
      supabase.from('parceiros').select('*').eq('ativo', true).order('nome'),
      supabase.from('parceiro_precos').select('*, parceiro:parceiros(*), exame:catalogo_exames(*)')
    ])

    if (examesRes.data) setExames(examesRes.data)
    if (parceirosRes.data) setParceiros(parceirosRes.data)
    if (precosRes.data) setPrecosParceiros(precosRes.data)
    setIsLoading(false)
  }

  const categorias = [...new Set(exames.map(e => e.categoria))]

  const filteredExames = exames.filter(exame => {
    const matchSearch = exame.nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = selectedCategory === 'todos' || exame.categoria === selectedCategory
    return matchSearch && matchCategory
  })

  const addToOrcamento = (exame: CatalogoExame, parceiro?: Parceiro) => {
    // Verifica se tem preco de parceiro
    let preco = exame.preco
    if (parceiro) {
      const precoParceiro = precosParceiros.find(
        p => p.exame_id === exame.id && p.parceiro_id === parceiro.id
      )
      if (precoParceiro) {
        preco = precoParceiro.preco_clinica
      }
    }

    setOrcamentoItens([...orcamentoItens, {
      exame,
      parceiro,
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
  }

  const limparOrcamento = () => {
    setOrcamentoItens([])
    setPacienteNome('')
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
          <h1 className="text-3xl font-bold text-foreground">Sistema de Orcamentos</h1>
          <p className="text-muted-foreground">Monte orcamentos de exames com preparos</p>
        </div>
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        {/* Painel de Exames */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Catalogo de Exames
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar exame..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {filteredExames.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                Nenhum exame encontrado. Configure o catalogo na area de administracao.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredExames.map(exame => (
                  <div
                    key={exame.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{exame.nome}</span>
                        <Badge variant="secondary" className="text-xs">
                          {exame.categoria}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        R$ {exame.preco.toFixed(2)}
                      </div>
                      {exame.preparo && (
                        <div className="mt-1 text-xs text-accent">
                          Preparo: {exame.preparo}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addToOrcamento(exame)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Painel do Orcamento */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Orcamento Atual
            </CardTitle>
            <Input
              placeholder="Nome do paciente (opcional)"
              value={pacienteNome}
              onChange={(e) => setPacienteNome(e.target.value)}
            />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex-1 space-y-2 overflow-auto">
              {orcamentoItens.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  Adicione exames ao orcamento
                </div>
              ) : (
                orcamentoItens.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between rounded-lg border bg-muted/30 p-3"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.exame.nome}</div>
                      {item.parceiro && (
                        <div className="text-sm text-accent">
                          Parceiro: {item.parceiro.nome}
                        </div>
                      )}
                      {item.preparo && (
                        <div className="mt-1 rounded bg-accent/10 p-2 text-xs text-accent">
                          Preparo: {item.preparo}
                        </div>
                      )}
                      <div className="mt-1 font-medium text-primary">
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

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-primary">R$ {total.toFixed(2)}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={copiarOrcamento}
                  disabled={orcamentoItens.length === 0}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
                <Button
                  variant="destructive"
                  onClick={limparOrcamento}
                  disabled={orcamentoItens.length === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
