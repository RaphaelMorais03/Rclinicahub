-- =============================================
-- ClinicHub Database Schema
-- =============================================

-- Tabela de usuários (perfis vinculados ao auth.users)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cargo TEXT NOT NULL DEFAULT 'comum' CHECK (cargo IN ('admin', 'financeiro', 'comum')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de atendimentos
CREATE TABLE IF NOT EXISTS public.atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atendente TEXT NOT NULL,
  data DATE NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  nps INTEGER CHECK (nps >= 0 AND nps <= 10),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela financeira
CREATE TABLE IF NOT EXISTS public.financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor DECIMAL(10, 2) NOT NULL,
  descricao TEXT NOT NULL,
  data DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de exames
CREATE TABLE IF NOT EXISTS public.exames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  paciente TEXT NOT NULL,
  data DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
  observacoes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Enable Row Level Security
-- =============================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exames ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for usuarios
-- =============================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "usuarios_select_own" ON public.usuarios 
  FOR SELECT USING (auth.uid() = id);

-- Admins podem ver todos os usuários
CREATE POLICY "usuarios_select_admin" ON public.usuarios 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() AND u.cargo = 'admin'
    )
  );

-- Usuários podem atualizar seu próprio perfil (exceto cargo)
CREATE POLICY "usuarios_update_own" ON public.usuarios 
  FOR UPDATE USING (auth.uid() = id);

-- Permitir inserção durante signup
CREATE POLICY "usuarios_insert_own" ON public.usuarios 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- RLS Policies for atendimentos
-- =============================================

-- Todos podem ver atendimentos
CREATE POLICY "atendimentos_select_all" ON public.atendimentos 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid()
    )
  );

-- Usuários podem inserir atendimentos
CREATE POLICY "atendimentos_insert" ON public.atendimentos 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar atendimentos que criaram
CREATE POLICY "atendimentos_update" ON public.atendimentos 
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins podem atualizar qualquer atendimento
CREATE POLICY "atendimentos_update_admin" ON public.atendimentos 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() AND u.cargo = 'admin'
    )
  );

-- Usuários podem deletar atendimentos que criaram
CREATE POLICY "atendimentos_delete" ON public.atendimentos 
  FOR DELETE USING (auth.uid() = user_id);

-- Admins podem deletar qualquer atendimento
CREATE POLICY "atendimentos_delete_admin" ON public.atendimentos 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() AND u.cargo = 'admin'
    )
  );

-- =============================================
-- RLS Policies for financeiro (apenas admin e financeiro)
-- =============================================

-- Apenas admin e financeiro podem ver registros financeiros
CREATE POLICY "financeiro_select" ON public.financeiro 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() AND u.cargo IN ('admin', 'financeiro')
    )
  );

-- Apenas admin e financeiro podem inserir
CREATE POLICY "financeiro_insert" ON public.financeiro 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() AND u.cargo IN ('admin', 'financeiro')
    )
  );

-- Apenas admin e financeiro podem atualizar
CREATE POLICY "financeiro_update" ON public.financeiro 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() AND u.cargo IN ('admin', 'financeiro')
    )
  );

-- Apenas admin pode deletar
CREATE POLICY "financeiro_delete" ON public.financeiro 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() AND u.cargo = 'admin'
    )
  );

-- =============================================
-- RLS Policies for exames
-- =============================================

-- Todos os usuários autenticados podem ver exames
CREATE POLICY "exames_select_all" ON public.exames 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid()
    )
  );

-- Usuários podem inserir exames
CREATE POLICY "exames_insert" ON public.exames 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar exames que criaram
CREATE POLICY "exames_update" ON public.exames 
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins podem atualizar qualquer exame
CREATE POLICY "exames_update_admin" ON public.exames 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() AND u.cargo = 'admin'
    )
  );

-- Usuários podem deletar exames que criaram
CREATE POLICY "exames_delete" ON public.exames 
  FOR DELETE USING (auth.uid() = user_id);

-- Admins podem deletar qualquer exame
CREATE POLICY "exames_delete_admin" ON public.exames 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() AND u.cargo = 'admin'
    )
  );

-- =============================================
-- Trigger para criar perfil de usuário automaticamente
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, cargo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'cargo', 'comum')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
