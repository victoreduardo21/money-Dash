
import React, { useMemo, useState } from 'react';
import MetricCard from '../components/MetricCard';
import TransactionsTable from '../components/TransactionsTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { ArrowUpIcon } from '../components/icons/ArrowUpIcon';
import { ArrowDownIcon } from '../components/icons/ArrowDownIcon';
import { CreditCardIcon } from '../components/icons/CreditCardIcon';
import { PersonalTransaction, TransactionType, Investment, Page, Currency } from '../types';
import WelcomeBanner from '../components/WelcomeBanner';
import { SwitchHorizontalIcon } from '../components/icons/SwitchHorizontalIcon';

interface DashboardProps {
    transactions: PersonalTransaction[];
    investments: Investment[];
    setActivePage: (page: Page) => void;
    onEditTransaction: (transaction: PersonalTransaction) => void;
    onDeleteTransaction: (id: string) => void;
    onNewTransaction: () => void;
    onOpenTransfer: () => void;
    searchQuery: string;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, investments, setActivePage, onEditTransaction, onDeleteTransaction, onNewTransaction, onOpenTransfer, searchQuery }) => {
    
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('BRL');

  const formatCurrency = (value: number, currency: Currency = selectedCurrency) => {
    const safeValue = Math.abs(value) < 0.005 ? 0 : value;
    if (currency === 'BRL') {
        return `R$ ${safeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$ ${safeValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const formatCompactCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
          notation: "compact",
          compactDisplay: "short",
          maximumFractionDigits: 1,
      }).format(value);
  }

  const isInvestmentCategory = (category: string) => {
      if (!category) return false;
      const cat = category.toLowerCase().trim();
      return cat === 'investimentos' || cat === 'investimento' || cat === 'aporte' || cat === 'aportes';
  };

  // 1. SALDO DISPONÍVEL (Filtrado pela moeda selecionada)
  const saldoDisponivel = useMemo(() => {
    const txs = transactions.filter(t => t.currency === selectedCurrency);
    const receitas = txs.filter(t => t.type === TransactionType.Receita).reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const despesas = txs.filter(t => t.type === TransactionType.Despesa).reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    return receitas - despesas;
  }, [transactions, selectedCurrency]);

  // 2. INVESTIMENTO (Filtrado pela moeda selecionada)
  const totalInvestido = useMemo(() => {
      const invList = Array.isArray(investments) ? investments : [];
      return invList
        .filter(i => i.currency === selectedCurrency)
        .reduce((acc, inv) => acc + (Number(inv.currentValue) || 0), 0);
  }, [investments, selectedCurrency]);

  // 3. PATRIMÔNIO TOTAL
  const patrimonioTotal = useMemo(() => saldoDisponivel + totalInvestido, [saldoDisponivel, totalInvestido]);

  // 4. FLUXO MENSAL (Ajustado para ignorar investimentos nas despesas e filtrar moeda)
  const fluxoMensal = useMemo(() => {
      const txsMesMoeda = transactions.filter(t => t.date.startsWith(selectedMonth) && t.currency === selectedCurrency);
      
      const receitas = txsMesMoeda
        .filter(t => t.type === TransactionType.Receita)
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        
      const despesasReais = txsMesMoeda
        .filter(t => t.type === TransactionType.Despesa && !isInvestmentCategory(t.category))
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        
      return { receitas, despesas: despesasReais };
  }, [transactions, selectedMonth, selectedCurrency]);

  // FILTRO DE PESQUISA AJUSTADO: Agora foca apenas em texto visível para evitar confusão com o Tipo
  const filteredTransactions = useMemo(() => {
      const query = (searchQuery || '').trim().toLowerCase();
      
      return transactions.filter(t => {
          const matchCurrency = t.currency === selectedCurrency;
          const matchMonth = t.date.startsWith(selectedMonth);
          
          if (!query) return matchCurrency && matchMonth;

          // Busca apenas em campos de texto e valor, removendo o tipo da busca
          const descriptionMatch = (t.description || '').toLowerCase().includes(query);
          const categoryMatch = (t.category || '').toLowerCase().includes(query);
          const amountMatch = (t.amount || 0).toString().includes(query);
          
          return matchCurrency && matchMonth && (descriptionMatch || categoryMatch || amountMatch);
      });
  }, [transactions, selectedMonth, selectedCurrency, searchQuery]);

  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(month => ({ name: month, Receitas: 0, Despesas: 0 }));
    
    transactions.forEach(transaction => {
      if (!transaction.date || transaction.currency !== selectedCurrency) return;
      const dateParts = transaction.date.split('-');
      const year = parseInt(dateParts[0]);
      const selectedYear = parseInt(selectedMonth.split('-')[0]);

      if (year === selectedYear) {
          const monthIndex = parseInt(dateParts[1]) - 1; 
          if (monthIndex >= 0 && monthIndex < 12) {
            const amount = Number(transaction.amount) || 0;
            if (transaction.type === TransactionType.Receita) {
                data[monthIndex].Receitas += amount;
            } else if (!isInvestmentCategory(transaction.category)) {
                data[monthIndex].Despesas += amount;
            }
          }
      }
    });
    return data;
  }, [transactions, selectedMonth, selectedCurrency]);
    
  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Painel Financeiro</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gestão de saldo, patrimônio e fluxo em {selectedCurrency}</p>
          </div>
          
          <div className="flex items-center gap-3">
              <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex gap-1">
                  <button 
                      onClick={() => setSelectedCurrency('BRL')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'BRL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                      BRL
                  </button>
                  <button 
                      onClick={() => setSelectedCurrency('USD')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'USD' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                      USD
                  </button>
              </div>

              <button 
                onClick={onOpenTransfer}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg"
              >
                  <SwitchHorizontalIcon className="w-4 h-4" />
                  Câmbio
              </button>

              <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                  <input 
                      type="month" 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-transparent border-none text-gray-700 dark:text-white text-sm font-bold p-1 focus:ring-0 outline-none cursor-pointer"
                  />
              </div>
          </div>
      </div>

      {transactions.length === 0 ? (
        <WelcomeBanner onActionClick={onNewTransaction} />
      ) : (
        <>
          <div className="mb-4">
            <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Visão Geral ({selectedCurrency})</h4>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Saldo em Conta"
                  value={formatCurrency(saldoDisponivel)}
                  icon={<span className="text-2xl">{selectedCurrency === 'BRL' ? '🇧🇷' : '🇺🇸'}</span>}
                  valueClassName={saldoDisponivel < 0 ? "text-red-600 dark:text-red-500" : "text-gray-900 dark:text-white"}
                />
                <MetricCard
                  title="Total Investido"
                  value={formatCurrency(totalInvestido)}
                  icon={<TrendingUpIcon className="h-8 w-8 text-indigo-500" />}
                  valueClassName="text-indigo-600 dark:text-indigo-400"
                />
                <MetricCard
                  title="Receitas (Mês)"
                  value={formatCurrency(fluxoMensal.receitas)}
                  icon={<ArrowUpIcon className="h-8 w-8 text-green-500" />}
                  valueClassName="text-green-600 dark:text-green-400"
                />
                <MetricCard
                  title="Gastos Reais (Mês)"
                  value={formatCurrency(fluxoMensal.despesas)}
                  icon={<ArrowDownIcon className="h-8 w-8 text-red-500" />}
                  valueClassName="text-red-600 dark:text-red-400"
                />
            </div>
          </div>

          <div className="mb-8 mt-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <MetricCard
                  title="Patrimônio Total"
                  value={formatCurrency(patrimonioTotal)}
                  icon={<CreditCardIcon className="h-8 w-8 text-blue-600" />}
                  valueClassName="text-slate-900 dark:text-white font-black text-3xl"
                />
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-xl flex items-center justify-between text-white">
                    <div>
                        <p className="text-xs font-black uppercase opacity-80 tracking-widest">Margem de Investimento</p>
                        <p className="text-3xl font-black mt-1">
                            {fluxoMensal.receitas > 0 
                                ? (((fluxoMensal.receitas - fluxoMensal.despesas) / fluxoMensal.receitas) * 100).toFixed(1)
                                : '0'}%
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] opacity-70 uppercase font-bold">Líquido Mensal</p>
                        <p className="text-xl font-bold">{formatCurrency(fluxoMensal.receitas - fluxoMensal.despesas)}</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-3 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-8">Fluxo de Caixa ({selectedCurrency})</h4>
                 <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                        <YAxis width={50} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={formatCompactCurrency} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="Receitas" fill="#22C55E" radius={[6, 6, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="Despesas" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-8">
            <div className="rounded-2xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <TransactionsTable 
                    transactions={filteredTransactions} 
                    title={searchQuery ? `Resultado da busca (${selectedCurrency})` : `Histórico: ${new Date(selectedMonth + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
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
