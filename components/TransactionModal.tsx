
import React, { useState, useEffect } from 'react';
import { PersonalTransaction, TransactionType } from '../types';
import { XIcon } from './icons/XIcon';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<PersonalTransaction, 'id'> & { id?: string }) => void;
    transaction: PersonalTransaction | null;
}

const CATEGORIES = [
    "Alimentação",
    "Moradia",
    "Transporte",
    "Saúde",
    "Lazer",
    "Educação",
    "Salário",
    "Aporte", // Adicionado Aporte
    "Investimentos",
    "Serviços",
    "Outros"
];

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave, transaction }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.Despesa);
    const [category, setCategory] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (transaction) {
                setDescription(transaction.description);
                setAmount(transaction.amount);
                setDate(transaction.date);
                setType(transaction.type);
                setCategory(transaction.category);
            } else {
                setDescription('');
                setAmount(0);
                setDate(new Date().toISOString().split('T')[0]);
                setType(TransactionType.Despesa);
                setCategory('');
            }
        }
    }, [transaction, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount || !date || !category) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        onSave({
            id: transaction?.id,
            description,
            amount,
            date,
            type,
            category,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                            {transaction ? 'Editar Transação' : 'Adicionar Transação'}
                        </h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="trans-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                            <select id="trans-type" value={type} onChange={e => setType(e.target.value as TransactionType)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200">
                                <option value={TransactionType.Despesa}>Despesa</option>
                                <option value={TransactionType.Receita}>Receita</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="trans-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                            <input type="text" id="trans-description" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Ex: Mercado, Salário" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                        <div>
                            <label htmlFor="trans-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor (R$)</label>
                            <input type="number" step="0.01" id="trans-amount" value={amount} onChange={e => setAmount(Number(e.target.value))} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                        <div>
                            <label htmlFor="trans-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    id="trans-category" 
                                    list="category-suggestions"
                                    value={category} 
                                    onChange={e => setCategory(e.target.value)} 
                                    required 
                                    placeholder="Selecione ou digite..."
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" 
                                />
                                <datalist id="category-suggestions">
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="trans-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data</label>
                            <input type="date" id="trans-date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold text-sm">Cancelar</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;
