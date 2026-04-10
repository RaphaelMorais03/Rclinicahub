// Tipos do banco de dados
export type Cargo = 'admin' | 'financeiro' | 'comum'

export interface Usuario {
  id: string
  nome: string
  email: string
  cargo: Cargo
  created_at: string
  updated_at: string
}

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
export interface AtendimentoForm {
  atendente: string
  data: string
  quantidade: number
  nps?: number
}

export interface FinanceiroForm {
  tipo: 'entrada' | 'saida'
  valor: number
  descricao: string
  data: string
}

export interface ExameForm {
  nome: string
  paciente: string
  data: string
  status: 'pendente' | 'concluido'
  observacoes?: string
}

// Tipos de estatísticas
export interface DashboardStats {
  totalAtendimentos: number
  npsMedia: number
  totalEntradas: number
  totalSaidas: number
  saldo: number
  examesPendentes: number
  examesConcluidos: number
}
