
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Investments from './pages/Investments';
import Agenda from './pages/Agenda';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import TransactionModal from './components/TransactionModal';
import TransferModal from './components/TransferModal';
import PlanSelectionModal from './components/PlanSelectionModal';
import { MenuIcon } from './components/icons/MenuIcon';
import { PersonalTransaction, Investment, User, Page, Theme, CalendarEvent, Plan, BillingCycle, TransactionType, Currency } from './types';
import { api } from './services/api';
import WhatsAppButton from './components/WhatsAppButton';
import Toast, { ToastMessage } from './components/Toast';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [tasks, setTasks] = useState<CalendarEvent[]>([]);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const savedUser = localStorage.getItem('user_data');
      return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoginScreen, setIsLoginScreen] = useState(false);
  const [preSelectRegister, setPreSelectRegister] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('FREE');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<PersonalTransaction | null>(null);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Função centralizada para buscar todos os dados
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      // Busca transações (Sempre disponível)
      const txs = await api.getTransactions(token);
      if (Array.isArray(txs)) setTransactions(txs);

      // Busca investimentos e agenda (Se não for plano Free ou se o usuário tiver acesso)
      const invs = await api.getInvestments(token);
      if (Array.isArray(invs)) setInvestments(invs);
      
      const userTasks = await api.getCalendarEvents(token);
      if (Array.isArray(userTasks)) setTasks(userTasks);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
      setToast({ id: Date.now().toString(), message, type });
  };

  const handleLogin = (user: User, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    localStorage.setItem('user_data', JSON.stringify(user));
    localStorage.setItem('auth_token', authToken);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('user_data');
    localStorage.removeItem('auth_token');
    setTransactions([]);
    setInvestments([]);
    setTasks([]);
    setIsLoginScreen(false);
  };

  const handleSaveTransaction = async (transaction: Omit<PersonalTransaction, 'id'> & { id?: string }) => {
    if (!token) return;
    try {
        await api.createTransaction(transaction, token);
        showToast(transaction.id ? "Transação atualizada!" : "Transação criada!", "success");
        fetchData();
        setIsTransactionModalOpen(false);
    } catch (error) {
        showToast("Erro ao salvar transação", "error");
    }
  };

  const handleSaveTransfer = async (data: { fromCurrency: Currency, toCurrency: Currency, amountFrom: number, amountTo: number, rate: number }) => {
    if (!token) return;
    const date = new Date().toISOString().split('T')[0];
    
    try {
        // Saída
        await api.createTransaction({
            description: `Câmbio: Saída (${data.fromCurrency} -> ${data.toCurrency})`,
            amount: Number(data.amountFrom.toFixed(2)),
            currency: data.fromCurrency,
            type: TransactionType.Despesa,
            category: 'Câmbio',
            date
        }, token);

        // Entrada
        await api.createTransaction({
            description: `Câmbio: Entrada (Taxa: ${data.rate.toFixed(4)})`,
            amount: Number(data.amountTo.toFixed(2)),
            currency: data.toCurrency,
            type: TransactionType.Receita,
            category: 'Câmbio',
            date
        }, token);

        showToast("Câmbio realizado com sucesso!", "success");
        fetchData();
    } catch (error) {
        showToast("Erro ao realizar câmbio", "error");
    }
  };

  const handleSaveInvestment = async (investment: Omit<Investment, 'id'> & { id?: string }) => {
    if (!token) return;
    try {
        await api.createInvestment(investment, token);
        showToast(investment.id ? "Ativo atualizado!" : "Ativo adicionado!", "success");
        fetchData();
    } catch (error) {
        showToast("Erro ao salvar investimento", "error");
    }
  };

  if (!token) {
      if (isLoginScreen) return <LoginPage onLogin={handleLogin} onBack={() => setIsLoginScreen(false)} initialMode={preSelectRegister ? 'register' : 'login'} selectedPlan={selectedPlan} selectedBillingCycle={selectedBillingCycle} />;
      return <LandingPage onLogin={() => setIsLoginScreen(true)} onRegister={(p, c) => { setSelectedPlan(p); setSelectedBillingCycle(c); setPreSelectRegister(true); setIsLoginScreen(true); }} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans relative transition-colors duration-300">
       {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
       <PlanSelectionModal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} onConfirmUpgrade={async (p, c) => { await api.updatePlan(p, c, token); fetchData(); }} currentPlan={currentUser?.plan || 'FREE'} />
       <TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onSaveTransfer={handleSaveTransfer} />

       {isSidebarOpen && <div className="fixed inset-0 z-20 bg-black opacity-50 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} activePage={activePage} setActivePage={setActivePage} currentUser={currentUser} onUpgrade={() => setIsPlanModalOpen(true)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={handleLogout} onNewTransaction={() => { setEditingTransaction(null); setIsTransactionModalOpen(true); }} currentUser={currentUser} setActivePage={setActivePage} onSearch={setSearchQuery} tasks={tasks}>
             <button className="md:hidden mr-4 text-gray-500" onClick={() => setIsSidebarOpen(true)}><MenuIcon className="h-6 w-6" /></button>
        </Header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
            {activePage === 'Dashboard' && <Dashboard transactions={transactions} investments={investments} setActivePage={setActivePage} onEditTransaction={setEditingTransaction} onDeleteTransaction={async (id) => { await api.deleteTransaction(id, token); fetchData(); }} onNewTransaction={() => setIsTransactionModalOpen(true)} onOpenTransfer={() => setIsTransferModalOpen(true)} searchQuery={searchQuery} />}
            {activePage === 'Transações' && <Transactions transactions={transactions} onOpenModal={(t) => { setEditingTransaction(t); setIsTransactionModalOpen(true); }} onDeleteTransaction={async (id) => { await api.deleteTransaction(id, token); fetchData(); }} searchQuery={searchQuery} />}
            {activePage === 'Agenda' && <Agenda tasks={tasks} onAddTask={async (t) => { await api.createCalendarEvent(t, token); fetchData(); }} onToggleTask={async (id, d) => { await api.toggleCalendarEvent(id, d, token); fetchData(); }} onDeleteTask={async (id) => { await api.deleteCalendarEvent(id, token); fetchData(); }} />}
            {activePage === 'Investimentos' && <Investments investments={investments} setInvestments={setInvestments} cdiRate={13.25} onSaveInvestment={handleSaveInvestment} onDeleteInvestment={async (id) => { await api.deleteInvestment(id, token); fetchData(); }} />}
            {activePage === 'Relatórios' && <Reports transactions={transactions} />}
            {activePage === 'Configurações' && currentUser && <Settings theme={theme} setTheme={setTheme} currentUser={currentUser} onUpdatePassword={async (c, n) => { await api.updatePassword({currentPassword: c, newPassword: n}, token); }} onUpdateAvatar={async (a) => { await api.updateAvatar({avatar: a}, token); }} onCreateUser={api.createUser} />}
        </main>
      </div>

      <TransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSave={handleSaveTransaction} transaction={editingTransaction} />
      <WhatsAppButton />
    </div>
  );
};

export default App;
