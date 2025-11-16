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
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <MoreVerticalIcon className="h-5 w-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border dark:border-gray-700">
                    <button onClick={() => { onEdit(transaction); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <EditIcon className="h-4 w-4 mr-2" /> Editar
                    </button>
                    <button onClick={() => { onDelete(transaction.id); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <h4 className="text-xl font-semibold text-gray-700 dark:text-white">{title}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Descrição</th>
              <th scope="col" className="px-6 py-3">Valor</th>
              <th scope="col" className="px-6 py-3">Data</th>
              <th scope="col" className="px-6 py-3">Categoria</th>
              <th scope="col" className="px-6 py-3">Tipo</th>
              <th scope="col" className="px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                    {transaction.description}
                </td>
                <td className={`px-6 py-4 font-semibold ${transaction.type === TransactionType.Receita ? 'text-green-500' : 'text-red-500'}`}>
                  {transaction.type === TransactionType.Despesa && '- '}
                  R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4">
                  {new Date(transaction.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
                    {transaction.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <TypeBadge type={transaction.type} />
                </td>
                <td className="px-6 py-4 text-right">
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
        <div className="p-4 text-center border-t dark:border-gray-700">
            <button onClick={onViewAll} className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">Ver todas as transações</button>
        </div>
      )}
    </div>
  );
};


const TypeBadge: React.FC<{ type: TransactionType }> = ({ type }) => {
  const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full inline-block';
  let typeClasses = '';

  switch (type) {
    case TransactionType.Receita:
      typeClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      break;
    case TransactionType.Despesa:
      typeClasses = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      break;
  }

  return <span className={`${baseClasses} ${typeClasses}`}>{type}</span>;
};


export default TransactionsTable;