
import React, { useState, useMemo } from 'react';
import { XIcon } from './icons/XIcon';
import { Currency } from '../types';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveTransfer: (data: { fromCurrency: Currency, toCurrency: Currency, amountFrom: number, amountTo: number, rate: number }) => Promise<void>;
}

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, onSaveTransfer }) => {
    const [fromCurrency, setFromCurrency] = useState<Currency>('BRL');
    const [toCurrency, setToCurrency] = useState<Currency>('USD');
    const [amountFrom, setAmountFrom] = useState<number>(0);
    const [rate, setRate] = useState<number>(5.50); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    // CÁLCULO DINÂMICO DO VALOR A RECEBER
    const amountTo = useMemo(() => {
        if (!amountFrom || !rate || rate <= 0) return 0;
        
        // Se vou de REAL para DÓLAR: Divido o real pela taxa (ex: R$ 500 / 5.0 = $ 100)
        if (fromCurrency === 'BRL' && toCurrency === 'USD') {
            return amountFrom / rate;
        }
        // Se vou de DÓLAR para REAL: Multiplico o dólar pela taxa (ex: $ 100 * 5.0 = R$ 500)
        if (fromCurrency === 'USD' && toCurrency === 'BRL') {
            return amountFrom * rate;
        }
        return amountFrom;
    }, [fromCurrency, toCurrency, amountFrom, rate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amountFrom <= 0) return;
        setIsSubmitting(true);
        try {
            await onSaveTransfer({
                fromCurrency,
                toCurrency,
                amountFrom,
                amountTo: Number(amountTo.toFixed(2)),
                rate
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Câmbio e Transferência</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Mova saldo entre suas carteiras</p>
                        </div>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {/* Seleção de Moedas */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Origem</label>
                                <select 
                                    value={fromCurrency} 
                                    onChange={(e) => {
                                        const val = e.target.value as Currency;
                                        setFromCurrency(val);
                                        setToCurrency(val === 'BRL' ? 'USD' : 'BRL');
                                    }}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="BRL">🇧🇷 Real (BRL)</option>
                                    <option value="USD">🇺🇸 Dólar (USD)</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Destino</label>
                                <div className="w-full p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold text-sm">
                                    {toCurrency === 'BRL' ? '🇧🇷 Real (BRL)' : '🇺🇸 Dólar (USD)'}
                                </div>
                            </div>
                        </div>

                        {/* Valor de Saída */}
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quanto você quer enviar?</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-lg">
                                    {fromCurrency === 'BRL' ? 'R$' : '$'}
                                </span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={amountFrom || ''}
                                    onChange={(e) => setAmountFrom(Number(e.target.value))}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-2xl font-black focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0,00"
                                    required
                                />
                            </div>
                        </div>

                        {/* Taxa e Resultado */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Cotação Atual (1 USD =)</span>
                                <div className="flex items-center bg-white dark:bg-gray-700 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-700 shadow-sm">
                                    <span className="text-xs text-gray-400 mr-1">R$</span>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={rate}
                                        onChange={(e) => setRate(Number(e.target.value))}
                                        className="w-16 text-right bg-transparent font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="h-px bg-indigo-100 dark:bg-indigo-800 w-full"></div>

                            <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Você vai receber</span>
                                    <p className="text-[10px] text-indigo-400 dark:text-indigo-500 uppercase font-bold tracking-widest">Saldo em {toCurrency}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                                        {toCurrency === 'BRL' ? 'R$ ' : '$ '}
                                        {amountTo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-3">
                        <button 
                            type="submit" 
                            disabled={isSubmitting || amountFrom <= 0}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Processando...' : 'Confirmar e Converter'}
                        </button>
                        <button type="button" onClick={onClose} className="w-full text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-2">
                            CANCELAR OPERAÇÃO
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransferModal;
