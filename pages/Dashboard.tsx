
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
import { PersonalTransaction, TransactionType, Investment, Page, Currency, Language, CreditTransaction, Subscription, User, Goal } from '../types';
import { SwitchHorizontalIcon } from '../components/icons/SwitchHorizontalIcon';
import { useTranslation } from '../translations';
import { Target, PiggyBank, ArrowRight, Sparkles } from 'lucide-react';

interface DashboardProps {
    transactions: PersonalTransaction[];
    creditTransactions: CreditTransaction[];
    investments: Investment[];
    subscriptions?: Subscription[];
    goals?: Goal[];
    setActivePage: (page: Page) => void;
    onEditTransaction: (transaction: PersonalTransaction) => void;
    onDeleteTransaction: (id: string) => void;
    onNewTransaction: () => void;
    onOpenTransfer: () => void;
    searchQuery: string;
    language: Language;
    selectedCurrency: Currency;
    onCurrencyChange: (currency: Currency) => void;
    currentUser?: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    transactions, 
    creditTransactions = [], 
    investments, 
    subscriptions = [],
    goals = [],
    setActivePage, 
    onEditTransaction, 
    onDeleteTransaction, 
    onNewTransaction, 
    onOpenTransfer, 
    searchQuery, 
    language, 
    selectedCurrency, 
    onCurrencyChange,
    currentUser
}) => {
  const t = useTranslation(language);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const monthInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (value: number, currency: Currency = selectedCurrency) => {
    const roundedValue = Math.abs(value) < 0.009 ? 0 : value;
    return (currency === 'BRL' ? 'R$ ' : '$ ') + roundedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const isInternalTransfer = (category: string) => {
    if (!category) return false;
    const cat = category.toLowerCase().trim();
    const internalKeywords = [
        'investimento', 'investimentos', 'investment', 'investments',
        'aporte', 'aportes', 'contribution', 'contributions',
        'câmbio', 'cambio', 'exchange', 'transferência', 'transferencia', 'transfer', 'resgate'
    ];
    return internalKeywords.some(keyword => cat.includes(keyword));
  };
  
  const totals = useMemo(() => {
      const txs = transactions.filter(t => (t.currency || 'BRL') === selectedCurrency);
      const txsMes = txs.filter(t => t.date.startsWith(selectedMonth));
      
      const subsTotal = (subscriptions || [])
          .filter((s: Subscription) => {
              if (s.status !== 'ACTIVE' || s.currency !== selectedCurrency) return false;
              if (s.startDate) {
                  const startMonth = s.startDate.slice(0, 7);
                  return selectedMonth >= startMonth;
              }
              return true;
          })
          .reduce((acc: number, s: Subscription) => acc + (Number(s.amount) || 0), 0);

      // Values for Cards (Matching user's specific requirement: Income includes everything, Expenses excludes investments)
      const recMes = txsMes
          .filter((t: PersonalTransaction) => t.type === TransactionType.Receita)
          .reduce((acc: number, t: PersonalTransaction) => acc + (Number(t.amount) || 0), 0);
      
      const gastMes = txsMes
          .filter((t: PersonalTransaction) => t.type === TransactionType.Despesa && !isInternalTransfer(t.category))
          .reduce((acc: number, t: PersonalTransaction) => acc + (Number(t.amount) || 0), 0) +
          (creditTransactions || [])
          .filter((ctx: CreditTransaction) => ctx.date.startsWith(selectedMonth) && ctx.status !== 'PAID')
          .reduce((acc: number, ctx: CreditTransaction) => acc + (Number(ctx.amount) || 0), 0) +
          subsTotal;
          
      // "Available Balance" - Raw net sum of ALL transactions
      const saldoTotal = txs.reduce((acc: number, t: PersonalTransaction) => acc + (t.type === TransactionType.Receita ? (Number(t.amount) || 0) : -(Number(t.amount) || 0)), 0);
      
      const investidoCurrent = (investments || [])
          .filter((i: Investment) => (i.currency || 'BRL') === selectedCurrency)
          .reduce((acc: number, i: Investment) => acc + (Number(i.currentValue) || 0), 0);
          
      return { 
        saldoMes: recMes - gastMes, 
        saldoTotal,
        investido: investidoCurrent, 
        recMes, 
        gastMes, 
        patrimonio: saldoTotal + investidoCurrent 
      };
    }, [transactions, investments, creditTransactions, subscriptions, selectedCurrency, selectedMonth]);

    const monthlyChartData = useMemo(() => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const currentYear = selectedMonth.split('-')[0];

      return months.map((name, i) => {
          const mStr = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
          const txs = transactions.filter((t: PersonalTransaction) => t.date.startsWith(mStr) && (t.currency || 'BRL') === selectedCurrency);
          const ctxs = (creditTransactions || []).filter((c: CreditTransaction) => c.date.startsWith(mStr) && c.status !== 'PAID');
          
          const subsTotalForMonth = (subscriptions || [])
              .filter((s: Subscription) => {
                  if (s.status !== 'ACTIVE' || s.currency !== selectedCurrency) return false;
                  if (s.startDate) {
                      const startMonth = s.startDate.slice(0, 7);
                      return mStr >= startMonth;
                  }
                  return true;
              })
              .reduce((acc: number, s: Subscription) => acc + (Number(s.amount) || 0), 0);

          return {
              name,
              // Graph logic: Matching Cards (Incomes: all, Expenses: real + pending credit + subscriptions)
              income: txs.filter((t: PersonalTransaction) => t.type === TransactionType.Receita).reduce((acc: number, t: PersonalTransaction) => acc + (Number(t.amount) || 0), 0),
              expense: txs.filter((t: PersonalTransaction) => t.type === TransactionType.Despesa && !isInternalTransfer(t.category)).reduce((acc: number, t: PersonalTransaction) => acc + (Number(t.amount) || 0), 0) +
                       ctxs.reduce((acc: number, c: CreditTransaction) => acc + (Number(c.amount) || 0), 0) +
                       subsTotalForMonth
          };
      });
    }, [transactions, selectedCurrency, selectedMonth, subscriptions, creditTransactions]);

    return (
      <div className="w-full max-w-7xl mx-auto pb-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard</h3>
              <p className="text-xs text-slate-400 font-medium">Resumo em {selectedCurrency}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <div id="tour-currency-selector" className="flex gap-2">
                  <div className="bg-white dark:bg-gray-800 p-1 rounded-2xl flex border border-slate-200 dark:border-gray-700 shadow-sm">
                      <button onClick={() => onCurrencyChange('BRL')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${selectedCurrency === 'BRL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>BRL</button>
                      <button onClick={() => onCurrencyChange('USD')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${selectedCurrency === 'USD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>USD</button>
                  </div>
                  <button onClick={onOpenTransfer} className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                      <SwitchHorizontalIcon className="w-5 h-5" />
                  </button>
                </div>

                <div 
                  className="relative bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl px-5 py-3 flex items-center justify-between cursor-pointer shadow-sm min-w-[200px]"
                  onClick={() => monthInputRef.current?.showPicker()}
                >
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-white capitalize">
                          {new Date(selectedMonth + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                        </span>
                    </div>
                    <ChevronDownIcon className="w-4 h-4 text-slate-300" />
                    <input ref={monthInputRef} type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
            </div>
        </div>

        {/* METRIC CARDS - RESPONSIVO (1, 2 ou 4 colunas) */}
        <div id="tour-metrics-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
            <MetricCard 
              title={t('balance')} 
              value={formatCurrency(totals.saldoTotal)} 
              icon={<CreditCardIcon className="h-7 w-7 text-blue-500" />} 
              valueClassName={totals.saldoTotal < 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}
            />
            <MetricCard title={t('totalInvested')} value={formatCurrency(totals.investido)} icon={<TrendingUpIcon className="h-7 w-7 text-indigo-500" />} />
            <MetricCard title={t('monthlyIncome')} value={formatCurrency(totals.recMes)} icon={<ArrowUpIcon className="h-7 w-7 text-green-500" />} />
            <MetricCard title={t('monthlyExpenses')} value={formatCurrency(totals.gastMes)} icon={<ArrowDownIcon className="h-7 w-7 text-red-500" />} />
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* GRÁFICO */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 md:p-6 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-gray-700 overflow-hidden">
            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-6">Cash Flow Annual</h4>
            <div className="h-[280px] w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} />
                        <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                        <Bar dataKey="income" name="Income" fill="#22C55E" radius={[4, 4, 0, 0]} barSize={10} />
                        <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={10} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* PATRIMÔNIO CARD */}
        <div id="tour-net-worth" className="bg-[#0a1122] p-6 md:p-8 rounded-[1.5rem] shadow-2xl text-white flex flex-col justify-between border border-white/5 relative overflow-hidden min-h-[260px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            <div className="relative z-10">
                <h4 className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] mb-3">Total Net Worth</h4>
                <p className="text-3xl md:text-4xl font-black tracking-tighter mb-3">{formatCurrency(totals.patrimonio)}</p>
                <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Investment Margin</p>
                <p className="text-3xl font-black text-[#22c55e]">
                    {totals.recMes > 0 ? (((totals.recMes - totals.gastMes) / totals.recMes) * 100).toFixed(1) : '0'}%
                </p>
                <div className="w-full bg-white/5 rounded-full h-1.5 mt-4 overflow-hidden">
                    <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(0, totals.recMes > 0 ? ((totals.recMes - totals.gastMes) / totals.recMes) * 100 : 0))}%` }}></div>
                </div>
            </div>
        </div>
      </div>

      {/* METAS & OBJETIVOS WIDGET PREVIEW */}
      <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-gray-700 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                {language === 'pt-BR' ? 'Minhas Metas & Cronogramas' : 'My Goals & Schedules'}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold uppercase">
                  {goals.filter(g => (g.currency || 'BRL') === selectedCurrency).length} {language === 'pt-BR' ? 'ativas' : 'active'}
                </span>
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                {language === 'pt-BR' 
                  ? 'Acompanhe o cronograma mensal e marque as parcelas guardadas'
                  : 'Track your monthly savings schedule and mark saved installments'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActivePage('Metas')}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span>{language === 'pt-BR' ? 'Gerenciar Metas' : 'Manage Goals'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {goals.filter(g => (g.currency || 'BRL') === selectedCurrency).length === 0 ? (
          <div className="py-6 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'pt-BR' ? 'Você ainda não tem metas cadastradas.' : 'No goals registered yet.'}
            </p>
            <p className="text-[11px] text-slate-400 mb-3">
              {language === 'pt-BR' 
                ? 'Ex: "Juntar R$ 1.000 em 6 meses" com cronograma automático de quanto guardar por mês!'
                : 'E.g.: "Save $1,000 in 6 months" with an automatic monthly savings plan!'}
            </p>
            <button
              onClick={() => setActivePage('Metas')}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"
            >
              {language === 'pt-BR' ? '+ Criar Primeira Meta' : '+ Create First Goal'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals
              .filter(g => (g.currency || 'BRL') === selectedCurrency)
              .slice(0, 2)
              .map((goal) => {
                const percent = Math.min(100, Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100));
                const isCompleted = goal.status === 'COMPLETED' || goal.currentAmount >= goal.targetAmount;
                const completedMilestones = (goal.milestones || []).filter(m => m.isCompleted).length;
                const totalMilestones = (goal.milestones || []).length;

                return (
                  <div 
                    key={goal.id} 
                    onClick={() => setActivePage('Metas')}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[180px]">
                        {goal.title}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isCompleted 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        {isCompleted ? '100% ✓' : `${percent}%`}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline text-xs mb-2">
                      <span className="text-[11px] text-slate-400">
                        {language === 'pt-BR' ? 'Guardado: ' : 'Saved: '}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(goal.currentAmount, goal.currency)}
                        </strong>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {language === 'pt-BR' ? 'Alvo: ' : 'Target: '}
                        <strong className="text-slate-700 dark:text-slate-200">
                          {formatCurrency(goal.targetAmount, goal.currency)}
                        </strong>
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>{completedMilestones}/{totalMilestones} {language === 'pt-BR' ? 'meses concluídos' : 'months completed'}</span>
                      <span className="text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-0.5">
                        {language === 'pt-BR' ? 'Ver cronograma' : 'View schedule'}
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* HISTÓRICO */}
      <TransactionsTable 
          transactions={transactions.filter(t => t.date.startsWith(selectedMonth) && t.currency === selectedCurrency).slice(0, 8)} 
          title="History - Recentes" 
          onEdit={onEditTransaction} 
          onDelete={onDeleteTransaction} 
          language={language} 
          currentUser={currentUser}
      />
    </div>
  );
};

export default Dashboard;