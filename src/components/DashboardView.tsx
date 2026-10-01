import React from 'react';
import { Ticket, ViewMode } from '../types';
import { getPriorityMeta, getStatusMeta, getSLARemaining, formatDateTime } from '../utils/sla';
import {
  Inbox,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Building2,
  UserCheck,
} from 'lucide-react';
import { TECHNICIANS } from '../mockData';

interface DashboardViewProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  setCurrentView: (view: ViewMode) => void;
  onOpenNewTicket: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tickets,
  onSelectTicket,
  setCurrentView,
  onOpenNewTicket,
}) => {
  const totalTickets = tickets.length;
  const newTickets = tickets.filter((t) => t.status === 'novo');
  const inProgressTickets = tickets.filter((t) => t.status === 'em_atendimento');
  const waitingUserTickets = tickets.filter((t) => t.status === 'aguardando_usuario');
  const resolvedTickets = tickets.filter((t) => t.status === 'resolvido' || t.status === 'fechado');

  // Attention tickets: Critical, High, or SLA warning/overdue and not resolved
  const urgentTickets = tickets.filter((t) => {
    if (t.status === 'resolvido' || t.status === 'fechado' || t.status === 'cancelado') return false;
    const sla = getSLARemaining(t.slaDeadline, t.status);
    return t.priority === 'critica' || t.priority === 'alta' || sla.isOverdue || sla.isWarning;
  });

  // Calculate department distribution
  const deptCounts: Record<string, number> = {};
  tickets.forEach((t) => {
    deptCounts[t.department] = (deptCounts[t.department] || 0) + 1;
  });

  // Category counts
  const categoryCounts: Record<string, number> = {};
  tickets.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome with quick stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Painel de Operações de Atendimento
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Monitoramento de chamados em tempo real, controle de nível de serviço (SLA) e produtividade.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('tickets')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <span>Ver Todos os Chamados</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenNewTicket}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <span>+ Abrir Chamado</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (6 metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-lg border border-neutral-200 bg-white">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">Total</span>
            <Inbox className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
            {totalTickets}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">registrados no sistema</p>
        </div>

        <div className="p-3.5 rounded-lg border border-neutral-200 bg-white">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">Em Triagem</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-sky-700">
            {newTickets.length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">aguardando técnico</p>
        </div>

        <div className="p-3.5 rounded-lg border border-neutral-200 bg-white">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">Em Atendimento</span>
            <UserCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-700">
            {inProgressTickets.length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">em diagnóstico ou ação</p>
        </div>

        <div className="p-3.5 rounded-lg border border-neutral-200 bg-white">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">Pendente Usuário</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-purple-700">
            {waitingUserTickets.length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">aguardando resposta</p>
        </div>

        <div className="p-3.5 rounded-lg border border-neutral-200 bg-white">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">Resolvidos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {resolvedTickets.length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">finalizados com sucesso</p>
        </div>

        <div className="p-3.5 rounded-lg border border-neutral-200 bg-white">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-medium">Conformidade SLA</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
            94.2%
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Meta: 90% atingida</p>
        </div>
      </div>

      {/* Main Grid: Urgent Attention List & Distribution Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Urgent Attention Queue */}
        <div className="lg:col-span-2 border border-neutral-200 rounded-lg bg-white overflow-hidden">
          <div className="px-4 py-3.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-semibold text-neutral-900">
                Fila de Atenção Imediata & Riscos de SLA
              </h2>
            </div>
            <span className="font-mono text-xs text-neutral-500">
              {urgentTickets.length} chamados prioritários
            </span>
          </div>

          <div className="divide-y divide-neutral-100">
            {urgentTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                Nenhum chamado crítico ou em iminência de violação de SLA no momento.
              </div>
            ) : (
              urgentTickets.map((ticket) => {
                const priorityMeta = getPriorityMeta(ticket.priority);
                const statusMeta = getStatusMeta(ticket.status);
                const sla = getSLARemaining(ticket.slaDeadline, ticket.status);

                return (
                  <div
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className="p-4 hover:bg-neutral-50/80 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        <span className="font-mono font-medium text-neutral-900">
                          {ticket.protocol}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-neutral-700">
                          {ticket.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{ticket.requester.name}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ticket.requester.department}</span>
                      </div>

                      <h3 className="text-sm font-medium text-neutral-900 truncate">
                        {ticket.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs">
                        <span className={priorityMeta.textClass}>
                          Prioridade {priorityMeta.label}
                        </span>
                        <span className="text-neutral-300">/</span>
                        <span className={statusMeta.textClass}>
                          {statusMeta.label}
                        </span>
                        {ticket.assignedTechnician ? (
                          <>
                            <span className="text-neutral-300">/</span>
                            <span className="text-neutral-600">
                              Técnico: {ticket.assignedTechnician.name}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-neutral-300">/</span>
                            <span className="text-rose-600 font-medium">Não atribuído</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-left sm:text-right space-y-1">
                      <div
                        className={`text-xs font-mono font-medium ${
                          sla.isOverdue
                            ? 'text-rose-600'
                            : sla.isWarning
                            ? 'text-amber-600'
                            : 'text-neutral-600'
                        }`}
                      >
                        {sla.text}
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Prazo: {formatDateTime(ticket.slaDeadline).split(' às ')[1]}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Department breakdown & Active Technicians */}
        <div className="space-y-6">
          {/* Department Breakdown */}
          <div className="border border-neutral-200 rounded-lg bg-white p-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
              <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                Volume por Departamento
              </h3>
            </div>
            <div className="space-y-2.5">
              {Object.entries(deptCounts).map(([dept, count]) => {
                const percentage = Math.round((count / totalTickets) * 100);
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-700 truncate max-w-[180px]">{dept}</span>
                      <span className="font-mono text-neutral-500 tabular-nums">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neutral-800 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Technicians status */}
          <div className="border border-neutral-200 rounded-lg bg-white p-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
              <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-neutral-500" />
                Equipe Técnica N1 / N2
              </h3>
            </div>
            <div className="space-y-3">
              {TECHNICIANS.map((tech) => {
                const countAssigned = tickets.filter(
                  (t) =>
                    t.assignedTechnician?.id === tech.id &&
                    t.status !== 'resolvido' &&
                    t.status !== 'fechado'
                ).length;

                return (
                  <div key={tech.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center font-mono text-[10px] font-semibold text-neutral-700">
                        {tech.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900 truncate">{tech.name}</p>
                        <p className="text-[10px] text-neutral-500 truncate">{tech.specialty}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                      {countAssigned} {countAssigned === 1 ? 'ativo' : 'ativos'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
