
import React from 'react';
import { DashboardIcon } from './icons/DashboardIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { XIcon } from './icons/XIcon';
import { SwitchHorizontalIcon } from './icons/SwitchHorizontalIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { Page } from '../types';


interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    activePage: Page;
    setActivePage: (page: Page) => void;
}

const NavLink: React.FC<{ 
    icon: React.ReactNode; 
    children: React.ReactNode; 
    active?: boolean;
    onClick: () => void;
}> = ({ icon, children, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
      active
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`}
  >
    {icon}
    <span className="ml-3">{children}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activePage, setActivePage }) => {
    const sidebarClasses = `fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
    
    const handleNavClick = (page: Page) => {
        setActivePage(page);
        if (isOpen) {
            setIsOpen(false);
        }
    }

    return (
    <>
        <div className={sidebarClasses}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Meu<span className="text-blue-600">Fin</span>
                </h1>
                 <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-500">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            <nav className="mt-6 px-4 space-y-2">
                <NavLink 
                    icon={<DashboardIcon className="h-5 w-5" />} 
                    active={activePage === 'Dashboard'}
                    onClick={() => handleNavClick('Dashboard')}
                >
                    Dashboard
                </NavLink>
                <NavLink 
                    icon={<SwitchHorizontalIcon className="h-5 w-5" />}
                    active={activePage === 'Transações'}
                    onClick={() => handleNavClick('Transações')}
                >
                    Transações
                </NavLink>
                <NavLink 
                    icon={<TrendingUpIcon className="h-5 w-5" />}
                    active={activePage === 'Investimentos'}
                    onClick={() => handleNavClick('Investimentos')}
                >
                    Investimentos
                </NavLink>
                <NavLink 
                    icon={<SettingsIcon className="h-5 w-5" />}
                    active={activePage === 'Configurações'}
                    onClick={() => handleNavClick('Configurações')}
                >
                    Configurações
                </NavLink>
            </nav>
        </div>
        {isOpen && (
            <div
                className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"
                onClick={() => setIsOpen(false)}
            ></div>
        )}
    </>
    );
};

export default Sidebar;