
import React, { useState, useEffect } from 'react';
import { PersonalTransaction, TransactionType, Currency } from '../types';
import { XIcon } from './icons/XIcon';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Omit<PersonalTransaction, 'id'> & { id?: string }) => Promise<void> | void;
    transaction: PersonalTransaction | null;
}

const CATEGORIES = ["Alimentação", "Moradia", "Transporte", "Saúde", "Lazer", "Educação", "Salário", "Aporte", "Investimentos", "Câmbio", "Serviços", "Outros"];

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave, transaction }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [currency, setCurrency] = useState<Currency>('BRL');
    const [date, setDate] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.Despesa);
    const [category, setCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsSubmitting(false);
            if (transaction) {
                setDescription(transaction.description);
                setAmount(transaction.amount);
                setCurrency(transaction.currency || 'BRL');
                setDate(transaction.date);
                setType(transaction.type);
                setCategory(transaction.category);
            } else {
                setDescription('');
                setAmount(0);
                setCurrency('BRL');
                setDate(new Date().toISOString().split('T')[0]);
                setType(TransactionType.Despesa);
                setCategory('');
            }
        }
    }, [transaction, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSave({
                id: transaction?.id,
                description,
                amount,
                currency,
                date,
                type,
                category,
            });
        } catch (error) {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-center backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {transaction ? 'Editar Movimentação' : 'Nova Movimentação'}
                        </h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                                <select value={type} onChange={e => setType(e.target.value as TransactionType)} className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                    <option value={TransactionType.Despesa}>Despesa</option>
                                    <option value={TransactionType.Receita}>Receita</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Moeda</label>
                                <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold">
                                    <option value="BRL">🇧🇷 Real (BRL)</option>
                                    <option value="USD">🇺🇸 Dólar (USD)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">{currency === 'BRL' ? 'R$' : '$'}</span>
                                <input type="number" step="0.01" value={amount} onChange={e => setAmount(Number(e.target.value))} required className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                                <input list="cats" value={category} onChange={e => setCategory(e.target.value)} required className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                <datalist id="cats">{CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;
