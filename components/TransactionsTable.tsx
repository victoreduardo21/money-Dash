
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
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors">
                <MoreVerticalIcon className="h-5 w-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <button onClick={() => { onEdit(transaction); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <EditIcon className="h-4 w-4 mr-2" /> Editar
                    </button>
                    <button onClick={() => { onDelete(transaction.id); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
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
    <div className="bg-white rounded-xl shadow-none"> {/* Shadow removida aqui pois o container pai já tem */}
      <div className="p-6 border-b border-gray-100">
        <h4 className="text-xl font-bold text-gray-800">{title}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
            <tr>
              <th scope="col" className="px-6 py-4 font-bold">Descrição</th>
              <th scope="col" className="px-6 py-4 font-bold">Valor</th>
              <th scope="col" className="px-6 py-4 font-bold">Data</th>
              <th scope="col" className="px-6 py-4 font-bold">Categoria</th>
              <th scope="col" className="px-6 py-4 font-bold">Tipo</th>
              <th scope="col" className="px-6 py-4 font-bold"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="bg-white hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900">
                    {transaction.description}
                </td>
                <td className={`px-6 py-4 font-bold ${transaction.type === TransactionType.Receita ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === TransactionType.Despesa && '- '}
                  R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4">
                  {new Date(transaction.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200">
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
                    <td colSpan={6} className="text-center py-8 text-gray-500">Nenhuma transação encontrada.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      {showViewAllLink && onViewAll && (
        <div className="p-4 text-center border-t border-gray-100">
            <button onClick={onViewAll} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">Ver todas as transações</button>
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
      typeClasses = 'bg-green-50 text-green-700 border-green-200';
      break;
    case TransactionType.Despesa:
      typeClasses = 'bg-red-50 text-red-700 border-red-200';
      break;
  }

  return <span className={`${baseClasses} ${typeClasses}`}>{type}</span>;
};


export default TransactionsTable;
