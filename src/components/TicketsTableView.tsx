import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus, TicketPriority, Technician } from '../types';
import { getPriorityMeta, getStatusMeta, getSLARemaining, formatDateShort } from '../utils/sla';
import {
  Search,
  Download,
  Filter,
  Check,
  ChevronDown,
  UserCheck,
  Layers,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { TECHNICIANS, DEPARTMENTS } from '../mockData';

interface TicketsTableViewProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onOpenNewTicket: () => void;
  onBulkUpdateStatus: (ticketIds: string[], newStatus: TicketStatus) => void;
  onBulkAssignTechnician: (ticketIds: string[], tech: Technician | null) => void;
}

export const TicketsTableView: React.FC<TicketsTableViewProps> = ({
  tickets,
  onSelectTicket,
  onOpenNewTicket,
  onBulkUpdateStatus,
  onBulkAssignTechnician,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Tab filter (Todos, Abertos, Meus, Críticos, Finalizados)
  const [quickFilter, setQuickFilter] = useState<'all' | 'open' | 'critical' | 'resolved'>('all');

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Quick filter
      if (quickFilter === 'open') {
        if (ticket.status === 'resolvido' || ticket.status === 'fechado' || ticket.status === 'cancelado') {
          return false;
        }
      } else if (quickFilter === 'critical') {
        if (ticket.priority !== 'critica' && ticket.priority !== 'alta') return false;
      } else if (quickFilter === 'resolved') {
        if (ticket.status !== 'resolvido' && ticket.status !== 'fechado') return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesProtocol = ticket.protocol.toLowerCase().includes(query);
        const matchesTitle = ticket.title.toLowerCase().includes(query);
        const matchesRequester = ticket.requester.name.toLowerCase().includes(query);
        const matchesDept = ticket.department.toLowerCase().includes(query);
        const matchesCategory = ticket.category.toLowerCase().includes(query);
        if (!matchesProtocol && !matchesTitle && !matchesRequester && !matchesDept && !matchesCategory) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== 'all' && ticket.status !== selectedStatus) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && ticket.priority !== selectedPriority) {
        return false;
      }

      // Department filter
      if (selectedDepartment !== 'all' && ticket.department !== selectedDepartment) {
        return false;
      }

      // Technician filter
      if (selectedTech !== 'all') {
        if (selectedTech === 'unassigned') {
          if (ticket.assignedTechnician) return false;
        } else if (ticket.assignedTechnician?.id !== selectedTech) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, quickFilter, searchQuery, selectedStatus, selectedPriority, selectedDepartment, selectedTech]);

  const toggleSelectAll = () => {
    if (selectedTicketIds.length === filteredTickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(filteredTickets.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTicketIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const headers = [
      'Protocolo',
      'Assunto',
      'Categoria',
      'Departamento',
      'Solicitante',
      'Prioridade',
      'Status',
      'Técnico Responsável',
      'Data de Abertura',
      'Prazo SLA',
    ];

    const rows = filteredTickets.map((t) => [
      t.protocol,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.department}"`,
      `"${t.requester.name}"`,
      t.priority.toUpperCase(),
      t.status,
      `"${t.assignedTechnician?.name || 'Não atribuído'}"`,
      t.createdAt,
      t.slaDeadline,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chamados_deskflow_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Segmented Quick Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-200/60 rounded-lg">
          <button
            onClick={() => setQuickFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              quickFilter === 'all'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Todos ({tickets.length})
          </button>
          <button
            onClick={() => setQuickFilter('open')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              quickFilter === 'open'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Em Aberto ({tickets.filter((t) => t.status !== 'resolvido' && t.status !== 'fechado').length})
          </button>
          <button
            onClick={() => setQuickFilter('critical')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              quickFilter === 'critical'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Críticos & Alta ({tickets.filter((t) => t.priority === 'critica' || t.priority === 'alta').length})
          </button>
          <button
            onClick={() => setQuickFilter('resolved')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              quickFilter === 'resolved'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Resolvidos ({tickets.filter((t) => t.status === 'resolvido' || t.status === 'fechado').length})
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {selectedTicketIds.length > 0 && (
            <div className="flex items-center gap-2 bg-neutral-900 text-white px-3 py-1 rounded-lg text-xs font-medium">
              <span className="font-mono tabular-nums">{selectedTicketIds.length}</span> selecionados
              <div className="h-3 w-px bg-neutral-700 mx-1" />
              <button
                onClick={() => {
                  onBulkUpdateStatus(selectedTicketIds, 'em_atendimento');
                  setSelectedTicketIds([]);
                }}
                className="hover:text-amber-300 transition-colors"
              >
                Em Atendimento
              </button>
              <span>·</span>
              <button
                onClick={() => {
                  onBulkUpdateStatus(selectedTicketIds, 'resolvido');
                  setSelectedTicketIds([]);
                }}
                className="hover:text-emerald-300 transition-colors"
              >
                Resolver
              </button>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenNewTicket}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Abrir Chamado</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-white border border-neutral-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search Input */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por protocolo, assunto, solicitante ou departamento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-neutral-50/50"
          />
        </div>

        {/* Status Dropdown */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filtrar por Status"
            className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">Todos os Status</option>
            <option value="novo">Novo / Triagem</option>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="aguardando_usuario">Aguardando Usuário</option>
            <option value="resolvido">Resolvido</option>
            <option value="fechado">Fechado</option>
          </select>
        </div>

        {/* Priority Dropdown */}
        <div>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            aria-label="Filtrar por Prioridade"
            className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="critica">Crítica (SLA 2h)</option>
            <option value="alta">Alta (SLA 8h)</option>
            <option value="media">Média (SLA 24h)</option>
            <option value="baixa">Baixa (SLA 48h)</option>
          </select>
        </div>

        {/* Department Dropdown */}
        <div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            aria-label="Filtrar por Departamento"
            className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">Todos Departamentos</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Corporate High Density Table */}
      <div className="border border-neutral-200 rounded-lg bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/75 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
                <th className="w-10 px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredTickets.length > 0 && selectedTicketIds.length === filteredTickets.length
                    }
                    onChange={toggleSelectAll}
                    aria-label="Selecionar todos os chamados"
                    className="rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5">Protocolo</th>
                <th className="px-3 py-2.5">Assunto & Categoria</th>
                <th className="px-3 py-2.5">Solicitante</th>
                <th className="px-3 py-2.5">Prioridade</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Técnico</th>
                <th className="px-3 py-2.5 text-right">Prazo SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    <p className="font-medium text-sm text-neutral-700">Nenhum chamado encontrado</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Ajuste os filtros de busca ou crie uma nova solicitação.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedStatus('all');
                        setSelectedPriority('all');
                        setSelectedDepartment('all');
                        setSelectedTech('all');
                        setQuickFilter('all');
                      }}
                      className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Limpar Filtros
                    </button>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const priorityMeta = getPriorityMeta(ticket.priority);
                  const statusMeta = getStatusMeta(ticket.status);
                  const sla = getSLARemaining(ticket.slaDeadline, ticket.status);
                  const isSelected = selectedTicketIds.includes(ticket.id);

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket)}
                      className={`hover:bg-neutral-50/80 cursor-pointer transition-colors ${
                        isSelected ? 'bg-neutral-50' : ''
                      }`}
                    >
                      <td
                        className="px-3 py-2.5 text-center"
                        onClick={(e) => toggleSelectOne(ticket.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          aria-label={`Selecionar chamado ${ticket.protocol}`}
                          className="rounded border-neutral-300 text-neutral-900 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Protocol */}
                      <td className="px-3 py-2.5 font-mono font-medium text-neutral-900 whitespace-nowrap">
                        {ticket.protocol}
                      </td>

                      {/* Title & Category */}
                      <td className="px-3 py-2.5 max-w-sm">
                        <div className="font-medium text-neutral-900 truncate">{ticket.title}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5">
                          <span>{ticket.category}</span>
                          {ticket.assetTag && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-neutral-600">{ticket.assetTag}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Requester & Dept */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="font-medium text-neutral-800">{ticket.requester.name}</div>
                        <div className="text-[11px] text-neutral-500">
                          {ticket.requester.department}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={priorityMeta.textClass}>{priorityMeta.label}</span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${statusMeta.dotClass}`} />
                          <span className={statusMeta.textClass}>{statusMeta.label}</span>
                        </div>
                      </td>

                      {/* Assignee */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {ticket.assignedTechnician ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center font-mono text-[9px] font-bold">
                              {ticket.assignedTechnician.initials}
                            </span>
                            <span className="text-neutral-700">{ticket.assignedTechnician.name}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">Não atribuído</span>
                        )}
                      </td>

                      {/* SLA */}
                      <td className="px-3 py-2.5 text-right whitespace-nowrap font-mono tabular-nums">
                        <div
                          className={`font-medium ${
                            sla.isOverdue
                              ? 'text-rose-600'
                              : sla.isWarning
                              ? 'text-amber-600'
                              : 'text-neutral-600'
                          }`}
                        >
                          {sla.text}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {formatDateShort(ticket.slaDeadline)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer count */}
        <div className="px-4 py-2.5 bg-neutral-50/70 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span>
            Exibindo <span className="font-mono tabular-nums font-semibold text-neutral-800">{filteredTickets.length}</span> de{' '}
            <span className="font-mono tabular-nums font-semibold text-neutral-800">{tickets.length}</span> chamados
          </span>
          <span className="text-[11px] text-neutral-400">
            Atualização em tempo real · Padrão ITIL Service Desk
          </span>
        </div>
      </div>
    </div>
  );
};
