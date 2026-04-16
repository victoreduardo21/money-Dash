
import React, { useState, useMemo } from 'react';
import { Investment, Currency, Language } from '../types';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ArrowDownIcon } from '../components/icons/ArrowDownIcon';
import InvestmentModal from '../components/InvestmentModal';
import { useTranslation } from '../translations';

interface InvestmentsProps {
    investments: Investment[];
    setInvestments: React.Dispatch<React.SetStateAction<Investment[]>>;
    onSaveInvestment: (investment: Omit<Investment, 'id'> & { id?: string }) => void;
    onDeleteInvestment: (id: string) => void;
    onWithdrawInvestment: (id: string) => void;
    language: Language;
}

const Investments: React.FC<InvestmentsProps> = ({ investments, onSaveInvestment, onDeleteInvestment, onWithdrawInvestment, language }) => {
    const t = useTranslation(language);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

    const formatCurrency = (value: number, currency: Currency = 'BRL') => {
        if (currency === 'BRL') {
            return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const stats = useMemo(() => {
        const brl = (investments || []).filter(i => i.currency === 'BRL');
        const usd = (investments || []).filter(i => i.currency === 'USD');

        return {
            totalBrl: brl.reduce((acc, i) => acc + (i.currentValue || 0), 0),
            rentabilidadeBrl: brl.reduce((acc, i) => acc + ((i.currentValue || 0) - (i.initialAmount || 0)), 0),
            totalUsd: usd.reduce((acc, i) => acc + (i.currentValue || 0), 0),
            rentabilidadeUsd: usd.reduce((acc, i) => acc + ((i.currentValue || 0) - (i.initialAmount || 0)), 0)
        };
    }, [investments]);

    const handleOpenModal = (investment: Investment | null) => {
        setSelectedInvestment(investment);
        setIsModalOpen(true);
    };

    const handleWithdraw = (inv: Investment) => {
        const confirmMsg = language === 'pt-BR' 
            ? `Deseja retirar ${formatCurrency(inv.currentValue, inv.currency)} de "${inv.name}"? O valor será adicionado ao seu saldo disponível.`
            : `Do you want to withdraw ${formatCurrency(inv.currentValue, inv.currency)} from "${inv.name}"? The amount will be added to your available balance.`;
        
        if (window.confirm(confirmMsg)) {
            onWithdrawInvestment(inv.id);
        }
    };

    return (
    <div>
        <InvestmentModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={(inv) => { onSaveInvestment(inv); setIsModalOpen(false); }}
            investment={selectedInvestment}
            language={language}
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{t('investments')}</h3>
            <button onClick={() => handleOpenModal(null)} className="w-full md:w-auto flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all font-bold text-xs shadow-md">
                <PlusIcon className="h-4 w-4 mr-1" />
                {t('newAsset')}
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-6">
            <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h4 className="text-base md:text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">🇧🇷</span> {t('brlWallet')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">{t('netWorth')}</p>
                        <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(stats.totalBrl, 'BRL')}</p>
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">{t('yield')}</p>
                        <p className={`text-base md:text-xl font-bold ${stats.rentabilidadeBrl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {stats.rentabilidadeBrl >= 0 ? '+' : ''}{formatCurrency(stats.rentabilidadeBrl, 'BRL')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h4 className="text-base md:text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">🇺🇸</span> {t('usdWallet')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">{t('netWorth')}</p>
                        <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(stats.totalUsd, 'USD')}</p>
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">{t('yield')}</p>
                        <p className={`text-base md:text-xl font-bold ${stats.rentabilidadeUsd >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {stats.rentabilidadeUsd >= 0 ? '+' : ''}{formatCurrency(stats.rentabilidadeUsd, 'USD')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700">
                <h4 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">{t('myAssets')}</h4>
            </div>

            {/* MOBILE ASSETS VIEW */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                {(investments || []).map(inv => {
                    const profit = (inv.currentValue || 0) - (inv.initialAmount || 0);
                    return (
                        <div key={inv.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                                        <TrendingUpIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{inv.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-black">{inv.currency === 'BRL' ? '🇧🇷 BRL' : '🇺🇸 USD'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleOpenModal(inv)} className="p-2 text-gray-400"><EditIcon className="w-5 h-5" /></button>
                                    <button onClick={() => onDeleteInvestment(inv.id)} className="p-2 text-gray-400"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            </div>
                            <div className="flex justify-between items-end bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl">
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('currentValue')}</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(inv.currentValue, inv.currency)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('yield')}</p>
                                    <p className={`text-sm font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {profit >= 0 ? '+' : ''}{formatCurrency(profit, inv.currency)}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleWithdraw(inv)} 
                                className="w-full py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-xs font-black uppercase tracking-widest border border-green-100 dark:border-green-800"
                            >
                                Resgatar Valor
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* DESKTOP ASSETS VIEW */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3">{t('asset')}</th>
                            <th className="px-4 py-3 text-center">Moeda</th>
                            <th className="px-4 py-3 text-right">{t('currentValue')}</th>
                            <th className="px-4 py-3 text-right">{t('yield')}</th>
                            <th className="px-4 py-3 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {(investments || []).map(inv => {
                            const profit = (inv.currentValue || 0) - (inv.initialAmount || 0);
                            return (
                                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                <TrendingUpIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{inv.name}</p>
                                                <p className="text-[10px] text-gray-500">{inv.yieldRate}% CDI/Meta</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-xs">
                                        {inv.currency === 'BRL' ? '🇧🇷 BRL' : '🇺🇸 USD'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-white">
                                        {formatCurrency(inv.currentValue, inv.currency)}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {profit >= 0 ? '+' : ''}{formatCurrency(profit, inv.currency)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleWithdraw(inv)} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold hover:bg-green-600 hover:text-white transition-all border border-green-100 dark:border-green-800">
                                                <ArrowDownIcon className="w-3 h-3" />
                                                Retirar
                                            </button>
                                            <button onClick={() => handleOpenModal(inv)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><EditIcon className="w-5 h-5" /></button>
                                            <button onClick={() => onDeleteInvestment(inv.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    );
};

export default Investments;
