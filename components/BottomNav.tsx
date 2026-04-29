
import React from 'react';
import { DashboardIcon } from './icons/DashboardIcon';
import { SwitchHorizontalIcon } from './icons/SwitchHorizontalIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { Sparkles, CreditCard, RefreshCw } from 'lucide-react';
import { Page, Language } from '../types';
import { useTranslation } from '../translations';

interface BottomNavProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
    language: Language;
    isFreePlan: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, setActivePage, language, isFreePlan }) => {
    const t = useTranslation(language);

    const navItems: { page: Page; icon: React.ReactNode; label: string; protected?: boolean }[] = [
        { page: 'Dashboard', icon: <DashboardIcon className="w-6 h-6" />, label: t('dashboard') },
        { page: 'Transações', icon: <SwitchHorizontalIcon className="w-6 h-6" />, label: t('transactions') },
        { page: 'Assinaturas', icon: <RefreshCw className="w-6 h-6" />, label: t('subscriptions') },
        { page: 'Créditos', icon: <CreditCard className="w-6 h-6" />, label: t('credits') },
        { page: 'Investimentos', icon: <TrendingUpIcon className="w-6 h-6" />, label: t('investments'), protected: true },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-2 flex justify-around items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            {navItems.map((item) => {
                if (item.protected && isFreePlan) return null;
                const isActive = activePage === item.page;
                return (
                    <button
                        key={item.page}
                        onClick={() => setActivePage(item.page)}
                        className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${
                            isActive 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                    >
                        <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            {item.icon}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter truncate max-w-[70px]">
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default BottomNav;
