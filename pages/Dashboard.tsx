
import React, { useMemo, useState } from 'react';
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
    searchQuery: string;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, investments, setActivePage, onEditTransaction, onDeleteTransaction, onNewTransaction, searchQuery }) => {
    
  // Estado para o filtro de mês (Padrão: Mês atual no formato YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Helper para identificar categorias de investimento/aporte
  const isInvestmentCategory = (category: string) => {
      const cat = category.toLowerCase().trim();
      return cat === 'investimentos' || cat === 'investimento' || cat === 'aporte' || cat === 'aportes';
  };

  // 1. SALDO GLOBAL (Mantemos a lógica original aqui para refletir o dinheiro em conta real)
  const saldoGlobal = useMemo(() => {
    const receitas = transactions.filter(t => t.type === TransactionType.Receita).reduce((acc, t) => acc + t.amount, 0);
    const despesas = transactions.filter(t => t.type === TransactionType.Despesa).reduce((acc, t) => acc + t.amount, 0);
    return receitas - despesas;
  }, [transactions]);

  // 2. FILTRAR TRANSAÇÕES PELO MÊS SELECIONADO E PELA BUSCA
  const filteredTransactions = useMemo(() => {
      const lowerQuery = searchQuery.toLowerCase();
      return transactions.filter(t => {
          const matchMonth = t.date.startsWith(selectedMonth);
          const matchSearch = 
            t.description.toLowerCase().includes(lowerQuery) ||
            t.category.toLowerCase().includes(lowerQuery) ||
            t.type.toLowerCase().includes(lowerQuery) ||
            t.amount.toString().includes(lowerQuery);
            
          return matchMonth && matchSearch;
      });
  }, [transactions, selectedMonth, searchQuery]);

  // 3. RECEITAS E DESPESAS (Visual)
  // Aqui aplicamos a regra: Se a categoria for 'Investimentos' ou 'Aporte', NÃO conta como despesa visual (vermelha).
  const { receitasMensais, despesasMensais } = useMemo(() => {
    const receitas = filteredTransactions
        .filter(t => t.type === TransactionType.Receita)
        .reduce((acc, t) => acc + t.amount, 0);
        
    const despesas = filteredTransactions
        .filter(t => t.type === TransactionType.Despesa && !isInvestmentCategory(t.category)) // Filtro aplicado
        .reduce((acc, t) => acc + t.amount, 0);
        
    return { receitasMensais: receitas, despesasMensais: despesas };
  }, [filteredTransactions]);

  const totalInvestido = useMemo(() => {
      return investments.reduce((acc, inv) => acc + inv.currentValue, 0);
  }, [investments]);

  // Gráfico: Mostra os dados do ANO correspondente ao mês selecionado
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(month => ({ name: month, Receitas: 0, Despesas: 0 }));

    transactions.forEach(transaction => {
      const dateParts = transaction.date.split('-'); // YYYY-MM-DD
      const year = parseInt(dateParts[0]);
      
      // Filtra o gráfico apenas para o ANO selecionado no filtro
      const selectedYear = parseInt(selectedMonth.split('-')[0]);

      if (year === selectedYear) {
          const monthIndex = parseInt(dateParts[1]) - 1; 
          
          if (monthIndex >= 0 && monthIndex < 12) {
            if (transaction.type === TransactionType.Receita) {
                data[monthIndex].Receitas += transaction.amount;
            } else if (!isInvestmentCategory(transaction.category)) { // Filtro aplicado no Gráfico (Exclui Aportes)
                data[monthIndex].Despesas += transaction.amount;
            }
          }
      }
    });

    return data;
  }, [transactions, selectedMonth]);
    
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Pessoal</h3>
          
          {/* Componente de Filtro de Mês */}
          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex items-center">
              <label htmlFor="month-filter" className="mr-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Período:
              </label>
              <input 
                  type="month" 
                  id="month-filter"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5 outline-none"
              />
          </div>
      </div>

      {transactions.length === 0 ? (
        <WelcomeBanner onActionClick={onNewTransaction} />
      ) : (
        <>
          {/* Metric Cards - Agora com suporte a modo escuro */}
          <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Saldo Atual (Global)"
              value={formatCurrency(saldoGlobal)}
              icon={<DollarSignIcon className="h-8 w-8 text-blue-600" />}
            />
            <MetricCard
              title="Receitas (Mês)"
              value={formatCurrency(receitasMensais)}
              icon={<ArrowUpIcon className="h-8 w-8 text-green-500" />}
              changeType="increase"
            />
            <MetricCard
              title="Despesas (Mês)"
              value={formatCurrency(despesasMensais)}
              icon={<ArrowDownIcon className="h-8 w-8 text-red-500" />}
              changeType="decrease"
            />
            <MetricCard
              title="Total Investido"
              value={formatCurrency(totalInvestido)}
              icon={<TrendingUpIcon className="h-8 w-8 text-indigo-500" />}
            />
          </div>

          {/* Chart - Suporte a modo escuro */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-3 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                    Visão Geral de {selectedMonth.split('-')[0]}
                </h4>
                 <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#9CA3AF" opacity={0.3} />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis tickFormatter={(value) => formatCurrency(Number(value))} stroke="#9CA3AF" />
                        <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{
                                backgroundColor: '#fff', 
                                border: '1px solid #e5e7eb', 
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                color: '#000'
                            }}
                            labelStyle={{color: '#374151', fontWeight: 'bold'}}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="Receitas" fill="#22C55E" name="Receitas" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Despesas" fill="#EF4444" name="Despesas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-8">
            {/* Tabela - Suporte a modo escuro */}
            <div className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <TransactionsTable 
                    transactions={filteredTransactions} 
                    title={`Transações de ${new Date(selectedMonth + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
                    showViewAllLink={true}
                    onViewAll={() => setActivePage('Transações')}
                    onEdit={onEditTransaction}
                    onDelete={onDeleteTransaction}
                />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
