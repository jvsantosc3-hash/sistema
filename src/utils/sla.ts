import { TicketPriority, UrgencyLevel, ImpactLevel, TicketStatus } from '../types';

export function calculatePriorityAndSLA(urgency: UrgencyLevel, impact: ImpactLevel): { priority: TicketPriority; hours: number } {
  if (urgency === 'alta' && impact === 'alto') {
    return { priority: 'critica', hours: 2 };
  }
  if ((urgency === 'alta' && impact === 'medio') || (urgency === 'media' && impact === 'alto')) {
    return { priority: 'alta', hours: 8 };
  }
  if (urgency === 'baixa' && impact === 'baixo') {
    return { priority: 'baixa', hours: 48 };
  }
  return { priority: 'media', hours: 24 };
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${mins}`;
  } catch {
    return isoString;
  }
}

export function formatDateShort(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} ${hours}:${mins}`;
  } catch {
    return isoString;
  }
}

export function getSLARemaining(slaDeadlineIso: string, status: TicketStatus): {
  isOverdue: boolean;
  isWarning: boolean;
  text: string;
  percentRemaining: number;
} {
  if (status === 'resolvido' || status === 'fechado' || status === 'cancelado') {
    return {
      isOverdue: false,
      isWarning: false,
      text: 'Finalizado',
      percentRemaining: 100,
    };
  }

  const now = new Date().getTime();
  const deadline = new Date(slaDeadlineIso).getTime();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
    const overdueMins = Math.abs(Math.floor((diffMs / (1000 * 60)) % 60));
    return {
      isOverdue: true,
      isWarning: false,
      text: `Estourado há ${overdueHours}h ${overdueMins}m`,
      percentRemaining: 0,
    };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs / (1000 * 60)) % 60);

  const isWarning = diffHours < 3; // less than 3h is alert

  return {
    isOverdue: false,
    isWarning,
    text: `${diffHours}h ${diffMins}m restantes`,
    percentRemaining: Math.min(100, Math.max(10, Math.round((diffMs / (24 * 60 * 60 * 1000)) * 100))),
  };
}

export function getStatusMeta(status: TicketStatus): { label: string; textClass: string; dotClass: string } {
  switch (status) {
    case 'novo':
      return {
        label: 'Novo / Triagem',
        textClass: 'text-sky-700 dark:text-sky-400 font-medium',
        dotClass: 'bg-sky-500',
      };
    case 'em_atendimento':
      return {
        label: 'Em Atendimento',
        textClass: 'text-amber-700 dark:text-amber-400 font-medium',
        dotClass: 'bg-amber-500',
      };
    case 'aguardando_usuario':
      return {
        label: 'Aguardando Usuário',
        textClass: 'text-purple-700 dark:text-purple-400 font-medium',
        dotClass: 'bg-purple-500',
      };
    case 'resolvido':
      return {
        label: 'Resolvido',
        textClass: 'text-emerald-700 dark:text-emerald-400 font-medium',
        dotClass: 'bg-emerald-500',
      };
    case 'fechado':
      return {
        label: 'Fechado',
        textClass: 'text-neutral-600 dark:text-neutral-400 font-medium',
        dotClass: 'bg-neutral-400',
      };
    case 'cancelado':
      return {
        label: 'Cancelado',
        textClass: 'text-rose-700 dark:text-rose-400 font-medium',
        dotClass: 'bg-rose-500',
      };
  }
}

export function getPriorityMeta(priority: TicketPriority): { label: string; textClass: string; order: number } {
  switch (priority) {
    case 'critica':
      return { label: 'Crítica (2h)', textClass: 'text-rose-600 font-semibold', order: 1 };
    case 'alta':
      return { label: 'Alta (8h)', textClass: 'text-orange-600 font-medium', order: 2 };
    case 'media':
      return { label: 'Média (24h)', textClass: 'text-blue-600 font-medium', order: 3 };
    case 'baixa':
      return { label: 'Baixa (48h)', textClass: 'text-neutral-600 font-normal', order: 4 };
  }
}
