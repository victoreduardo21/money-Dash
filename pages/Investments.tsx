
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Investment, Currency } from '../types';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import InvestmentModal from '../components/InvestmentModal';

interface InvestmentsProps {
    investments: Investment[];
    setInvestments: React.Dispatch<React.SetStateAction<Investment[]>>;
    cdiRate: number; 
    onSaveInvestment: (investment: Omit<Investment, 'id'> & { id?: string }) => void;
    onDeleteInvestment: (id: string) => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const Investments: React.FC<InvestmentsProps> = ({ investments, setInvestments, onSaveInvestment, onDeleteInvestment }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

    const formatCurrency = (value: number, currency: Currency = 'BRL') => {
        if (currency === 'BRL') {
            return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // CÁLCULOS POR MOEDA
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

    const handleSaveInvestment = (investment: Omit<Investment, 'id'> & { id?: string }) => {
        onSaveInvestment(investment);
        setIsModalOpen(false);
    };
    
  return (
    <div>
        <InvestmentModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveInvestment}
            investment={selectedInvestment}
        />

        <div className="flex justify-between items-center mb-6">
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white">Investimentos</h3>
            <button onClick={() => handleOpenModal(null)} className="flex items-center bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg">
                <PlusIcon className="h-5 w-5 mr-1" />
                Novo Ativo
            </button>
        </div>
        
        {/* Resumo Consolidado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">🇧🇷</span> Carteira Real
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Patrimônio</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(stats.totalBrl, 'BRL')}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rendimento</p>
                        <p className={`text-xl font-bold ${stats.rentabilidadeBrl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {stats.rentabilidadeBrl >= 0 ? '+' : ''}{formatCurrency(stats.rentabilidadeBrl, 'BRL')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">🇺🇸</span> Carteira Dólar
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Patrimônio</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(stats.totalUsd, 'USD')}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rendimento</p>
                        <p className={`text-xl font-bold ${stats.rentabilidadeUsd >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {stats.rentabilidadeUsd >= 0 ? '+' : ''}{formatCurrency(stats.rentabilidadeUsd, 'USD')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Listagem de Ativos */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Meus Ativos</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-4">Ativo</th>
                            <th className="px-6 py-4 text-center">Moeda</th>
                            <th className="px-6 py-4 text-right">Valor Atual</th>
                            <th className="px-6 py-4 text-right">Rentabilidade</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {(investments || []).map(inv => {
                            const profit = (inv.currentValue || 0) - (inv.initialAmount || 0);
                            return (
                                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                <TrendingUpIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{inv.name}</p>
                                                <p className="text-xs text-gray-500">{inv.yieldRate}% do CDI/Meta</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold">
                                        {inv.currency === 'BRL' ? '🇧🇷 BRL' : '🇺🇸 USD'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white">
                                        {formatCurrency(inv.currentValue, inv.currency)}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {profit >= 0 ? '+' : ''}{formatCurrency(profit, inv.currency)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(inv)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => onDeleteInvestment(inv.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {(!investments || investments.length === 0) && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Nenhum investimento cadastrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default Investments;
