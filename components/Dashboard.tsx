
import React, { useMemo } from 'react';
import MetricCard from '../components/MetricCard';
import TransactionsTable from '../components/TransactionsTable';
import { MOCK_PERSONAL_TRANSACTIONS, MOCK_CHART_DATA, MOCK_INVESTMENTS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSignIcon } from '../components/icons/DollarSignIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { ArrowUpIcon } from '../components/icons/ArrowUpIcon';
import { ArrowDownIcon } from '../components/icons/ArrowDownIcon';
import { TransactionType } from '../types';

const Dashboard: React.FC = () => {
    
  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const { receitas, despesas, saldo } = useMemo(() => {
    const receitas = MOCK_PERSONAL_TRANSACTIONS.filter(t => t.type === TransactionType.Receita).reduce((acc, t) => acc + t.amount, 0);
    const despesas = MOCK_PERSONAL_TRANSACTIONS.filter(t => t.type === TransactionType.Despesa).reduce((acc, t) => acc + t.amount, 0);
    const saldo = receitas - despesas;
    return { receitas, despesas, saldo };
  }, []);

  const totalInvestido = useMemo(() => {
      return MOCK_INVESTMENTS.reduce((acc, inv) => acc + inv.currentValue, 0);
  }, []);
    
  return (
    <div>
      <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Dashboard Pessoal</h3>

      {/* Metric Cards */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Saldo Atual"
          value={formatCurrency(saldo)}
          icon={<DollarSignIcon className="h-8 w-8 text-blue-500" />}
        />
        <MetricCard
          title="Receitas (Mês)"
          value={formatCurrency(receitas)}
          icon={<ArrowUpIcon className="h-8 w-8 text-green-500" />}
        />
        <MetricCard
          title="Despesas (Mês)"
          value={formatCurrency(despesas)}
          icon={<ArrowDownIcon className="h-8 w-8 text-red-500" />}
        />
        <MetricCard
          title="Total Investido"
          value={formatCurrency(totalInvestido)}
          icon={<TrendingUpIcon className="h-8 w-8 text-indigo-500" />}
        />
      </div>

      {/* Chart and Recent Transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h4 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Visão Geral Mensal</h4>
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={MOCK_CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis tickFormatter={(value) => formatCurrency(Number(value))} stroke="#9CA3AF" />
                    <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                            backgroundColor: 'rgba(31, 41, 55, 0.9)', 
                            border: 'none', 
                            borderRadius: '0.5rem'
                        }}
                        labelStyle={{color: '#F9FAFB'}}
                    />
                    <Legend />
                    <Bar dataKey="Receitas" fill="#22C55E" name="Receitas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Despesas" fill="#EF4444" name="Despesas" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8">
        <TransactionsTable transactions={MOCK_PERSONAL_TRANSACTIONS.slice(0, 5)} title="Últimas Transações" />
      </div>
    </div>
  );
};

export default Dashboard;
