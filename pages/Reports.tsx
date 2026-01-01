
import React, { useMemo, useState } from 'react';
import { PersonalTransaction, TransactionType, Currency, Language, Investment } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ArrowDownIcon } from '../components/icons/ArrowDownIcon';
import { ArrowUpIcon } from '../components/icons/ArrowUpIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { CreditCardIcon } from '../components/icons/CreditCardIcon';
import { useTranslation } from '../translations';

interface ReportsProps {
    transactions: PersonalTransaction[];
    investments: Investment[];
    language: Language;
    selectedCurrency: Currency;
    onCurrencyChange: (currency: Currency) => void;
}

const COLOR_RECEITA = '#10B981';
const COLOR_DESPESA = '#EF4444';
const COLOR_APORTE = '#6366F1';
const COLOR_SALDO = '#3B82F6';

const Reports: React.FC<ReportsProps> = ({ transactions, investments, language, selectedCurrency, onCurrencyChange }) => {
    const t = useTranslation(language);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    const formatCurrency = (value: number) => {
        if (selectedCurrency === 'BRL') {
            return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Função padronizada para identificar o que é INVESTIMENTO/CÂMBIO/APORTE
    // Isso garante que esses valores saiam do "Custo de Vida" (Despesa Real)
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

    const selectedYear = selectedMonth.split('-')[0];

    // Cálculos do Mês Selecionado
    const monthTotals = useMemo(() => {
        let rec = 0; // Receitas
        let despReal = 0; // Custo de Vida (Despesas que não são investimentos)
        let aportesMes = 0; // Aportes realizados no mês (Transações do tipo Despesa marcadas como investimento)
        
        transactions.forEach(t => {
            const txCurrency = t.currency || 'BRL';
            if (t.date.startsWith(selectedMonth) && txCurrency === selectedCurrency) {
                const amount = Number(t.amount) || 0;
                if (t.type === TransactionType.Receita) {
                    rec += amount;
                } else if (t.type === TransactionType.Despesa) {
                    if (isInternalTransfer(t.category)) {
                        aportesMes += amount;
                    } else {
                        despReal += amount;
                    }
                }
            }
        });

        // Saldo disponível gerado no mês: O que sobrou na conta (Receita - Tudo que saiu, incluindo aportes)
        const saldoGeradoMes = rec - (despReal + aportesMes);

        // Patrimônio Total (Soma de todos os ativos da aba Investimentos)
        const patrimonioTotalAtivos = (investments || [])
            .filter(i => (i.currency || 'BRL') === selectedCurrency)
            .reduce((acc, inv) => acc + (Number(inv.currentValue) || 0), 0);

        return { rec, despReal, aportesMes, saldoGeradoMes, patrimonioTotalAtivos };
    }, [transactions, investments, selectedMonth, selectedCurrency]);

    // Dados para o Gráfico de Evolução Anual
    const monthlyData = useMemo(() => {
        const months = language === 'pt-BR' 
            ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const data = months.map(m => ({ name: m, income: 0, expense: 0, investment: 0, balance: 0 }));

        transactions.forEach(t => {
            const txCurrency = t.currency || 'BRL';
            if (t.date.startsWith(selectedYear) && txCurrency === selectedCurrency) {
                const monthIndex = parseInt(t.date.split('-')[1]) - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    const amount = Number(t.amount) || 0;
                    if (t.type === TransactionType.Receita) {
                        data[monthIndex].income += amount;
                    } else if (t.type === TransactionType.Despesa) {
                        if (isInternalTransfer(t.category)) {
                            data[monthIndex].investment += amount;
                        } else {
                            data[monthIndex].expense += amount;
                        }
                    }
                }
            }
        });

        // Calcula o saldo de cada mês para o gráfico
        return data.map(d => ({
            ...d,
            balance: d.income - (d.expense + d.investment)
        }));
    }, [transactions, selectedYear, selectedCurrency, language]);

    const pieData = useMemo(() => {
        return [
            { name: t('income'), value: monthTotals.rec, color: COLOR_RECEITA },
            { name: t('costOfLiving'), value: monthTotals.despReal, color: COLOR_DESPESA },
            { name: `Aportes Mensais`, value: monthTotals.aportesMes, color: COLOR_APORTE }
        ].filter(item => item.value > 0); 
    }, [monthTotals, t]);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">{t('reports')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Visão Geral Detalhada ({selectedCurrency})</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex gap-1">
                        <button onClick={() => onCurrencyChange('BRL')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'BRL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>BRL</button>
                        <button onClick={() => onCurrencyChange('USD')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCurrency === 'USD' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>USD</button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none text-gray-700 dark:text-white text-sm font-bold p-1 outline-none cursor-pointer" />
                    </div>
                </div>
            </div>

            {/* CARDS DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Receita Total */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-3 mb-2 text-green-600">
                        <ArrowUpIcon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">{t('income')}</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(monthTotals.rec)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Total recebido no mês</p>
                </div>
                
                {/* Custo de Vida (Gasto Real) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-3 mb-2 text-red-600">
                        <ArrowDownIcon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">{t('costOfLiving')}</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(monthTotals.despReal)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Despesas fixas e variáveis</p>
                </div>

                {/* Aportes Mensais */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-3 mb-2 text-indigo-600">
                        <TrendingUpIcon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Aportes / Investimentos</span>
                    </div>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(monthTotals.aportesMes)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Total aportado no mês</p>
                </div>

                {/* Saldo Final (Em Conta) */}
                <div className="bg-blue-600 p-6 rounded-2xl shadow-xl text-white hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <CreditCardIcon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Saldo em Conta</span>
                    </div>
                    <p className="text-2xl font-black">
                        {formatCurrency(monthTotals.saldoGeradoMes)}
                    </p>
                    <p className="text-[10px] mt-1 opacity-70">O que sobrou após despesas e aportes</p>
                </div>
            </div>

            {/* SEÇÃO DE GRÁFICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Evolução de Fluxo */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-8">Evolução de Fluxo ({selectedYear} - {selectedCurrency})</h4>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLOR_RECEITA} stopOpacity={0.3}/><stop offset="95%" stopColor={COLOR_RECEITA} stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLOR_DESPESA} stopOpacity={0.3}/><stop offset="95%" stopColor={COLOR_DESPESA} stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLOR_SALDO} stopOpacity={0.3}/><stop offset="95%" stopColor={COLOR_SALDO} stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                                <YAxis hide />
                                <Tooltip formatter={(v: number) => formatCurrency(v)} labelStyle={{ fontWeight: 'bold' }} contentStyle={{ borderRadius: '12px', border: 'none', shadow: 'none' }} />
                                <Legend verticalAlign="top" height={36}/>
                                <Area type="monotone" name={t('income')} dataKey="income" stroke={COLOR_RECEITA} fill="url(#colorRec)" strokeWidth={3} />
                                <Area type="monotone" name={t('costOfLiving')} dataKey="expense" stroke={COLOR_DESPESA} fill="url(#colorDesp)" strokeWidth={3} />
                                <Area type="monotone" name="Saldo Final" dataKey="balance" stroke={COLOR_SALDO} fill="url(#colorSaldo)" strokeWidth={2} strokeDasharray="3 3" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                {/* Composição das Despesas */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-8">Onde seu dinheiro está indo? ({selectedCurrency})</h4>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value">
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-500">Patrimônio Total em Ativos:</span>
                            <span className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(monthTotals.patrimonioTotalAtivos)}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">Esse valor representa a soma de todos os seus ativos cadastrados na aba Investimentos, independente da movimentação deste mês.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
