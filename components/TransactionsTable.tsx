
import React from 'react';
import { PersonalTransaction, TransactionType } from '../types';
import { MoreVerticalIcon } from './icons/MoreVerticalIcon';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';

interface TransactionsTableProps {
  transactions: PersonalTransaction[];
  title?: string;
  onEdit?: (transaction: PersonalTransaction) => void;
  onDelete?: (id: string) => void;
  onViewAll?: () => void;
  showViewAllLink?: boolean;
}

const ActionMenu: React.FC<{ transaction: PersonalTransaction; onEdit: any; onDelete: any; }> = ({ transaction, onEdit, onDelete }) => {
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
                        <EditIcon className="h-4 w-4 mr-2" /> Editar
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(transaction.id); setIsOpen(false); }} 
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                        <TrashIcon className="h-4 w-4 mr-2" /> Excluir
                    </button>
                </div>
            )}
        </div>
    );
};

const TransactionsTable: React.FC<TransactionsTableProps> = ({ 
    transactions, 
    title = "Transações",
    onEdit,
    onDelete,
    onViewAll,
    showViewAllLink = false,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-none transition-colors duration-300">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <h4 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h4>
      </div>
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th scope="col" className="px-6 py-4 font-bold">Descrição</th>
              <th scope="col" className="px-6 py-4 font-bold">Valor</th>
              <th scope="col" className="px-6 py-4 font-bold">Data</th>
              <th scope="col" className="px-6 py-4 font-bold">Categoria</th>
              <th scope="col" className="px-6 py-4 font-bold">Tipo</th>
              <th scope="col" className="px-6 py-4 font-bold"><span className="sr-only">Ações</span></th>
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
                  R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4">
                  {new Date(transaction.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                    {transaction.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <TypeBadge type={transaction.type} />
                </td>
                <td className="px-6 py-4 text-right overflow-visible">
                   {onEdit && onDelete && <ActionMenu transaction={transaction} onEdit={onEdit} onDelete={onDelete} />}
                </td>
              </tr>
            ))}
             {transactions.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">Nenhuma transação encontrada.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      {showViewAllLink && onViewAll && (
        <div className="p-4 text-center border-t border-gray-100 dark:border-gray-700">
            <button onClick={onViewAll} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">Ver todas as transações</button>
        </div>
      )}
    </div>
  );
};


const TypeBadge: React.FC<{ type: TransactionType }> = ({ type }) => {
  const baseClasses = 'px-3 py-1 text-xs font-bold rounded-full inline-block border';
  let typeClasses = '';

  switch (type) {
    case TransactionType.Receita:
      typeClasses = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      break;
    case TransactionType.Despesa:
      typeClasses = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      break;
  }

  return <span className={`${baseClasses} ${typeClasses}`}>{type}</span>;
};


export default TransactionsTable;
