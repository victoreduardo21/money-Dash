
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Investment } from '../types';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

const Investments: React.FC<InvestmentsProps> = ({ investments, setInvestments, onSaveInvestment, onDeleteInvestment }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

    const formatCurrency = (value: number) => {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const { totalInvested, portfolioValue, totalReturn } = useMemo(() => {
        const totalInvested = investments.reduce((acc, inv) => acc + inv.initialAmount, 0);
        const portfolioValue = investments.reduce((acc, inv) => acc + inv.currentValue, 0);
        const totalReturn = portfolioValue - totalInvested;
        return { totalInvested, portfolioValue, totalReturn };
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

        <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Investimentos</h3>
        
        {/* Chart & Results */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
            <h4 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">Resumo da Carteira</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-center">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Valor Total Aplicado</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(totalInvested)}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rendimento</p>
                    <p className={`text-lg font-bold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(totalReturn)}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Valor Atual da Carteira</p>
                    <p className="text-lg font-bold text-blue-500">{formatCurrency(portfolioValue)}</p>
                </div>
            </div>
            {investments.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                   <PieChart>
                        <Pie
                            data={investments}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="currentValue"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {investments.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', border: 'none', borderRadius: '0.5rem' }} labelStyle={{color: '#F9FAFB'}}/>
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Adicione um investimento para ver o gráfico de alocação.
                </div>
            )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-semibold text-gray-700 dark:text-white">Minha Carteira</h4>
                <button onClick={() => handleOpenModal(null)} className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Adicionar
                </button>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {investments.length > 0 ? investments.map(inv => (
                    <li key={inv.id} className="py-4 flex items-center justify-between flex-wrap">
                        <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                                <TrendingUpIcon className="h-6 w-6 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-md font-semibold text-gray-800 dark:text-white">{inv.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Rendimento: {inv.yieldRate}% do CDI</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                            <div className="text-right">
                                <p className="text-md font-bold text-gray-800 dark:text-white">{formatCurrency(inv.currentValue)}</p>
                                <p className={`text-sm ${inv.currentValue - inv.initialAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>{inv.currentValue - inv.initialAmount >= 0 ? '+' : ''}{formatCurrency(inv.currentValue - inv.initialAmount)}</p>
                            </div>
                            <button onClick={() => handleOpenModal(inv)} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <EditIcon className="h-5 w-5" />
                            </button>
                             <button onClick={() => onDeleteInvestment(inv.id)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </li>
                )) : (
                    <p className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum investimento na carteira.</p>
                )}
            </ul>
        </div>
    </div>
  );
};

export default Investments;