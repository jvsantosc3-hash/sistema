import React from 'react';
import { Ticket, TicketStatus } from '../types';
import { getPriorityMeta, getSLARemaining } from '../utils/sla';
import { Clock, Plus, ArrowRight, User } from 'lucide-react';

interface KanbanViewProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateStatus: (ticketId: string, newStatus: TicketStatus) => void;
  onOpenNewTicket: () => void;
}

const COLUMNS: { id: TicketStatus; label: string; dotColor: string }[] = [
  { id: 'novo', label: 'Triagem & Novos', dotColor: 'bg-sky-500' },
  { id: 'em_atendimento', label: 'Em Atendimento', dotColor: 'bg-amber-500' },
  { id: 'aguardando_usuario', label: 'Aguardando Usuário', dotColor: 'bg-purple-500' },
  { id: 'resolvido', label: 'Resolvidos', dotColor: 'bg-emerald-500' },
  { id: 'fechado', label: 'Fechados / Arquivados', dotColor: 'bg-neutral-400' },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  tickets,
  onSelectTicket,
  onUpdateStatus,
  onOpenNewTicket,
}) => {
  return (
    <div className="space-y-4">
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Quadro Kanban de Chamados
          </h2>
          <p className="text-xs text-neutral-500">
            Acompanhamento visual de fluxo e transição rápida de estágios.
          </p>
        </div>
        <button
          onClick={onOpenNewTicket}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Chamado</span>
        </button>
      </div>

      {/* Columns Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 items-start overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-neutral-100/70 border border-neutral-200/80 rounded-lg p-3 min-w-[240px] flex flex-col max-h-[calc(100vh-190px)]"
            >
              {/* Column Title */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className="text-xs font-semibold text-neutral-800">
                    {col.label}
                  </span>
                </div>
                <span className="font-mono text-xs font-medium text-neutral-500 bg-neutral-200/80 px-1.5 py-0.5 rounded">
                  {colTickets.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                {colTickets.length === 0 ? (
                  <div className="p-4 border border-dashed border-neutral-300 rounded-md text-center text-xs text-neutral-400">
                    Nenhum chamado nesta etapa
                  </div>
                ) : (
                  colTickets.map((ticket) => {
                    const priorityMeta = getPriorityMeta(ticket.priority);
                    const sla = getSLARemaining(ticket.slaDeadline, ticket.status);

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => onSelectTicket(ticket)}
                        className="bg-white border border-neutral-200 hover:border-neutral-400 rounded-md p-3 shadow-xs cursor-pointer transition-all hover:shadow-sm space-y-2"
                      >
                        {/* Header: Protocol + Priority */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-medium text-neutral-800">
                            {ticket.protocol}
                          </span>
                          <span className={priorityMeta.textClass}>
                            {priorityMeta.label.split(' ')[0]}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-medium text-neutral-900 leading-snug line-clamp-2">
                          {ticket.title}
                        </h4>

                        {/* Metadata row */}
                        <div className="text-[11px] text-neutral-500 flex items-center gap-1 truncate">
                          <span>{ticket.requester.name}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{ticket.requester.department}</span>
                        </div>

                        {/* Footer: SLA + Assignee + Transition Dropdown */}
                        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                          <div
                            className={`font-mono tabular-nums ${
                              sla.isOverdue
                                ? 'text-rose-600 font-medium'
                                : sla.isWarning
                                ? 'text-amber-600 font-medium'
                                : 'text-neutral-500'
                            }`}
                          >
                            {sla.text.split(' restantes')[0]}
                          </div>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {ticket.assignedTechnician ? (
                              <div
                                title={`Técnico: ${ticket.assignedTechnician.name}`}
                                className="h-5 w-5 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center font-mono text-[9px] font-bold text-neutral-700"
                              >
                                {ticket.assignedTechnician.initials}
                              </div>
                            ) : (
                              <div
                                title="Não atribuído"
                                className="h-5 w-5 rounded-full border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400"
                              >
                                <User className="w-3 h-3" />
                              </div>
                            )}

                            {/* Quick move select */}
                            <select
                              value={ticket.status}
                              onChange={(e) => onUpdateStatus(ticket.id, e.target.value as TicketStatus)}
                              aria-label={`Mover status do chamado ${ticket.protocol}`}
                              className="text-[10px] bg-neutral-50 border border-neutral-200 rounded px-1 py-0.5 text-neutral-600 focus:outline-none"
                            >
                              <option value="novo">Triagem</option>
                              <option value="em_atendimento">Atendendo</option>
                              <option value="aguardando_usuario">Pendente</option>
                              <option value="resolvido">Resolvido</option>
                              <option value="fechado">Fechado</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
