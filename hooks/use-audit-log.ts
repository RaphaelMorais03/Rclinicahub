'use client'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from './use-auth'

type LogTipo = 'info' | 'success' | 'warning' | 'error'

interface LogData {
  [key: string]: unknown
}

export function useAuditLog() {
  const { user } = useAuth()

  const log = async (
    tipo: LogTipo,
    msg: string,
    dados?: LogData
  ) => {
    if (!user) return

    const supabase = createClient()
    
    try {
      await supabase.from('logs').insert({
        tipo,
        msg,
        uid: user.id,
        dados: dados || null
      })
    } catch (error) {
      console.error('Erro ao registrar log:', error)
    }
  }

  // Logs especificos para acoes comuns
  const logAcesso = (modulo: string) => {
    log('info', `Acesso ao modulo ${modulo}`)
  }

  const logCriacaoUsuario = (emailNovo: string) => {
    log('success', `Usuario criado: ${emailNovo}`, { email: emailNovo })
  }

  const logAtualizacaoPermissoes = (emailAlterado: string, permissoes: Record<string, boolean>) => {
    log('info', `Permissoes atualizadas: ${emailAlterado}`, { email: emailAlterado, permissoes })
  }

  const logUploadLogo = () => {
    log('success', 'Logo atualizada')
  }

  const logImportacaoExames = (quantidade: number, tipo: string) => {
    log('success', `Importacao de ${quantidade} exames do tipo ${tipo}`, { quantidade, tipo })
  }

  const logAtendenteAdicionado = (nome: string) => {
    log('info', `Atendente adicionado: ${nome}`, { nome })
  }

  const logAtendenteRemovido = (nome: string) => {
    log('warning', `Atendente removido: ${nome}`, { nome })
  }

  const logDadosClinicaAtualizados = () => {
    log('info', 'Dados da clinica atualizados')
  }

  const logExameRetirado = (paciente: string, tipo: string) => {
    log('success', `Exame retirado: ${paciente} - ${tipo}`, { paciente, tipo })
  }

  const logExameCadastrado = (paciente: string, tipo: string) => {
    log('info', `Exame cadastrado: ${paciente} - ${tipo}`, { paciente, tipo })
  }

  const logFechamentoGerado = (profissional: string, valor: number) => {
    log('success', `Fechamento gerado: ${profissional} - R$ ${valor.toFixed(2)}`, { profissional, valor })
  }

  const logReciboGerado = (colaborador: string, categoria: string, valor: number) => {
    log('success', `Recibo gerado: ${colaborador} - ${categoria} - R$ ${valor.toFixed(2)}`, { colaborador, categoria, valor })
  }

  const logCronogramaSalvo = () => {
    log('success', 'Cronograma semanal salvo')
  }

  const logCaixaAtualizado = (data: string, entradas: number, saidas: number) => {
    log('info', `Caixa atualizado: ${data}`, { data, entradas, saidas })
  }

  return {
    log,
    logAcesso,
    logCriacaoUsuario,
    logAtualizacaoPermissoes,
    logUploadLogo,
    logImportacaoExames,
    logAtendenteAdicionado,
    logAtendenteRemovido,
    logDadosClinicaAtualizados,
    logExameRetirado,
    logExameCadastrado,
    logFechamentoGerado,
    logReciboGerado,
    logCronogramaSalvo,
    logCaixaAtualizado
  }
}
