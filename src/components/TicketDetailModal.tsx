import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority, Technician, UserPersona } from '../types';
import { getPriorityMeta, getStatusMeta, getSLARemaining, formatDateTime } from '../utils/sla';
import { TECHNICIANS, CANNED_RESPONSES } from '../mockData';
import {
  X,
  Send,
  Lock,
  MessageSquare,
  Clock,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Paperclip,
  CheckCircle,
  FileText,
  Star,
  Download,
  AlertCircle,
} from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket;
  persona: UserPersona;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus, resolutionNote?: string) => void;
  onAssignTechnician: (ticketId: string, tech: Technician | null) => void;
  onUpdatePriority: (ticketId: string, priority: TicketPriority) => void;
  onAddComment: (
    ticketId: string,
    content: string,
    isInternal: boolean,
    author: string,
    role: 'requester' | 'technician'
  ) => void;
  onSubmitCsat: (ticketId: string, rating: number, comment?: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  persona,
  onClose,
  onUpdateStatus,
  onAssignTechnician,
  onUpdatePriority,
  onAddComment,
  onSubmitCsat,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showCannedModal, setShowCannedModal] = useState(false);
  const [csatRating, setCsatRating] = useState<number>(ticket.csat?.rating || 0);
  const [csatComment, setCsatComment] = useState<string>(ticket.csat?.comment || '');
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const priorityMeta = getPriorityMeta(ticket.priority);
  const statusMeta = getStatusMeta(ticket.status);
  const sla = getSLARemaining(ticket.slaDeadline, ticket.status);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const authorName = persona === 'technician' ? 'Lucas Morais' : ticket.requester.name;
    const authorRole = persona === 'technician' ? 'technician' : 'requester';

    onAddComment(ticket.id, commentText, isInternalNote, authorName, authorRole);
    setCommentText('');
  };

  const handleInsertCanned = (content: string) => {
    setCommentText((prev) => (prev ? `${prev}\n\n${content}` : content));
    setShowCannedModal(false);
  };

  const handleConfirmResolution = () => {
    onUpdateStatus(ticket.id, 'resolvido', resolutionNoteInput || 'Chamado resolvido pela equipe técnica.');
    setIsResolving(false);
    setResolutionNoteInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 sm:p-6 backdrop-blur-xs">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-semibold text-neutral-900">{ticket.protocol}</span>
              <span className="text-neutral-300">/</span>
              <span className="text-neutral-600">{ticket.category}</span>
              {ticket.subcategory && (
                <>
                  <span className="text-neutral-300">/</span>
                  <span className="text-neutral-500">{ticket.subcategory}</span>
                </>
              )}
              <span className="text-neutral-300">/</span>
              <span className="text-neutral-400">Aberto em {formatDateTime(ticket.createdAt)}</span>
            </div>
            <h2 className="text-base font-bold text-neutral-900 leading-snug">{ticket.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body (2 Columns) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200">
          {/* Left Column (Main discussion & timeline) */}
          <div className="lg:col-span-2 p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Original Issue Description Card */}
              <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="font-medium text-neutral-700">Descrição do Incidente / Solicitação</span>
                  <span>Por {ticket.requester.name}</span>
                </div>
                <p className="text-xs text-neutral-800 leading-relaxed whitespace-pre-line">
                  {ticket.description}
                </p>

                {/* Attachments if any */}
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="pt-2 border-t border-neutral-200 space-y-1.5">
                    <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      Anexos ({ticket.attachments.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ticket.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 px-2.5 py-1 rounded bg-white border border-neutral-200 text-xs text-neutral-700"
                        >
                          <FileText className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="truncate max-w-[160px] font-mono text-[11px]">{att.name}</span>
                          <span className="font-mono text-[10px] text-neutral-400">({att.sizeKb} KB)</span>
                          <button
                            type="button"
                            title="Visualizar anexo"
                            onClick={() => window.open('#', '_blank')}
                            className="text-neutral-500 hover:text-neutral-900"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resolution Banner if resolved */}
              {ticket.status === 'resolvido' || ticket.status === 'fechado' ? (
                <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Chamado Concluído / Solucionado</span>
                  </div>
                  {ticket.resolutionSummary && (
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      {ticket.resolutionSummary}
                    </p>
                  )}

                  {/* CSAT Rating Section */}
                  <div className="pt-2 border-t border-emerald-200/80 mt-2">
                    <p className="text-xs font-medium text-emerald-950 mb-1.5">
                      Avaliação de Satisfação (CSAT):
                    </p>
                    {ticket.csat ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= ticket.csat!.rating
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-neutral-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-medium text-neutral-700 ml-2">
                            {ticket.csat.rating} de 5 estrelas
                          </span>
                        </div>
                        {ticket.csat.comment && (
                          <p className="text-xs text-neutral-600 italic">"{ticket.csat.comment}"</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setCsatRating(star)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-5 h-5 transition-colors ${
                                  star <= csatRating
                                    ? 'fill-amber-400 text-amber-500'
                                    : 'text-neutral-300 hover:text-amber-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs text-neutral-600 ml-2">
                            {csatRating > 0 ? `${csatRating}/5` : 'Clique para avaliar o suporte'}
                          </span>
                        </div>
                        {csatRating > 0 && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Deixe um comentário opcional sobre o atendimento..."
                              value={csatComment}
                              onChange={(e) => setCsatComment(e.target.value)}
                              className="text-xs px-2.5 py-1 border border-neutral-300 rounded flex-1 bg-white"
                            />
                            <button
                              onClick={() => onSubmitCsat(ticket.id, csatRating, csatComment)}
                              className="px-3 py-1 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800"
                            >
                              Salvar Avaliação
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Timeline feed */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                  Histórico de Atendimento ({ticket.timeline.length})
                </h3>

                <div className="space-y-3 pl-2 border-l-2 border-neutral-200">
                  {ticket.timeline.map((event) => {
                    const isInternal = event.type === 'internal_note';
                    return (
                      <div
                        key={event.id}
                        className={`relative pl-4 text-xs space-y-1 ${
                          isInternal ? 'p-3 bg-amber-50/60 border border-amber-200 rounded-md' : ''
                        }`}
                      >
                        {/* Event Dot */}
                        {!isInternal && (
                          <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-neutral-400 ring-4 ring-white" />
                        )}

                        <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-neutral-800">{event.author}</span>
                            {isInternal && (
                              <span className="text-amber-800 font-medium flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                Nota Interna
                              </span>
                            )}
                          </div>
                          <span className="font-mono">{formatDateTime(event.timestamp)}</span>
                        </div>

                        <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                          {event.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Interaction / Reply Box */}
            <div className="pt-4 border-t border-neutral-200 space-y-3">
              {/* Type toggle: Public comment vs Internal note */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-lg text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                      !isInternalNote
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Resposta Pública</span>
                  </button>

                  {persona === 'technician' && (
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                        isInternalNote
                          ? 'bg-amber-100 text-amber-900 font-semibold shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-800'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Nota Interna (Técnicos)</span>
                    </button>
                  )}
                </div>

                {/* Canned Responses dropdown */}
                {persona === 'technician' && !isInternalNote && (
                  <button
                    type="button"
                    onClick={() => setShowCannedModal(!showCannedModal)}
                    className="text-xs text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1"
                  >
                    <span>Respostas Prontas</span>
                  </button>
                )}
              </div>

              {/* Canned responses popover */}
              {showCannedModal && (
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2 text-xs">
                  <p className="font-semibold text-neutral-800">Selecione uma resposta padrão:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CANNED_RESPONSES.map((cr) => (
                      <button
                        key={cr.id}
                        type="button"
                        onClick={() => handleInsertCanned(cr.content)}
                        className="p-2 text-left bg-white border border-neutral-200 rounded hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
                      >
                        <p className="font-medium text-neutral-900">{cr.title}</p>
                        <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                          {cr.content}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Textarea & Send button */}
              <form onSubmit={handleSendComment} className="space-y-2">
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    isInternalNote
                      ? 'Escreva uma anotação visível somente para a equipe técnica...'
                      : 'Escreva uma mensagem para o solicitante...'
                  }
                  className={`w-full p-3 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                    isInternalNote
                      ? 'border-amber-300 bg-amber-50/40 focus:ring-amber-500'
                      : 'border-neutral-300 bg-white focus:ring-neutral-900'
                  }`}
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">
                    Pressione Enviar para registrar no histórico.
                  </span>
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Actions & Details */}
          <div className="p-6 space-y-6 bg-neutral-50/50">
            {/* SLA countdown indicator box */}
            <div className="p-4 rounded-lg bg-white border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span className="font-medium">Acordo de Nível de Serviço (SLA)</span>
                <Clock className="w-4 h-4 text-neutral-400" />
              </div>
              <div
                className={`text-lg font-bold font-mono tabular-nums ${
                  sla.isOverdue
                    ? 'text-rose-600'
                    : sla.isWarning
                    ? 'text-amber-600'
                    : 'text-neutral-900'
                }`}
              >
                {sla.text}
              </div>
              <div className="text-[11px] text-neutral-500 space-y-0.5">
                <div>Limite: {formatDateTime(ticket.slaDeadline)}</div>
                <div>Tempo Total Contratado: {ticket.slaTotalHours} horas úteis</div>
              </div>
            </div>

            {/* Quick Actions / Status Changers */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                Gestão do Chamado
              </h3>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700">Status Atual</label>
                <select
                  value={ticket.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as TicketStatus;
                    if (newStatus === 'resolvido') {
                      setIsResolving(true);
                    } else {
                      onUpdateStatus(ticket.id, newStatus);
                    }
                  }}
                  className="w-full text-xs p-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 font-medium text-neutral-800"
                >
                  <option value="novo">Novo / Em Triagem</option>
                  <option value="em_atendimento">Em Atendimento</option>
                  <option value="aguardando_usuario">Aguardando Usuário / Terceiros</option>
                  <option value="resolvido">Resolvido</option>
                  <option value="fechado">Fechado / Encerrado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {/* Resolution popup dialog if resolving */}
              {isResolving && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg space-y-2 text-xs">
                  <p className="font-semibold text-emerald-900">Resumo da Solução:</p>
                  <textarea
                    rows={2}
                    value={resolutionNoteInput}
                    onChange={(e) => setResolutionNoteInput(e.target.value)}
                    placeholder="Descreva o que foi realizado para solucionar o problema..."
                    className="w-full p-2 border border-emerald-300 rounded bg-white text-xs"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsResolving(false)}
                      className="px-2 py-1 text-xs text-neutral-600 hover:text-neutral-900"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmResolution}
                      className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-medium hover:bg-emerald-800"
                    >
                      Confirmar Resolução
                    </button>
                  </div>
                </div>
              )}

              {/* Technician Assignee */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700">Técnico Responsável</label>
                <select
                  value={ticket.assignedTechnician?.id || 'unassigned'}
                  onChange={(e) => {
                    const techId = e.target.value;
                    const tech = TECHNICIANS.find((t) => t.id === techId) || null;
                    onAssignTechnician(ticket.id, tech);
                  }}
                  className="w-full text-xs p-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="unassigned">-- Não atribuído (Fila Geral) --</option>
                  {TECHNICIANS.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} ({tech.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700">Prioridade & Impacto</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => onUpdatePriority(ticket.id, e.target.value as TicketPriority)}
                  className="w-full text-xs p-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  <option value="critica">Crítica (SLA 2 horas)</option>
                  <option value="alta">Alta (SLA 8 horas)</option>
                  <option value="media">Média (SLA 24 horas)</option>
                  <option value="baixa">Baixa (SLA 48 horas)</option>
                </select>
              </div>
            </div>

            {/* Requester Information Card */}
            <div className="border border-neutral-200 rounded-lg bg-white p-4 space-y-3">
              <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-neutral-500" />
                Dados do Solicitante
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="font-semibold text-neutral-900">{ticket.requester.name}</div>
                  <div className="text-neutral-500 text-[11px]">{ticket.requester.role}</div>
                </div>

                <div className="space-y-1 pt-1 border-t border-neutral-100 text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{ticket.requester.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{ticket.requester.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{ticket.requester.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{ticket.requester.location}</span>
                  </div>
                </div>

                {ticket.assetTag && (
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Patrimônio:</span>
                    <span className="font-mono font-medium text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                      {ticket.assetTag}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
