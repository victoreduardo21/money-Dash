
import React from 'react';
import { PersonalTransaction, TransactionType, Language } from '../types';
import { MoreVerticalIcon } from './icons/MoreVerticalIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useTranslation } from '../translations';


interface TransactionsTableProps {
  transactions: PersonalTransaction[];
  title?: string;
  onEdit?: (transaction: PersonalTransaction) => void;
  onDelete?: (id: string) => void;
  onViewAll?: () => void;
  showViewAllLink?: boolean;
  language?: Language;
}

const ActionMenu: React.FC<{ transaction: PersonalTransaction; onEdit: any; onDelete: any; language: Language }> = ({ transaction, onEdit, onDelete, language }) => {
    const t = useTranslation(language);
    const [isOpen, setIsOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} 
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <MoreVerticalIcon className="h-5 w-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(transaction); setIsOpen(false); }} 
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <EditIcon className="h-4 w-4 mr-2" /> {t('edit')}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); setIsOpen(false); }} 
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                        <TrashIcon className="h-4 w-4 mr-2" /> {t('delete')}
                    </button>
                </div>
            )}
        </div>
    );
};

const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase().trim();
    if (cat.includes('invest') || cat === 'aporte') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
    if (cat.includes('alimen') || cat.includes('food')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    if (cat.includes('lazer') || cat.includes('leisure')) return 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400 border-pink-200 dark:border-pink-800';
    if (cat.includes('saúde') || cat.includes('health')) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ 
    transactions, 
    title = "Transações",
    onEdit,
    onDelete,
    onViewAll,
    showViewAllLink = false,
    language = 'pt-BR'
}) => {
  const currentLanguage = language as Language;
  const t = useTranslation(currentLanguage);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-none transition-colors duration-300">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <h4 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h4>
      </div>
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th scope="col" className="px-6 py-4 font-bold">{t('description')}</th>
              <th scope="col" className="px-6 py-4 font-bold">{t('value')}</th>
              <th scope="col" className="px-6 py-4 font-bold">{t('language') === 'Idioma' ? 'Moeda' : 'Currency'}</th>
              <th scope="col" className="px-6 py-4 font-bold">{t('date')}</th>
              <th scope="col" className="px-6 py-4 font-bold">{t('category')}</th>
              <th scope="col" className="px-6 py-4 font-bold text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                    {transaction.description}
                </td>
                <td className={`px-6 py-4 font-bold ${transaction.type === TransactionType.Receita ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {transaction.type === TransactionType.Despesa && '- '}
                  {transaction.currency === 'BRL' ? 'R$ ' : '$ '}
                  {transaction.amount.toLocaleString(currentLanguage, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${transaction.currency === 'USD' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {transaction.currency || 'BRL'}
                    </span>
                </td>
                <td className="px-6 py-4">
                  {new Date(transaction.date).toLocaleDateString(currentLanguage, {timeZone: 'UTC'})}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-tighter ${getCategoryColor(transaction.category)}`}>
                    {transaction.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                   {onEdit && onDelete && <ActionMenu transaction={transaction} onEdit={onEdit} onDelete={onDelete} language={currentLanguage} />}
                </td>
              </tr>
            ))}
             {transactions.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">{t('noTransactions')}</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      {showViewAllLink && onViewAll && (
        <div className="p-4 text-center border-t border-gray-100 dark:border-gray-700">
            <button onClick={onViewAll} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">{t('viewAll')}</button>
        </div>
      )}
    </div>
  );
};

export default TransactionsTable;
