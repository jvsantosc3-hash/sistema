import React, { useState, useEffect } from 'react';
import { Ticket, ViewMode, UserPersona, TicketStatus, TicketPriority, Technician } from './types';
import { INITIAL_TICKETS } from './mockData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TicketsTableView } from './components/TicketsTableView';
import { KanbanView } from './components/KanbanView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { SLAReportView } from './components/SLAReportView';
import { TicketDetailModal } from './components/TicketDetailModal';
import { NewTicketModal } from './components/NewTicketModal';
import { SupabaseTableEditorView } from './components/SupabaseTableEditorView';
import { NetlifyDeployModal } from './components/NetlifyDeployModal';
import {
  getSupabaseClient,
  ticketToSupabaseRow,
  supabaseRowToTicket,
  loadSavedSupabaseConfig,
  fetchTicketsFromSupabase,
  saveTicketToSupabase,
} from './lib/supabase';
import { CheckCircle2, RotateCcw, Database, AlertCircle, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'deskflow_tickets_v1';

export default function App() {
  const [supabaseConfig, setSupabaseConfig] = useState(loadSavedSupabaseConfig());

  // Load tickets from LocalStorage or initialize with rich realistic sample data
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_TICKETS;
  });

  // Active navigation view
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  // Active user persona: 'technician' (Lucas Morais - N2) vs 'requester' (Camila Fernandes)
  const [persona, setPersona] = useState<UserPersona>('technician');

  // Modals state
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isNetlifyModalOpen, setIsNetlifyModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [kbSelectedArticleId, setKbSelectedArticleId] = useState<string | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch {
      // ignore
    }
  }, [tickets]);

  // Initial load from Supabase if connected & setup Realtime subscription
  useEffect(() => {
    const config = loadSavedSupabaseConfig();
    setSupabaseConfig(config);

    if (config.isConnected && config.url && config.anonKey) {
      // 1. Fetch remote tickets
      fetchTicketsFromSupabase(config.tableName).then((remoteTickets) => {
        if (remoteTickets && remoteTickets.length > 0) {
          setTickets(remoteTickets);
          console.log(`Carregados ${remoteTickets.length} chamados do Supabase.`);
        }
      });

      // 2. Realtime subscription
      const client = getSupabaseClient();
      if (client) {
        const channel = client
          .channel('public:chamados-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: config.tableName },
            (payload) => {
              console.log('Evento Realtime Supabase recebido:', payload);
              if (payload.eventType === 'INSERT') {
                const newT = supabaseRowToTicket(payload.new);
                setTickets((prev) => {
                  if (prev.some((t) => t.id === newT.id)) return prev;
                  return [newT, ...prev];
                });
              } else if (payload.eventType === 'UPDATE') {
                const updatedT = supabaseRowToTicket(payload.new);
                setTickets((prev) =>
                  prev.map((t) => (t.id === updatedT.id ? { ...t, ...updatedT } : t))
                );
              } else if (payload.eventType === 'DELETE') {
                setTickets((prev) => prev.filter((t) => t.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        return () => {
          client.removeChannel(channel);
        };
      }
    }
  }, []);

  // Selected ticket lookup
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  // Handlers
  const handleCreateTicket = (newTicket: Ticket) => {
    setTickets([newTicket, ...tickets]);
    showToast(`Chamado ${newTicket.protocol} aberto com sucesso!`);

    // Async sync to Supabase if connected
    saveTicketToSupabase(newTicket, supabaseConfig.tableName).then((saved) => {
      if (saved) console.log('Salvo diretamente no Supabase:', newTicket.protocol);
    });
  };

  const handleUpdateStatus = (
    ticketId: string,
    newStatus: TicketStatus,
    resolutionNote?: string
  ) => {
    setTickets((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== ticketId) return t;

        const now = new Date().toISOString();
        const authorName = persona === 'technician' ? 'Lucas Morais' : t.requester.name;

        let content = `Status alterado para "${newStatus.replace('_', ' ').toUpperCase()}".`;
        if (newStatus === 'resolvido' && resolutionNote) {
          content = `Chamado solucionado: ${resolutionNote}`;
        }

        const newEvent = {
          id: `tm-${Date.now()}`,
          type: newStatus === 'resolvido' ? ('resolution' as const) : ('status_change' as const),
          author: authorName,
          authorRole: (persona === 'technician' ? 'technician' : 'requester') as 'technician' | 'requester',
          content,
          timestamp: now,
        };

        const target = {
          ...t,
          status: newStatus,
          updatedAt: now,
          resolutionSummary: resolutionNote || t.resolutionSummary,
          timeline: [...t.timeline, newEvent],
        };

        // Async sync updated row to Supabase
        saveTicketToSupabase(target, supabaseConfig.tableName);

        return target;
      });
      return updated;
    });
    showToast('Status do chamado atualizado com sucesso.');
  };

  const handleAssignTechnician = (ticketId: string, tech: Technician | null) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const now = new Date().toISOString();
        const content = tech
          ? `Chamado atribuído para o analista ${tech.name} (${tech.role}).`
          : 'Chamado desatribuído e retornado à fila geral.';

        return {
          ...t,
          assignedTechnician: tech,
          updatedAt: now,
          timeline: [
            ...t.timeline,
            {
              id: `tm-${Date.now()}`,
              type: 'assignment',
              author: 'Lucas Morais',
              authorRole: 'technician',
              content,
              timestamp: now,
            },
          ],
        };
      })
    );
    showToast(tech ? `Atribuído a ${tech.name}` : 'Chamado desatribuído');
  };

  const handleUpdatePriority = (ticketId: string, priority: TicketPriority) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const now = new Date().toISOString();
        return {
          ...t,
          priority,
          updatedAt: now,
          timeline: [
            ...t.timeline,
            {
              id: `tm-${Date.now()}`,
              type: 'status_change',
              author: persona === 'technician' ? 'Lucas Morais' : t.requester.name,
              authorRole: persona === 'technician' ? 'technician' : 'requester',
              content: `Prioridade ajustada para "${priority.toUpperCase()}".`,
              timestamp: now,
            },
          ],
        };
      })
    );
    showToast(`Prioridade atualizada para ${priority.toUpperCase()}`);
  };

  const handleAddComment = (
    ticketId: string,
    content: string,
    isInternal: boolean,
    author: string,
    role: 'requester' | 'technician'
  ) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const now = new Date().toISOString();
        const newEvent = {
          id: `tm-${Date.now()}`,
          type: isInternal ? ('internal_note' as const) : ('comment' as const),
          author,
          authorRole: role,
          content,
          timestamp: now,
        };

        // If requester comments and ticket was waiting, automatically move back to in_progress
        let nextStatus = t.status;
        if (role === 'requester' && t.status === 'aguardando_usuario') {
          nextStatus = 'em_atendimento';
        }

        return {
          ...t,
          status: nextStatus,
          updatedAt: now,
          timeline: [...t.timeline, newEvent],
        };
      })
    );
    showToast(isInternal ? 'Nota interna adicionada.' : 'Resposta registrada no chamado.');
  };

  const handleSubmitCsat = (ticketId: string, rating: number, comment?: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          csat: {
            rating,
            comment,
            submittedAt: new Date().toISOString(),
          },
        };
      })
    );
    showToast('Avaliação registrada. Muito obrigado pelo feedback!');
  };

  const handleBulkUpdateStatus = (ticketIds: string[], newStatus: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (!ticketIds.includes(t.id)) return t;
        const now = new Date().toISOString();
        return {
          ...t,
          status: newStatus,
          updatedAt: now,
          timeline: [
            ...t.timeline,
            {
              id: `tm-${Date.now()}-${Math.random()}`,
              type: 'status_change',
              author: 'Operação em Lote',
              authorRole: 'technician',
              content: `Status atualizado em lote para ${newStatus.toUpperCase()}.`,
              timestamp: now,
            },
          ],
        };
      })
    );
    showToast(`${ticketIds.length} chamados atualizados para ${newStatus}.`);
  };

  const handleBulkAssignTechnician = (ticketIds: string[], tech: Technician | null) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (!ticketIds.includes(t.id)) return t;
        return {
          ...t,
          assignedTechnician: tech,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    showToast(`${ticketIds.length} chamados atribuídos com sucesso.`);
  };

  const handleResetData = () => {
    if (window.confirm('Deseja restaurar os chamados padrão de demonstração?')) {
      setTickets(INITIAL_TICKETS);
      localStorage.removeItem(STORAGE_KEY);
      showToast('Dados de demonstração restaurados.');
    }
  };

  // Filtered tickets for 'my_tickets' view
  const myTickets = tickets.filter((t) => {
    if (persona === 'technician') {
      return t.assignedTechnician?.id === 'tech-1';
    }
    return t.requester.email === 'camila.fernandes@empresa.com.br';
  });

  const openTicketsCount = tickets.filter(
    (t) => t.status !== 'resolvido' && t.status !== 'fechado' && t.status !== 'cancelado'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 text-neutral-900">
      {/* Top Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        persona={persona}
        setPersona={setPersona}
        onOpenNewTicket={() => setIsNewTicketOpen(true)}
        onOpenNetlifyDeploy={() => setIsNetlifyModalOpen(true)}
        openTicketsCount={openTicketsCount}
      />

      {/* Main Workspace with Sidebar + Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          persona={persona}
          tickets={tickets}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Supabase Global Integration Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-2.5 rounded-lg border bg-white text-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    supabaseConfig.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <div>
                  <span className="font-semibold text-neutral-900">
                    {supabaseConfig.isConnected
                      ? 'Banco de Dados Supabase Conectado'
                      : 'Levar Sistema para o Supabase'}
                  </span>
                  <span className="text-neutral-500 ml-2">
                    {supabaseConfig.isConnected
                      ? `Sincronização em tempo real ativa na tabela public.${supabaseConfig.tableName}`
                      : 'Conecte seu projeto Supabase para salvar e sincronizar todos os chamados na nuvem'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setCurrentView('supabase_table')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    supabaseConfig.isConnected
                      ? 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                  }`}
                >
                  {supabaseConfig.isConnected ? 'Gerenciar Tabela Supabase' : 'Conectar Supabase Agora'}
                </button>
              </div>
            </div>

            {/* View Switcher */}
            {currentView === 'dashboard' && (
              <DashboardView
                tickets={tickets}
                onSelectTicket={(t) => setSelectedTicketId(t.id)}
                setCurrentView={setCurrentView}
                onOpenNewTicket={() => setIsNewTicketOpen(true)}
              />
            )}

            {currentView === 'tickets' && (
              <TicketsTableView
                tickets={tickets}
                onSelectTicket={(t) => setSelectedTicketId(t.id)}
                onOpenNewTicket={() => setIsNewTicketOpen(true)}
                onBulkUpdateStatus={handleBulkUpdateStatus}
                onBulkAssignTechnician={handleBulkAssignTechnician}
              />
            )}

            {currentView === 'kanban' && (
              <KanbanView
                tickets={tickets}
                onSelectTicket={(t) => setSelectedTicketId(t.id)}
                onUpdateStatus={handleUpdateStatus}
                onOpenNewTicket={() => setIsNewTicketOpen(true)}
              />
            )}

            {currentView === 'my_tickets' && (
              <div className="space-y-4">
                <div className="border-b border-neutral-200 pb-3">
                  <h2 className="text-base font-bold text-neutral-900">
                    {persona === 'technician'
                      ? 'Meus Atendimentos Atribuídos (Lucas Morais)'
                      : 'Minhas Solicitações Abertas (Camila Fernandes)'}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Chamados vinculados diretamente ao seu usuário atual.
                  </p>
                </div>
                <TicketsTableView
                  tickets={myTickets}
                  onSelectTicket={(t) => setSelectedTicketId(t.id)}
                  onOpenNewTicket={() => setIsNewTicketOpen(true)}
                  onBulkUpdateStatus={handleBulkUpdateStatus}
                  onBulkAssignTechnician={handleBulkAssignTechnician}
                />
              </div>
            )}

            {currentView === 'knowledge' && (
              <KnowledgeBaseView
                onOpenNewTicket={() => setIsNewTicketOpen(true)}
                selectedArticleId={kbSelectedArticleId}
                onClearSelectedArticle={() => setKbSelectedArticleId(null)}
              />
            )}

            {currentView === 'sla_metrics' && <SLAReportView tickets={tickets} />}

            {currentView === 'supabase_table' && (
              <SupabaseTableEditorView
                tickets={tickets}
                onTicketsSynced={(newTickets) => setTickets(newTickets)}
                onOpenNewTicket={() => setIsNewTicketOpen(true)}
                showToast={showToast}
              />
            )}

            {/* Bottom Footer Info & Reset Data Action */}
            <footer className="pt-6 border-t border-neutral-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
              <div>
                DeskFlow ITSM · Sistema de Abertura e Gestão de Chamados Corporativos
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleResetData}
                  className="flex items-center gap-1 text-neutral-500 hover:text-neutral-800 transition-colors"
                  title="Recarregar massa de dados de teste inicial"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar Chamados de Teste</span>
                </button>
                <span>·</span>
                <span>Padrão ITIL Service Management</span>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* Ticket Details & Timeline Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          persona={persona}
          onClose={() => setSelectedTicketId(null)}
          onUpdateStatus={handleUpdateStatus}
          onAssignTechnician={handleAssignTechnician}
          onUpdatePriority={handleUpdatePriority}
          onAddComment={handleAddComment}
          onSubmitCsat={handleSubmitCsat}
        />
      )}

      {/* New Ticket Creation Modal */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        onCreateTicket={handleCreateTicket}
        persona={persona}
        onOpenArticle={(articleId) => {
          setIsNewTicketOpen(false);
          setKbSelectedArticleId(articleId);
          setCurrentView('knowledge');
        }}
      />

      {/* Netlify Deploy Guide Modal */}
      <NetlifyDeployModal
        isOpen={isNetlifyModalOpen}
        onClose={() => setIsNetlifyModalOpen(false)}
        showToast={showToast}
      />

      {/* Toast alert banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium border border-neutral-800 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
