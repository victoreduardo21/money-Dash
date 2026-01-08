
import React, { useMemo, useState, useRef } from 'react';
import MetricCard from '../components/MetricCard';
import TransactionsTable from '../components/TransactionsTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { ArrowUpIcon } from '../components/icons/ArrowUpIcon';
import { ArrowDownIcon } from '../components/icons/ArrowDownIcon';
import { CreditCardIcon } from '../components/icons/CreditCardIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
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
  const monthInputRef = useRef<HTMLInputElement>(null);

  const isInternalTransfer = (category: string) => {
    if (!category) return false;
    const cat = category.toLowerCase().trim();
    const internalKeywords = ['investimento', 'aporte', 'câmbio', 'transferência', 'investment', 'contribution', 'resgate'];
    return internalKeywords.some(keyword => cat.includes(keyword));
  };

  const formatCurrency = (value: number, currency: Currency = selectedCurrency) => {
    // Normalização absoluta: se o valor arredondado for 0, ignore o sinal
    const roundedValue = Math.abs(value) < 0.009 ? 0 : value;
    return (currency === 'BRL' ? 'R$ ' : '$ ') + roundedValue.toLocaleString(language === 'pt-BR' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const totals = useMemo(() => {
    const txs = transactions.filter(t => t.currency === selectedCurrency);
    // O Saldo considera TUDO (Receitas - Despesas), independente da categoria
    const rawSaldo = txs.reduce((acc, t) => acc + (t.type === TransactionType.Receita ? t.amount : -t.amount), 0);
    const saldo = Number(rawSaldo.toFixed(2));
    
    const investido = (investments || []).filter(i => i.currency === selectedCurrency).reduce((acc, i) => acc + i.currentValue, 0);
    
    const txsMes = transactions.filter(t => t.date.startsWith(selectedMonth) && t.currency === selectedCurrency);
    
    // Renda Mensal: Ignora transferências internas (como resgates de investimento) para mostrar apenas renda REAL
    const recMes = txsMes.filter(t => t.type === TransactionType.Receita && !isInternalTransfer(t.category)).reduce((acc, t) => acc + t.amount, 0);
    
    // Gastos Mensais: Ignora aplicações em investimento para mostrar apenas custo de vida REAL
    const gastMes = txsMes.filter(t => t.type === TransactionType.Despesa && !isInternalTransfer(t.category)).reduce((acc, t) => acc + t.amount, 0);

    return { saldo, investido, recMes, gastMes, patrimonio: Number((saldo + investido).toFixed(2)) };
  }, [transactions, investments, selectedCurrency, selectedMonth]);

  const monthlyChartData = useMemo(() => {
    const months = language === 'pt-BR' ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = selectedMonth.split('-')[0];
    const data = months.map(name => ({ name, income: 0, expense: 0, investment: 0 }));

    transactions.forEach(t => {
      if (t.currency !== selectedCurrency || !t.date.startsWith(currentYear)) return;
      const mIdx = parseInt(t.date.split('-')[1]) - 1;
      if (mIdx < 0 || mIdx > 11) return;
      
      if (t.type === TransactionType.Receita) {
          // Só conta no gráfico de "Renda" se não for transferência interna
          if (!isInternalTransfer(t.category)) data[mIdx].income += t.amount;
      } else {
          // Se for despesa, separa custo de vida de investimento
          if (isInternalTransfer(t.category)) data[mIdx].investment += t.amount;
          else data[mIdx].expense += t.amount;
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
          
          <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex gap-1">
                  <button onClick={() => onCurrencyChange('BRL')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'BRL' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>BRL</button>
                  <button onClick={() => onCurrencyChange('USD')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'USD' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>USD</button>
              </div>

              <div 
                className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 flex items-center gap-3 cursor-pointer hover:border-blue-500 transition-all shadow-sm"
                onClick={() => monthInputRef.current?.showPicker()}
              >
                  <CalendarIcon className="w-5 h-5 text-blue-500" />
                  <div className="flex flex-col min-w-[120px]">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">Período</span>
                      <span className="text-sm font-bold text-gray-700 dark:text-white capitalize">
                        {new Date(selectedMonth + '-02').toLocaleDateString(language, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                      </span>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  <input ref={monthInputRef} type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>

              <button onClick={onOpenTransfer} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg flex items-center gap-2">
                  <SwitchHorizontalIcon className="w-4 h-4" /> {t('exchange')}
              </button>
          </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard 
            title={t('availableBalance')} 
            value={formatCurrency(totals.saldo)} 
            icon={<CreditCardIcon className="h-8 w-8 text-blue-500" />} 
            valueClassName={totals.saldo <= -0.01 ? 'text-red-600' : 'text-gray-900 dark:text-white'}
          />
          <MetricCard title={t('totalInvested')} value={formatCurrency(totals.investido)} icon={<TrendingUpIcon className="h-8 w-8 text-indigo-500" />} />
          <MetricCard title={t('monthlyIncome')} value={formatCurrency(totals.recMes)} icon={<ArrowUpIcon className="h-8 w-8 text-green-500" />} />
          <MetricCard title={t('monthlyExpenses')} value={formatCurrency(totals.gastMes)} icon={<ArrowDownIcon className="h-8 w-8 text-red-500" />} change={t('costOfLiving')} changeType="decrease" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-8">{t('cashFlow')} {t('annual')}</h4>
            <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="income" name={t('income')} fill="#22C55E" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name={t('costOfLiving')} fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="investment" name={t('investments')} fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-[#0a0f1e] p-8 rounded-3xl shadow-2xl text-white flex flex-col justify-between border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div>
                <h4 className="text-sm font-black opacity-40 uppercase tracking-widest mb-2">{t('netWorth')}</h4>
                <p className="text-5xl font-black tracking-tighter">{formatCurrency(totals.patrimonio)}</p>
            </div>
            <div className="mt-12 pt-8 border-t border-white/10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('investmentMargin')}</p>
                <p className="text-3xl font-black text-[#22c55e] mt-1">
                    {totals.recMes > 0 ? (((totals.recMes - totals.gastMes) / totals.recMes) * 100).toFixed(1) : '0'}%
                </p>
                <div className="w-full bg-white/5 rounded-full h-2 mt-4"><div className="bg-green-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, totals.recMes > 0 ? ((totals.recMes - totals.gastMes) / totals.recMes) * 100 : 0))}%` }}></div></div>
            </div>
        </div>
      </div>

      <div className="mt-8">
        <TransactionsTable 
            transactions={transactions.filter(t => t.date.startsWith(selectedMonth) && t.currency === selectedCurrency)} 
            title={`${t('history')} - ${selectedMonth}`} 
            onEdit={onEditTransaction} 
            onDelete={onDeleteTransaction} 
            language={language} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
