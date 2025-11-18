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

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cdiRate, setCdiRate] = useState(0);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PersonalTransaction | null>(null);

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
  
  const handleLogin = (user: User) => {
      setCurrentUser(user);
  };

  const handleLogout = () => {
      setCurrentUser(null);
      // Clean up state on logout
      setTransactions([]);
      setInvestments([]);
      setActivePage('Dashboard');
  };

  const handlePasswordUpdate = (newPassword: string) => {
    if (!currentUser) return;
    
    const usersJson = localStorage.getItem('fin-dash-users');
    if (usersJson) {
      const users: User[] = JSON.parse(usersJson);
      const userIndex = users.findIndex(u => u.email === currentUser.email);
      if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('fin-dash-users', JSON.stringify(users));
        setCurrentUser(users[userIndex]);
        alert("Senha alterada com sucesso!");
      }
    }
  };

  const handleAvatarUpdate = (avatar: string) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, avatar };
    setCurrentUser(updatedUser);

    const usersJson = localStorage.getItem('fin-dash-users');
    if (usersJson) {
        const users: User[] = JSON.parse(usersJson);
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex] = updatedUser;
            localStorage.setItem('fin-dash-users', JSON.stringify(users));
        }
    }
  };

  const handleCreateUser = async (newUser: Omit<User, 'id'>): Promise<{success: boolean, message: string}> => {
    const usersJson = localStorage.getItem('fin-dash-users');
    const users: User[] = usersJson ? JSON.parse(usersJson) : [];

    const userExists = users.some(user => user.email === newUser.email);

    if (userExists) {
      return { success: false, message: 'Este email já está em uso.' };
    }

    users.push(newUser);
    localStorage.setItem('fin-dash-users', JSON.stringify(users));
    return { success: true, message: 'Usuário criado com sucesso!' };
  };

  const handleOpenTransactionModal = (transaction: PersonalTransaction | null) => {
    setSelectedTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = (transaction: Omit<PersonalTransaction, 'id'> & { id?: string }) => {
    if (transaction.id) {
        // Edit
        setTransactions(transactions.map(t => t.id === transaction.id ? { ...t, ...transaction } as PersonalTransaction : t));
    } else {
        // Add
        const newTransaction: PersonalTransaction = {
            ...transaction,
            id: `TRX${new Date().getTime()}`,
        };
        setTransactions([newTransaction, ...transactions]);
    }
    setIsTransactionModalOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
      if(window.confirm("Tem certeza que deseja excluir esta transação?")) {
          setTransactions(transactions.filter(t => t.id !== id));
      }
  };

  const handleSaveInvestment = (investment: Omit<Investment, 'id'> & { id?: string }) => {
    if (investment.id) {
        // Edit existing investment
        setInvestments(investments.map(inv => inv.id === investment.id ? { ...inv, ...investment } as Investment : inv));
    } else {
        // Add new investment
        const newId = `INV${new Date().getTime()}`;
        const newInvestment: Investment = {
            ...investment,
            id: newId,
        };
        setInvestments([...investments, newInvestment]);

        // Create corresponding Expense Transaction to deduct from balance
        const newTransaction: PersonalTransaction = {
            id: `TRX-INV-${newId}`,
            description: `Aplicação: ${investment.name}`,
            amount: investment.initialAmount,
            date: new Date().toISOString().split('T')[0],
            type: TransactionType.Despesa,
            category: 'Investimentos'
        };
        setTransactions([newTransaction, ...transactions]);
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

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-6 py-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
    </>
  );
};

export default App;