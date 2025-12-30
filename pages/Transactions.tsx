
import React, { useMemo } from 'react';
import TransactionsTable from '../components/TransactionsTable';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PersonalTransaction, Currency, Language } from '../types';
import { useTranslation } from '../translations';

interface TransactionsProps {
    transactions: PersonalTransaction[];
    onOpenModal: (transaction: PersonalTransaction | null) => void;
    onDeleteTransaction: (id: string) => void;
    searchQuery: string;
    language: Language;
    selectedCurrency: Currency;
    onCurrencyChange: (currency: Currency) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, onOpenModal, onDeleteTransaction, searchQuery, language, selectedCurrency, onCurrencyChange }) => {
  const t = useTranslation(language);
  
  const filteredTransactions = useMemo(() => {
    const query = (searchQuery || '').trim().toLowerCase();
    
    return transactions.filter(t => {
        const matchCurrency = t.currency === selectedCurrency;
        
        if (!query) return matchCurrency;

        const descriptionMatch = (t.description || '').toLowerCase().includes(query);
        const categoryMatch = (t.category || '').toLowerCase().includes(query);
        const amountMatch = (t.amount || 0).toString().includes(query);

        return matchCurrency && (descriptionMatch || categoryMatch || amountMatch);
    });
  }, [transactions, selectedCurrency, searchQuery]);

  return (
    <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{t('transactions')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'pt-BR' 
                        ? `Pesquise e gerencie suas movimentações em ${selectedCurrency}`
                        : `Search and manage your transactions in ${selectedCurrency}`}
                </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex gap-1">
                    <button 
                        onClick={() => onCurrencyChange('BRL')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'BRL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        BRL
                    </button>
                    <button 
                        onClick={() => onCurrencyChange('USD')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'USD' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        USD
                    </button>
                </div>

                <button 
                    onClick={() => onOpenModal(null)} 
                    className="flex-1 md:flex-none flex items-center justify-center bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors duration-200 text-sm font-bold shadow-lg"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {t('add')}
                </button>
            </div>
        </div>
        
        <div className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <TransactionsTable 
                transactions={filteredTransactions} 
                title={searchQuery ? `${language === 'pt-BR' ? 'Resultados para' : 'Results for'} "${searchQuery}" (${selectedCurrency})` : `${t('history')} (${selectedCurrency})`}
                onEdit={onOpenModal}
                onDelete={onDeleteTransaction}
                language={language}
            />
        </div>
    </div>
  );
};

export default Transactions;
