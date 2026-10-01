export type TicketPriority = 'baixa' | 'media' | 'alta' | 'critica';
export type TicketStatus = 'novo' | 'em_atendimento' | 'aguardando_usuario' | 'resolvido' | 'fechado' | 'cancelado';
export type UrgencyLevel = 'baixa' | 'media' | 'alta';
export type ImpactLevel = 'baixo' | 'medio' | 'alto';

export interface RequesterInfo {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  location: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  department: string;
  specialty: string;
}

export interface Attachment {
  id: string;
  name: string;
  sizeKb: number;
  type: string;
  uploadedAt: string;
}

export interface TimelineEvent {
  id: string;
  type: 'creation' | 'status_change' | 'comment' | 'internal_note' | 'assignment' | 'resolution';
  author: string;
  authorRole: 'requester' | 'technician' | 'system';
  content: string;
  timestamp: string;
  statusBadge?: string;
  attachmentName?: string;
}

export interface Ticket {
  id: string;
  protocol: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  department: string;
  requester: RequesterInfo;
  priority: TicketPriority;
  urgency: UrgencyLevel;
  impact: ImpactLevel;
  status: TicketStatus;
  assignedTechnician?: Technician | null;
  assetTag?: string;
  attachments: Attachment[];
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
  slaDeadline: string; // ISO date string
  slaTotalHours: number;
  resolutionSummary?: string;
  csat?: {
    rating: number; // 1 to 5
    comment?: string;
    submittedAt: string;
  };
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
  views: number;
  helpfulCount: number;
  updatedAt: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
  isConnected: boolean;
}

export type ViewMode = 'dashboard' | 'tickets' | 'kanban' | 'my_tickets' | 'knowledge' | 'sla_metrics' | 'supabase_table';
export type UserPersona = 'technician' | 'requester';
