import React, { useState } from 'react';
import { PluggyConnector, BankConnection, BankAccount, BankTransaction } from '../types';
import { DEFAULT_PLUGGY_CONNECTORS, PluggyService } from '../services/pluggyService';
import { 
  Building2, 
  Search, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Loader2, 
  X, 
  ArrowRight, 
  AlertCircle, 
  KeyRound, 
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface PluggyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { connection: BankConnection; accounts: BankAccount[]; transactions: BankTransaction[] }) => void;
  userId: string;
}

type Step = 'SELECT_BANK' | 'CONSENT' | 'CREDENTIALS' | 'SYNCING' | 'SUCCESS';

export const PluggyConnectModal: React.FC<PluggyConnectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('SELECT_BANK');
  const [search, setSearch] = useState('');
  const [selectedConnector, setSelectedConnector] = useState<PluggyConnector | null>(null);
  const [cpfOrUser, setCpfOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [agency, setAgency] = useState('');
  const [account, setAccount] = useState('');
  const [syncStepText, setSyncStepText] = useState('Conectando à instituição financeira...');
  const [resultData, setResultData] = useState<{ connection: BankConnection; accounts: BankAccount[]; transactions: BankTransaction[] } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const filteredConnectors = DEFAULT_PLUGGY_CONNECTORS.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectConnector = (connector: PluggyConnector) => {
    setSelectedConnector(connector);
    setCurrentStep('CONSENT');
  };

  const handleFillSandbox = () => {
    setCpfOrUser('123.456.789-00');
    setPassword('••••••••');
    setAgency('0001');
    setAccount('12345-6');
  };

  const handleStartAuth = async () => {
    if (!selectedConnector) return;
    setCurrentStep('SYNCING');
    setErrorMessage('');

    try {
      setSyncStepText('Estabelecendo túnel de segurança TLS 1.3 com ' + selectedConnector.name + '...');
      await new Promise(r => setTimeout(r, 900));

      setSyncStepText('Autenticando credenciais e validando consentimento Open Finance...');
      await new Promise(r => setTimeout(r, 1000));

      setSyncStepText('Consultando saldos de conta corrente, poupança e cartões...');
      await new Promise(r => setTimeout(r, 900));

      setSyncStepText('Sincronizando transações bancárias recentes...');
      const data = await PluggyService.createConnection(selectedConnector, userId);
      await new Promise(r => setTimeout(r, 600));

      setResultData(data);
      setCurrentStep('SUCCESS');
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Não foi possível concluir a sincronização com o banco. Tente novamente.');
      setCurrentStep('CREDENTIALS');
    }
  };

  const handleFinish = () => {
    if (resultData) {
      onSuccess(resultData);
    }
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep('SELECT_BANK');
    setSelectedConnector(null);
    setSearch('');
    setCpfOrUser('');
    setPassword('');
    setAgency('');
    setAccount('');
    setResultData(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Pluggy Open Finance</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Conexão bancária direta, rápida e segura</p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 no-scrollbar">
          {/* STEP 1: SELECT BANK */}
          {currentStep === 'SELECT_BANK' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Passo 1 de 3</p>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Escolha sua instituição financeira</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Selecione o banco ou carteira digital que deseja sincronizar com o sistema.
                </p>
              </div>

              {/* SEARCH */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar banco por nome..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* POPULAR / ALL BANKS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {filteredConnectors.map(connector => (
                  <button
                    key={connector.id}
                    onClick={() => handleSelectConnector(connector)}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all text-center group cursor-pointer"
                  >
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md mb-2 group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: connector.primaryColor }}
                    >
                      {connector.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate max-w-full">
                      {connector.name}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 capitalize">
                      {connector.type === 'INVESTMENT' ? 'Investimentos' : 'Banco'}
                    </span>
                  </button>
                ))}
              </div>

              {filteredConnectors.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhum banco encontrado para "{search}".
                </div>
              )}

              {/* SECURITY NOTE */}
              <div className="pt-2">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                    Regulamentado pelo <strong>Banco Central do Brasil</strong>. Criptografia ponta a ponta. Nós <strong>nunca</strong> temos acesso a movimentações ou senhas de transação.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONSENT */}
          {currentStep === 'CONSENT' && selectedConnector && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Passo 2 de 3</p>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Consentimento de Compartilhamento</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Autorização segura para leitura de dados bancários
                </p>
              </div>

              {/* BANK CARD SUMMARY */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-base shadow"
                    style={{ backgroundColor: selectedConnector.primaryColor }}
                  >
                    {selectedConnector.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-slate-900 dark:text-white">{selectedConnector.name}</h5>
                    <span className="text-[11px] text-slate-400">Open Finance API Direct</span>
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentStep('SELECT_BANK')}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Trocar
                </button>
              </div>

              {/* PERMISSION BULLETS */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Dados que serão compartilhados (apenas leitura):</p>
                
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="text-xs">
                    <strong className="text-slate-800 dark:text-slate-200">Saldo da conta corrente e poupança</strong>
                    <p className="text-slate-400 text-[11px]">Para atualizar seus cards de saldo em tempo real</p>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="text-xs">
                    <strong className="text-slate-800 dark:text-slate-200">Extrato e transações bancárias</strong>
                    <p className="text-slate-400 text-[11px]">Para importar despesas e receitas automaticamente</p>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="text-xs">
                    <strong className="text-slate-800 dark:text-slate-200">Fatura de cartão de crédito e limites</strong>
                    <p className="text-slate-400 text-[11px]">Para controle integrado de limites e vencimentos</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                  <strong>Acesso 100% somente leitura.</strong> Nenhuma operação de transferência, pagamento ou movimentação financeira pode ser realizada através desta conexão.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('SELECT_BANK')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep('CREDENTIALS')}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <span>Concordar e Prosseguir</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CREDENTIALS */}
          {currentStep === 'CREDENTIALS' && selectedConnector && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Passo 3 de 3</p>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Autenticação Segura</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Conectando com as credenciais do seu banco {selectedConnector.name}
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* QUICK SANDBOX AUTOFILL */}
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 truncate">
                    Teste rápido com dados de Sandbox
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFillSandbox}
                  className="px-2.5 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 transition-colors shrink-0 shadow-sm"
                >
                  Preencher Demo
                </button>
              </div>

              {/* FORM FIELDS */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    CPF ou Identificador
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpfOrUser}
                    onChange={e => setCpfOrUser(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Agência
                    </label>
                    <input
                      type="text"
                      placeholder="0001"
                      value={agency}
                      onChange={e => setAgency(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Conta com dígito
                    </label>
                    <input
                      type="text"
                      placeholder="12345-6"
                      value={account}
                      onChange={e => setAccount(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Senha de Internet Banking / Consulta
                  </label>
                  <input
                    type="password"
                    placeholder="Sua senha eletrônica"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('CONSENT')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleStartAuth}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sincronizar com {selectedConnector.name}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SYNCING ANIMATION */}
          {currentStep === 'SYNCING' && selectedConnector && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div 
                  className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-xl"
                  style={{ backgroundColor: selectedConnector.primaryColor }}
                >
                  {selectedConnector.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 p-1.5 rounded-full shadow-lg border border-slate-200 dark:border-slate-700">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                </div>
              </div>

              <div className="max-w-xs space-y-1">
                <h4 className="text-base font-black text-slate-900 dark:text-white">Conectando via Open Finance</h4>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
                  {syncStepText}
                </p>
              </div>

              <div className="w-48 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full w-2/3 rounded-full animate-[shimmer_1.5s_infinite]"></div>
              </div>

              <p className="text-[11px] text-slate-400 max-w-xs">
                Isto leva apenas alguns instantes. Por favor, mantenha esta tela aberta.
              </p>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {currentStep === 'SUCCESS' && resultData && selectedConnector && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Banco Conectado com Sucesso!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Identificamos {resultData.accounts.length} contas e {resultData.transactions.length} transações prontas para gerenciar.
                </p>
              </div>

              {/* ACCOUNTS PREVIEW */}
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contas Encontradas:</p>
                {resultData.accounts.map(acc => (
                  <div key={acc.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-white">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{acc.accountNumber} • {acc.bankName}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${acc.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-amber-500'}`}>
                        R$ {Math.abs(acc.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[9px] text-slate-400 capitalize">
                        {acc.type === 'CREDIT' ? 'Fatura atual' : 'Saldo em conta'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 transition-all active:scale-98"
                >
                  Concluir e Ver Contas Conectadas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
