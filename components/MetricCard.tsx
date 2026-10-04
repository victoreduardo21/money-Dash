
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
  subtitle?: React.ReactNode;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  changeType, 
  valueClassName,
  subtitle,
  onClick 
}) => {
  const isIncrease = changeType === 'increase';
  const ChangeIcon = isIncrease ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div 
      onClick={onClick}
      className={`p-4 md:p-5 bg-white dark:bg-gray-800 rounded-[1.25rem] md:rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col justify-between transition-all duration-300 hover:shadow-md ${onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-gray-600' : ''}`}
    >
      <div className="flex items-center space-x-3 md:space-x-4">
        <div className="p-2.5 md:p-3 bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600 rounded-xl shadow-sm flex-shrink-0">
            {icon}
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-[10px] md:text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.1em] mb-0.5 md:mb-1 truncate">{title}</p>
          <p className={`text-lg md:text-xl lg:text-2xl font-black tracking-tighter truncate ${valueClassName || 'text-slate-900 dark:text-white'}`}>{value}</p>
        </div>
        {change && changeType && (
          <div className={`hidden sm:flex items-center text-[10px] font-bold px-2 py-1 rounded-full ${isIncrease ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <ChangeIcon className="h-3 w-3 mr-1" />
              <span>{change}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-gray-700/80">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default MetricCard;