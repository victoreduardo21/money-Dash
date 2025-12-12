
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Investments from './pages/Investments';
import Agenda from './pages/Agenda';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import TransactionModal from './components/TransactionModal';
import { MenuIcon } from './components/icons/MenuIcon';
import { PersonalTransaction, Investment, User, Page, Theme, CalendarEvent, Plan } from './types';
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
  
  // Estado para busca global
  const [searchQuery, setSearchQuery] = useState('');

  // Estado para Notificações (Toast)
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Load user and token from localStorage if available to persist session on refresh
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const savedUser = localStorage.getItem('user_data');
      return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));

  // Estado para controlar se mostra a tela de Login ou a Landing Page
  const [isLoginScreen, setIsLoginScreen] = useState(false);
  // Estado para pre-selecionar o modo de registro no login se vier do botão "Criar Conta" da Landing Page
  const [preSelectRegister, setPreSelectRegister] = useState(false);
  // Estado para armazenar o plano selecionado na Landing Page
  const [selectedPlan, setSelectedPlan] = useState<Plan>('FREE');

  const [cdiRate, setCdiRate] = useState(0);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<PersonalTransaction | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
        const fetchData = async () => {
             // 1. Atualiza Transações
             const txs = await api.getTransactions(token);
             if (Array.isArray(txs)) setTransactions(txs);
             
             // 2. Atualiza Investimentos
             const invs = await api.getInvestments(token);
             if (Array.isArray(invs)) setInvestments(invs);
             
             // 3. Atualiza Agenda (CALENDAR)
             const userTasks = await api.getCalendarEvents(token);
             if (Array.isArray(userTasks)) setTasks(userTasks);

             // 4. ATUALIZA DADOS DO PERFIL (Para garantir que Foto, CPF, Tel e Status estejam sincronizados)
             const userProfile = await api.getMe(token);
             if (userProfile && !userProfile.error) {
                 setCurrentUser(userProfile);
                 localStorage.setItem('user_data', JSON.stringify(userProfile));
             }
        };
        fetchData();
    }
  }, [token]);

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
    setIsLoginScreen(false); // Volta para a Landing Page ao sair
  };

  const handleSaveTransaction = async (transaction: Omit<PersonalTransaction, 'id'> & { id?: string }) => {
    if (!token) return;
    
    if (transaction.id) {
         const txId = transaction.id;
         setTransactions(prev => prev.map(t => t.id === txId ? { ...transaction, id: txId } as PersonalTransaction : t));
         showToast("Transação atualizada!", "success");
    } else {
        await api.createTransaction(transaction, token);
        const txs = await api.getTransactions(token);
        if (Array.isArray(txs)) setTransactions(txs);
        showToast("Transação criada com sucesso!", "success");
    }
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
     if (!token) return;
     if (window.confirm("Tem certeza que deseja excluir esta transação permanentemente?")) {
         // Atualiza UI otimista
         setTransactions(prev => prev.filter(t => t.id !== id));
         showToast("Transação removida.", "error");
         
         // Chama API
         const result = await api.deleteTransaction(id, token);
         if (result.error) {
             alert(result.message);
             // Reverte se der erro (opcional, aqui estamos apenas recarregando)
             const txs = await api.getTransactions(token);
             if (Array.isArray(txs)) setTransactions(txs);
         }
     }
  };

  const handleSaveInvestment = async (investment: Omit<Investment, 'id'> & { id?: string }) => {
      if (!token) return;
      if (investment.id) {
          const invId = investment.id;
          setInvestments(prev => prev.map(i => i.id === invId ? { ...investment, id: invId } as Investment : i));
          showToast("Investimento atualizado!", "success");
      } else {
          await api.createInvestment(investment, token);
          const invs = await api.getInvestments(token);
          if (Array.isArray(invs)) setInvestments(invs);
          showToast("Investimento adicionado!", "success");
      }
  };

  const handleDeleteInvestment = async (id: string) => {
      if (!token) return;
      if (window.confirm("Tem certeza que deseja excluir este investimento permanentemente?")) {
          setInvestments(prev => prev.filter(i => i.id !== id));
          showToast("Investimento removido.", "error");
          
          const result = await api.deleteInvestment(id, token);
          if (result.error) {
              alert(result.message);
              const invs = await api.getInvestments(token);
              if (Array.isArray(invs)) setInvestments(invs);
          }
      }
  }

  // --- AGENDA HANDLERS (CALENDAR) ---
  const handleAddTask = async (task: Omit<CalendarEvent, 'id'>) => {
      if (!token) return;
      // 1. Cria ID temporário para mostrar na tela imediatamente
      const tempId = 'temp-' + Date.now();
      const tempTask = { ...task, id: tempId };
      
      // 2. Atualiza UI (Otimista)
      setTasks(prev => [...prev, tempTask]);
      showToast("Lembrete adicionado à agenda!", "success");
      
      // 3. Chama o servidor
      const response = await api.createCalendarEvent(task, token);
      
      if (response && response.id) {
          // 4. SUCESSO: Troca o ID temporário pelo ID real do banco
          setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: response.id } : t));
      } else {
          // 5. FALHA ou Fallback: Recarrega tudo se algo der errado
          const serverTasks = await api.getCalendarEvents(token);
          if(Array.isArray(serverTasks)) setTasks(serverTasks);
      }
  };

  const handleToggleTask = async (id: string, done: boolean) => {
      if (!token) return;
      // Atualiza UI Imediatamente
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done } : t));
      
      // Notificação Visual
      if (done) {
          showToast("Tarefa concluída! 🎉", "success");
      } else {
          showToast("Tarefa reaberta.", "info");
      }

      await api.toggleCalendarEvent(id, done, token);
  };

  const handleDeleteTask = async (id: string) => {
      if (!token) return;
      if (window.confirm("Excluir lembrete?")) {
        // Atualiza UI Imediatamente (Remove o item)
        setTasks(prev => prev.filter(t => t.id !== id));
        showToast("Lembrete excluído.", "error");
        
        // Chama API para deletar
        await api.deleteCalendarEvent(id, token);
      }
  };
  
  const handleUpdatePassword = async (current: string, newPass: string) => {
      if(token) await api.updatePassword({currentPassword: current, newPassword: newPass}, token);
      showToast("Senha atualizada com sucesso.", "success");
  };

  const handleUpdateAvatar = async (avatar: string) => {
      if (token) {
          await api.updateAvatar({avatar}, token);
          if (currentUser) {
              const updatedUser = { ...currentUser, avatar };
              setCurrentUser(updatedUser);
              localStorage.setItem('user_data', JSON.stringify(updatedUser));
              showToast("Foto de perfil atualizada!", "success");
          }
      }
  };

  // FIXED: Adjusted logic to return { success: boolean, message: string } to match CreateUserModal expectation
  const handleCreateUser = async (newUser: Omit<User, 'id'>) => {
     const result = await api.createUser(newUser);
     if (result.error) {
         return { success: false, message: result.message || 'Erro ao criar usuário' };
     }
     return { success: true, message: 'Usuário criado com sucesso' };
  };

  if (!token) {
      if (isLoginScreen) {
          return (
            <>
                <LoginPage 
                    onLogin={handleLogin} 
                    onBack={() => setIsLoginScreen(false)} 
                    initialMode={preSelectRegister ? 'register' : 'login'}
                    selectedPlan={selectedPlan}
                />
                <WhatsAppButton />
            </>
          );
      }
      return (
          <>
            <LandingPage 
                onLogin={() => {
                    setPreSelectRegister(false);
                    setIsLoginScreen(true);
                }}
                onRegister={(plan) => {
                    if (plan) setSelectedPlan(plan);
                    setPreSelectRegister(true);
                    setIsLoginScreen(true);
                }}
            />
            <WhatsAppButton />
          </>
      );
  }

  return (
    // Sidebar Escura (#020617) + Conteúdo Claro (bg-slate-50)
    <div className="flex h-screen bg-slate-50 font-sans relative">
       {/* Sistema de Notificação (Toast) */}
       {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

       {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        activePage={activePage} 
        setActivePage={setActivePage} 
        currentUser={currentUser}
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <Header 
            onLogout={handleLogout} 
            onNewTransaction={() => {
                setEditingTransaction(null);
                setIsTransactionModalOpen(true);
            }}
            currentUser={currentUser}
            setActivePage={setActivePage}
            onSearch={setSearchQuery}
            tasks={tasks} 
        >
             <button
              className="md:hidden mr-4 text-gray-500 focus:outline-none"
              onClick={() => setIsSidebarOpen(true)}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
        </Header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-8 relative">
            {activePage === 'Dashboard' && (
                <Dashboard 
                    transactions={transactions} 
                    investments={investments}
                    setActivePage={setActivePage}
                    onEditTransaction={(t) => {
                        setEditingTransaction(t);
                        setIsTransactionModalOpen(true);
                    }}
                    onDeleteTransaction={handleDeleteTransaction}
                    onNewTransaction={() => {
                        setEditingTransaction(null);
                        setIsTransactionModalOpen(true);
                    }}
                    searchQuery={searchQuery}
                />
            )}
            {activePage === 'Transações' && (
                <Transactions 
                    transactions={transactions}
                    onOpenModal={(t) => {
                        setEditingTransaction(t);
                        setIsTransactionModalOpen(true);
                    }}
                    onDeleteTransaction={handleDeleteTransaction}
                    searchQuery={searchQuery}
                />
            )}
            {activePage === 'Agenda' && (
                <Agenda 
                    tasks={tasks}
                    onAddTask={handleAddTask}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={handleDeleteTask}
                />
            )}
            {activePage === 'Investimentos' && (
                <Investments 
                    investments={investments}
                    setInvestments={setInvestments}
                    cdiRate={cdiRate}
                    onSaveInvestment={handleSaveInvestment}
                    onDeleteInvestment={handleDeleteInvestment}
                />
            )}
            {activePage === 'Configurações' && currentUser && (
                <Settings 
                    theme={theme} 
                    setTheme={setTheme}
                    currentUser={currentUser}
                    onUpdatePassword={handleUpdatePassword}
                    onUpdateAvatar={handleUpdateAvatar}
                    onCreateUser={handleCreateUser}
                />
            )}
        </main>
      </div>

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
      />

      {/* Floating WhatsApp Button */}
      <WhatsAppButton />
    </div>
  );
};

export default App;
