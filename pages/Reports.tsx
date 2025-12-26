
import React, { useMemo, useState } from 'react';
import { PersonalTransaction, TransactionType, Currency } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ArrowDownIcon } from '../components/icons/ArrowDownIcon';
import { ArrowUpIcon } from '../components/icons/ArrowUpIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';

interface ReportsProps {
    transactions: PersonalTransaction[];
}

const COLOR_RECEITA = '#10B981'; // Verde
const COLOR_DESPESA = '#EF4444'; // Vermelho
const COLOR_APORTE = '#6366F1';  // Indigo/Azul

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>('BRL');

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

    // 1. TOTAIS DO MÊS SELECIONADO (Filtrado por Moeda)
    const monthTotals = useMemo(() => {
        let rec = 0;
        let desp = 0;
        let inv = 0;

        transactions.forEach(t => {
            if (t.date.startsWith(selectedMonth) && t.currency === selectedCurrency) {
                const amount = Number(t.amount) || 0;
                if (t.type === TransactionType.Receita) {
                    rec += amount;
                } else {
                    if (isInvestmentCategory(t.category)) {
                        inv += amount;
                    } else {
                        desp += amount;
                    }
                }
            }
        });

        return { rec, desp, inv, saldoDisponivel: rec - desp - inv, fluxoLiquido: rec - desp };
    }, [transactions, selectedMonth, selectedCurrency]);

    // 2. DISTRIBUIÇÃO DE GASTOS POR CATEGORIA (Excluindo Investimentos e Filtrado por Moeda)
    const categoryData = useMemo(() => {
        const categories: Record<string, number> = {};
        
        transactions.forEach(t => {
            if (t.type === TransactionType.Despesa && t.date.startsWith(selectedMonth) && !isInvestmentCategory(t.category) && t.currency === selectedCurrency) {
                const catName = t.category || 'Outros';
                categories[catName] = (categories[catName] || 0) + (Number(t.amount) || 0);
            }
        });

        return Object.keys(categories).map(key => ({
            name: key,
            value: categories[key]
        })).sort((a, b) => b.value - a.value); 
    }, [transactions, selectedMonth, selectedCurrency]);

    // 3. EVOLUÇÃO MENSAL NO ANO (Filtrado por Moeda)
    const monthlyData = useMemo(() => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const data = months.map(m => ({ name: m, Receitas: 0, Despesas: 0, Aportes: 0 }));

        transactions.forEach(t => {
            if (t.date.startsWith(selectedYear) && t.currency === selectedCurrency) {
                const monthIndex = parseInt(t.date.split('-')[1]) - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    const amount = Number(t.amount) || 0;
                    if (t.type === TransactionType.Receita) {
                        data[monthIndex].Receitas += amount;
                    } else if (isInvestmentCategory(t.category)) {
                        data[monthIndex].Aportes += amount;
                    } else {
                        data[monthIndex].Despesas += amount;
                    }
                }
            }
        });
        
        return data;
    }, [transactions, selectedYear, selectedCurrency]);

    // 4. DADOS PARA O GRÁFICO DE PIZZA
    const pieData = useMemo(() => {
        return [
            { name: 'Receitas', value: monthTotals.rec, color: COLOR_RECEITA },
            { name: 'Aportes', value: monthTotals.inv, color: COLOR_APORTE },
            { name: 'Custo de Vida', value: monthTotals.desp, color: COLOR_DESPESA }
        ].filter(item => item.value > 0); 
    }, [monthTotals]);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white">Relatórios Avançados</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Análise profunda do seu fluxo financeiro em {selectedCurrency}</p>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Seletor de Moeda */}
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

                    <div className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex items-center">
                        <input 
                            type="month" 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none text-gray-700 dark:text-white text-sm font-bold p-1 focus:ring-0 outline-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2 text-green-600">
                        <ArrowUpIcon className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-wider">Receitas</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(monthTotals.rec)}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2 text-red-600">
                        <ArrowDownIcon className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-wider">Custo de Vida</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(monthTotals.desp)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">*Exclui investimentos</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2 text-indigo-600">
                        <TrendingUpIcon className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-wider">Aportes</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(monthTotals.inv)}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2 text-blue-600">
                        <ArrowUpIcon className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-wider">Margem Líquida</span>
                    </div>
                    <p className={`text-2xl font-black ${monthTotals.fluxoLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(monthTotals.fluxoLiquido)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Sobra p/ investir</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico de Evolução */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-8">Evolução ({selectedYear} - {selectedCurrency})</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLOR_RECEITA} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={COLOR_RECEITA} stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLOR_DESPESA} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={COLOR_DESPESA} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                                <YAxis hide />
                                <Tooltip 
                                    formatter={(v: number) => formatCurrency(v)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="Receitas" stroke={COLOR_RECEITA} fillOpacity={1} fill="url(#colorRec)" strokeWidth={3} />
                                <Area type="monotone" dataKey="Despesas" stroke={COLOR_DESPESA} fillOpacity={1} fill="url(#colorDesp)" strokeWidth={3} />
                                <Area type="monotone" dataKey="Aportes" stroke={COLOR_APORTE} fillOpacity={0.5} fill={COLOR_APORTE} strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Pizza */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-8">Composição do Fluxo ({selectedCurrency})</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Ranking de Despesas */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white">Gastos de Consumo em {selectedCurrency}</h4>
                    <span className="text-xs font-bold text-gray-400 uppercase">Top Categorias</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                <th className="px-8 py-4">Categoria</th>
                                <th className="px-8 py-4 text-right">Valor Acumulado</th>
                                <th className="px-8 py-4 text-right">Representatividade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {categoryData.map((cat, idx) => {
                                const percentage = monthTotals.desp > 0 ? ((cat.value / monthTotals.desp) * 100).toFixed(1) : '0';
                                return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-8 py-4 font-bold text-gray-800 dark:text-white flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                            {cat.name}
                                        </td>
                                        <td className="px-8 py-4 text-right font-black text-gray-900 dark:text-white">{formatCurrency(cat.value)}</td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-indigo-500 h-full" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-500 min-w-[40px]">{percentage}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {categoryData.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-8 py-12 text-center text-gray-400">Nenhuma despesa registrada em {selectedCurrency} para este mês.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
