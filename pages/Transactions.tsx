import React from 'react';
import TransactionsTable from '../components/TransactionsTable';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PersonalTransaction } from '../types';

interface TransactionsProps {
    transactions: PersonalTransaction[];
    onOpenModal: (transaction: PersonalTransaction | null) => void;
    onDeleteTransaction: (id: string) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, onOpenModal, onDeleteTransaction }) => {
  return (
    <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciar Transações</h3>
             <button onClick={() => onOpenModal(null)} className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
                <PlusIcon className="h-5 w-5 mr-2" />
                Adicionar Transação
            </button>
        </div>
        
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <p className="text-gray-600 dark:text-gray-300">Filtros e busca avançada serão adicionados aqui.</p>
        </div>


        <TransactionsTable 
            transactions={transactions} 
            title="Todas as Transações"
            onEdit={onOpenModal}
            onDelete={onDeleteTransaction}
        />
    </div>
  );
};

export default Transactions;