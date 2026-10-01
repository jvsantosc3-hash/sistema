import React, { useState, useMemo } from 'react';
import { Ticket, UrgencyLevel, ImpactLevel, Attachment, UserPersona } from '../types';
import { CATEGORIES_CONFIG, DEPARTMENTS, KNOWLEDGE_ARTICLES } from '../mockData';
import { calculatePriorityAndSLA } from '../utils/sla';
import {
  X,
  Plus,
  Paperclip,
  Trash2,
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle,
  FileText,
} from 'lucide-react';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTicket: (newTicket: Ticket) => void;
  persona: UserPersona;
  onOpenArticle?: (articleId: string) => void;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onCreateTicket,
  persona,
  onOpenArticle,
}) => {
  if (!isOpen) return null;

  // Requester default data based on persona
  const [requesterName, setRequesterName] = useState(
    persona === 'requester' ? 'Camila Fernandes' : 'Lucas Morais'
  );
  const [requesterEmail, setRequesterEmail] = useState(
    persona === 'requester' ? 'camila.fernandes@empresa.com.br' : 'lucas.morais@empresa.com.br'
  );
  const [requesterDept, setRequesterDept] = useState(
    persona === 'requester' ? 'Financeiro & Fiscal' : 'TI & Infraestrutura'
  );
  const [requesterPhone, setRequesterPhone] = useState('(11) 98451-2201');
  const [requesterLocation, setRequesterLocation] = useState('Matriz - 4º Andar');

  // Ticket data
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Hardware & Periféricos');
  const [subcategory, setSubcategory] = useState<string>('Notebook não liga');
  const [urgency, setUrgency] = useState<UrgencyLevel>('media');
  const [impact, setImpact] = useState<ImpactLevel>('baixo');
  const [assetTag, setAssetTag] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subcategories available for chosen category
  const availableSubcategories = CATEGORIES_CONFIG[category] || [];

  // Calculate live priority and SLA based on ITIL Matrix
  const { priority, hours: slaHours } = useMemo(
    () => calculatePriorityAndSLA(urgency, impact),
    [urgency, impact]
  );

  // Check for smart self-service article deflection
  const suggestedArticle = useMemo(() => {
    if (!title.trim() && !description.trim()) return null;
    const query = `${title} ${description}`.toLowerCase();
    return KNOWLEDGE_ARTICLES.find((art) => {
      return (
        art.tags.some((tag) => query.includes(tag.toLowerCase())) ||
        art.title.toLowerCase().includes(query.slice(0, 5))
      );
    });
  }, [title, description]);

  const handleAddSampleAttachment = () => {
    const sampleFiles = [
      { name: 'captura_de_tela_erro.png', sizeKb: 280, type: 'image/png' },
      { name: 'relatorio_diagnostico.pdf', sizeKb: 512, type: 'application/pdf' },
      { name: 'registro_log_sistema.txt', sizeKb: 45, type: 'text/plain' },
    ];
    const file = sampleFiles[attachments.length % sampleFiles.length];
    const newAtt: Attachment = {
      id: `att-${Date.now()}-${Math.random()}`,
      name: file.name,
      sizeKb: file.sizeKb,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    };
    setAttachments([...attachments, newAtt]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);

    const now = new Date();
    const deadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);
    const randomProtocolNum = Math.floor(1000 + Math.random() * 9000);
    const protocol = `CH-2026-${randomProtocolNum}`;

    const newTicket: Ticket = {
      id: `tick-${Date.now()}`,
      protocol,
      title: title.trim(),
      description: description.trim(),
      category,
      subcategory,
      department: requesterDept,
      requester: {
        name: requesterName,
        email: requesterEmail,
        department: requesterDept,
        phone: requesterPhone,
        role: persona === 'requester' ? 'Colaborador Solicitante' : 'Analista Técnico',
        location: requesterLocation,
      },
      priority,
      urgency,
      impact,
      status: 'novo',
      assignedTechnician: null,
      assetTag: assetTag.trim() || undefined,
      attachments,
      timeline: [
        {
          id: `tm-${Date.now()}`,
          type: 'creation',
          author: requesterName,
          authorRole: persona === 'technician' ? 'technician' : 'requester',
          content: `Chamado aberto com Prioridade ${priority.toUpperCase()} (SLA Contratado: ${slaHours}h úteis).`,
          timestamp: now.toISOString(),
        },
      ],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      slaDeadline: deadline.toISOString(),
      slaTotalHours: slaHours,
    };

    setTimeout(() => {
      onCreateTicket(newTicket);
      setIsSubmitting(false);
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 sm:p-6 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div>
            <h2 className="text-base font-bold text-neutral-900 leading-snug">
              Abertura de Chamado - Service Desk
            </h2>
            <p className="text-xs text-neutral-500">
              Preencha os detalhes da ocorrência para encaminhamento à equipe técnica especializada.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Smart Deflection Suggestion Banner */}
          {suggestedArticle && (
            <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-lg flex items-start justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dica de Autoatendimento Instantâneo</span>
                </div>
                <p className="text-indigo-800">
                  Existe um guia na Base de Conhecimento que pode resolver seu problema sem espera:{' '}
                  <span className="font-medium underline">{suggestedArticle.title}</span>
                </p>
              </div>
              {onOpenArticle && (
                <button
                  type="button"
                  onClick={() => onOpenArticle(suggestedArticle.id)}
                  className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px] font-medium hover:bg-indigo-700 whitespace-nowrap"
                >
                  Consultar Artigo
                </button>
              )}
            </div>
          )}

          {/* Section 1: Solicitante (Compact grid) */}
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
            <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block">
              1. Identificação do Solicitante
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-neutral-600 font-medium mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1">Departamento</label>
                <select
                  value={requesterDept}
                  onChange={(e) => setRequesterDept(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded bg-white"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1">Telefone / Ramal</label>
                <input
                  type="text"
                  value={requesterPhone}
                  onChange={(e) => setRequesterPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-neutral-600 font-medium mb-1">Localização Física / Posto</label>
                <input
                  type="text"
                  value={requesterLocation}
                  onChange={(e) => setRequesterLocation(e.target.value)}
                  placeholder="Ex: Matriz - 3º Andar, Baia 12 ou Filial Campinas"
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Detalhes do Chamado */}
          <div className="space-y-4">
            <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block">
              2. Classificação e Ocorrência
            </span>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Assunto do Chamado <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Falha ao autenticar VPN, Monitor sem sinal, Erro ao faturar nota fiscal..."
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Category and Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-neutral-800 mb-1">Categoria Principal</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setCategory(newCat);
                    const subList = CATEGORIES_CONFIG[newCat] || [];
                    if (subList.length > 0) setSubcategory(subList[0]);
                  }}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white focus:outline-none"
                >
                  {Object.keys(CATEGORIES_CONFIG).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-800 mb-1">Item / Subcategoria</label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-md bg-white focus:outline-none"
                >
                  {availableSubcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ITIL Urgency & Impact Matrix */}
            <div className="p-3.5 bg-neutral-50/80 rounded-lg border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-800">
                  Matriz ITIL de Prioridade & Prazo de SLA
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-500">Calculado:</span>
                  <span
                    className={`font-semibold uppercase ${
                      priority === 'critica'
                        ? 'text-rose-600'
                        : priority === 'alta'
                        ? 'text-orange-600'
                        : priority === 'media'
                        ? 'text-blue-600'
                        : 'text-neutral-600'
                    }`}
                  >
                    Prioridade {priority} · SLA {slaHours}h
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Urgência (Velocidade com que a solução é exigida)
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded bg-white"
                  >
                    <option value="baixa">Baixa - O trabalho continua normalmente</option>
                    <option value="media">Média - Dificulta certas atividades</option>
                    <option value="alta">Alta - Trabalho completamente impedido</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Impacto (Abrangência de usuários afetados)
                  </label>
                  <select
                    value={impact}
                    onChange={(e) => setImpact(e.target.value as ImpactLevel)}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded bg-white"
                  >
                    <option value="baixo">Baixo - Apenas um colaborador</option>
                    <option value="medio">Médio - Um departamento inteiro</option>
                    <option value="alto">Alto - Toda a empresa / Operação fabril</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Asset Tag */}
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Etiqueta de Patrimônio / Ativo (Opcional)
              </label>
              <input
                type="text"
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                placeholder="Ex: NOTE-0482, DESK-FIN-12, SRV-DB-01"
                className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Descrição Detalhada do Problema <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que aconteceu, as mensagens de erro exibidas, se outros colegas estão com o mesmo comportamento e as tentativas de resolução..."
                className="w-full p-3 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-700">Evidências e Anexos (Prints, Logs)</span>
                <button
                  type="button"
                  onClick={handleAddSampleAttachment}
                  className="flex items-center gap-1 text-xs text-neutral-700 hover:text-neutral-900 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Anexar Arquivo Simulado</span>
                </button>
              </div>

              {attachments.length === 0 ? (
                <div
                  onClick={handleAddSampleAttachment}
                  className="p-3 border border-dashed border-neutral-300 rounded-md text-center text-xs text-neutral-500 hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <Paperclip className="w-4 h-4 mx-auto mb-1 text-neutral-400" />
                  Clique aqui para simular o anexo de prints de tela ou relatórios.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 px-2.5 py-1 rounded bg-neutral-100 text-xs text-neutral-800 border border-neutral-200"
                    >
                      <FileText className="w-3 h-3 text-neutral-500" />
                      <span className="font-mono text-[11px] truncate max-w-[140px]">{att.name}</span>
                      <span className="font-mono text-[10px] text-neutral-400">({att.sizeKb} KB)</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="text-neutral-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer / Buttons */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Gerando Protocolo...' : 'Confirmar e Abrir Chamado'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
