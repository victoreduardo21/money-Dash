
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
  const changeColor = isIncrease ? 'text-green-500' : 'text-red-500';
  const ChangeIcon = isIncrease ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
            {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
      </div>
      {change && changeType && (
        <div className={`flex items-center text-sm font-semibold ${changeColor}`}>
            <ChangeIcon className="h-4 w-4 mr-1" />
            <span>{change}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
