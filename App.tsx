
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
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
import { PersonalTransaction, Investment, User, Page, Theme, CalendarEvent, Plan, BillingCycle, TransactionType, Language, Currency } from './types';
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
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'pt-BR');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => (localStorage.getItem('selected_currency') as Currency) || 'BRL');
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

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const txs = await api.getTransactions(token);
      if (Array.isArray(txs)) setTransactions(txs);
      const invs = await api.getInvestments(token);
      if (Array.isArray(invs)) setInvestments(invs);
      const userTasks = await api.getCalendarEvents(token);
      if (Array.isArray(userTasks)) setTasks(userTasks);
      const me = await api.getMe(token);
      if (me) setCurrentUser(prev => prev ? {...prev, ...me} : me);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogin = (user: User, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    localStorage.setItem('user_data', JSON.stringify(user));
    localStorage.setItem('auth_token', authToken);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.clear();
    setIsLoginScreen(false);
    setActivePage('Dashboard');
  };

  if (!token) {
      if (isLoginScreen) return <LoginPage onLogin={handleLogin} onBack={() => setIsLoginScreen(false)} initialMode={preSelectRegister ? 'register' : 'login'} selectedPlan={selectedPlan} selectedBillingCycle={selectedBillingCycle} />;
      return <LandingPage onLogin={() => setIsLoginScreen(true)} onRegister={(p, c) => { setSelectedPlan(p); setSelectedBillingCycle(c); setPreSelectRegister(true); setIsLoginScreen(true); }} />;
  }

  return (
    <div className="flex h-full w-full max-w-[100vw] bg-[#f8fafc] dark:bg-slate-900 relative overflow-hidden">
       {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
       
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} activePage={activePage} setActivePage={setActivePage} currentUser={currentUser} language={language} onUpgrade={() => setIsPlanModalOpen(true)} />

      <div className="flex-1 flex flex-col w-full min-w-0 h-full max-w-full overflow-hidden">
        <Header 
            onLogout={handleLogout} 
            onNewTransaction={() => { setEditingTransaction(null); setIsTransactionModalOpen(true); }} 
            currentUser={currentUser} 
            setActivePage={setActivePage} 
            onSearch={setSearchQuery} 
            tasks={tasks} 
            language={language} 
            onLanguageChange={setLanguage}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full p-4 md:p-10 pb-28 md:pb-10 no-scrollbar max-w-full">
            {activePage === 'Dashboard' && <Dashboard transactions={transactions} investments={investments} setActivePage={setActivePage} onEditTransaction={(t) => { setEditingTransaction(t); setIsTransactionModalOpen(true); }} onDeleteTransaction={async (id) => { await api.deleteTransaction(id, token); fetchData(); }} onNewTransaction={() => setIsTransactionModalOpen(true)} onOpenTransfer={() => setIsTransferModalOpen(true)} searchQuery={searchQuery} language={language} selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />}
            {activePage === 'Transações' && <Transactions transactions={transactions} onOpenModal={(t) => { setEditingTransaction(t); setIsTransactionModalOpen(true); }} onDeleteTransaction={async (id) => { await api.deleteTransaction(id, token); fetchData(); }} searchQuery={searchQuery} language={language} selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />}
            {activePage === 'Investimentos' && <Investments investments={investments} setInvestments={setInvestments} onSaveInvestment={async (inv) => { await api.createInvestment(inv, token); fetchData(); }} onDeleteInvestment={async (id) => { await api.deleteInvestment(id, token); fetchData(); }} onWithdrawInvestment={async (id) => { await api.withdrawInvestment(id, token); fetchData(); }} language={language} />}
            {activePage === 'Agenda' && <Agenda tasks={tasks} onAddTask={async (t) => { await api.createCalendarEvent(t, token); fetchData(); }} onToggleTask={async (id, d) => { await api.toggleCalendarEvent(id, d, token); fetchData(); }} onDeleteTask={async (id) => { await api.deleteCalendarEvent(id, token); fetchData(); }} language={language} />}
            {activePage === 'Relatórios' && <Reports transactions={transactions} investments={investments} language={language} selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />}
            {activePage === 'Configurações' && currentUser && <Settings theme={theme} setTheme={setTheme} currentUser={currentUser} onUpdatePassword={async (c, n) => { await api.updatePassword({currentPassword: c, newPassword: n}, token); }} onUpdateAvatar={async (a) => { await api.updateAvatar({avatar: a}, token); }} onCreateUser={async (u) => { const r = await api.createUser(u); return r; }} language={language} onLanguageChange={setLanguage} />}
        </main>
      </div>

      <BottomNav activePage={activePage} setActivePage={setActivePage} language={language} isFreePlan={currentUser?.plan === 'FREE'} />
      <TransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSave={async (t) => { await api.createTransaction(t, token); fetchData(); setIsTransactionModalOpen(false); }} transaction={editingTransaction} language={language} />
      <WhatsAppButton />
    </div>
  );
};

export default App;