-- ==============================================================================
-- DESKFLOW ITSM - SCHEMA COMPLETO PARA SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Como utilizar:
-- 1. Acesse o painel do seu projeto no Supabase: https://supabase.com/dashboard
-- 2. Vá em "SQL Editor" > "New Query"
-- 3. Cole todo o conteúdo deste arquivo e clique em "Run" (Executar)
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela Principal de Chamados
CREATE TABLE IF NOT EXISTS public.chamados (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    protocol TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    department TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
    urgency TEXT NOT NULL DEFAULT 'media' CHECK (urgency IN ('baixa', 'media', 'alta')),
    impact TEXT NOT NULL DEFAULT 'medio' CHECK (impact IN ('baixo', 'medio', 'alto')),
    status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_atendimento', 'aguardando_usuario', 'resolvido', 'fechado', 'cancelado')),
    
    -- Dados do Solicitante
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_phone TEXT,
    requester_department TEXT,
    requester_location TEXT,
    
    -- Técnico Atribuído
    assigned_technician_name TEXT,
    assigned_technician_email TEXT,
    asset_tag TEXT,
    
    -- Métricas de SLA
    sla_deadline TIMESTAMPTZ NOT NULL,
    sla_total_hours INTEGER NOT NULL DEFAULT 24,
    
    -- Resolução e Avaliação (CSAT)
    resolution_summary TEXT,
    csat_rating INTEGER CHECK (csat_rating >= 1 AND csat_rating <= 5),
    csat_comment TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Interações e Linha do Tempo (Timeline / Mensagens)
CREATE TABLE IF NOT EXISTS public.chamado_interacoes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    chamado_id TEXT NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('creation', 'status_change', 'comment', 'internal_note', 'assignment', 'resolution')),
    author TEXT NOT NULL,
    author_role TEXT NOT NULL DEFAULT 'technician' CHECK (author_role IN ('requester', 'technician', 'system')),
    content TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Artigos da Base de Conhecimento
CREATE TABLE IF NOT EXISTS public.artigos_base (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    views INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Índices de Otimização
CREATE INDEX IF NOT EXISTS idx_chamados_protocol ON public.chamados(protocol);
CREATE INDEX IF NOT EXISTS idx_chamados_status ON public.chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_priority ON public.chamados(priority);
CREATE INDEX IF NOT EXISTS idx_chamados_dept ON public.chamados(department);
CREATE INDEX IF NOT EXISTS idx_chamados_created_at ON public.chamados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interacoes_chamado_id ON public.chamado_interacoes(chamado_id);

-- 6. Trigger para atualizar automaticamente 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_chamados_updated_at ON public.chamados;
CREATE TRIGGER trigger_chamados_updated_at
BEFORE UPDATE ON public.chamados
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 7. Configuração de Row Level Security (RLS)
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamado_interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artigos_base ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (usando a chave pública 'anon')
CREATE POLICY "Permitir leitura anonima de chamados" ON public.chamados FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir criacao anonima de chamados" ON public.chamados FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualizacao anonima de chamados" ON public.chamados FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir exclusao anonima de chamados" ON public.chamados FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Permitir leitura de interacoes" ON public.chamado_interacoes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Permitir criacao de interacoes" ON public.chamado_interacoes FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Permitir leitura da base de conhecimento" ON public.artigos_base FOR SELECT TO anon, authenticated USING (true);

-- 8. Ativar Realtime para a tabela chamados (para atualização instantânea na interface)
ALTER PUBLICATION supabase_realtime ADD TABLE public.chamados;
