
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Investments from './pages/Investments';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';
import TransactionModal from './components/TransactionModal';
import { MenuIcon } from './components/icons/MenuIcon';
import { PersonalTransaction, Investment, User, Page, Theme } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');

  // Load user and token from localStorage if available to persist session on refresh
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const savedUser = localStorage.getItem('user_data');
      return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));

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

             // 3. ATUALIZA DADOS DO PERFIL (Para garantir que Foto, CPF e Tel estejam sincronizados)
             const userProfile = await api.getMe(token);
             if (userProfile && !userProfile.error) {
                 setCurrentUser(userProfile);
                 localStorage.setItem('user_data', JSON.stringify(userProfile));
             }
        };
        fetchData();
    }
  }, [token]);

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
  };

  const handleSaveTransaction = async (transaction: Omit<PersonalTransaction, 'id'> & { id?: string }) => {
    if (!token) return;
    
    if (transaction.id) {
         const txId = transaction.id;
         setTransactions(prev => prev.map(t => t.id === txId ? { ...transaction, id: txId } as PersonalTransaction : t));
    } else {
        await api.createTransaction(transaction, token);
        const txs = await api.getTransactions(token);
        setTransactions(txs);
    }
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
     if (!token) return;
     if (window.confirm("Tem certeza que deseja excluir esta transação permanentemente?")) {
         // Atualiza UI otimista
         setTransactions(prev => prev.filter(t => t.id !== id));
         
         // Chama API
         const result = await api.deleteTransaction(id, token);
         if (result.error) {
             alert(result.message);
             // Reverte se der erro (opcional, aqui estamos apenas recarregando)
             const txs = await api.getTransactions(token);
             setTransactions(txs);
         }
     }
  };

  const handleSaveInvestment = async (investment: Omit<Investment, 'id'> & { id?: string }) => {
      if (!token) return;
      if (investment.id) {
          const invId = investment.id;
          setInvestments(prev => prev.map(i => i.id === invId ? { ...investment, id: invId } as Investment : i));
      } else {
          await api.createInvestment(investment, token);
          const invs = await api.getInvestments(token);
          setInvestments(invs);
      }
  };

  const handleDeleteInvestment = async (id: string) => {
      if (!token) return;
      if (window.confirm("Tem certeza que deseja excluir este investimento permanentemente?")) {
          setInvestments(prev => prev.filter(i => i.id !== id));
          
          const result = await api.deleteInvestment(id, token);
          if (result.error) {
              alert(result.message);
              const invs = await api.getInvestments(token);
              setInvestments(invs);
          }
      }
  }
  
  const handleUpdatePassword = async (current: string, newPass: string) => {
      if(token) await api.updatePassword({currentPassword: current, newPassword: newPass}, token);
      alert("Senha atualizada (se as credenciais estavam corretas).");
  };

  const handleUpdateAvatar = async (avatar: string) => {
      if (token) {
          await api.updateAvatar({avatar}, token);
          if (currentUser) {
              const updatedUser = { ...currentUser, avatar };
              setCurrentUser(updatedUser);
              localStorage.setItem('user_data', JSON.stringify(updatedUser));
          }
      }
  };

  const handleCreateUser = async (newUser: Omit<User, 'id'>) => {
     return await api.createUser(newUser);
  };

  if (!token) {
      return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans`}>
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
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            onLogout={handleLogout} 
            onNewTransaction={() => {
                setEditingTransaction(null);
                setIsTransactionModalOpen(true);
            }}
            currentUser={currentUser}
            setActivePage={setActivePage}
        >
             <button
              className="md:hidden mr-4 text-gray-500 focus:outline-none"
              onClick={() => setIsSidebarOpen(true)}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
        </Header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
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
    </div>
  );
};

export default App;
