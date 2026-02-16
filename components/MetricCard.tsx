
import React from 'react';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'increase' | 'decrease';
  valueClassName?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, change, changeType, valueClassName }) => {
  const isIncrease = changeType === 'increase';
  const ChangeIcon = isIncrease ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-700 flex items-center space-x-4 md:space-x-5 transition-all duration-300 hover:shadow-md">
      <div className="p-3 md:p-4 bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-2xl shadow-sm flex-shrink-0">
          {icon}
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="text-[10px] md:text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.1em] mb-0.5 md:mb-1 truncate">{title}</p>
        <p className={`text-xl md:text-2xl lg:text-3xl font-black tracking-tighter truncate ${valueClassName || 'text-slate-900 dark:text-white'}`}>{value}</p>
      </div>
      {change && changeType && (
        <div className={`hidden sm:flex items-center text-[10px] font-bold px-2 py-1 rounded-full ${isIncrease ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <ChangeIcon className="h-3 w-3 mr-1" />
            <span>{change}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;