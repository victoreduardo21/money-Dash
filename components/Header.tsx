
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { BellIcon } from './icons/BellIcon';
import { PlusIcon } from './icons/PlusIcon';
import { User, CalendarEvent } from '../types';
import { Page } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { CalendarIcon } from './icons/CalendarIcon';


interface HeaderProps {
    children?: React.ReactNode;
    onLogout: () => void;
    onNewTransaction: () => void;
    currentUser: User | null;
    setActivePage: (page: Page) => void;
    onSearch: (query: string) => void;
    tasks: CalendarEvent[]; // Recebe as tarefas para gerar notificações
}

const Header: React.FC<HeaderProps> = ({ children, onLogout, onNewTransaction, currentUser, setActivePage, onSearch, tasks }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleViewProfile = () => {
      setActivePage('Configurações');
      setIsProfileMenuOpen(false);
  }

  // Lógica de Notificações: Tarefas não concluídas que são de HOJE ou ANTERIORES (Atrasadas)
  const notifications = useMemo(() => {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const pending = tasks.filter(task => {
          if (task.done) return false;
          
          let taskDate = task.date;
          if (taskDate.includes('T')) taskDate = taskDate.split('T')[0];

          // Retorna verdadeiro se for hoje ou data passada (menor ou igual a hoje)
          return taskDate <= today;
      });

      // Ordena: Atrasadas primeiro, depois as de hoje
      return pending.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tasks]);

  return (
    // Header Branco com sombra suave
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b border-gray-200 z-10">
      <div className="flex items-center">
        {children}
        <div className="relative mx-4 lg:mx-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            className="w-32 sm:w-64 form-input pl-10 pr-4 rounded-full bg-gray-100 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-transparent focus:border-transparent transition-all"
            type="text"
            placeholder="Buscar receitas, despesas..."
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center">
         <button onClick={onNewTransaction} className="hidden sm:flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-md hover:shadow-lg">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nova Transação
        </button>

        <div className="relative mx-4" ref={notificationsMenuRef}>
            <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                className="flex text-gray-500 hover:text-blue-600 transition-colors focus:outline-none relative"
            >
                <BellIcon className="h-6 w-6" />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                        {notifications.length}
                    </span>
                )}
            </button>
            {isNotificationsOpen && (
                 <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-20 border border-gray-200 animate-fade-in">
                    <div className="py-3 px-4 text-sm font-bold text-gray-800 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <span>Lembretes Pendentes</span>
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{notifications.length}</span>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm">
                                <p>Tudo em dia! 🎉</p>
                                <p className="text-xs mt-1">Nenhuma tarefa pendente para hoje.</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const today = new Date().toISOString().split('T')[0];
                                let notifDate = notif.date;
                                if(notifDate.includes('T')) notifDate = notifDate.split('T')[0];
                                const isLate = notifDate < today;

                                return (
                                    <div 
                                        key={notif.id} 
                                        onClick={() => {
                                            setActivePage('Agenda');
                                            setIsNotificationsOpen(false);
                                        }}
                                        className="flex items-start px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        {isLate ? (
                                            <ClockIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <CalendarIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                                        )}
                                        
                                        <div>
                                            <p className={`text-sm font-medium ${isLate ? 'text-red-600' : 'text-gray-800'}`}>
                                                {notif.description}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {isLate ? 'Atrasado - Era para ' : 'Para hoje - '}
                                                {new Date(notif.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <button 
                            onClick={() => {
                                setActivePage('Agenda');
                                setIsNotificationsOpen(false);
                            }}
                            className="w-full block text-center py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 border-t border-gray-100 transition-colors"
                        >
                            Ver Agenda Completa
                        </button>
                    )}
                </div>
            )}
        </div>

        <div className="relative" ref={profileMenuRef}>
          <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center focus:outline-none group">
             <img
                className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-500 transition-colors"
                src={currentUser?.avatar || `https://i.pravatar.cc/150?u=${currentUser?.email}`}
                alt="Your avatar"
            />
            <div className="hidden md:block ml-3 text-left">
                <p className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{currentUser?.name || 'Usuário'}</p>
                <p className="text-xs text-gray-500">Meu Perfil</p>
            </div>
          </button>
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-100">
              <button onClick={handleViewProfile} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Ver Perfil</button>
              <button
                onClick={onLogout}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
