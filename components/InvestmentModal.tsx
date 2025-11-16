import React, { useState, useEffect } from 'react';
import { Investment } from '../types';
import { XIcon } from './icons/XIcon';

interface InvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (investment: Omit<Investment, 'id'> & { id?: string }) => void;
    investment: Investment | null;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ isOpen, onClose, onSave, investment }) => {
    const [name, setName] = useState('');
    const [initialAmount, setInitialAmount] = useState(0);
    const [currentValue, setCurrentValue] = useState(0);
    const [yieldRate, setYieldRate] = useState(100);

    useEffect(() => {
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
    }, [investment, isOpen]);
    
    useEffect(() => {
        // For new investments, keep currentValue in sync with initialAmount unless manually changed
        if (!investment) {
            setCurrentValue(initialAmount);
        }
    }, [initialAmount, investment]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: investment?.id,
            name,
            initialAmount,
            currentValue,
            yieldRate,
        });
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
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
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
                        <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold text-sm">Cancelar</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvestmentModal;