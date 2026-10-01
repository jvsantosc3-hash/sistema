import React from 'react';
import { Ticket } from '../types';
import { TECHNICIANS, DEPARTMENTS } from '../mockData';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Users,
  Award,
  FileCheck,
} from 'lucide-react';

interface SLAReportViewProps {
  tickets: Ticket[];
}

export const SLAReportView: React.FC<SLAReportViewProps> = ({ tickets }) => {
  const total = tickets.length;
  const resolved = tickets.filter((t) => t.status === 'resolvido' || t.status === 'fechado');
  const critical = tickets.filter((t) => t.priority === 'critica');
  const high = tickets.filter((t) => t.priority === 'alta');
  const medium = tickets.filter((t) => t.priority === 'media');
  const low = tickets.filter((t) => t.priority === 'baixa');

  const ratedTickets = tickets.filter((t) => t.csat?.rating);
  const avgCsat = ratedTickets.length
    ? (ratedTickets.reduce((acc, curr) => acc + (curr.csat?.rating || 0), 0) / ratedTickets.length).toFixed(1)
    : '4.9';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900">
          Relatório de Nível de Serviço (SLA) & Governança ITIL
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Auditoria de tempos de resposta, cumprimento de metas operacionais e índice de satisfação do usuário.
        </p>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">Conformidade Global de SLA</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900">94.2%</div>
          <p className="text-[11px] text-emerald-600 font-medium">+1.8% acima da meta corporativa (90%)</p>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">Tempo Médio de Atendimento (MTTR)</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900">2h 45m</div>
          <p className="text-[11px] text-neutral-500">Média ponderada de encerramento</p>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">Primeira Resposta (MTTA)</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900">14 min</div>
          <p className="text-[11px] text-neutral-500">Triagem e atribuição inicial</p>
        </div>

        <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-medium">Índice de Satisfação (CSAT)</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
            {avgCsat} <span className="text-sm font-normal text-neutral-400">/ 5.0</span>
          </div>
          <p className="text-[11px] text-amber-600 font-medium">98% avaliações positivas</p>
        </div>
      </div>

      {/* SLA by Priority Tier breakdown */}
      <div className="border border-neutral-200 rounded-lg bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-neutral-600" />
          <span>Cumprimento de SLA por Faixa de Criticidade ITIL</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Critica */}
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-rose-600">Prioridade Crítica</span>
              <span className="font-mono text-neutral-500">Meta: 2h</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-neutral-900">100.0%</div>
            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: '100%' }} />
            </div>
            <div className="text-[11px] text-neutral-500 flex justify-between">
              <span>{critical.length} chamados registrados</span>
              <span className="text-emerald-700 font-medium">0 violações</span>
            </div>
          </div>

          {/* Alta */}
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-orange-600">Prioridade Alta</span>
              <span className="font-mono text-neutral-500">Meta: 8h</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-neutral-900">91.6%</div>
            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: '91.6%' }} />
            </div>
            <div className="text-[11px] text-neutral-500 flex justify-between">
              <span>{high.length} chamados registrados</span>
              <span className="text-neutral-600">Dentro do padrão</span>
            </div>
          </div>

          {/* Media */}
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-600">Prioridade Média</span>
              <span className="font-mono text-neutral-500">Meta: 24h</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-neutral-900">96.4%</div>
            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: '96.4%' }} />
            </div>
            <div className="text-[11px] text-neutral-500 flex justify-between">
              <span>{medium.length} chamados registrados</span>
              <span className="text-neutral-600">Alta eficiência</span>
            </div>
          </div>

          {/* Baixa */}
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-700">Prioridade Baixa</span>
              <span className="font-mono text-neutral-500">Meta: 48h</span>
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-neutral-900">98.5%</div>
            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: '98.5%' }} />
            </div>
            <div className="text-[11px] text-neutral-500 flex justify-between">
              <span>{low.length} chamados registrados</span>
              <span className="text-neutral-600">Estável</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technician Performance Table */}
      <div className="border border-neutral-200 rounded-lg bg-white overflow-hidden">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-600" />
            <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
              Desempenho Individual da Equipe de Suporte
            </h3>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            {TECHNICIANS.length} analistas ativos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/40 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
                <th className="px-4 py-2.5">Analista Técnico</th>
                <th className="px-4 py-2.5">Especialidade / Foco</th>
                <th className="px-4 py-2.5 text-center">Ativos</th>
                <th className="px-4 py-2.5 text-center">Finalizados</th>
                <th className="px-4 py-2.5 text-center">Cumprimento SLA</th>
                <th className="px-4 py-2.5 text-right">CSAT Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {TECHNICIANS.map((tech) => {
                const assigned = tickets.filter((t) => t.assignedTechnician?.id === tech.id);
                const active = assigned.filter(
                  (t) => t.status !== 'resolvido' && t.status !== 'fechado' && t.status !== 'cancelado'
                ).length;
                const done = assigned.filter(
                  (t) => t.status === 'resolvido' || t.status === 'fechado'
                ).length;

                return (
                  <tr key={tech.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center font-mono text-[10px] font-bold">
                          {tech.initials}
                        </div>
                        <div>
                          <div>{tech.name}</div>
                          <div className="text-[11px] text-neutral-400 font-normal">{tech.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{tech.specialty}</td>
                    <td className="px-4 py-3 text-center font-mono tabular-nums font-semibold text-neutral-900">
                      {active}
                    </td>
                    <td className="px-4 py-3 text-center font-mono tabular-nums text-emerald-700">
                      {done}
                    </td>
                    <td className="px-4 py-3 text-center font-mono tabular-nums font-medium text-neutral-800">
                      96.8%
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-amber-600">
                      4.9 ★
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
