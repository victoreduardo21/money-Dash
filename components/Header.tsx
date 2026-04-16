
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { BellIcon } from './icons/BellIcon';
import { PlusIcon } from './icons/PlusIcon';
import { MenuIcon } from './icons/MenuIcon';
import { User, CalendarEvent, Page, Language } from '../types';
import { ClockIcon } from './icons/ClockIcon';

interface HeaderProps {
    onLogout: () => void;
    onNewTransaction: () => void;
    currentUser: User | null;
    setActivePage: (page: Page) => void;
    onSearch: (query: string) => void;
    tasks: CalendarEvent[];
    language: Language;
    onLanguageChange: (lang: Language) => void;
    toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, onNewTransaction, currentUser, setActivePage, onSearch, tasks, language, onLanguageChange, toggleSidebar }) => {
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const notifications = useMemo(() => {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const pending = (tasks || []).filter(task => !task.done && task.date <= todayStr);
      return pending.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [tasks]);

  const userInitials = useMemo(() => {
      const name = currentUser?.name || 'U';
      const parts = name.trim().split(' ');
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [currentUser]);

  return (
    <header className="flex items-center justify-between px-4 py-2 md:px-6 md:py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 z-40 transition-colors sticky top-0">
      {/* Lado Esquerdo: Menu Burger */}
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="p-2 -ml-2 text-gray-400 hover:text-blue-600 transition-colors lg:hidden">
            <MenuIcon className="h-7 w-7" />
        </button>

        {/* Busca: Oculta no mobile para focar no layout de App */}
        <div className="relative hidden lg:block ml-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-4 w-4 text-gray-400" />
          </span>
          <input
            className="w-48 xl:w-64 pl-9 pr-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            type="text"
            placeholder={language === 'pt-BR' ? "Buscar..." : "Search..."}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
      
      {/* Lado Direito: Ações rápidas igual à imagem 2 */}
      <div className="flex items-center gap-2 md:gap-4">
         {/* Botão de Nova Transação Circular no Mobile */}
         <button 
            onClick={onNewTransaction} 
            className="flex items-center justify-center bg-blue-600 text-white w-10 h-10 md:w-auto md:h-auto md:px-5 md:py-2.5 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-90"
          >
            <PlusIcon className="h-6 w-6 md:mr-2" />
            <span className="hidden md:inline font-bold text-sm">Nova Transação</span>
        </button>

        {/* Notificações */}
        <div className="relative" ref={notificationsMenuRef}>
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 text-gray-400 hover:text-blue-600 relative">
                <BellIcon className="h-7 w-7" />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-100 animate-fade-in origin-top-right overflow-hidden">
                    <div className="px-4 py-3 border-b bg-gray-50/50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                        Notificações
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Tudo em dia!</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(item => (
                                    <button key={item.id} onClick={() => { setActivePage('Agenda'); setIsNotificationsOpen(false); }} className="w-full text-left p-3 hover:bg-blue-50 flex gap-3 items-start">
                                        <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><ClockIcon className="w-4 h-4" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800 truncate">{item.description}</p>
                                            <p className="text-[10px] text-red-500 font-black mt-0.5 uppercase">{new Date(item.date).toLocaleDateString(language, {timeZone: 'UTC'})}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Perfil Circle com iniciais */}
        <div className="relative" ref={profileMenuRef}>
          <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center h-10 w-10 md:h-11 md:w-11 rounded-full bg-blue-50 border-2 border-blue-100 text-blue-700 font-bold justify-center transition-transform active:scale-95 shadow-sm">
              <span className="text-sm md:text-base">{userInitials}</span>
          </button>
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl py-2 z-50 border border-gray-100 animate-fade-in origin-top-right">
              <button onClick={() => {setActivePage('Configurações'); setIsProfileMenuOpen(false);}} className="w-full text-left block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                  Configurações
              </button>
              <div className="h-px bg-gray-100 my-1 mx-2"></div>
              <button onClick={onLogout} className="w-full text-left block px-4 py-2.5 text-xs font-black text-red-600 uppercase tracking-wider">
                  Sair da Conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
