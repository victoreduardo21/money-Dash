import React, { useMemo } from 'react';
import MetricCard from '../components/MetricCard';
import TransactionsTable from '../components/TransactionsTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSignIcon } from '../components/icons/DollarSignIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { ArrowUpIcon } from '../components/icons/ArrowUpIcon';
import { ArrowDownIcon } from '../components/icons/ArrowDownIcon';
import { PersonalTransaction, TransactionType, Investment, Page } from '../types';
import WelcomeBanner from '../components/WelcomeBanner';

interface DashboardProps {
    transactions: PersonalTransaction[];
    investments: Investment[];
    setActivePage: (page: Page) => void;
    onEditTransaction: (transaction: PersonalTransaction) => void;
    onDeleteTransaction: (id: string) => void;
    onNewTransaction: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, investments, setActivePage, onEditTransaction, onDeleteTransaction, onNewTransaction }) => {
    
  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const { receitas, despesas, saldo } = useMemo(() => {
    const receitas = transactions.filter(t => t.type === TransactionType.Receita).reduce((acc, t) => acc + t.amount, 0);
    const despesas = transactions.filter(t => t.type === TransactionType.Despesa).reduce((acc, t) => acc + t.amount, 0);
    const saldo = receitas - despesas;
    return { receitas, despesas, saldo };
  }, [transactions]);

  const totalInvestido = useMemo(() => {
      return investments.reduce((acc, inv) => acc + inv.currentValue, 0);
  }, [investments]);

  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(month => ({ name: month, Receitas: 0, Despesas: 0 }));

    transactions.forEach(transaction => {
      // Adding 'T00:00:00' ensures the date is parsed in the local timezone, avoiding off-by-one day errors.
      const monthIndex = new Date(transaction.date + 'T00:00:00').getMonth();
      if (transaction.type === TransactionType.Receita) {
        data[monthIndex].Receitas += transaction.amount;
      } else {
        data[monthIndex].Despesas += transaction.amount;
      }
    });

    return data;
  }, [transactions]);
    
  return (
    <div>
      <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Dashboard Pessoal</h3>

      {transactions.length === 0 ? (
        <WelcomeBanner onActionClick={onNewTransaction} />
      ) : (
        <>
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

          {/* Chart */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h4 className="text-xl font-semibold text-gray-700 dark:text-white mb-4">Visão Geral Mensal</h4>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyChartData}>
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
            <TransactionsTable 
                transactions={transactions.slice(0, 5)} 
                title="Últimas Transações"
                showViewAllLink={true}
                onViewAll={() => setActivePage('Transações')}
                onEdit={onEditTransaction}
                onDelete={onDeleteTransaction}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;