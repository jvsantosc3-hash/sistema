import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig, Ticket } from '../types';

const CONFIG_STORAGE_KEY = 'deskflow_supabase_config_v1';

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  url: (import.meta as any).env?.VITE_SUPABASE_URL || '',
  anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',
  tableName: 'chamados',
  isConnected: false,
};

let cachedClient: SupabaseClient | null = null;
let currentConfig: SupabaseConfig = DEFAULT_SUPABASE_CONFIG;

export function loadSavedSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.url === 'string') {
        currentConfig = parsed;
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_SUPABASE_CONFIG;
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  currentConfig = config;
  cachedClient = null;
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = currentConfig.url ? currentConfig : loadSavedSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Erro ao inicializar cliente Supabase:', err);
    return null;
  }
}

// Convert application Ticket format into relational row for Supabase
export function ticketToSupabaseRow(ticket: Ticket) {
  return {
    id: ticket.id,
    protocol: ticket.protocol,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    subcategory: ticket.subcategory || null,
    department: ticket.department,
    priority: ticket.priority,
    urgency: ticket.urgency,
    impact: ticket.impact,
    status: ticket.status,
    requester_name: ticket.requester.name,
    requester_email: ticket.requester.email,
    requester_phone: ticket.requester.phone || null,
    requester_department: ticket.requester.department,
    requester_location: ticket.requester.location || null,
    assigned_technician_name: ticket.assignedTechnician?.name || null,
    assigned_technician_email: ticket.assignedTechnician?.email || null,
    asset_tag: ticket.assetTag || null,
    sla_deadline: ticket.slaDeadline,
    sla_total_hours: ticket.slaTotalHours,
    resolution_summary: ticket.resolutionSummary || null,
    csat_rating: ticket.csat?.rating || null,
    csat_comment: ticket.csat?.comment || null,
    created_at: ticket.createdAt,
    updated_at: ticket.updatedAt,
  };
}

// Convert Supabase row back to application Ticket format
export function supabaseRowToTicket(row: any): Ticket {
  return {
    id: row.id,
    protocol: row.protocol || `CH-${row.id?.slice(0, 8)}`,
    title: row.title || 'Chamado importado',
    description: row.description || '',
    category: row.category || 'Geral',
    subcategory: row.subcategory || undefined,
    department: row.department || row.requester_department || 'TI & Infraestrutura',
    priority: (row.priority as any) || 'media',
    urgency: (row.urgency as any) || 'media',
    impact: (row.impact as any) || 'medio',
    status: (row.status as any) || 'novo',
    requester: {
      name: row.requester_name || 'Usuário Supabase',
      email: row.requester_email || 'usuario@empresa.com.br',
      phone: row.requester_phone || '(11) 90000-0000',
      department: row.requester_department || row.department || 'Geral',
      role: 'Colaborador',
      location: row.requester_location || 'Matriz',
    },
    assignedTechnician: row.assigned_technician_name
      ? {
          id: 'tech-supabase',
          name: row.assigned_technician_name,
          email: row.assigned_technician_email || '',
          role: 'Analista de Suporte',
          initials: row.assigned_technician_name.slice(0, 2).toUpperCase(),
          department: 'Suporte',
          specialty: 'Atendimento',
        }
      : null,
    assetTag: row.asset_tag || undefined,
    attachments: [],
    timeline: [
      {
        id: `tm-${Date.now()}`,
        type: 'creation',
        author: row.requester_name || 'Supabase',
        authorRole: 'requester',
        content: 'Registro sincronizado com a tabela Supabase.',
        timestamp: row.created_at || new Date().toISOString(),
      },
    ],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    slaDeadline: row.sla_deadline || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    slaTotalHours: row.sla_total_hours || 24,
    resolutionSummary: row.resolution_summary || undefined,
    csat: row.csat_rating
      ? {
          rating: row.csat_rating,
          comment: row.csat_comment || undefined,
          submittedAt: row.updated_at || new Date().toISOString(),
        }
      : undefined,
  };
}

export async function fetchTicketsFromSupabase(tableName: string = 'chamados'): Promise<Ticket[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Erro ao consultar Supabase:', error.message);
      return null;
    }

    if (data && Array.isArray(data)) {
      return data.map(supabaseRowToTicket);
    }
    return [];
  } catch (err) {
    console.warn('Falha na comunicação com Supabase:', err);
    return null;
  }
}

export async function saveTicketToSupabase(ticket: Ticket, tableName: string = 'chamados'): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = ticketToSupabaseRow(ticket);
    const { error } = await client.from(tableName).upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('Erro ao salvar no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao salvar no Supabase:', err);
    return false;
  }
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string,
  tableName: string = 'chamados'
): Promise<{ success: boolean; message: string; rowCount?: number }> {
  try {
    const testClient = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data, error, count } = await testClient
      .from(tableName)
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: false,
          message: `Conectou ao Supabase com sucesso, mas a tabela "${tableName}" ainda não foi criada. Copie o script SQL abaixo e execute no SQL Editor do Supabase.`,
        };
      }
      return { success: false, message: `Erro ao consultar tabela: ${error.message}` };
    }

    return {
      success: true,
      message: `Conexão estabelecida com sucesso! (${count ?? data?.length ?? 0} registros encontrados).`,
      rowCount: count ?? data?.length ?? 0,
    };
  } catch (err: any) {
    return { success: false, message: `Falha de rede ou URL inválida: ${err.message || err}` };
  }
}

export function getSupabaseSQLScript(tableName: string = 'chamados'): string {
  return `-- ============================================================
-- SCRIPT DE CRIAÇÃO DA TABELA DE CHAMADOS NO SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.${tableName} (
    id TEXT PRIMARY KEY,
    protocol TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    department TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'media',
    urgency TEXT DEFAULT 'media',
    impact TEXT DEFAULT 'medio',
    status TEXT NOT NULL DEFAULT 'novo',
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_phone TEXT,
    requester_department TEXT,
    requester_location TEXT,
    assigned_technician_name TEXT,
    assigned_technician_email TEXT,
    asset_tag TEXT,
    sla_deadline TIMESTAMPTZ,
    sla_total_hours INTEGER DEFAULT 24,
    resolution_summary TEXT,
    csat_rating INTEGER,
    csat_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública/anônima (permite SELECT via chave anon)
CREATE POLICY "Permitir leitura de chamados" 
ON public.${tableName} 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Política de inserção pública/anônima (permite criar chamados)
CREATE POLICY "Permitir criacao de chamados" 
ON public.${tableName} 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Política de atualização (permite atualizar status e respostas)
CREATE POLICY "Permitir atualizacao de chamados" 
ON public.${tableName} 
FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

-- Índice para buscas rápidas por protocolo e status
CREATE INDEX IF NOT EXISTS idx_chamados_protocol ON public.${tableName}(protocol);
CREATE INDEX IF NOT EXISTS idx_chamados_status ON public.${tableName}(status);
`;
}
