
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
    // CORREÇÃO: Se o valor for muito próximo de zero (ex: -0.00001), força para 0 positivo.
    // Isso evita o problema de aparecer "-R$ 0,00".
    const safeValue = Math.abs(value) < 0.005 ? 0 : value;
    return `R$ ${safeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Formatador compacto para o Eixo Y (Ex: 1.5k, 2 mil) para não poluir o gráfico
  const formatCompactCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
          notation: "compact",
          compactDisplay: "short",
          maximumFractionDigits: 1,
      }).format(value);
  }

  // Helper para identificar categorias de investimento/aporte
  // FIX: Adicionada verificação (!category) para evitar erro se a categoria vier nula ou undefined
  const isInvestmentCategory = (category: string) => {
      if (!category) return false;
      const cat = category.toLowerCase().trim();
      return cat === 'investimentos' || cat === 'investimento' || cat === 'aporte' || cat === 'aportes';
  };

  // 1. SALDO GLOBAL (Mantemos a lógica original aqui para refletir o dinheiro em conta real)
  const saldoGlobal = useMemo(() => {
    const receitas = transactions.filter(t => t.type === TransactionType.Receita).reduce((acc, t) => acc + (t.amount || 0), 0);
    const despesas = transactions.filter(t => t.type === TransactionType.Despesa).reduce((acc, t) => acc + (t.amount || 0), 0);
    return receitas - despesas;
  }, [transactions]);

  // 2. FILTRAR TRANSAÇÕES PELO MÊS SELECIONADO E PELA BUSCA
  const filteredTransactions = useMemo(() => {
      const lowerQuery = searchQuery.toLowerCase();
      return transactions.filter(t => {
          const matchMonth = t.date.startsWith(selectedMonth);
          
          // Verifica se as propriedades existem antes de usar toLowerCase()
          const descriptionMatch = (t.description || '').toLowerCase().includes(lowerQuery);
          const categoryMatch = (t.category || '').toLowerCase().includes(lowerQuery);
          const typeMatch = (t.type || '').toLowerCase().includes(lowerQuery);
          const amountMatch = (t.amount || 0).toString().includes(lowerQuery);
          
          const matchSearch = descriptionMatch || categoryMatch || typeMatch || amountMatch;
            
          return matchMonth && matchSearch;
      });
  }, [transactions, selectedMonth, searchQuery]);

  // 3. RECEITAS E DESPESAS (Visual)
  // Aqui aplicamos a regra: Se a categoria for 'Investimentos' ou 'Aporte', NÃO conta como despesa visual (vermelha).
  const { receitasMensais, despesasMensais } = useMemo(() => {
    const receitas = filteredTransactions
        .filter(t => t.type === TransactionType.Receita)
        .reduce((acc, t) => acc + (t.amount || 0), 0);
        
    const despesas = filteredTransactions
        .filter(t => t.type === TransactionType.Despesa && !isInvestmentCategory(t.category)) // Filtro aplicado
        .reduce((acc, t) => acc + (t.amount || 0), 0);
        
    return { receitasMensais: receitas, despesasMensais: despesas };
  }, [filteredTransactions]);

  const totalInvestido = useMemo(() => {
      return investments.reduce((acc, inv) => acc + (inv.currentValue || 0), 0);
  }, [investments]);

  // Gráfico: Mostra os dados do ANO correspondente ao mês selecionado
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(month => ({ name: month, Receitas: 0, Despesas: 0 }));

    transactions.forEach(transaction => {
      // Verifica se a data existe antes de tentar dividir
      if (!transaction.date) return;

      const dateParts = transaction.date.split('-'); // YYYY-MM-DD
      if (dateParts.length < 2) return;

      const year = parseInt(dateParts[0]);
      
      // Filtra o gráfico apenas para o ANO selecionado no filtro
      const selectedYear = parseInt(selectedMonth.split('-')[0]);

      if (year === selectedYear) {
          const monthIndex = parseInt(dateParts[1]) - 1; 
          
          if (monthIndex >= 0 && monthIndex < 12) {
            const amount = transaction.amount || 0;
            if (transaction.type === TransactionType.Receita) {
                data[monthIndex].Receitas += amount;
            } else if (!isInvestmentCategory(transaction.category)) { // Filtro aplicado no Gráfico (Exclui Aportes)
                data[monthIndex].Despesas += amount;
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
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5 outline-none cursor-pointer"
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
              // LÓGICA DE COR: Só fica vermelho se for menor que zero (considerando pequena margem de erro)
              valueClassName={saldoGlobal < -0.005 ? "text-red-600 dark:text-red-500" : "text-gray-900 dark:text-white"}
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

          {/* Chart - Design Limpo e Moderno */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-3 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <div className="flex justify-between items-center mb-8">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white">
                        Visão Geral de {selectedMonth.split('-')[0]}
                    </h4>
                    {/* Legenda Customizada (Opcional, se quiser substituir a padrão do Recharts) */}
                </div>
                
                 <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={monthlyChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        {/* Grade apenas horizontal e bem suave */}
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
                        
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                            dy={10} // Afasta um pouco o texto
                        />
                        
                        <YAxis 
                            width={50} // Largura fixa para garantir que "1.5 mil" caiba
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                            tickFormatter={formatCompactCurrency} // Ex: 1.5k
                        />
                        
                        <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.03)' }} // Highlight suave na barra ao passar o mouse
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{
                                backgroundColor: '#fff', 
                                border: 'none', 
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                color: '#111827',
                                padding: '12px 16px'
                            }}
                            itemStyle={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}
                            labelStyle={{ color: '#6B7280', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        />
                        
                        <Legend 
                            wrapperStyle={{ paddingTop: '24px' }} 
                            iconType="circle"
                            formatter={(value) => <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 ml-1">{value}</span>}
                        />
                        
                        {/* Barras com bordas arredondadas no topo e largura máxima controlada */}
                        <Bar 
                            dataKey="Receitas" 
                            fill="#22C55E" 
                            name="Receitas" 
                            radius={[6, 6, 0, 0]} 
                            maxBarSize={50}
                        />
                        <Bar 
                            dataKey="Despesas" 
                            fill="#EF4444" 
                            name="Despesas" 
                            radius={[6, 6, 0, 0]} 
                            maxBarSize={50}
                        />
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
