
import React from 'react';
import { DashboardIcon } from './icons/DashboardIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { XIcon } from './icons/XIcon';
import { SwitchHorizontalIcon } from './icons/SwitchHorizontalIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { Page, User } from '../types';


interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    activePage: Page;
    setActivePage: (page: Page) => void;
    currentUser: User | null;
    onUpgrade?: () => void; // Nova prop opcional para realizar o upgrade
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

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, activePage, setActivePage, currentUser, onUpgrade }) => {
    // Definindo a cor de fundo fixa para combinar com o Login (#020617)
    const sidebarClasses = `fixed inset-y-0 left-0 z-30 w-64 bg-[#020617] border-r border-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;
    
    // Verifica o plano
    const isFreePlan = currentUser?.plan === 'FREE';

    const handleNavClick = (page: Page) => {
        setActivePage(page);
        if (isOpen) {
            setIsOpen(false);
        }
    }

    return (
    <>
        <div className={sidebarClasses}>
            {/* LOGO AREA */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-white tracking-tight leading-none">
                            Fin<span className="text-blue-500">Dash</span>
                        </h1>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">
                            {currentUser?.plan || 'FREE'}
                        </span>
                    </div>
                </div>
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
                    
                    {/* Feature Gating: Agenda e Investimentos só aparecem se NÃO for Free */}
                    {!isFreePlan && (
                        <>
                            <NavLink 
                                icon={<CalendarIcon className="h-5 w-5" />}
                                active={activePage === 'Agenda'}
                                onClick={() => handleNavClick('Agenda')}
                            >
                                Agenda
                            </NavLink>
                            <NavLink 
                                icon={<TrendingUpIcon className="h-5 w-5" />}
                                active={activePage === 'Investimentos'}
                                onClick={() => handleNavClick('Investimentos')}
                            >
                                Investimentos
                            </NavLink>
                        </>
                    )}
                </nav>

                {/* Upsell box for Free users */}
                {isFreePlan && (
                    <div className="mx-4 mt-6 p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 animate-pulse">
                        <p className="text-xs text-blue-400 font-bold uppercase mb-2">Faça o Upgrade</p>
                        <p className="text-xs text-gray-400 mb-3">Libere Investimentos e Agenda com o plano PRO.</p>
                        <button 
                            onClick={onUpgrade}
                            className="w-full py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                        >
                            Assinar PRO
                        </button>
                    </div>
                )}

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

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-[#020617]">
                <div className="flex items-center">
                    <div className="ml-3">
                        <p className="text-xs font-medium text-gray-500">Versão 2.1.0</p>
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
