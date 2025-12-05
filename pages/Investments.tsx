
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

        <h3 className="text-3xl font-bold text-gray-800 mb-6">Investimentos</h3>
        
        {/* Chart & Results - Estilo Branco Puro com Sombra e Borda */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 mb-8">
            <h4 className="text-xl font-bold text-gray-800 mb-6">Resumo da Carteira</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <div className="py-2">
                    <p className="text-sm font-medium text-gray-500">Valor Total Aplicado</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalInvested)}</p>
                </div>
                 <div className="py-2">
                    <p className="text-sm font-medium text-gray-500">Rendimento</p>
                    <p className={`text-2xl font-bold mt-1 ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(totalReturn)}</p>
                </div>
                 <div className="py-2">
                    <p className="text-sm font-medium text-gray-500">Valor Atual da Carteira</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(portfolioValue)}</p>
                </div>
            </div>
            {investments.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                   <PieChart>
                        <Pie
                            data={investments}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="currentValue"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {investments.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value: number) => formatCurrency(value)} 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
                            labelStyle={{color: '#111827', fontWeight: 'bold'}}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                    Adicione um investimento para ver o gráfico de alocação.
                </div>
            )}
        </div>
        
        {/* List - Estilo Branco Puro com Sombra e Borda */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-bold text-gray-800">Minha Carteira</h4>
                <button onClick={() => handleOpenModal(null)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors text-sm font-bold shadow-md hover:shadow-lg">
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Adicionar
                </button>
            </div>
            <ul className="divide-y divide-gray-100">
                {investments.length > 0 ? investments.map(inv => (
                    <li key={inv.id} className="py-5 flex items-center justify-between flex-wrap hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2">
                        <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                            <div className="p-3 bg-indigo-50 rounded-xl">
                                <TrendingUpIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-md font-bold text-gray-900">{inv.name}</p>
                                <p className="text-sm text-gray-500">Rendimento: {inv.yieldRate}% do CDI</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
                            <div className="text-right">
                                <p className="text-md font-bold text-gray-900">{formatCurrency(inv.currentValue)}</p>
                                <p className={`text-sm font-medium ${inv.currentValue - inv.initialAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>{inv.currentValue - inv.initialAmount >= 0 ? '+' : ''}{formatCurrency(inv.currentValue - inv.initialAmount)}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => handleOpenModal(inv)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
                                    <EditIcon className="h-5 w-5" />
                                </button>
                                <button onClick={() => onDeleteInvestment(inv.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </li>
                )) : (
                    <p className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">Nenhum investimento na carteira.</p>
                )}
            </ul>
        </div>
    </div>
  );
};

export default Investments;
