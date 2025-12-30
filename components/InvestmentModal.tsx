
import React, { useState, useEffect } from 'react';
import { Investment, Currency, Language } from '../types';
import { XIcon } from './icons/XIcon';
import { useTranslation } from '../translations';

interface InvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (investment: Omit<Investment, 'id'> & { id?: string }) => Promise<void> | void;
    investment: Investment | null;
    language: Language;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ isOpen, onClose, onSave, investment, language }) => {
    const t = useTranslation(language);
    const [name, setName] = useState('');
    const [initialAmount, setInitialAmount] = useState(0);
    const [currentValue, setCurrentValue] = useState(0);
    const [yieldRate, setYieldRate] = useState(100);
    const [currency, setCurrency] = useState<Currency>('BRL');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsSubmitting(false);
            if (investment) {
                setName(investment.name); setInitialAmount(investment.initialAmount); setCurrentValue(investment.currentValue); setYieldRate(investment.yieldRate); setCurrency(investment.currency || 'BRL');
            } else {
                setName(''); setInitialAmount(0); setCurrentValue(0); setYieldRate(100); setCurrency('BRL');
            }
        }
    }, [investment, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); if (isSubmitting) return; setIsSubmitting(true);
        try { await onSave({ id: investment?.id, name, initialAmount, currentValue, yieldRate, currency }); } catch (error) { setIsSubmitting(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-center backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{investment ? t('edit') : t('newAsset')}</h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon className="h-6 w-6" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Currency</label><select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="w-full p-2.5 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-white font-bold"><option value="BRL">🇧🇷 BRL</option><option value="USD">🇺🇸 USD</option></select></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('name')}</label><input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2.5 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-white" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('invested')}</label><input type="number" step="0.01" value={initialAmount} onChange={e => setInitialAmount(Number(e.target.value))} required className="w-full p-2.5 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-white font-bold" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('current')}</label><input type="number" step="0.01" value={currentValue} onChange={e => setCurrentValue(Number(e.target.value))} required className="w-full p-2.5 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-white font-bold text-blue-600" /></div>
                        </div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('yieldRate')}</label><input type="number" value={yieldRate} onChange={e => setYieldRate(Number(e.target.value))} required className="w-full p-2.5 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-700 dark:text-white" /></div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500">{t('cancel')}</button>
                        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700">{isSubmitting ? t('saving') : t('save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvestmentModal;
