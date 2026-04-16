
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
import AIInsights from './pages/AIInsights';
import Admin from './pages/Admin';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import TransactionModal from './components/TransactionModal';
import TransferModal from './components/TransferModal';
import PlanSelectionModal from './components/PlanSelectionModal';
import { PersonalTransaction, Investment, User, Page, Theme, CalendarEvent, Plan, BillingCycle, TransactionType, Language, Currency } from './types';
import { api } from './services/api';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, getDocFromServer, doc } from 'firebase/firestore';
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoginScreen, setIsLoginScreen] = useState(false);
  const [preSelectRegister, setPreSelectRegister] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('FREE');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<PersonalTransaction | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Test connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error.message && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setToken(user.uid);
        const userData = await api.getMe(user.uid);
        if (userData) {
          setCurrentUser(userData);
          if (userData.language) setLanguage(userData.language);
        }
      } else {
        setToken(null);
        setCurrentUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!token || !isAuthReady) return;

    const qT = query(collection(db, 'transactions'), where('userId', '==', token));
    const unsubT = onSnapshot(qT, (snap) => {
      setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id } as PersonalTransaction)));
    }, (error) => {
      console.error("Error fetching transactions:", error);
    });

    const qI = query(collection(db, 'investments'), where('userId', '==', token));
    const unsubI = onSnapshot(qI, (snap) => {
      setInvestments(snap.docs.map(d => ({ ...d.data(), id: d.id } as Investment)));
    }, (error) => {
      console.error("Error fetching investments:", error);
    });

    const qC = query(collection(db, 'calendar'), where('userId', '==', token));
    const unsubC = onSnapshot(qC, (snap) => {
      setTasks(snap.docs.map(d => ({ ...d.data(), id: d.id } as CalendarEvent)));
    }, (error) => {
      console.error("Error fetching tasks:", error);
    });

    return () => {
      unsubT();
      unsubI();
      unsubC();
    };
  }, [token, isAuthReady]);

  const handleLogin = (user: User, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    setIsLoginScreen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      setIsLoginScreen(false);
      setActivePage('Dashboard');
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const handleSaveTransfer = async (data: { fromCurrency: Currency, toCurrency: Currency, amountFrom: number, amountTo: number, rate: number }) => {
    if (!token) return;
    try {
        const date = new Date().toISOString().split('T')[0];
        
        // 1. Débito da conta de origem
        await api.createTransaction({
            description: `Transferência (Saída) p/ ${data.toCurrency}`,
            amount: data.amountFrom,
            currency: data.fromCurrency,
            date,
            type: TransactionType.Despesa,
            category: 'Câmbio/Transferência'
        }, token);

        // 2. Crédito na conta de destino
        await api.createTransaction({
            description: `Transferência (Entrada) de ${data.fromCurrency}`,
            amount: data.amountTo,
            currency: data.toCurrency,
            date,
            type: TransactionType.Receita,
            category: 'Câmbio/Transferência'
        }, token);

        setToast({ id: Date.now().toString(), message: "Transferência realizada com sucesso!", type: 'success' });
    } catch (error) {
        setToast({ id: Date.now().toString(), message: "Erro ao realizar transferência.", type: 'error' });
    }
  };

  const handleUpdatePlan = async (plan: Plan, billing: BillingCycle) => {
    if (!token) return;
    try {
        await api.updateUser(token, { plan, billingCycle: billing });
        setCurrentUser(prev => prev ? { ...prev, plan, billingCycle: billing } : null);
        setToast({ id: Date.now().toString(), message: `Plano atualizado para ${plan}!`, type: 'success' });
        setIsPlanModalOpen(false);
    } catch (error) {
        setToast({ id: Date.now().toString(), message: "Erro ao atualizar plano.", type: 'error' });
    }
  };

  if (!isAuthReady) return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
  );

  if (!token) {
      if (isLoginScreen) return <LoginPage onLogin={handleLogin} onBack={() => setIsLoginScreen(false)} initialMode={preSelectRegister ? 'register' : 'login'} selectedPlan={selectedPlan} selectedBillingCycle={selectedBillingCycle} />;
      return <LandingPage onLogin={() => setIsLoginScreen(true)} onRegister={(p, c) => { setSelectedPlan(p); setSelectedBillingCycle(c); setPreSelectRegister(true); setIsLoginScreen(true); }} />;
  }

  return (
    <div className="flex h-screen w-full max-w-[100vw] bg-[#f8fafc] dark:bg-slate-900 relative overflow-hidden">
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

        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full p-4 md:p-6 lg:p-8 pb-28 md:pb-8 no-scrollbar max-w-full">
            {activePage === 'Dashboard' && <Dashboard transactions={transactions} investments={investments} setActivePage={setActivePage} onEditTransaction={(t) => { setEditingTransaction(t); setIsTransactionModalOpen(true); }} onDeleteTransaction={async (id) => { await api.deleteTransaction(id, token); }} onNewTransaction={() => setIsTransactionModalOpen(true)} onOpenTransfer={() => setIsTransferModalOpen(true)} searchQuery={searchQuery} language={language} selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />}
            {activePage === 'Transações' && <Transactions transactions={transactions} onOpenModal={(t) => { setEditingTransaction(t); setIsTransactionModalOpen(true); }} onDeleteTransaction={async (id) => { await api.deleteTransaction(id, token); }} searchQuery={searchQuery} language={language} selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />}
            {activePage === 'Investimentos' && <Investments investments={investments} setInvestments={setInvestments} onSaveInvestment={async (inv) => { await api.createInvestment(inv, token); }} onDeleteInvestment={async (id) => { await api.deleteInvestment(id, token); }} onWithdrawInvestment={async (id) => { await api.withdrawInvestment(id, token); }} language={language} />}
            {activePage === 'Agenda' && <Agenda tasks={tasks} onAddTask={async (t) => { await api.createCalendarEvent(t, token); }} onToggleTask={async (id, d) => { await api.toggleCalendarEvent(id, d, token); }} onDeleteTask={async (id) => { await api.deleteCalendarEvent(id, token); }} language={language} />}
            {activePage === 'Relatórios' && <Reports transactions={transactions} investments={investments} language={language} selectedCurrency={selectedCurrency} onCurrencyChange={setSelectedCurrency} />}
            {activePage === 'Insights' && <AIInsights transactions={transactions} investments={investments} />}
            {activePage === 'Configurações' && currentUser && <Settings theme={theme} setTheme={setTheme} currentUser={currentUser} onUpdatePassword={async (c, n) => { await api.updatePassword({currentPassword: c, newPassword: n}, token); }} onUpdateAvatar={async (a) => { await api.updateAvatar({avatar: a}, token); }} onCreateUser={async (u) => { const r = await api.createUser(u); return r; }} language={language} onLanguageChange={setLanguage} />}
            {activePage === 'Admin' && currentUser?.email === 'eduardopontesdias@outlook.com' && <Admin />}
        </main>
      </div>

      <BottomNav activePage={activePage} setActivePage={setActivePage} language={language} isFreePlan={currentUser?.plan === 'FREE'} />
      <TransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSave={async (t) => { await api.createTransaction(t, token); setIsTransactionModalOpen(false); }} transaction={editingTransaction} language={language} />
      <TransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} onSaveTransfer={handleSaveTransfer} />
      <PlanSelectionModal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} onConfirmUpgrade={handleUpdatePlan} currentPlan={currentUser?.plan || 'FREE'} />
      <WhatsAppButton />
    </div>
  );
};

export default App;