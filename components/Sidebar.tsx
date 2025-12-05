
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
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-left mb-1 ${
      active
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-3">{children}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activePage, setActivePage }) => {
    // Definindo a cor de fundo fixa para combinar com o Login (#020617)
    // Removemos a variação dark:bg-gray-800 para manter a identidade visual azul escuro
    const sidebarClasses = `fixed inset-y-0 left-0 z-30 w-64 bg-[#020617] border-r border-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
    
    const handleNavClick = (page: Page) => {
        setActivePage(page);
        if (isOpen) {
            setIsOpen(false);
        }
    }

    return (
    <>
        <div className={sidebarClasses}>
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-white">
                    Meu<span className="text-blue-500">Fin</span>
                </h1>
                 <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            
            <div className="px-4 py-6">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Menu Principal
                </p>
                <nav className="space-y-1">
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
                </nav>

                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-8 mb-4">
                    Sistema
                </p>
                <nav className="space-y-1">
                    <NavLink 
                        icon={<SettingsIcon className="h-5 w-5" />}
                        active={activePage === 'Configurações'}
                        onClick={() => handleNavClick('Configurações')}
                    >
                        Configurações
                    </NavLink>
                </nav>
            </div>

            {/* User Info / Footer da Sidebar (Opcional para dar um charme) */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-[#020617]">
                <div className="flex items-center">
                    <div className="ml-3">
                        <p className="text-xs font-medium text-gray-500">Versão 1.0.0</p>
                    </div>
                </div>
            </div>
        </div>
        {isOpen && (
            <div
                className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
                onClick={() => setIsOpen(false)}
            ></div>
        )}
    </>
    );
};

export default Sidebar;
