import React, { useState } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  FolderArchive,
  GitBranch,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface NetlifyDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const NetlifyDeployModal: React.FC<NetlifyDeployModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  if (!isOpen) return null;

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast('Copiado para a área de transferência!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 sm:p-6 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#00C7B7]/15 text-[#009688] flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5 text-[#00A389]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Guia de Deploy no Netlify
              </h2>
              <p className="text-xs text-neutral-500">
                Arquivos de configuração e build prontos para publicação na nuvem.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Status Alert */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-900 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Configurações criadas: <code>netlify.toml</code> e <code>_redirects</code> SPA estão prontos!
              </span>
            </div>
            <span className="font-mono text-[11px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
              Build: dist
            </span>
          </div>

          {/* Settings specs */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 font-mono text-[11px]">
            <div>
              <span className="text-neutral-500 block mb-0.5">Build Command:</span>
              <span className="font-semibold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200 inline-block">
                npm run build
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-0.5">Publish Directory:</span>
              <span className="font-semibold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200 inline-block">
                dist
              </span>
            </div>
          </div>

          {/* Methods */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
              Escolha como deseja enviar para o Netlify:
            </h3>

            {/* Method 1: Netlify Drop */}
            <div className="p-4 border border-neutral-200 rounded-lg bg-white space-y-2 hover:border-neutral-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900 flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-[#00A389]" />
                  <span>Método 1: Netlify Drop (Mais Rápido - 10 Segundos, Sem Git)</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded">
                  Recomendado
                </span>
              </div>
              <p className="text-neutral-600 leading-relaxed">
                Você pode simplesmente arrastar e soltar a pasta <code>dist</code> no site oficial do Netlify Drop sem precisar de Git nem terminal:
              </p>
              <div className="pt-1 flex items-center gap-2">
                <a
                  href="https://app.netlify.com/drop"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00A389] text-white rounded-md font-medium hover:bg-[#008f78] transition-colors"
                >
                  <span>Abrir Netlify Drop</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <span className="text-neutral-400">Arraste a pasta <strong>dist</strong> gerada pelo build.</span>
              </div>
            </div>

            {/* Method 2: Git / GitHub */}
            <div className="p-4 border border-neutral-200 rounded-lg bg-white space-y-2 hover:border-neutral-300 transition-colors">
              <span className="font-semibold text-neutral-900 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-neutral-700" />
                <span>Método 2: Conectar com Repositório GitHub / GitLab</span>
              </span>
              <p className="text-neutral-600 leading-relaxed">
                1. No painel do Netlify, clique em <strong>"Add new site" &gt; "Import an existing project"</strong>.<br />
                2. Selecione seu repositório no GitHub.<br />
                3. O Netlify detectará automaticamente o arquivo <code>netlify.toml</code> já configurado neste projeto e fará o deploy a cada commit!
              </p>
            </div>

            {/* Method 3: Netlify CLI */}
            <div className="p-4 border border-neutral-200 rounded-lg bg-white space-y-2 hover:border-neutral-300 transition-colors">
              <span className="font-semibold text-neutral-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-neutral-700" />
                <span>Método 3: Envio direto via Terminal (Netlify CLI)</span>
              </span>
              <p className="text-neutral-600">
                Execute os seguintes comandos no seu terminal:
              </p>
              <div className="p-3 bg-neutral-900 text-neutral-100 rounded font-mono text-[11px] flex items-center justify-between">
                <span>npm install -g netlify-cli && netlify deploy --prod --dir=dist</span>
                <button
                  onClick={() =>
                    copyText(
                      'npm install -g netlify-cli && netlify deploy --prod --dir=dist',
                      'cli'
                    )
                  }
                  className="text-neutral-400 hover:text-white ml-2"
                >
                  {copiedKey === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Environment Variables on Netlify */}
          <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
            <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-neutral-600" />
              <span>Variáveis de Ambiente no Netlify (Supabase):</span>
            </span>
            <p className="text-neutral-600">
              No painel do Netlify do seu site, vá em <strong>Site configuration &gt; Environment variables</strong> e adicione:
            </p>
            <div className="font-mono text-[11px] space-y-1 text-neutral-700">
              <div className="bg-white p-2 rounded border border-neutral-200 flex justify-between items-center">
                <span>VITE_SUPABASE_URL = &lt;sua-url-do-supabase&gt;</span>
              </div>
              <div className="bg-white p-2 rounded border border-neutral-200 flex justify-between items-center">
                <span>VITE_SUPABASE_ANON_KEY = &lt;sua-chave-anon-do-supabase&gt;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 text-white rounded text-xs font-medium hover:bg-neutral-800 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
