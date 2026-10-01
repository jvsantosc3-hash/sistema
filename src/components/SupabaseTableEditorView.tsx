import React, { useState } from 'react';
import { Ticket, SupabaseConfig } from '../types';
import {
  loadSavedSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  getSupabaseSQLScript,
  getSupabaseClient,
  ticketToSupabaseRow,
  supabaseRowToTicket,
} from '../lib/supabase';
import {
  Database,
  RefreshCw,
  Plus,
  Copy,
  Check,
  Download,
  Upload,
  Settings,
  AlertCircle,
  CheckCircle2,
  Table as TableIcon,
  Code,
  ExternalLink,
  Send,
  Terminal,
  KeyRound,
  Globe,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface SupabaseTableEditorViewProps {
  tickets: Ticket[];
  onTicketsSynced: (newTickets: Ticket[]) => void;
  onOpenNewTicket: () => void;
  showToast: (msg: string) => void;
}

export const SupabaseTableEditorView: React.FC<SupabaseTableEditorViewProps> = ({
  tickets,
  onTicketsSynced,
  onOpenNewTicket,
  showToast,
}) => {
  const [config, setConfig] = useState<SupabaseConfig>(loadSavedSupabaseConfig());
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Quick Inline Send inputs
  const [inputUrl, setInputUrl] = useState(config.url);
  const [inputKey, setInputKey] = useState(config.anonKey);
  const [inputTable, setInputTable] = useState(config.tableName || 'chamados');

  // Transmission logs state
  const [isSending, setIsSending] = useState(false);
  const [transmissionLogs, setTransmissionLogs] = useState<string[]>([]);
  const [sendSuccessCount, setSendSuccessCount] = useState<number | null>(null);

  // Filtering
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const supabaseRows = tickets.map(ticketToSupabaseRow);

  const filteredRows = supabaseRows.filter((row) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      row.protocol?.toLowerCase().includes(q) ||
      row.title?.toLowerCase().includes(q) ||
      row.requester_name?.toLowerCase().includes(q) ||
      row.department?.toLowerCase().includes(q) ||
      row.status?.toLowerCase().includes(q)
    );
  });

  const appendLog = (msg: string) => {
    setTransmissionLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Direct Send / Sync all tickets to Supabase
  const handleDirectSendToSupabase = async () => {
    const url = inputUrl.trim();
    const key = inputKey.trim();
    const tableName = inputTable.trim() || 'chamados';

    if (!url || !key) {
      showToast('Por favor, informe a URL e a Anon Key do seu projeto Supabase.');
      appendLog('ERRO: URL ou Anon Key não preenchidas.');
      return;
    }

    setIsSending(true);
    setTransmissionLogs([]);
    setSendSuccessCount(null);
    appendLog(`Iniciando conexão com Supabase: ${url}`);

    try {
      const client = createClient(url, key, { auth: { persistSession: false } });

      // Save valid config
      const newConfig: SupabaseConfig = {
        url,
        anonKey: key,
        tableName,
        isConnected: true,
      };
      setConfig(newConfig);
      saveSupabaseConfig(newConfig);

      appendLog(`Conectado ao Supabase! Verificando tabela "${tableName}"...`);

      const rows = tickets.map(ticketToSupabaseRow);
      appendLog(`Preparando ${rows.length} chamados para envio...`);

      // Try upsert
      const { data, error } = await client.from(tableName).upsert(rows, { onConflict: 'id' });

      if (error) {
        if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
          appendLog(`AVISO: A tabela "${tableName}" ainda não existe no seu Supabase!`);
          appendLog(`Ação necessária: Abra o modal "Script SQL" e execute o CREATE TABLE no SQL Editor do Supabase.`);
          setIsSqlModalOpen(true);
        } else {
          appendLog(`ERRO Supabase: ${error.message} (Código: ${error.code || 'N/A'})`);
        }
        showToast(`Erro ao gravar no Supabase: ${error.message}`);
      } else {
        appendLog(`SUCESSO! ${rows.length} chamados enviados e gravados na tabela public.${tableName}.`);
        setSendSuccessCount(rows.length);
        showToast(`${rows.length} chamados gravados no Supabase com sucesso!`);
      }
    } catch (err: any) {
      appendLog(`FALHA DE REDE: ${err.message || err}`);
      showToast(`Falha na requisição: ${err.message || err}`);
    } finally {
      setIsSending(false);
    }
  };

  const handlePullFromSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      showToast('Configure a URL e a chave do Supabase primeiro.');
      return;
    }

    setIsSending(true);
    appendLog(`Consultando tabela public.${config.tableName} no Supabase...`);
    try {
      const { data, error } = await client.from(config.tableName).select('*').order('created_at', { ascending: false });

      if (error) {
        appendLog(`ERRO ao puxar dados: ${error.message}`);
        showToast(`Erro: ${error.message}`);
      } else if (data && data.length > 0) {
        const pulledTickets = data.map(supabaseRowToTicket);
        onTicketsSynced(pulledTickets);
        appendLog(`${pulledTickets.length} registros puxados do Supabase e sincronizados na interface!`);
        showToast(`${pulledTickets.length} chamados carregados do Supabase!`);
      } else {
        appendLog(`Nenhum registro encontrado na tabela public.${config.tableName}.`);
        showToast('Tabela remota está vazia.');
      }
    } catch (err: any) {
      appendLog(`ERRO: ${err.message || err}`);
      showToast(`Erro: ${err.message || err}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(getSupabaseSQLScript(config.tableName));
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    showToast('Script SQL copiado para a área de transferência!');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[#3ECF8E]/20 text-[#249662] flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-neutral-900">
              Envio e Gestão via Tabela Supabase
            </h1>
            <span className="font-mono text-xs bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded border border-neutral-200">
              public.{inputTable}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Envie todos os chamados diretamente para o seu banco de dados PostgreSQL no Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Code className="w-3.5 h-3.5 text-neutral-500" />
            <span>Ver Script SQL da Tabela</span>
          </button>
        </div>
      </div>

      {/* Direct Send Console Panel (Destaque Principal) */}
      <div className="border-2 border-emerald-500/40 rounded-xl bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
            <Send className="w-4 h-4 text-emerald-600" />
            <span>Painel de Envio Imediato para o seu Supabase</span>
          </div>
          <a
            href="https://supabase.com/dashboard/project/_/settings/api"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>Onde pegar a URL e a Chave no Supabase</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-medium text-neutral-700 mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-neutral-400" />
              <span>URL do Projeto Supabase</span>
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full px-3 py-1.5 border border-neutral-300 rounded-md font-mono text-xs focus:ring-1 focus:ring-neutral-900 bg-neutral-50/50"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-700 mb-1 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-neutral-400" />
              <span>Chave Anônima (anon public key)</span>
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full px-3 py-1.5 border border-neutral-300 rounded-md font-mono text-xs focus:ring-1 focus:ring-neutral-900 bg-neutral-50/50"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-700 mb-1 flex items-center gap-1">
              <TableIcon className="w-3 h-3 text-neutral-400" />
              <span>Nome da Tabela no Banco</span>
            </label>
            <input
              type="text"
              value={inputTable}
              onChange={(e) => setInputTable(e.target.value)}
              className="w-full px-3 py-1.5 border border-neutral-300 rounded-md font-mono text-xs focus:ring-1 focus:ring-neutral-900 bg-neutral-50/50"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDirectSendToSupabase}
              disabled={isSending}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {isSending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{isSending ? 'Enviando ao Supabase...' : `Enviar ${tickets.length} Chamados para o Supabase`}</span>
            </button>

            <button
              onClick={handlePullFromSupabase}
              disabled={isSending}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-100 text-neutral-800 rounded-lg text-xs font-medium hover:bg-neutral-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>Puxar Registros do Supabase</span>
            </button>
          </div>

          {sendSuccessCount !== null && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{sendSuccessCount} chamados gravados com sucesso na tabela public.{inputTable}!</span>
            </div>
          )}
        </div>

        {/* Live Terminal Transmission Logs */}
        {transmissionLogs.length > 0 && (
          <div className="mt-3 p-3 bg-neutral-950 text-neutral-200 rounded-lg font-mono text-[11px] space-y-1 max-h-40 overflow-y-auto border border-neutral-800">
            <div className="flex items-center gap-1.5 text-neutral-400 pb-1 border-b border-neutral-800 mb-1 text-[10px]">
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>Log de Transmissão Supabase</span>
            </div>
            {transmissionLogs.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.includes('ERRO') || log.includes('FALHA')
                    ? 'text-rose-400'
                    : log.includes('SUCESSO')
                    ? 'text-emerald-400 font-semibold'
                    : 'text-neutral-300'
                }
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Table Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="w-full max-w-sm">
            <input
              type="text"
              placeholder="Filtrar tabela por protocolo, título, solicitante..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
            />
          </div>
          <div className="font-mono text-xs text-neutral-500 tabular-nums">
            {filteredRows.length} registros prontos para sincronização
          </div>
        </div>

        <div className="border border-neutral-200 rounded-lg bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-neutral-100 border-b border-neutral-200">
                <tr className="text-[11px] font-mono text-neutral-600 divide-x divide-neutral-200">
                  <th className="px-3 py-2 w-12 text-center font-semibold">#</th>
                  <th className="px-3 py-2 whitespace-nowrap">protocol</th>
                  <th className="px-3 py-2 whitespace-nowrap min-w-[200px]">title</th>
                  <th className="px-3 py-2 whitespace-nowrap">category</th>
                  <th className="px-3 py-2 whitespace-nowrap">priority</th>
                  <th className="px-3 py-2 whitespace-nowrap">status</th>
                  <th className="px-3 py-2 whitespace-nowrap">requester_name</th>
                  <th className="px-3 py-2 whitespace-nowrap">department</th>
                  <th className="px-3 py-2 whitespace-nowrap">sla_deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-mono">
                {filteredRows.map((row, index) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRow(row)}
                    className="hover:bg-neutral-50 cursor-pointer divide-x divide-neutral-200 transition-colors"
                  >
                    <td className="px-3 py-2 text-center text-neutral-400 text-[11px] tabular-nums">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-neutral-900 whitespace-nowrap">
                      {row.protocol}
                    </td>
                    <td className="px-3 py-2 text-neutral-800 font-sans truncate max-w-xs" title={row.title}>
                      {row.title}
                    </td>
                    <td className="px-3 py-2 text-neutral-600 font-sans whitespace-nowrap">
                      {row.category}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap font-sans font-medium">
                      <span
                        className={
                          row.priority === 'critica'
                            ? 'text-rose-600'
                            : row.priority === 'alta'
                            ? 'text-orange-600'
                            : 'text-neutral-700'
                        }
                      >
                        {row.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap font-sans">
                      <span
                        className={
                          row.status === 'resolvido'
                            ? 'text-emerald-700 font-medium'
                            : row.status === 'em_atendimento'
                            ? 'text-amber-700 font-medium'
                            : 'text-neutral-700'
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-neutral-700 font-sans whitespace-nowrap">
                      {row.requester_name}
                    </td>
                    <td className="px-3 py-2 text-neutral-600 font-sans whitespace-nowrap">
                      {row.department}
                    </td>
                    <td className="px-3 py-2 text-neutral-400 text-[11px] whitespace-nowrap tabular-nums">
                      {row.sla_deadline?.slice(0, 16).replace('T', ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row detail inspector */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-neutral-900">
                  Registro Supabase: {selectedRow.protocol} (public.{inputTable})
                </h3>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="text-neutral-400 hover:text-neutral-700 text-sm"
              >
                ✕
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3 font-mono text-xs">
              {Object.entries(selectedRow).map(([key, value]) => (
                <div key={key} className="flex border-b border-neutral-100 pb-1.5">
                  <span className="w-48 text-neutral-500 font-semibold">{key}:</span>
                  <span className="text-neutral-900 flex-1 break-all">
                    {value === null || value === undefined ? <span className="text-neutral-400 italic">null</span> : String(value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex justify-end">
              <button
                onClick={() => setSelectedRow(null)}
                className="px-4 py-1.5 bg-neutral-900 text-white rounded text-xs font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase SQL DDL Modal */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden border border-neutral-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-neutral-900">
                  Script de Criação da Tabela (SQL Editor Supabase)
                </h3>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 flex-1 overflow-y-auto">
              <p className="text-xs text-neutral-600">
                Se a tabela ainda não foi criada no seu Supabase, copie o código abaixo e execute no{' '}
                <a
                  href="https://supabase.com/dashboard/project/_/sql"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 underline font-medium inline-flex items-center gap-0.5"
                >
                  <span>SQL Editor do Supabase</span>
                  <ExternalLink className="w-3 h-3" />
                </a>:
              </p>

              <pre className="p-4 bg-neutral-900 text-neutral-100 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed select-all">
                {getSupabaseSQLScript(inputTable)}
              </pre>
            </div>

            <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                Pronto para executar no PostgreSQL do Supabase.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 text-white rounded text-xs font-medium hover:bg-neutral-800"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
