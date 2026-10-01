import React from 'react';
import { UserPersona, ViewMode } from '../types';
import { Plus, UserCheck, ShieldCheck, TicketCheck, Cloud } from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  persona: UserPersona;
  setPersona: (p: UserPersona) => void;
  onOpenNewTicket: () => void;
  onOpenNetlifyDeploy: () => void;
  openTicketsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  persona,
  setPersona,
  onOpenNewTicket,
  onOpenNetlifyDeploy,
  openTicketsCount,
}) => {
  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Visão Geral & Indicadores';
      case 'tickets':
        return 'Fila de Chamados';
      case 'kanban':
        return 'Quadro de Atendimento';
      case 'my_tickets':
        return persona === 'technician' ? 'Meus Atendimentos Ativos' : 'Minhas Solicitações';
      case 'knowledge':
        return 'Base de Conhecimento';
      case 'sla_metrics':
        return 'Métricas de SLA & Performance';
      case 'supabase_table':
        return 'Tabela de Dados Supabase';
      default:
        return 'Central de Serviços';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white px-6">
      {/* Zone 1: Single text element Brand Zone */}
      <div className="flex items-center gap-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setCurrentView('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-neutral-900 hover:text-neutral-700 transition-colors"
        >
          DeskFlow ITSM
        </a>
        <span className="text-neutral-300">/</span>
        <span className="text-sm font-medium text-neutral-600 truncate max-w-xs sm:max-w-md">
          {getViewTitle()}
        </span>
      </div>

      {/* Zone 2: Navigation Links (Clean text links) */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-600">
        <button
          onClick={() => setCurrentView('tickets')}
          className={`transition-colors hover:text-neutral-900 ${
            currentView === 'tickets' ? 'text-neutral-900 font-semibold' : ''
          }`}
        >
          Chamados
          {openTicketsCount > 0 && (
            <span className="ml-1.5 font-mono text-xs text-neutral-500">
              ({openTicketsCount})
            </span>
          )}
        </button>
        <button
          onClick={() => setCurrentView('kanban')}
          className={`transition-colors hover:text-neutral-900 ${
            currentView === 'kanban' ? 'text-neutral-900 font-semibold' : ''
          }`}
        >
          Quadro Kanban
        </button>
        <button
          onClick={() => setCurrentView('knowledge')}
          className={`transition-colors hover:text-neutral-900 ${
            currentView === 'knowledge' ? 'text-neutral-900 font-semibold' : ''
          }`}
        >
          Autoatendimento
        </button>
        <button
          onClick={() => setCurrentView('sla_metrics')}
          className={`transition-colors hover:text-neutral-900 ${
            currentView === 'sla_metrics' ? 'text-neutral-900 font-semibold' : ''
          }`}
        >
          Relatório SLA
        </button>
        <button
          onClick={() => setCurrentView('supabase_table')}
          className={`flex items-center gap-1.5 transition-colors hover:text-neutral-900 ${
            currentView === 'supabase_table'
              ? 'text-emerald-700 font-semibold'
              : 'text-neutral-600 hover:text-emerald-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Tabela Supabase</span>
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Netlify Deploy button */}
        <button
          onClick={onOpenNetlifyDeploy}
          title="Ver configurações e instruções de publicação no Netlify"
          className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-100 transition-colors whitespace-nowrap"
        >
          <Cloud className="w-3.5 h-3.5 text-teal-600" />
          <span>Deploy Netlify</span>
        </button>

        {/* Persona toggle button */}
        <button
          onClick={() => setPersona(persona === 'technician' ? 'requester' : 'technician')}
          title="Alternar entre visão da equipe técnica e visão do colaborador"
          className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors whitespace-nowrap"
        >
          {persona === 'technician' ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Modo Técnico / N2</span>
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Modo Solicitante</span>
            </>
          )}
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onOpenNewTicket}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Chamado</span>
        </button>
      </div>
    </header>
  );
};
