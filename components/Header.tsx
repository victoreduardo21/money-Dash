
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { BellIcon } from './icons/BellIcon';
import { PlusIcon } from './icons/PlusIcon';
import { User, CalendarEvent, Page, Language } from '../types';
import { ClockIcon } from './icons/ClockIcon';

interface HeaderProps {
    children?: React.ReactNode;
    onLogout: () => void;
    onNewTransaction: () => void;
    currentUser: User | null;
    setActivePage: (page: Page) => void;
    onSearch: (query: string) => void;
    tasks: CalendarEvent[];
    language: Language;
    onLanguageChange: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ children, onLogout, onNewTransaction, currentUser, setActivePage, onSearch, tasks, language, onLanguageChange }) => {
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
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 z-30 transition-colors duration-300">
      <div className="flex items-center flex-1">
        {children}
        <div className="relative mx-4 lg:mx-0 hidden sm:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            className="w-32 sm:w-64 form-input pl-10 pr-4 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            type="text"
            placeholder={language === 'pt-BR' ? "Buscar..." : "Search..."}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
         {/* Seletor de Idioma */}
         <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-700 rounded-full p-1 border border-gray-200 dark:border-gray-600 mr-2">
            <button 
                onClick={() => onLanguageChange('pt-BR')} 
                className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${language === 'pt-BR' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-400'}`}
                title="Português"
            >
                PT
            </button>
            <button 
                onClick={() => onLanguageChange('en-US')} 
                className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${language === 'en-US' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-400'}`}
                title="English"
            >
                EN
            </button>
         </div>

         <button onClick={onNewTransaction} className="hidden lg:flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-md">
            <PlusIcon className="h-5 w-5 mr-2" />
            {language === 'pt-BR' ? "Nova Transação" : "New Transaction"}
        </button>

        {/* NOTIFICATIONS DROPDOWN */}
        <div className="relative mx-2 sm:mx-4" ref={notificationsMenuRef}>
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="flex text-gray-500 dark:text-gray-300 hover:text-blue-600 transition-colors focus:outline-none relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <BellIcon className="h-6 w-6" />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-800">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl py-2 z-50 border border-gray-100 dark:border-gray-700 animate-fade-in origin-top-right overflow-hidden">
                    <div className="px-4 py-3 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-500">{language === 'pt-BR' ? 'Notificações' : 'Notifications'}</span>
                        {notifications.length > 0 && <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">{notifications.length}</span>}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center">
                                <BellIcon className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                                <p className="text-sm text-gray-400 font-medium">{language === 'pt-BR' ? 'Tudo em dia por aqui!' : 'Everything is up to date!'}</p>
                            </div>
                        ) : (
                            <div className="divide-y dark:divide-gray-700">
                                {notifications.map(item => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => { setActivePage('Agenda'); setIsNotificationsOpen(false); }}
                                        className="w-full text-left p-4 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors flex gap-4 items-start group"
                                    >
                                        <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center">
                                            <ClockIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.description}</p>
                                            <p className="text-[10px] text-red-500 font-black mt-0.5 uppercase tracking-tighter">
                                                {language === 'pt-BR' ? 'Vencido em: ' : 'Due on: '} 
                                                {new Date(item.date).toLocaleDateString(language, {timeZone: 'UTC'})}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => { setActivePage('Agenda'); setIsNotificationsOpen(false); }}
                        className="w-full py-3 text-center text-[10px] font-black text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors uppercase tracking-widest border-t dark:border-gray-700"
                    >
                        {language === 'pt-BR' ? 'Ver agenda completa' : 'View full agenda'}
                    </button>
                </div>
            )}
        </div>

        <div className="relative" ref={profileMenuRef}>
          <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center focus:outline-none group">
             <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-200 font-bold border-2 border-blue-200 dark:border-blue-700 transition-transform group-hover:scale-105">
                {userInitials}
             </div>
          </button>
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-1 z-50 border border-gray-100 dark:border-gray-700 animate-fade-in origin-top-right">
              <button onClick={() => {setActivePage('Configurações'); setIsProfileMenuOpen(false);}} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">
                  {language === 'pt-BR' ? 'Configurações' : 'Settings'}
              </button>
              <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2"></div>
              <button onClick={onLogout} className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold">
                  {language === 'pt-BR' ? 'Sair' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
