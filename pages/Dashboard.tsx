
import React, { useMemo, useState } from 'react';
import MetricCard from '../components/MetricCard';
import TransactionsTable from '../components/TransactionsTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { ArrowUpIcon } from '../components/icons/ArrowUpIcon';
import { ArrowDownIcon } from '../components/icons/ArrowDownIcon';
import { CreditCardIcon } from '../components/icons/CreditCardIcon';
import { PersonalTransaction, TransactionType, Investment, Page, Currency, Language } from '../types';
import WelcomeBanner from '../components/WelcomeBanner';
import { SwitchHorizontalIcon } from '../components/icons/SwitchHorizontalIcon';
import { useTranslation } from '../translations';

interface DashboardProps {
    transactions: PersonalTransaction[];
    investments: Investment[];
    setActivePage: (page: Page) => void;
    onEditTransaction: (transaction: PersonalTransaction) => void;
    onDeleteTransaction: (id: string) => void;
    onNewTransaction: () => void;
    onOpenTransfer: () => void;
    searchQuery: string;
    language: Language;
    selectedCurrency: Currency;
    onCurrencyChange: (currency: Currency) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, investments, setActivePage, onEditTransaction, onDeleteTransaction, onNewTransaction, onOpenTransfer, searchQuery, language, selectedCurrency, onCurrencyChange }) => {
  const t = useTranslation(language);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Identifica o que é movimentação patrimonial (não é custo de vida)
  const isInternalTransfer = (category: string) => {
    if (!category) return false;
    const cat = category.toLowerCase().trim();
    const internalKeywords = [
        'investimento', 'investimentos', 'investment', 'investments',
        'aporte', 'aportes', 'contribution', 'contributions',
        'câmbio', 'cambio', 'exchange', 'transferência', 'transferencia', 'transfer'
    ];
    return internalKeywords.some(keyword => cat.includes(keyword));
  };

  const formatCurrency = (value: number, currency: Currency = selectedCurrency) => {
    if (currency === 'BRL') {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const saldoDisponivel = useMemo(() => {
    const txs = transactions.filter(t => t.currency === selectedCurrency);
    const receitas = txs.filter(t => t.type === TransactionType.Receita).reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const despesas = txs.filter(t => t.type === TransactionType.Despesa).reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    return receitas - despesas;
  }, [transactions, selectedCurrency]);

  const totalInvestido = useMemo(() => {
      return (investments || [])
        .filter(i => i.currency === selectedCurrency)
        .reduce((acc, inv) => acc + (Number(inv.currentValue) || 0), 0);
  }, [investments, selectedCurrency]);

  const patrimonioTotal = useMemo(() => saldoDisponivel + totalInvestido, [saldoDisponivel, totalInvestido]);

  const fluxoMensal = useMemo(() => {
      const txsMes = transactions.filter(t => t.date.startsWith(selectedMonth) && t.currency === selectedCurrency);
      
      const receitas = txsMes
        .filter(t => t.type === TransactionType.Receita)
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      
      // Gasto Real = Despesa que NÃO é investimento/câmbio
      const despesasCustoVida = txsMes
        .filter(t => t.type === TransactionType.Despesa && !isInternalTransfer(t.category))
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      
      // Aportes do mês para o card de investimento
      const aportesMes = txsMes
        .filter(t => t.type === TransactionType.Despesa && isInternalTransfer(t.category))
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

      return { receitas, despesas: despesasCustoVida, aportes: aportesMes };
  }, [transactions, selectedMonth, selectedCurrency]);

  const filteredTransactions = useMemo(() => {
      const query = (searchQuery || '').trim().toLowerCase();
      return transactions.filter(t => {
          const matchMonth = t.date.startsWith(selectedMonth);
          const matchCurrency = t.currency === selectedCurrency;
          if (!query) return matchMonth && matchCurrency;
          const descriptionMatch = (t.description || '').toLowerCase().includes(query);
          const categoryMatch = (t.category || '').toLowerCase().includes(query);
          return matchMonth && matchCurrency && (descriptionMatch || categoryMatch);
      });
  }, [transactions, selectedMonth, selectedCurrency, searchQuery]);

  const monthlyChartData = useMemo(() => {
    const months = language === 'pt-BR' 
        ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const data = months.map(month => ({ name: month, income: 0, expense: 0, investment: 0 }));
    const currentYear = selectedMonth.split('-')[0];

    transactions.forEach(transaction => {
      if (transaction.currency !== selectedCurrency) return;
      
      const [year, month] = transaction.date.split('-');
      if (year === currentYear) {
          const monthIndex = parseInt(month) - 1; 
          if (monthIndex >= 0 && monthIndex < 12) {
            const amount = Number(transaction.amount) || 0;
            if (transaction.type === TransactionType.Receita) {
                data[monthIndex].income += amount;
            } else {
                if (isInternalTransfer(transaction.category)) {
                    data[monthIndex].investment += amount;
                } else {
                    data[monthIndex].expense += amount;
                }
            }
          }
      }
    });
    return data;
  }, [transactions, selectedCurrency, language, selectedMonth]);
    
  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">{t('dashboard')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('summary')} em {selectedCurrency}</p>
          </div>
          
          <div className="flex items-center gap-3">
              <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex gap-1">
                  <button onClick={() => onCurrencyChange('BRL')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'BRL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>BRL</button>
                  <button onClick={() => onCurrencyChange('USD')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'USD' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>USD</button>
              </div>

              <button onClick={onOpenTransfer} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg">
                  <SwitchHorizontalIcon className="w-4 h-4" />
                  {t('exchange')}
              </button>

              <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                  <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none text-gray-700 dark:text-white text-sm font-bold p-1 focus:ring-0 outline-none cursor-pointer" />
              </div>
          </div>
      </div>

      {transactions.length === 0 ? (
        <WelcomeBanner onActionClick={onNewTransaction} />
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <MetricCard title={t('availableBalance')} value={formatCurrency(saldoDisponivel)} icon={<CreditCardIcon className="h-8 w-8 text-blue-500" />} valueClassName={saldoDisponivel < 0 ? "text-red-600" : ""} />
              <MetricCard title={t('totalInvested')} value={formatCurrency(totalInvestido)} icon={<TrendingUpIcon className="h-8 w-8 text-indigo-500" />} />
              <MetricCard title={t('monthlyIncome')} value={formatCurrency(fluxoMensal.receitas)} icon={<ArrowUpIcon className="h-8 w-8 text-green-500" />} />
              <MetricCard title={t('monthlyExpenses')} value={formatCurrency(fluxoMensal.despesas)} icon={<ArrowDownIcon className="h-8 w-8 text-red-500" />} change={fluxoMensal.despesas > 0 ? t('costOfLiving') : ""} changeType="decrease" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-8">{t('cashFlow')} {t('annual')} ({selectedCurrency})</h4>
                 <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                        <YAxis hide />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '12px', border: 'none', shadow: 'none' }} labelStyle={{ fontWeight: 'bold' }} />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="income" name={t('income')} fill="#22C55E" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="expense" name={t('costOfLiving')} fill="#EF4444" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="investment" name={`${t('investments')} / ${t('exchange')}`} fill="#6366F1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-[#0a0f1e] p-8 rounded-3xl shadow-2xl text-white flex flex-col justify-between border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div>
                    <h4 className="text-sm font-black opacity-40 uppercase tracking-[0.2em] mb-2">{t('netWorth')}</h4>
                    <p className="text-5xl font-black tracking-tighter text-white">{formatCurrency(patrimonioTotal)}</p>
                </div>
                <div className="mt-12 pt-8 border-t border-white/10">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('investmentMargin')}</p>
                            <p className="text-3xl font-black text-[#22c55e] mt-1 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                                {fluxoMensal.receitas > 0 ? (((fluxoMensal.receitas - fluxoMensal.despesas) / fluxoMensal.receitas) * 100).toFixed(1) : '0'}%
                            </p>
                        </div>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3 p-0.5 border border-white/5">
                        <div className="bg-gradient-to-r from-blue-600 to-[#22c55e] h-full rounded-full transition-all duration-1000" 
                            style={{width: `${Math.max(0, Math.min(100, (fluxoMensal.receitas > 0 ? ((fluxoMensal.receitas - fluxoMensal.despesas) / fluxoMensal.receitas) * 100 : 0)))}%`}}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-4 leading-relaxed font-medium">Margem líquida após o custo de vida básico em {selectedCurrency}.</p>
                </div>
            </div>
          </div>

          <div className="mt-8">
            <TransactionsTable transactions={filteredTransactions} title={`${t('history')} (${selectedCurrency})`} onEdit={onEditTransaction} onDelete={onDeleteTransaction} showViewAllLink onViewAll={() => setActivePage('Transações')} language={language} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
