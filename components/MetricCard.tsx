
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
    <div className="w-full p-7 bg-white dark:bg-gray-800 rounded-[2.2rem] shadow-sm border border-slate-100 dark:border-gray-700 flex items-center justify-between transition-all duration-300 hover:shadow-md min-h-[130px]">
      <div className="flex items-center space-x-5 flex-1 min-w-0">
        <div className="p-4.5 bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-2xl shadow-sm flex-shrink-0 flex items-center justify-center">
            {icon}
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1.5 truncate">{title}</p>
          <p className={`text-3xl font-black tracking-tighter truncate leading-none ${valueClassName || 'text-slate-900 dark:text-white'}`}>{value}</p>
        </div>
      </div>
      {change && changeType && (
        <div className={`ml-3 flex items-center text-[11px] font-black px-3.5 py-2 rounded-full ${isIncrease ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <ChangeIcon className="h-3.5 w-3.5 mr-1" />
            <span>{change}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;