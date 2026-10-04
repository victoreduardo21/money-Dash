import React, { useState } from 'react';
import { PluggyConfig } from '../types';
import { PluggyService } from '../services/pluggyService';
import { 
  Key, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Settings2,
  Sparkles,
  Copy,
  Check,
  Radio
} from 'lucide-react';

interface PluggyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (config: PluggyConfig) => void;
}

export const PluggyConfigModal: React.FC<PluggyConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [config, setConfig] = useState<PluggyConfig>(() => PluggyService.getConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Compute public webhook URL
  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/pluggy`
    : 'https://ais-pre-svcwonnn6d5zgzfabsjoty-52279200690.us-west2.run.app/api/webhooks/pluggy';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await PluggyService.testConnection(config.clientId, config.clientSecret, config.environment);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Falha ao testar conexão com a Pluggy.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const saved = PluggyService.saveConfig(config);
    onSaved(saved);
    onClose();
  };

  const handleUseSandboxPreset = () => {
    setConfig({
      ...config,
      clientId: 'pluggy_sandbox_client_demo',
      clientSecret: 'pluggy_sandbox_secret_demo',
      environment: 'sandbox'
    });
    setTestResult({
      success: true,
      message: 'Ambiente Sandbox Oficial ativado com chaves de demonstração instantâneas.'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Configurações da API Pluggy</h3>
              <p className="text-xs text-slate-400 font-medium">Credenciais Open Finance (dashboard.pluggy.ai)</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-5 overflow-y-auto no-scrollbar max-h-[75vh]">
          {/* NOTICE & LINK */}
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  O que é a API da Pluggy?
                </span>
              </div>
              <a 
                href="https://dashboard.pluggy.ai" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
              >
                <span>Criar Conta Pluggy</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed">
              A Pluggy é a plataforma líder em agregação Open Finance no Brasil. Você pode obter seu <strong>Client ID</strong> e <strong>Client Secret</strong> gratuitamente no portal de desenvolvedores.
            </p>
          </div>

          {/* SANDBOX QUICK BUTTON */}
          <button
            type="button"
            onClick={handleUseSandboxPreset}
            className="w-full p-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between text-left hover:border-indigo-500 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                  Ativar Modo Demonstração Instantâneo (Sandbox)
                </p>
                <p className="text-[10px] text-slate-400">
                  Permite conectar todos os bancos sem precisar cadastrar conta na Pluggy agora
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
              Usar Demo
            </span>
          </button>

          {/* CREDENTIAL FIELDS */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Client ID da Pluggy
              </label>
              <input
                type="text"
                placeholder="Ex: c1d2e3f4-5678-90ab-cdef-1234567890ab"
                value={config.clientId}
                onChange={e => setConfig({ ...config, clientId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Client Secret da Pluggy
              </label>
              <input
                type="password"
                placeholder="Ex: sec_a1b2c3d4e5f6..."
                value={config.clientSecret}
                onChange={e => setConfig({ ...config, clientSecret: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Ambiente
                </label>
                <select
                  value={config.environment}
                  onChange={e => setConfig({ ...config, environment: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="sandbox">Sandbox (Ambiente de Testes)</option>
                  <option value="production">Produção (Bancos Reais ao Vivo)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Importação Automática
                </label>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, autoImportTransactions: !config.autoImportTransactions })}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                    config.autoImportTransactions
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <span>{config.autoImportTransactions ? 'Ativada' : 'Manual'}</span>
                  <div className={`w-2 h-2 rounded-full ${config.autoImportTransactions ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* WEBHOOK URL (REGISTER ON PLUGGY DASHBOARD) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  URL do Webhook (Notificações em Tempo Real)
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                Ativo no Servidor
              </span>
            </div>
            
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Cadastre esta URL no campo <strong>URL do seu webhook</strong> no painel da Pluggy para receber atualizações automáticas de saldo e novas transações:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 select-all"
              />
              <button
                type="button"
                onClick={handleCopyWebhook}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Eventos suportados:</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 font-mono">item/created</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 font-mono">item/updated</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700/60 font-mono">item/error</span>
            </div>
          </div>

          {/* TEST RESULT MESSAGE */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              testResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{testResult.message}</span>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTest}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              <span>Testar Conexão</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 transition-all active:scale-98"
            >
              Salvar Configuração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
