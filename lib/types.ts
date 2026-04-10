// Tipos do banco de dados
export type Cargo = 'admin' | 'financeiro' | 'comum'

export interface Usuario {
  id: string
  nome: string
  email: string
  cargo: Cargo
  ultimo_acesso: string | null
  criado_em: string | null
  created_at: string
  updated_at: string
}

export interface UsuarioPermissoes {
  id: string
  uid: string
  financeiro: boolean
  orcamento: boolean
  exames: boolean
  cronograma: boolean
  admin: boolean
  created_at: string
  updated_at: string
}

export interface UsuarioComPermissoes extends Usuario {
  permissoes?: UsuarioPermissoes
}

export interface Clinica {
  id: string
  nome: string
  subtitulo: string | null
  cnpj: string | null
  endereco: string | null
  telefone: string | null
  email: string | null
  logo_url: string | null
  horario: string | null
  empresa: string | null
  atualizado_em: string | null
  created_at: string
  updated_at: string
}

export interface Logo {
  id: string
  data_url: string
  versao: string
  atualizado_em: string
}

export interface Atendente {
  id: string
  nome: string
  apelido: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface AcessoFinanceiro {
  id: string
  email: string
  adicionado_em: string
}

export interface ExamePreco {
  exam_id: string
  ct: number | null
  part: number | null
  editado_em: string
}

export interface Colaborador {
  id: string
  nome: string
  cpf: string
  cargo: string | null
  valor_padrao: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Recibo {
  id: string
  colaborador_id: string
  categoria: string
  valor: number
  forma_pagamento: string
  periodo_inicio: string | null
  periodo_fim: string | null
  user_id: string
  created_at: string
  colaborador?: Colaborador
}

export interface GavetaExame {
  id: string
  paciente: string
  tipo_exame: string
  data_exame: string
  observacoes: string | null
  status: 'pendente' | 'retirado'
  quem_retirou: string | null
  atendente_entrega: string | null
  data_retirada: string | null
  atendente_cadastro: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface ExameRetirado {
  id: string
  paciente: string
  tipo: string
  data_exame: string | null
  quem_retirou: string | null
  atendente_entregou: string | null
  retirado_em: string
}

export interface CronoAgenda {
  id: string
  dia: 'Segunda' | 'Terca' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sabado'
  sala: string
  medico: string | null
  especialidade: string | null
  turno: 'Manha' | 'Tarde'
  atualizado_em: string
}

export interface Cronograma {
  id: string
  data: string
  sala: string
  medico: string | null
  especialidade: string | null
  horario_inicio: string | null
  horario_fim: string | null
  status: 'pendente' | 'pronto'
  user_id: string
  created_at: string
  updated_at: string
}

export interface CronogramaNota {
  id: string
  data: string
  texto: string
  tipo: 'comum' | 'recado' | 'limpeza'
  concluido: boolean
  user_id: string
  created_at: string
}

export interface OperacaoCaixa {
  id: string
  data: string
  entradas: number
  saidas: number
  atualizado_em: string
}

export interface OperacaoVale {
  id: string
  data: string
  paciente: string
  cpf: string | null
  especialidade: string | null
  valor: number
  hora: string
  created_at: string
}

export interface OperacaoChecklist {
  id: string
  data: string
  item_id: string
  titulo: string
  instrucao: string | null
  icone: string
  feito: boolean
  user_id: string | null
  created_at: string
}

export interface ChecklistAbertura {
  id: string
  data: string
  item: string
  concluido: boolean
  user_id: string
  created_at: string
}

export interface Caixa {
  id: string
  data: string
  dinheiro: number
  pix: number
  cartao: number
  user_id: string
  created_at: string
  updated_at: string
}

export interface Profissional {
  id: string
  nome: string
  cpf: string
  regime: 'funcionario' | 'pj-presumido'
  categoria: string
  chave_pix: string | null
  especialidade: string | null
  percentual: number
  tipo: 'medico' | 'terapeuta' | 'parceiro'
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Fechamento {
  id: string
  profissional_id: string
  subtotal: number
  pis: number
  csll: number
  cofins: number
  irrf: number
  liquido: number
  forma_pagamento: string
  pago: boolean
  user_id: string
  created_at: string
  profissional?: Profissional
  itens?: FechamentoItem[]
}

export interface FechamentoItem {
  id: string
  fechamento_id: string
  quantidade: number
  descricao: string
  valor_unitario: number
  valor_total: number
  created_at: string
}

export interface CatalogoExame {
  id: string
  nome: string
  categoria: string
  descricao: string | null
  preparo: string | null
  preco: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Parceiro {
  id: string
  nome: string
  localizacao: string | null
  ativo: boolean
  created_at: string
}

export interface ParceiroPreco {
  id: string
  parceiro_id: string
  exame_id: string
  preco_clinica: number
  preco_parceiro: number
  created_at: string
  parceiro?: Parceiro
  exame?: CatalogoExame
}

export interface Orcamento {
  id: string
  paciente: string | null
  total: number
  user_id: string
  created_at: string
  itens?: OrcamentoItem[]
}

export interface OrcamentoItem {
  id: string
  orcamento_id: string
  exame_id: string | null
  parceiro_id: string | null
  nome_exame: string
  preco: number
  created_at: string
  exame?: CatalogoExame
  parceiro?: Parceiro
}

export interface Log {
  id: string
  tipo: 'info' | 'success' | 'warning' | 'error'
  msg: string
  ts: string
  uid: string | null
  dados: Record<string, unknown> | null
}

// Tipos legados (mantidos para compatibilidade)
export interface Atendimento {
  id: string
  atendente: string
  data: string
  quantidade: number
  nps: number | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface Financeiro {
  id: string
  tipo: 'entrada' | 'saida'
  valor: number
  descricao: string
  data: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface Exame {
  id: string
  nome: string
  paciente: string
  data: string
  status: 'pendente' | 'concluido'
  observacoes: string | null
  user_id: string
  created_at: string
  updated_at: string
}

// Tipos de formulário
export interface GavetaExameForm {
  paciente: string
  tipo_exame: string
  data_exame: string
  observacoes?: string
  atendente_cadastro?: string
}

export interface CronogramaForm {
  data: string
  sala: string
  medico?: string
  especialidade?: string
  horario_inicio?: string
  horario_fim?: string
}

export interface ProfissionalForm {
  nome: string
  cpf: string
  regime: 'funcionario' | 'pj-presumido'
  categoria?: string
  chave_pix?: string
  especialidade?: string
  percentual?: number
  tipo?: 'medico' | 'terapeuta' | 'parceiro'
}

export interface FechamentoForm {
  profissional_id: string
  itens: {
    quantidade: number
    descricao: string
    valor_unitario: number
  }[]
  forma_pagamento?: string
}

export interface ColaboradorForm {
  nome: string
  cpf: string
  cargo?: string
  valor_padrao?: number
}

export interface ReciboForm {
  colaborador_id: string
  categoria: string
  valor: number
  forma_pagamento?: string
  periodo_inicio?: string
  periodo_fim?: string
}

export interface CatalogoExameForm {
  nome: string
  categoria: string
  descricao?: string
  preparo?: string
  preco: number
}

export interface ParceiroForm {
  nome: string
  localizacao?: string
}

export interface AtendenteForm {
  nome: string
  apelido?: string
}

export interface UsuarioForm {
  nome: string
  email: string
  senha?: string
}

export interface PermissoesForm {
  financeiro: boolean
  orcamento: boolean
  exames: boolean
  cronograma: boolean
  admin: boolean
}

// Constantes de impostos PJ Presumido
export const IMPOSTOS_PJ = {
  PIS: 0.0065,
  COFINS: 0.03,
  CSLL: 0.0288,
  IRRF: 0.048
}

// Função para calcular impostos
export function calcularImpostosPJ(subtotal: number) {
  const pis = subtotal * IMPOSTOS_PJ.PIS
  const cofins = subtotal * IMPOSTOS_PJ.COFINS
  const csll = subtotal * IMPOSTOS_PJ.CSLL
  const irrf = subtotal * IMPOSTOS_PJ.IRRF
  const totalImpostos = pis + cofins + csll + irrf
  const liquido = subtotal - totalImpostos

  return {
    pis: Math.round(pis * 100) / 100,
    cofins: Math.round(cofins * 100) / 100,
    csll: Math.round(csll * 100) / 100,
    irrf: Math.round(irrf * 100) / 100,
    totalImpostos: Math.round(totalImpostos * 100) / 100,
    liquido: Math.round(liquido * 100) / 100
  }
}

// Função para calcular repasse com percentual
export function calcularRepasse(total: number, percentual: number) {
  return Math.round(total * (percentual / 100) * 100) / 100
}

// Cores por tempo de espera da gaveta
export function getCorPorTempoEspera(dataExame: string): string {
  const hoje = new Date()
  const dataEx = new Date(dataExame)
  const diffDias = Math.floor((hoje.getTime() - dataEx.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDias <= 0) return 'bg-green-100 border-green-500' // Hoje
  if (diffDias <= 3) return 'bg-amber-100 border-amber-500' // 1-3 dias
  if (diffDias <= 7) return 'bg-orange-100 border-orange-500' // 3-7 dias
  return 'bg-red-100 border-red-500' // 7+ dias
}

// Categorias de recibo
export const CATEGORIAS_RECIBO = [
  'Bonificação',
  'Vale-Transporte',
  'Salário',
  'Adiantamento',
  'Cesta Básica',
  'Vale-Refeição',
  'Comissão',
  'Outros'
]

// Formas de pagamento
export const FORMAS_PAGAMENTO = [
  'PIX',
  'Transferência',
  'Dinheiro',
  'Cheque'
]

// Itens padrão do checklist de abertura
export const CHECKLIST_PADRAO = [
  { id: 'impressora', titulo: 'Ligar Impressoras', instrucao: 'Verificar se as impressoras estão ligadas e com papel', icone: 'printer' },
  { id: 'ar', titulo: 'Ar Condicionado', instrucao: 'Ligar os ar condicionados das salas', icone: 'thermometer' },
  { id: 'chave', titulo: 'Conferir Chaves', instrucao: 'Verificar se todas as chaves estão no lugar', icone: 'key' },
  { id: 'computadores', titulo: 'Ligar Computadores', instrucao: 'Ligar todos os computadores e verificar funcionamento', icone: 'monitor' },
  { id: 'recepcao', titulo: 'Organizar Recepção', instrucao: 'Verificar limpeza e organização da recepção', icone: 'home' },
  { id: 'agenda', titulo: 'Verificar Agenda', instrucao: 'Conferir agenda do dia no sistema', icone: 'calendar' }
]

// Tipos de exame para gaveta
export const TIPOS_EXAME = [
  'ECO - Ecocardiograma',
  'EEG - Eletroencefalograma',
  'USG - Ultrassom',
  'Potencial Evocado',
  'Holter',
  'MAPA',
  'Teste Ergométrico',
  'Outros'
]
