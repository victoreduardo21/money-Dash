import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { BellIcon } from './icons/BellIcon';
import { PlusIcon } from './icons/PlusIcon';

interface HeaderProps {
    children?: React.ReactNode;
    onLogout: () => void;
    onNewTransaction: () => void;
}

const Header: React.FC<HeaderProps> = ({ children, onLogout, onNewTransaction }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b-2 border-gray-100 dark:border-gray-700">
      <div className="flex items-center">
        {children}
        <div className="relative mx-4 lg:mx-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-gray-500" />
          </span>
          <input
            className="w-32 sm:w-64 form-input pl-10 pr-4 rounded-full bg-gray-100 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border-transparent focus:border-transparent"
            type="text"
            placeholder="Buscar"
          />
        </div>
      </div>
      <div className="flex items-center">
         <button onClick={onNewTransaction} className="hidden sm:flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nova Transação
        </button>

        <button className="flex mx-4 text-gray-600 dark:text-gray-300 focus:outline-none">
          <BellIcon className="h-6 w-6" />
        </button>

        <div className="relative" ref={profileMenuRef}>
          <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center focus:outline-none">
             <img
                className="h-10 w-10 rounded-full object-cover"
                src="https://i.pravatar.cc/150?u=a042581f4e29026701d"
                alt="Your avatar"
            />
            <div className="hidden md:block ml-3 text-left">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Usuário</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Meu Perfil</p>
            </div>
          </button>
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20">
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Ver Perfil</a>
              <button
                onClick={onLogout}
                className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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