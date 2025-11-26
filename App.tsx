
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
import { PersonalTransaction, Investment, User, Page, Theme, TransactionType } from './types';
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
  const [selectedTransaction, setSelectedTransaction] = useState<PersonalTransaction | null>(null);

  // Fetch initial data when user logs in (has token)
  useEffect(() => {
    if (token) {
        const loadData = async () => {
            try {
                const txs = await api.getTransactions(token);
                if (txs && !txs.error) {
                    setTransactions(txs);
                } else {
                    console.error("Erro ao carregar transações", txs);
                }

                const invs = await api.getInvestments(token);
                if (invs && !invs.error) {
                    setInvestments(invs);
                } else {
                    console.error("Erro ao carregar investimentos", invs);
                }
            } catch (error) {
                console.error("Erro de conexão ao carregar dados", error);
            }
        };
        loadData();
    }
  }, [token]);

  useEffect(() => {
    // Fetch real-time CDI rate
    const fetchCdiRate = async () => {
      try {
        const response = await fetch('https://brasilapi.com.br/api/taxas/v1/cdi');
        const data = await response.json();
        if (data && data.valor) {
            setCdiRate(data.valor);
        } else {
            console.error("Failed to fetch CDI rate, using fallback.");
            setCdiRate(10.50); // Fallback
        }
      } catch (error) {
        console.error("Error fetching CDI rate:", error);
        setCdiRate(10.50); // Fallback on error
      }
    };
    if (currentUser) {
        fetchCdiRate();
    }
  }, [currentUser]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const handleLogin = (user: User, authToken: string) => {
      setCurrentUser(user);
      setToken(authToken);
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user_data', JSON.stringify(user));
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      setTransactions([]);
      setInvestments([]);
      setActivePage('Dashboard');
  };

  const handlePasswordUpdate = async (currentPassword: string, newPassword: string) => {
    if (!token) return;
    try {
        const result = await api.updatePassword({ currentPassword, newPassword }, token);
        if (result.error) {
            alert(result.message || "Erro ao atualizar senha.");
        } else {
            alert("Senha alterada com sucesso!");
        }
    } catch (e) {
        alert("Erro de conexão.");
    }
  };

  const handleAvatarUpdate = async (avatar: string) => {
    if (!currentUser || !token) return;

    try {
        const result = await api.updateAvatar({ avatar }, token);
        if (result.error) {
            alert(result.message || "Erro ao atualizar avatar.");
        } else {
            const updatedUser = { ...currentUser, avatar };
            setCurrentUser(updatedUser);
            localStorage.setItem('user_data', JSON.stringify(updatedUser));
        }
    } catch (e) {
        alert("Erro de conexão ao atualizar avatar.");
    }
  };

  const handleCreateUser = async (newUser: Omit<User, 'id'>): Promise<{success: boolean, message: string}> => {
    try {
        const result = await api.createUser(newUser);
        if (result.error) {
            return { success: false, message: result.message || 'Erro ao criar usuário.' };
        }
        return { success: true, message: 'Usuário criado com sucesso!' };
    } catch (e) {
        return { success: false, message: 'Erro de conexão.' };
    }
  };

  const handleOpenTransactionModal = (transaction: PersonalTransaction | null) => {
    setSelectedTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = async (transaction: Omit<PersonalTransaction, 'id'> & { id?: string }) => {
    if (transaction.id) {
        // Edit (Not fully supported by backend MVP yet, updating locally)
        setTransactions(transactions.map(t => t.id === transaction.id ? { ...t, ...transaction } as PersonalTransaction : t));
        alert("Nota: A edição está salva apenas localmente nesta versão.");
    } else {
        // Add
        if (token) {
            try {
                await api.createTransaction(transaction as PersonalTransaction, token);
                // Refresh list
                const txs = await api.getTransactions(token);
                if (!txs.error) setTransactions(txs);
            } catch (e) {
                alert("Erro ao salvar transação no servidor.");
            }
        }
    }
    setIsTransactionModalOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
      if(window.confirm("Tem certeza que deseja excluir esta transação? (Apenas localmente nesta versão)")) {
          setTransactions(transactions.filter(t => t.id !== id));
      }
  };

  const handleSaveInvestment = async (investment: Omit<Investment, 'id'> & { id?: string }) => {
    if (investment.id) {
        // Edit
        setInvestments(investments.map(inv => inv.id === investment.id ? { ...inv, ...investment } as Investment : inv));
        alert("Nota: A edição está salva apenas localmente nesta versão.");
    } else {
        // Add
        if (token) {
             try {
                // The backend automatically creates the expense transaction when creating an investment
                await api.createInvestment(investment as Investment, token);
                
                // Refresh both lists
                const invs = await api.getInvestments(token);
                if (!invs.error) setInvestments(invs);

                const txs = await api.getTransactions(token);
                if (!txs.error) setTransactions(txs);

            } catch (e) {
                alert("Erro ao salvar investimento no servidor.");
            }
        }
    }
  };

  if (!currentUser) {
      return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard 
                    transactions={transactions} 
                    investments={investments} 
                    setActivePage={setActivePage}
                    onEditTransaction={handleOpenTransactionModal}
                    onDeleteTransaction={handleDeleteTransaction}
                    onNewTransaction={() => handleOpenTransactionModal(null)}
                />;
      case 'Transações':
        return <Transactions 
                    transactions={transactions} 
                    onOpenModal={handleOpenTransactionModal}
                    onDeleteTransaction={handleDeleteTransaction}
                />;
      case 'Investimentos':
        return <Investments 
                    investments={investments} 
                    setInvestments={setInvestments}
                    cdiRate={cdiRate}
                    onSaveInvestment={handleSaveInvestment}
                />;
      case 'Configurações':
        return <Settings 
                    theme={theme} 
                    setTheme={setTheme} 
                    currentUser={currentUser}
                    onUpdatePassword={handlePasswordUpdate}
                    onUpdateAvatar={handleAvatarUpdate}
                    onCreateUser={handleCreateUser}
                />;
      default:
        return <Dashboard 
                    transactions={transactions} 
                    investments={investments} 
                    setActivePage={setActivePage}
                    onEditTransaction={handleOpenTransactionModal}
                    onDeleteTransaction={handleDeleteTransaction}
                    onNewTransaction={() => handleOpenTransactionModal(null)}
                />;
    }
  };

  return (
    <>
    <TransactionModal 
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={selectedTransaction}
    />
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            onLogout={handleLogout} 
            onNewTransaction={() => handleOpenTransactionModal(null)} 
            currentUser={currentUser}
            setActivePage={setActivePage}
        >
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden text-gray-500 dark:text-gray-300 focus:outline-none"
            >
                <MenuIcon className="h-6 w-6" />
            </button>
        </Header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-800 flex flex-col">
          <div className="container mx-auto px-6 py-8">
            {renderContent()}
          </div>
          <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>&copy; 2024 GTS - Global Tech Software</p>
            <p>Todos os direitos reservados</p>
          </footer>
        </main>
      </div>
    </div>
    </>
  );
};

export default App;
