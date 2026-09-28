import React, { useState, useMemo, useEffect } from 'react';
import { 
  BankConnection, 
  BankAccount, 
  BankTransaction, 
  Currency, 
  Language, 
  PersonalTransaction, 
  User,
  PluggyConfig 
} from '../types';
import { PluggyService } from '../services/pluggyService';
import { PluggyConnectModal } from '../components/PluggyConnectModal';
import { PluggyConfigModal } from '../components/PluggyConfigModal';
import { api } from '../services/api';
import { 
  Building2, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink, 
  Trash2, 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  CheckCircle2, 
  Settings, 
  Lock, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  DownloadCloud,
  Layers,
  Filter
} from 'lucide-react';

interface OpenFinanceProps {
  userId: string;
  language: Language;
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  currentUser?: User | null;
  onImportTransactionsToApp?: (transactions: Omit<PersonalTransaction, 'id'>[]) => Promise<void>;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const OpenFinance: React.FC<OpenFinanceProps> = ({
  userId,
  language,
  selectedCurrency,
  onCurrencyChange,
  currentUser,
  onImportTransactionsToApp,
  showToast
}) => {
  const isPT = language === 'pt-BR';

  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null);

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [pluggyConfig, setPluggyConfig] = useState<PluggyConfig>(() => PluggyService.getConfig());

  const [searchTx, setSearchTx] = useState('');
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('ALL');

  // Load connections and accounts
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const [loadedConns, loadedAccs] = await Promise.all([
          api.getBankConnections(userId),
          api.getBankAccounts(userId)
        ]);
        if (isMounted) {
          setConnections(loadedConns || []);
          setAccounts(loadedAccs || []);
          const cachedTxs = PluggyService.getCachedTransactions(userId);
          setBankTransactions(cachedTxs || []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do Open Finance:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [userId]);

  // Aggregated totals
  const stats = useMemo(() => {
    const checkingBalance = accounts
      .filter(a => a.type === 'BANK')
      .reduce((acc, a) => acc + (Number(a.balance) || 0), 0);

    const investmentBalance = accounts
      .filter(a => a.type === 'INVESTMENT')
      .reduce((acc, a) => acc + (Number(a.balance) || 0), 0);

    const creditLimitTotal = accounts
      .filter(a => a.type === 'CREDIT')
      .reduce((acc, a) => acc + (Number(a.creditLimit) || 0), 0);

    const creditUsedTotal = accounts
      .filter(a => a.type === 'CREDIT')
      .reduce((acc, a) => acc + Math.abs(Number(a.balance) || 0), 0);

    return {
      checkingBalance,
      investmentBalance,
      totalBankAssets: checkingBalance + investmentBalance,
      creditLimitTotal,
      creditUsedTotal,
      connectionsCount: connections.length,
      transactionsCount: bankTransactions.length
    };
  }, [accounts, connections, bankTransactions]);

  const formatCurrency = (val: number) => {
    const symbol = selectedCurrency === 'BRL' ? 'R$ ' : '$ ';
    return symbol + Math.abs(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Handle successful new bank connection
  const handleConnectionSuccess = async (data: { connection: BankConnection; accounts: BankAccount[]; transactions: BankTransaction[] }) => {
    try {
      await Promise.all([
        api.saveBankConnection(data.connection, userId),
        ...data.accounts.map(acc => api.saveBankAccount(acc, userId))
      ]);

      setConnections(prev => [data.connection, ...prev.filter(c => c.itemId !== data.connection.itemId)]);
      setAccounts(prev => [...data.accounts, ...prev.filter(a => a.itemId !== data.connection.itemId)]);
      setBankTransactions(prev => [...data.transactions, ...prev]);

      // If auto-import is enabled, import to personal transactions
      if (pluggyConfig.autoImportTransactions && onImportTransactionsToApp) {
        const converted = PluggyService.convertToPersonalTransactions(data.transactions, userId);
        await onImportTransactionsToApp(converted);
        showToast?.(
          isPT 
            ? `Banco ${data.connection.connector.name} conectado e transações importadas com sucesso!` 
            : `Bank ${data.connection.connector.name} connected and transactions imported!`,
          'success'
        );
      } else {
        showToast?.(
          isPT 
            ? `Banco ${data.connection.connector.name} conectado via Pluggy com sucesso!` 
            : `Bank ${data.connection.connector.name} connected successfully!`,
          'success'
        );
      }
    } catch (err) {
      console.error('Erro ao salvar conexão bancária:', err);
      showToast?.(isPT ? 'Erro ao salvar conexão bancária.' : 'Error saving connection.', 'error');
    }
  };

  // Sync a single bank connection
  const handleSyncItem = async (conn: BankConnection) => {
    setSyncingItemId(conn.itemId);
    try {
      const result = await PluggyService.syncConnection(conn, accounts, userId);
      await Promise.all(result.accounts.map(acc => api.saveBankAccount(acc, userId)));

      setAccounts(result.accounts);
      if (result.newTransactions.length > 0) {
        setBankTransactions(prev => [...result.newTransactions, ...prev]);
        if (pluggyConfig.autoImportTransactions && onImportTransactionsToApp) {
          const converted = PluggyService.convertToPersonalTransactions(result.newTransactions, userId);
          await onImportTransactionsToApp(converted);
        }
      }

      const updatedConn: BankConnection = {
        ...conn,
        lastUpdatedAt: new Date().toISOString(),
        status: 'UPDATED'
      };
      await api.saveBankConnection(updatedConn, userId);
      setConnections(prev => prev.map(c => c.itemId === conn.itemId ? updatedConn : c));

      showToast?.(
        isPT 
          ? `Banco ${conn.connector.name} sincronizado com sucesso!` 
          : `Bank ${conn.connector.name} synced successfully!`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast?.(isPT ? 'Erro ao sincronizar banco.' : 'Error syncing bank.', 'error');
    } finally {
      setSyncingItemId(null);
    }
  };

  // Sync all bank connections
  const handleSyncAll = async () => {
    if (connections.length === 0) return;
    setIsSyncingAll(true);
    try {
      let currentAccs = [...accounts];
      let allNewTxs: BankTransaction[] = [];

      for (const conn of connections) {
        const result = await PluggyService.syncConnection(conn, currentAccs, userId);
        currentAccs = result.accounts;
        allNewTxs.push(...result.newTransactions);
        const updatedConn: BankConnection = {
          ...conn,
          lastUpdatedAt: new Date().toISOString()
        };
        await api.saveBankConnection(updatedConn, userId);
      }

      await Promise.all(currentAccs.map(acc => api.saveBankAccount(acc, userId)));
      setAccounts(currentAccs);

      if (allNewTxs.length > 0) {
        setBankTransactions(prev => [...allNewTxs, ...prev]);
        if (pluggyConfig.autoImportTransactions && onImportTransactionsToApp) {
          const converted = PluggyService.convertToPersonalTransactions(allNewTxs, userId);
          await onImportTransactionsToApp(converted);
        }
      }

      showToast?.(
        isPT ? 'Todas as contas Open Finance foram atualizadas!' : 'All Open Finance accounts synced!',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast?.(isPT ? 'Erro ao sincronizar todas as contas.' : 'Error syncing all accounts.', 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Disconnect bank connection
  const handleDisconnect = async (conn: BankConnection) => {
    const msg = isPT
      ? `Tem certeza que deseja desconectar o banco "${conn.connector.name}"? As contas associadas serão removidas do sincronizador.`
      : `Are you sure you want to disconnect "${conn.connector.name}"?`;
    
    if (window.confirm(msg)) {
      try {
        await api.deleteBankConnection(conn.id, userId);
        const accsToDelete = accounts.filter(a => a.itemId === conn.itemId);
        await Promise.all(accsToDelete.map(a => api.deleteBankAccount(a.id, userId)));

        setConnections(prev => prev.filter(c => c.itemId !== conn.itemId));
        setAccounts(prev => prev.filter(a => a.itemId !== conn.itemId));
        showToast?.(
          isPT ? `Banco ${conn.connector.name} desconectado.` : 'Bank disconnected.',
          'info'
        );
      } catch (err) {
        console.error(err);
        showToast?.(isPT ? 'Erro ao desconectar banco.' : 'Error disconnecting bank.', 'error');
      }
    }
  };

  // Import selected transactions into the app's personal transactions
  const handleImportTransactions = async (txsToImport: BankTransaction[]) => {
    if (!onImportTransactionsToApp || txsToImport.length === 0) return;
    try {
      const converted = PluggyService.convertToPersonalTransactions(txsToImport, userId);
      await onImportTransactionsToApp(converted);

      // Mark as imported
      const updatedTxs = bankTransactions.map(tx => {
        if (txsToImport.some(t => t.id === tx.id)) {
          return { ...tx, imported: true };
        }
        return tx;
      });
      setBankTransactions(updatedTxs);
      PluggyService.saveCachedTransactions(userId, updatedTxs);

      showToast?.(
        isPT 
          ? `${txsToImport.length} transações importadas para o seu painel de controle!` 
          : `${txsToImport.length} transactions imported to your dashboard!`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast?.(isPT ? 'Erro ao importar transações.' : 'Error importing transactions.', 'error');
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return bankTransactions.filter(tx => {
      const matchSearch = searchTx 
        ? tx.description.toLowerCase().includes(searchTx.toLowerCase()) || tx.category.toLowerCase().includes(searchTx.toLowerCase())
        : true;
      const matchBank = selectedBankFilter === 'ALL' || tx.bankName === selectedBankFilter;
      return matchSearch && matchBank;
    });
  }, [bankTransactions, searchTx, selectedBankFilter]);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Open Finance
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Pluggy API
                </span>
              </div>
              <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {isPT 
                  ? 'Conecte seus bancos reais para sincronizar saldos, faturas e extratos em tempo real' 
                  : 'Connect your real bank accounts via Pluggy Open Finance API'}
              </p>
            </div>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Configurações da API Pluggy"
          >
            <Settings className="w-5 h-5" />
          </button>

          {connections.length > 0 && (
            <button
              type="button"
              disabled={isSyncingAll}
              onClick={handleSyncAll}
              className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-600 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? (isPT ? 'Sincronizando...' : 'Syncing...') : (isPT ? 'Sincronizar Tudo' : 'Sync All')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsConnectModalOpen(true)}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{isPT ? 'Conectar Novo Banco' : 'Connect New Bank'}</span>
          </button>
        </div>
      </div>

      {/* METRIC STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL BANK ASSETS */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {isPT ? 'Saldo Bancário Total' : 'Total Bank Balance'}
            </p>
            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {formatCurrency(stats.checkingBalance)}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Contas correntes e poupança</span>
          </div>
        </div>

        {/* CREDIT CARDS LIMIT & BILL */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {isPT ? 'Fatura Cartões Conectados' : 'Connected Cards Bill'}
            </p>
            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {formatCurrency(stats.creditUsedTotal)}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">
              Limite Disp.: {formatCurrency(Math.max(0, stats.creditLimitTotal - stats.creditUsedTotal))}
            </span>
          </div>
        </div>

        {/* CONNECTED INSTITUTIONS */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {isPT ? 'Bancos Conectados' : 'Connected Banks'}
            </p>
            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.connectionsCount} {stats.connectionsCount === 1 ? (isPT ? 'instituição' : 'institution') : (isPT ? 'instituições' : 'institutions')}
            </p>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Conexão direta ativa</span>
            </span>
          </div>
        </div>

        {/* TRANSACTIONS SYNCED */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {isPT ? 'Transações no Extrato' : 'Synced Transactions'}
            </p>
            <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.transactionsCount}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Sincronizadas via API</span>
          </div>
        </div>
      </div>

      {/* CONNECTED BANKS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {isPT ? 'Suas Contas e Cartões Conectados' : 'Your Connected Accounts'}
            </h3>
          </div>
          {connections.length > 0 && (
            <span className="text-xs text-slate-400 font-medium">
              {accounts.length} {accounts.length === 1 ? 'conta cadastrada' : 'contas cadastradas'}
            </span>
          )}
        </div>

        {connections.length === 0 ? (
          /* EMPTY STATE ONBOARDING */
          <div className="p-8 md:p-12 bg-gradient-to-br from-indigo-900/5 via-white to-purple-900/5 dark:from-indigo-950/20 dark:via-slate-900 dark:to-purple-950/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Building2 className="w-10 h-10" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                Nenhum banco conectado ainda
              </h4>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Conecte seu Nubank, Itaú, Santander, Bradesco, Banco do Brasil ou Inter via <strong>Pluggy Open Finance</strong> para ter suas contas, cartões e extratos atualizados automaticamente.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(true)}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-600/25 flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Conectar Primeiro Banco</span>
              </button>
            </div>
          </div>
        ) : (
          /* CONNECTED INSTITUTIONS CARDS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map(conn => {
              const bankAccounts = accounts.filter(a => a.itemId === conn.itemId);
              const isSyncingThis = syncingItemId === conn.itemId;

              return (
                <div 
                  key={conn.id} 
                  className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
                >
                  {/* CARD HEADER */}
                  <div className="p-5 border-b border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md shrink-0"
                          style={{ backgroundColor: conn.connector.primaryColor }}
                        >
                          {conn.connector.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            {conn.connector.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                              Sincronizado
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isSyncingThis}
                          onClick={() => handleSyncItem(conn)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                          title="Sincronizar este banco"
                        >
                          <RefreshCw className={`w-4 h-4 ${isSyncingThis ? 'animate-spin text-indigo-600' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDisconnect(conn)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Desconectar banco"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ACCOUNTS LIST WITHIN THIS BANK */}
                  <div className="p-5 space-y-3 flex-1">
                    {bankAccounts.map(acc => (
                      <div 
                        key={acc.id} 
                        className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            {acc.type === 'CREDIT' ? (
                              <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                            ) : acc.type === 'INVESTMENT' ? (
                              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                            ) : (
                              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {acc.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {acc.accountNumber} {acc.agency ? `• Ag: ${acc.agency}` : ''}
                          </span>
                        </div>

                        <div className="text-right">
                          <p className={`text-xs font-black ${acc.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-amber-500'}`}>
                            {formatCurrency(acc.balance)}
                          </p>
                          <span className="text-[9px] text-slate-400 capitalize">
                            {acc.type === 'CREDIT' ? 'Fatura atual' : 'Saldo'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CARD FOOTER */}
                  <div className="px-5 py-3 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      Última atualização: {new Date(conn.lastUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      Open Finance BACEN
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INTEGRATED BANK TRANSACTIONS STATEMENT */}
      {bankTransactions.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Extrato Integrado Open Finance
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Movimentações sincronizadas diretamente das suas contas bancárias
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* IMPORT ALL BUTTON */}
              {onImportTransactionsToApp && (
                <button
                  type="button"
                  onClick={() => handleImportTransactions(bankTransactions.filter(t => !t.imported))}
                  className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Importar Todas para Meu Painel</span>
                </button>
              )}
            </div>
          </div>

          {/* SEARCH & BANK FILTER */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por descrição ou categoria..."
                value={searchTx}
                onChange={e => setSearchTx(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* BANK FILTER PILLS */}
            <select
              value={selectedBankFilter}
              onChange={e => setSelectedBankFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todos os Bancos ({bankTransactions.length})</option>
              {Array.from(new Set(bankTransactions.map(t => t.bankName))).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/60 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Banco</th>
                  <th className="pb-3">Descrição</th>
                  <th className="pb-3">Categoria</th>
                  <th className="pb-3 text-right">Valor</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.slice(0, 15).map(tx => {
                  const isCredit = tx.type === 'CREDIT';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                      <td className="py-3 font-medium text-slate-500 dark:text-slate-400">
                        {new Date(tx.date + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {tx.bankName}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-slate-900 dark:text-white max-w-[220px] truncate">
                        {tx.description}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">
                        {tx.category}
                      </td>
                      <td className="py-3 text-right font-black">
                        <span className={isCredit ? 'text-emerald-600' : 'text-red-500'}>
                          {isCredit ? '+ ' : '- '}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {tx.imported ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Importada</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleImportTransactions([tx])}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Importar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECURITY AND COMPLIANCE NOTICE */}
      <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">
              Privacidade & Segurança Bancária Garantida
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Operamos em conformidade com as normas de Open Finance do Banco Central do Brasil e LGPD. Suas credenciais são transmitidas diretamente para a Pluggy com criptografia de 256 bits.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://pluggy.ai"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Conheça a Pluggy</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* MODALS */}
      <PluggyConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onSuccess={handleConnectionSuccess}
        userId={userId}
      />

      <PluggyConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSaved={cfg => {
          setPluggyConfig(cfg);
          showToast?.('Configurações da Pluggy salvas.', 'success');
        }}
      />
    </div>
  );
};
