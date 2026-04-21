
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
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700 animate-fade-in origin-top-right">
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
  
  const isInvestment = (category: string) => {
    const cat = category.toLowerCase().trim();
    return cat.includes('invest') || cat === 'aporte' || cat === 'contribution' || cat === 'resgate';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    if (currentLanguage === 'pt-BR') return `${d}/${m}/${y}`;
    return `${m}/${d}/${y}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm md:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
        <h4 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">{title}</h4>
      </div>

      {/* VIEW MOBILE: CARDS */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="p-4 flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-bold text-gray-900 dark:text-white truncate">{transaction.description}</p>
                <p className="text-[10px] text-gray-500 font-medium">{formatDate(transaction.date)}</p>
              </div>
              {onEdit && onDelete && <ActionMenu transaction={transaction} onEdit={onEdit} onDelete={onDelete} language={currentLanguage} />}
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center gap-2">
                 <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter ${getCategoryColor(transaction.category)}`}>
                    {transaction.category}
                 </span>
                 <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${transaction.currency === 'USD' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {transaction.currency || 'BRL'}
                 </span>
              </div>
              <p className={`font-black text-sm ${
                transaction.type === TransactionType.Receita 
                  ? 'text-green-600 dark:text-green-400' 
                  : isInvestment(transaction.category) 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-red-600 dark:text-red-400'
              }`}>
                {transaction.type === TransactionType.Despesa && '- '}
                {transaction.currency === 'BRL' ? 'R$ ' : '$ '}
                {transaction.amount.toLocaleString(currentLanguage, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="p-10 text-center text-gray-500 text-sm">{t('noTransactions')}</div>
        )}
      </div>

      {/* VIEW DESKTOP: TABLE */}
      <div className="hidden md:block overflow-x-auto min-h-[300px]">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-[10px] text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold">{t('description')}</th>
              <th scope="col" className="px-4 py-3 font-bold">{t('value')}</th>
              <th scope="col" className="px-4 py-3 font-bold">Moeda</th>
              <th scope="col" className="px-4 py-3 font-bold">{t('date')}</th>
              <th scope="col" className="px-4 py-3 font-bold">{t('category')}</th>
              <th scope="col" className="px-4 py-3 font-bold text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                    {transaction.description}
                </td>
                <td className={`px-4 py-3 font-bold ${
                  transaction.type === TransactionType.Receita 
                    ? 'text-green-600 dark:text-green-400' 
                    : isInvestment(transaction.category) 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.type === TransactionType.Despesa && '- '}
                  {transaction.currency === 'BRL' ? 'R$ ' : '$ '}
                  {transaction.amount.toLocaleString(currentLanguage, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${transaction.currency === 'USD' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {transaction.currency || 'BRL'}
                    </span>
                </td>
                <td className="px-4 py-3">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-tighter ${getCategoryColor(transaction.category)}`}>
                    {transaction.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
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
            <button onClick={onViewAll} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors uppercase tracking-widest">{t('viewAll')}</button>
        </div>
      )}
    </div>
  );
};

export default TransactionsTable;
