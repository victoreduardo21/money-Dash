
import React from 'react';
import TransactionsTable from '../components/TransactionsTable';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PersonalTransaction } from '../types';

interface TransactionsProps {
    transactions: PersonalTransaction[];
    onOpenModal: (transaction: PersonalTransaction | null) => void;
    onDeleteTransaction: (id: string) => void;
    searchQuery: string;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, onOpenModal, onDeleteTransaction, searchQuery }) => {
  
  // Filtragem local
  const filteredTransactions = transactions.filter(t => {
      const lowerQuery = searchQuery.toLowerCase();
      return (
          t.description.toLowerCase().includes(lowerQuery) ||
          t.category.toLowerCase().includes(lowerQuery) ||
          t.type.toLowerCase().includes(lowerQuery) ||
          t.amount.toString().includes(lowerQuery)
      );
  });

  return (
    <div>
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h3 className="text-3xl font-bold text-gray-800">Gerenciar Transações</h3>
             <button onClick={() => onOpenModal(null)} className="flex items-center justify-center bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors duration-200 text-sm font-bold shadow-md hover:shadow-lg">
                <PlusIcon className="h-5 w-5 mr-2" />
                Adicionar Transação
            </button>
        </div>
        
        {/* Container sem overflow-hidden para não cortar o dropdown de ações */}
        <div className="rounded-2xl shadow-xl bg-white border border-gray-200">
            <TransactionsTable 
                transactions={filteredTransactions} 
                title={searchQuery ? `Resultados para "${searchQuery}"` : "Todas as Transações"}
                onEdit={onOpenModal}
                onDelete={onDeleteTransaction}
            />
        </div>
    </div>
  );
};

export default Transactions;
