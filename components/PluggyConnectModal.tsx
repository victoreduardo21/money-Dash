import React, { useState, useEffect } from 'react';
import { PluggyConnector, BankConnection, BankAccount, BankTransaction } from '../types';
import { DEFAULT_PLUGGY_CONNECTORS, PluggyService } from '../services/pluggyService';
import { BankStatementParser } from '../services/ofxParser';
import { PluggyConnect } from './PluggyConnect';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Loader2, 
  X, 
  AlertCircle, 
  Upload, 
  FileText, 
  ExternalLink,
  Wallet,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Check
} from 'lucide-react';

interface PluggyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { connection: BankConnection; accounts: BankAccount[]; transactions: BankTransaction[] }) => void;
  userId: string;
}

export const PluggyConnectModal: React.FC<PluggyConnectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId
}) => {
  const [connectToken, setConnectToken] = useState<string>('');
  const [isLoadingToken, setIsLoadingToken] = useState<boolean>(false);
  const [isSyncingData, setIsSyncingData] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'PLUGGY_CONNECT' | 'OFX_IMPORT'>('PLUGGY_CONNECT');

  // OFX file backup state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{ balance: number; transactions: BankTransaction[]; bankName: string } | null>(null);

  // Success summary before closing
  const [successResult, setSuccessResult] = useState<{
    bankName: string;
    accountsCount: number;
    transactionsCount: number;
    totalBalance: number;
  } | null>(null);

  // Initialize connect token when modal opens
  useEffect(() => {
    if (!isOpen) {
      setConnectToken('');
      setErrorMessage('');
      setSuccessResult(null);
      setIsSyncingData(false);
      return;
    }

    let isMounted = true;

    const fetchToken = async () => {
      setIsLoadingToken(true);
      setErrorMessage('');
      try {
        const res = await PluggyService.getConnectToken(userId);
        if (isMounted) {
          if (res.success && res.accessToken) {
            setConnectToken(res.accessToken);
          } else {
            setErrorMessage(res.error || 'Não foi possível gerar a sessão segura da Pluggy. Verifique suas credenciais.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Erro ao conectar à API da Pluggy.');
        }
      } finally {
        if (isMounted) setIsLoadingToken(false);
      }
    };

    fetchToken();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  // Handle successful bank connection from Pluggy Connect widget
  const handlePluggySuccess = async (itemData: any) => {
    const itemId = itemData?.item?.id;
    if (!itemId) {
      setErrorMessage('Identificador de conexão não retornado pela Pluggy.');
      return;
    }

    setIsSyncingData(true);
    setSyncStatusText('Conexão autorizada! Buscando dados reais de contas e movimentações no banco...');

    try {
      const syncResult = await PluggyService.syncItemWithBackend(itemId, userId);

      if (!syncResult.success) {
        throw new Error(syncResult.error || 'Falha ao sincronizar contas');
      }

      const connectorInfo: PluggyConnector = {
        id: itemData?.item?.connector?.id || 1,
        name: syncResult.bankName || itemData?.item?.connector?.name || 'Banco Conectado',
        primaryColor: itemData?.item?.connector?.primaryColor || '#4F46E5',
        institutionUrl: itemData?.item?.connector?.institutionUrl || '',
        imageUrl: itemData?.item?.connector?.imageUrl || '',
        type: 'PERSONAL_BANK',
        popular: true,
        supportsPayment: true
      };

      const newConnection: BankConnection = {
        id: 'conn_' + Date.now(),
        itemId,
        connector: connectorInfo,
        status: 'UPDATED',
        executionStatus: 'SUCCESS',
        lastUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        accountsCount: syncResult.accounts.length,
        userId
      };

      const totalBalance = syncResult.accounts
        .filter(a => a.type === 'BANK')
        .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

      // Save transactions in cache
      if (syncResult.transactions.length > 0) {
        const existing = PluggyService.getCachedTransactions(userId);
        PluggyService.saveCachedTransactions(userId, [...syncResult.transactions, ...existing]);
      }

      setSuccessResult({
        bankName: syncResult.bankName,
        accountsCount: syncResult.accounts.length,
        transactionsCount: syncResult.transactions.length,
        totalBalance
      });

      onSuccess({
        connection: newConnection,
        accounts: syncResult.accounts,
        transactions: syncResult.transactions
      });
    } catch (err: any) {
      console.error('Erro no pós-conexão Pluggy:', err);
      setErrorMessage(err.message || 'Erro ao sincronizar dados da sua conta bancária.');
    } finally {
      setIsSyncingData(false);
    }
  };

  const handlePluggyError = (error: any) => {
    console.error('Pluggy Connect Error:', error);
    // Only display user-facing error if it is not just closing the widget
    if (error?.message && !error?.message?.includes('closed')) {
      setErrorMessage(`Erro no assistente de conexão: ${error.message}`);
    }
  };

  // OFX file fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let parsed;
        if (file.name.toLowerCase().endsWith('.ofx')) {
          parsed = BankStatementParser.parseOFX(content, 'Extrato Importado', userId);
        } else {
          parsed = BankStatementParser.parseCSV(content, 'Extrato Importado', userId);
        }

        setParsedData({
          balance: parsed.balance,
          transactions: parsed.transactions,
          bankName: parsed.bankName
        });
      } catch (err: any) {
        console.error(err);
        setErrorMessage('Não foi possível ler o arquivo. Verifique se é um arquivo .OFX ou .CSV válido.');
      }
    };
    reader.readAsText(file, 'ISO-8859-1');
  };

  const handleSaveOfx = () => {
    if (!parsedData) return;
    const connector: PluggyConnector = {
      id: 9999,
      name: parsedData.bankName || 'Banco Importado',
      primaryColor: '#0ea5e9',
      institutionUrl: '',
      imageUrl: '',
      type: 'PERSONAL_BANK',
      popular: false,
      supportsPayment: false
    };

    const res = PluggyService.createRealConnection(
      connector,
      parsedData.balance,
      'Extrato',
      '',
      parsedData.transactions,
      userId
    );

    onSuccess(res);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Conexão Open Finance (Pluggy)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Conecte Nubank, Itaú, Santander, BB, Inter, Bradesco e +200 bancos com total segurança
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECURITY BANNER */}
        <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border-b border-emerald-500/20 px-4 py-2.5 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>100% Seguro:</strong> Regulamentado pelo Banco Central. Nós <strong>NUNCA</strong> solicitamos nem temos acesso à sua senha bancária. A autenticação ocorre no ambiente protegido do seu próprio banco.
          </span>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 pt-2 gap-4 bg-slate-50/30 dark:bg-slate-800/20 shrink-0">
          <button
            onClick={() => setActiveMode('PLUGGY_CONNECT')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeMode === 'PLUGGY_CONNECT'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Conexão Direta Open Finance
          </button>
          <button
            onClick={() => setActiveMode('OFX_IMPORT')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeMode === 'OFX_IMPORT'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Upload className="w-4 h-4" />
            Importar Extrato OFX / CSV
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-[380px] flex flex-col justify-center">

          {/* SUCCESS SCREEN */}
          {successResult ? (
            <div className="text-center py-6 animate-scale-up">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                {successResult.bankName} Conectado com Sucesso!
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Suas contas e movimentações reais foram sincronizadas com exatidão.
              </p>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Saldo Real</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    R$ {successResult.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-center border-x border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Contas</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white">
                    {successResult.accountsCount}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Transações</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {successResult.transactionsCount}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all inline-flex items-center gap-2"
              >
                <span>Ver Minhas Contas Conectadas</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : isSyncingData ? (
            /* SYNCING ANIMATION */
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <div className="relative mb-5">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-950 border-t-indigo-600 animate-spin flex items-center justify-center" />
                <div className="absolute inset-0 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Building2 className="w-6 h-6 animate-pulse" />
                </div>
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white mb-2">
                Sincronizando com a API do Banco...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                {syncStatusText || 'Obtendo saldo real, faturas e histórico de transações via Pluggy Open Finance.'}
              </p>
            </div>
          ) : activeMode === 'PLUGGY_CONNECT' ? (
            /* PLUGGY CONNECT OFFICIAL WIDGET */
            <div className="flex-1 flex flex-col">
              {isLoadingToken ? (
                <div className="text-center py-12 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-3" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Iniciando ambiente seguro Pluggy...
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Conectando com credenciais oficiais da Pluggy Open Finance
                  </p>
                </div>
              ) : errorMessage ? (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-3 my-4">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold mb-1">Não foi possível iniciar a conexão</p>
                    <p className="text-slate-600 dark:text-slate-400">{errorMessage}</p>
                    <button
                      onClick={() => {
                        setErrorMessage('');
                        setIsLoadingToken(true);
                        PluggyService.getConnectToken(userId).then(res => {
                          setIsLoadingToken(false);
                          if (res.success && res.accessToken) setConnectToken(res.accessToken);
                          else setErrorMessage(res.error || 'Erro ao reconectar');
                        });
                      }}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              ) : connectToken ? (
                <div className="w-full flex-1 min-h-[460px] relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white">
                  <PluggyConnect
                    connectToken={connectToken}
                    includeSandbox={true}
                    onSuccess={handlePluggySuccess}
                    onError={handlePluggyError}
                    onClose={() => {
                      if (!successResult) onClose();
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            /* OFX IMPORT BACKUP */
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Selecione o arquivo de extrato baixado no seu banco (.OFX ou .CSV)
                </label>
                <div 
                  onClick={() => document.getElementById('ofx-file-input')?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-white dark:bg-slate-900"
                >
                  <input
                    id="ofx-file-input"
                    type="file"
                    accept=".ofx,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <FileText className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                    {selectedFile ? selectedFile.name : 'Clique para selecionar arquivo .OFX ou .CSV'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Geralmente disponível na opção "Baixar Extrato OFX" do internet banking
                  </p>
                </div>
              </div>

              {parsedData && (
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 block">
                        {parsedData.bankName}
                      </span>
                      <span className="text-xs text-slate-500">
                        {parsedData.transactions.length} transações identificadas
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Saldo no Extrato</span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        R$ {parsedData.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {parsedData && (
                <button
                  onClick={handleSaveOfx}
                  className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>Concluir Importação do Extrato</span>
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Open Finance Brasil • Criptografia AES-256</span>
          </div>
          <a
            href="https://pluggy.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-500 flex items-center gap-1 font-medium transition-colors"
          >
            <span>Powered by Pluggy</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
};
