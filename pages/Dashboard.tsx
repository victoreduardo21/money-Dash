
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

  const formatCurrency = (value: number, currency: Currency = selectedCurrency) => {
    const roundedValue = Math.abs(value) < 0.009 ? 0 : value;
    return (currency === 'BRL' ? 'R$ ' : '$ ') + roundedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const totals = useMemo(() => {
    const txs = transactions.filter(t => t.currency === selectedCurrency);
    const saldo = txs.reduce((acc, t) => acc + (t.type === TransactionType.Receita ? t.amount : -t.amount), 0);
    const investido = (investments || []).filter(i => i.currency === selectedCurrency).reduce((acc, i) => acc + i.currentValue, 0);
    const txsMes = transactions.filter(t => t.date.startsWith(selectedMonth) && t.currency === selectedCurrency);
    const recMes = txsMes.filter(t => t.type === TransactionType.Receita).reduce((acc, t) => acc + t.amount, 0);
    const gastMes = txsMes.filter(t => t.type === TransactionType.Despesa).reduce((acc, t) => acc + t.amount, 0);
    return { saldo, investido, recMes, gastMes, patrimonio: saldo + investido };
  }, [transactions, investments, selectedCurrency, selectedMonth]);

  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = selectedMonth.split('-')[0];
    return months.map((name, i) => {
        const mStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        const txs = transactions.filter(t => t.date.startsWith(mStr) && t.currency === selectedCurrency);
        return {
            name,
            income: txs.filter(t => t.type === TransactionType.Receita).reduce((acc, t) => acc + t.amount, 0),
            expense: txs.filter(t => t.type === TransactionType.Despesa).reduce((acc, t) => acc + t.amount, 0)
        };
    });
  }, [transactions, selectedCurrency, selectedMonth]);

  return (
    <div className="w-full max-w-full pb-10 overflow-x-hidden">
      {/* HEADER DO DASHBOARD */}
      <div className="flex flex-col mb-8 gap-6 px-4">
          <div>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard</h3>
            <p className="text-sm text-slate-400 font-medium tracking-wide">Resumo em {selectedCurrency}</p>
          </div>
          
          <div className="flex flex-col gap-4">
              {/* Seletores Mobile-First */}
              <div className="flex gap-3 w-full">
                <div className="flex-1 bg-white dark:bg-gray-800 p-1.5 rounded-2xl flex border border-slate-200 dark:border-gray-700 shadow-sm">
                    <button onClick={() => onCurrencyChange('BRL')} className={`flex-1 py-3.5 rounded-xl text-sm font-black transition-all ${selectedCurrency === 'BRL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>BRL</button>
                    <button onClick={() => onCurrencyChange('USD')} className={`flex-1 py-3.5 rounded-xl text-sm font-black transition-all ${selectedCurrency === 'USD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>USD</button>
                </div>
                <button onClick={onOpenTransfer} className="bg-indigo-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all flex-shrink-0">
                    <SwitchHorizontalIcon className="w-7 h-7" />
                </button>
              </div>

              <div 
                className="relative w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl px-5 py-4 flex items-center justify-between cursor-pointer shadow-sm active:scale-[0.97] transition-all"
                onClick={() => monthInputRef.current?.showPicker()}
              >
                  <div className="flex items-center gap-4">
                      <CalendarIcon className="w-7 h-7 text-blue-500" />
                      <div className="flex flex-col text-left">
                          <span className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1 tracking-widest">Período</span>
                          <span className="text-base font-bold text-slate-700 dark:text-white capitalize">
                            {new Date(selectedMonth + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                          </span>
                      </div>
                  </div>
                  <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                  <input ref={monthInputRef} type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
          </div>
      </div>

      {/* CARDS DE MÉTRICAS - FORÇAR 1 COLUNA ATÉ 1024PX (LG) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 px-4 mb-10">
          <MetricCard 
            title="Available Balance" 
            value={formatCurrency(totals.saldo)} 
            icon={<CreditCardIcon className="h-9 w-9 text-blue-500" />} 
            valueClassName={totals.saldo < 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}
          />
          <MetricCard title="Total Invested" value={formatCurrency(totals.investido)} icon={<TrendingUpIcon className="h-9 w-9 text-indigo-500" />} />
          <MetricCard title="Income (Month)" value={formatCurrency(totals.recMes)} icon={<ArrowUpIcon className="h-9 w-9 text-green-500" />} />
          <MetricCard title="Real Expenses (Month)" value={formatCurrency(totals.gastMes)} icon={<ArrowDownIcon className="h-9 w-9 text-red-500" />} />
      </div>

      <div className="space-y-6 px-4">
        {/* GRÁFICO */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Fluxo de Caixa Anual</h4>
            <div className="h-[300px] w-full -ml-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }} />
                        <Bar dataKey="income" name="Receita" fill="#22C55E" radius={[4, 4, 0, 0]} barSize={10} />
                        <Bar dataKey="expense" name="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={10} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* PATRIMÔNIO CARD */}
        <div className="bg-[#0a1122] p-10 rounded-[2.8rem] shadow-2xl text-white flex flex-col justify-between border border-white/5 relative overflow-hidden min-h-[300px]">
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/15 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            <div className="relative z-10">
                <h4 className="text-[11px] font-black opacity-30 uppercase tracking-[0.4em] mb-4">Patrimônio Líquido</h4>
                <p className="text-4xl md:text-5xl font-black tracking-tighter mb-4">{formatCurrency(totals.patrimonio)}</p>
                <div className="h-2 w-24 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
            </div>
            <div className="mt-14 pt-10 border-t border-white/10 relative z-10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Eficiência Financeira</p>
                <p className="text-4xl font-black text-[#22c55e]">
                    {totals.recMes > 0 ? (((totals.recMes - totals.gastMes) / totals.recMes) * 100).toFixed(1) : '0'}%
                </p>
                <div className="w-full bg-white/5 rounded-full h-2.5 mt-6 overflow-hidden">
                    <div className="bg-green-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.4)]" style={{ width: `${Math.min(100, Math.max(0, totals.recMes > 0 ? ((totals.recMes - totals.gastMes) / totals.recMes) * 100 : 0))}%` }}></div>
                </div>
            </div>
        </div>

        {/* TABELA DE TRANSAÇÕES */}
        <div className="mt-8">
            <TransactionsTable 
                transactions={transactions.filter(t => t.date.startsWith(selectedMonth) && t.currency === selectedCurrency).slice(0, 10)} 
                title="Histórico Recente" 
                onEdit={onEditTransaction} 
                onDelete={onDeleteTransaction} 
                language={language} 
            />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;