
import React, { useState, useEffect } from 'react';
import { Investment } from '../types';
import { XIcon } from './icons/XIcon';

interface InvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (investment: Omit<Investment, 'id'> & { id?: string }) => Promise<void> | void;
    investment: Investment | null;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ isOpen, onClose, onSave, investment }) => {
    const [name, setName] = useState('');
    const [initialAmount, setInitialAmount] = useState(0);
    const [currentValue, setCurrentValue] = useState(0);
    const [yieldRate, setYieldRate] = useState(100);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsSubmitting(false);
            if (investment) {
                setName(investment.name);
                setInitialAmount(investment.initialAmount);
                setCurrentValue(investment.currentValue);
                setYieldRate(investment.yieldRate);
            } else {
                setName('');
                setInitialAmount(0);
                setCurrentValue(0);
                setYieldRate(100);
            }
        }
    }, [investment, isOpen]);
    
    useEffect(() => {
        // For new investments, keep currentValue in sync with initialAmount unless manually changed
        if (!investment) {
            setCurrentValue(initialAmount);
        }
    }, [initialAmount, investment]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            await onSave({
                id: investment?.id,
                name,
                initialAmount,
                currentValue,
                yieldRate,
            });
        } catch (error) {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                            {investment ? 'Editar Investimento' : 'Adicionar Investimento'}
                        </h3>
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="inv-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Investimento</label>
                            <input type="text" id="inv-name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                        <div>
                            <label htmlFor="inv-initialAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor Aplicado (R$)</label>
                            <input type="number" step="0.01" id="inv-initialAmount" value={initialAmount} onChange={e => setInitialAmount(Number(e.target.value))} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                         <div>
                            <label htmlFor="inv-currentValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor Atual (R$)</label>
                            <input type="number" step="0.01" id="inv-currentValue" value={currentValue} onChange={e => setCurrentValue(Number(e.target.value))} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                        <div>
                            <label htmlFor="inv-yieldRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rendimento (% do CDI)</label>
                            <input type="number" id="inv-yieldRate" value={yieldRate} onChange={e => setYieldRate(Number(e.target.value))} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold text-sm disabled:opacity-50">Cancelar</button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                             {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Salvando...
                                </>
                            ) : (
                                'Salvar'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvestmentModal;
