
import React from 'react';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, change, changeType }) => {
  const isIncrease = changeType === 'increase';
  const ChangeIcon = isIncrease ? ArrowUpIcon : ArrowDownIcon;

  return (
    // Visual Branco Puro / Escuro com Sombra e Borda
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between transition-transform duration-300 hover:scale-[1.02]">
      <div className="flex items-center space-x-4">
        {/* Fundo do ícone suave para contrastar com o branco/escuro */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl shadow-sm">
            {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
      </div>
      {change && changeType && (
        <div className={`flex items-center text-sm font-bold px-2 py-1 rounded-lg ${isIncrease ? 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
            <ChangeIcon className="h-4 w-4 mr-1" />
            <span>{change}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
