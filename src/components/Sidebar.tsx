import React from 'react';
import { ViewMode, UserPersona, Ticket } from '../types';
import {
  LayoutDashboard,
  Inbox,
  Kanban,
  FileText,
  BookOpen,
  BarChart3,
  LifeBuoy,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  persona: UserPersona;
  tickets: Ticket[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  persona,
  tickets,
}) => {
  const activeTickets = tickets.filter(
    (t) => t.status === 'novo' || t.status === 'em_atendimento' || t.status === 'aguardando_usuario'
  );
  const criticalTickets = tickets.filter(
    (t) => (t.priority === 'critica' || t.priority === 'alta') && t.status !== 'resolvido' && t.status !== 'fechado'
  );
  const myTicketsCount = tickets.filter((t) => {
    if (persona === 'technician') {
      return t.assignedTechnician?.id === 'tech-1';
    }
    return t.requester.email === 'camila.fernandes@empresa.com.br';
  }).length;

  const navItems = [
    {
      id: 'dashboard' as ViewMode,
      label: 'Painel Geral',
      icon: LayoutDashboard,
      count: null,
    },
    {
      id: 'tickets' as ViewMode,
      label: 'Fila de Chamados',
      icon: Inbox,
      count: activeTickets.length,
    },
    {
      id: 'kanban' as ViewMode,
      label: 'Quadro Kanban',
      icon: Kanban,
      count: null,
    },
    {
      id: 'my_tickets' as ViewMode,
      label: persona === 'technician' ? 'Meus Atendimentos' : 'Minhas Solicitações',
      icon: FileText,
      count: myTicketsCount,
    },
    {
      id: 'knowledge' as ViewMode,
      label: 'Base de Conhecimento',
      icon: BookOpen,
      count: null,
    },
    {
      id: 'sla_metrics' as ViewMode,
      label: 'Relatório & SLA',
      icon: BarChart3,
      count: null,
    },
    {
      id: 'supabase_table' as ViewMode,
      label: 'Tabela Supabase',
      icon: Database,
      count: null,
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white flex flex-col justify-between select-none">
      <div>
        {/* Workspace Brand / Info */}
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white font-bold text-xs tracking-wider">
              DF
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 leading-tight">Central de Serviços</h2>
              <p className="text-xs text-neutral-500">Service Desk & Suporte</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="p-3 space-y-1">
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Navegação
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== null && item.count > 0 && (
                  <span
                    className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick status summary */}
        <div className="p-3 mx-3 mt-2 rounded-lg border border-neutral-200 bg-neutral-50/70 text-xs space-y-2">
          <div className="flex items-center justify-between font-medium text-neutral-700">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Em Aberto</span>
            </span>
            <span className="font-mono tabular-nums text-neutral-900">{activeTickets.length}</span>
          </div>

          <div className="flex items-center justify-between font-medium text-neutral-700">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Críticos / Urgentes</span>
            </span>
            <span className="font-mono tabular-nums text-rose-600 font-semibold">{criticalTickets.length}</span>
          </div>

          <div className="flex items-center justify-between font-medium text-neutral-700">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>SLA no Prazo</span>
            </span>
            <span className="font-mono tabular-nums text-emerald-600">94.2%</span>
          </div>
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-neutral-200 bg-neutral-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 font-mono text-xs font-semibold text-neutral-700">
            {persona === 'technician' ? 'LM' : 'CF'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-neutral-900 truncate">
              {persona === 'technician' ? 'Lucas Morais' : 'Camila Fernandes'}
            </p>
            <p className="text-[11px] text-neutral-500 truncate">
              {persona === 'technician' ? 'TI & Infra N2' : 'Coord. Contábil'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
