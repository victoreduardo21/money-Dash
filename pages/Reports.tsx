
import React, { useMemo, useState } from 'react';
import { PersonalTransaction, TransactionType, Currency, Language } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ArrowDownIcon } from '../components/icons/ArrowDownIcon';
import { ArrowUpIcon } from '../components/icons/ArrowUpIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { useTranslation } from '../translations';

interface ReportsProps {
    transactions: PersonalTransaction[];
    language: Language;
    selectedCurrency: Currency;
    onCurrencyChange: (currency: Currency) => void;
}

const COLOR_RECEITA = '#10B981';
const COLOR_DESPESA = '#EF4444';
const COLOR_APORTE = '#6366F1';

const Reports: React.FC<ReportsProps> = ({ transactions, language, selectedCurrency, onCurrencyChange }) => {
    const t = useTranslation(language);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    const formatCurrency = (value: number) => {
        if (selectedCurrency === 'BRL') {
            return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const isInvestmentCategory = (category: string) => {
        if (!category) return false;
        const cat = category.toLowerCase().trim();
        return cat === 'investimentos' || cat === 'investimento' || cat === 'aporte' || cat === 'aportes';
    };

    const selectedYear = selectedMonth.split('-')[0];

    const monthTotals = useMemo(() => {
        let rec = 0, desp = 0, inv = 0;
        transactions.forEach(t => {
            if (t.date.startsWith(selectedMonth) && t.currency === selectedCurrency) {
                const amount = Number(t.amount) || 0;
                if (t.type === TransactionType.Receita) rec += amount;
                else if (isInvestmentCategory(t.category)) inv += amount;
                else desp += amount;
            }
        });
        return { rec, desp, inv, fluxoLiquido: rec - desp };
    }, [transactions, selectedMonth, selectedCurrency]);

    const monthlyData = useMemo(() => {
        const months = language === 'pt-BR' 
            ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = months.map(m => ({ name: m, income: 0, expense: 0, investment: 0 }));

        transactions.forEach(t => {
            if (t.date.startsWith(selectedYear) && t.currency === selectedCurrency) {
                const monthIndex = parseInt(t.date.split('-')[1]) - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    const amount = Number(t.amount) || 0;
                    if (t.type === TransactionType.Receita) data[monthIndex].income += amount;
                    else if (isInvestmentCategory(t.category)) data[monthIndex].investment += amount;
                    else data[monthIndex].expense += amount;
                }
            }
        });
        return data;
    }, [transactions, selectedYear, selectedCurrency, language]);

    const pieData = useMemo(() => {
        return [
            { name: t('income'), value: monthTotals.rec, color: COLOR_RECEITA },
            { name: t('investments'), value: monthTotals.inv, color: COLOR_APORTE },
            { name: t('costOfLiving'), value: monthTotals.desp, color: COLOR_DESPESA }
        ].filter(item => item.value > 0); 
    }, [monthTotals, t]);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{t('reports')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('summary')} em {selectedCurrency}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex">
                        <button onClick={() => onCurrencyChange('BRL')} className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedCurrency === 'BRL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>BRL</button>
                        <button onClick={() => onCurrencyChange('USD')} className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedCurrency === 'USD' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>USD</button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none text-gray-700 dark:text-white text-sm font-bold p-1 outline-none" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2 text-green-600"><ArrowUpIcon className="w-5 h-5" /><span className="text-xs font-black uppercase tracking-wider">{t('income')}</span></div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(monthTotals.rec)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2 text-red-600"><ArrowDownIcon className="w-5 h-5" /><span className="text-xs font-black uppercase tracking-wider">{t('costOfLiving')}</span></div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(monthTotals.desp)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2 text-indigo-600"><TrendingUpIcon className="w-5 h-5" /><span className="text-xs font-black uppercase tracking-wider">{t('investments')}</span></div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(monthTotals.inv)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2 text-blue-600"><ArrowUpIcon className="w-5 h-5" /><span className="text-xs font-black uppercase tracking-wider">{t('margin')}</span></div>
                    <p className={`text-2xl font-black ${monthTotals.fluxoLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(monthTotals.fluxoLiquido)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border dark:border-gray-700">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-8">{t('evolution')} ({selectedYear} - {selectedCurrency})</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLOR_RECEITA} stopOpacity={0.3}/><stop offset="95%" stopColor={COLOR_RECEITA} stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLOR_DESPESA} stopOpacity={0.3}/><stop offset="95%" stopColor={COLOR_DESPESA} stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                                <YAxis hide />
                                <Tooltip formatter={(v: number) => formatCurrency(v)} labelStyle={{ fontWeight: 'bold' }} />
                                <Legend />
                                <Area type="monotone" name={t('income')} dataKey="income" stroke={COLOR_RECEITA} fill="url(#colorRec)" strokeWidth={3} />
                                <Area type="monotone" name={t('expense')} dataKey="expense" stroke={COLOR_DESPESA} fill="url(#colorDesp)" strokeWidth={3} />
                                <Area type="monotone" name={t('investments')} dataKey="investment" stroke={COLOR_APORTE} fill={COLOR_APORTE} fillOpacity={0.2} strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border dark:border-gray-700">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-8">{t('composition')} ({selectedCurrency})</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
