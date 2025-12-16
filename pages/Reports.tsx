
import React, { useMemo, useState } from 'react';
import { PersonalTransaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ArrowDownIcon } from '../components/icons/ArrowDownIcon';
import { ArrowUpIcon } from '../components/icons/ArrowUpIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';

interface ReportsProps {
    transactions: PersonalTransaction[];
}

// Cores definidas pelo usuário
const COLOR_RECEITA = '#10B981'; // Verde
const COLOR_DESPESA = '#EF4444'; // Vermelho
const COLOR_APORTE = '#3B82F6'; // Azul (Antes Investimento)

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
    // Estado alterado para Mês (YYYY-MM), igual ao Dashboard
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    const formatCurrency = (value: number) => {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Helper para identificar categorias de aporte
    // FIX: Proteção contra categoria nula/undefined
    const isInvestmentCategory = (category: string) => {
        if (!category) return false;
        const cat = category.toLowerCase().trim();
        return cat === 'investimentos' || cat === 'investimento' || cat === 'aporte' || cat === 'aportes';
    };

    // Extrai o ano do mês selecionado para o gráfico de evolução
    const selectedYear = selectedMonth.split('-')[0];

    // 1. Totais do MÊS SELECIONADO (Para Cards e Gráfico de Pizza)
    const monthTotals = useMemo(() => {
        let rec = 0;
        let desp = 0;
        let inv = 0;

        transactions.forEach(t => {
            if (t.date.startsWith(selectedMonth)) {
                if (t.type === TransactionType.Receita) {
                    rec += (t.amount || 0);
                } else {
                    if (isInvestmentCategory(t.category)) {
                        inv += (t.amount || 0);
                    } else {
                        desp += (t.amount || 0);
                    }
                }
            }
        });

        return { rec, desp, inv, saldo: rec - desp - inv };
    }, [transactions, selectedMonth]);

    // 2. Dados para Tabela de Categorias (Filtrado pelo MÊS SELECIONADO)
    const categoryData = useMemo(() => {
        const categories: Record<string, number> = {};
        
        transactions.forEach(t => {
            if (t.type === TransactionType.Despesa && t.date.startsWith(selectedMonth) && !isInvestmentCategory(t.category)) {
                const catName = t.category || 'Outros'; // Fallback para categoria
                if (!categories[catName]) {
                    categories[catName] = 0;
                }
                categories[catName] += (t.amount || 0);
            }
        });

        return Object.keys(categories).map(key => ({
            name: key,
            value: categories[key]
        })).sort((a, b) => b.value - a.value); 
    }, [transactions, selectedMonth]);

    // 3. Dados para Gráfico de Evolução Mensal (Contexto do ANO TODO do mês selecionado)
    const monthlyData = useMemo(() => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const data = months.map(m => ({ name: m, Receitas: 0, Despesas: 0, Aportes: 0, Saldo: 0 }));

        transactions.forEach(t => {
            if (!t.date) return;
            
            if (t.date.startsWith(selectedYear)) {
                const parts = t.date.split('-');
                if (parts.length < 2) return;

                const monthIndex = parseInt(parts[1]) - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    const amount = t.amount || 0;
                    if (t.type === TransactionType.Receita) {
                        data[monthIndex].Receitas += amount;
                    } else {
                        if (isInvestmentCategory(t.category)) {
                            data[monthIndex].Aportes += amount;
                        } else {
                            data[monthIndex].Despesas += amount;
                        }
                    }
                }
            }
        });
        
        return data.map(d => ({
            ...d,
            Saldo: d.Receitas - d.Despesas - d.Aportes
        }));

    }, [transactions, selectedYear]);

    // 4. Dados para o Gráfico de Pizza (Baseado nos totais do MÊS)
    const pieData = useMemo(() => {
        return [
            { name: 'Receitas', value: monthTotals.rec, color: COLOR_RECEITA },
            { name: 'Aportes', value: monthTotals.inv, color: COLOR_APORTE }, // Label alterada para Aportes
            { name: 'Despesas', value: monthTotals.desp, color: COLOR_DESPESA }
        ].filter(item => item.value > 0); 
    }, [monthTotals]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">Relatórios Avançados</h3>
                
                {/* Filtro igual ao do Dashboard */}
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex items-center">
                    <label htmlFor="month-filter-reports" className="mr-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                        Período:
                    </label>
                    <input 
                        type="month" 
                        id="month-filter-reports"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5 outline-none"
                    />
                </div>
            </div>

            {/* Cards de Resumo MENSAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400">
                            <ArrowUpIcon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Receita (Mês)</span>
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(monthTotals.rec)}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
                            <ArrowDownIcon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Despesas (Mês)</span>
                    </div>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(monthTotals.desp)}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                            <TrendingUpIcon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Aportes (Mês)</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(monthTotals.inv)}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                            <ArrowUpIcon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Saldo (Mês)</span>
                    </div>
                    <p className={`text-xl font-bold ${monthTotals.saldo >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(monthTotals.saldo)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Área */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Evolução em {selectedYear}</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLOR_RECEITA} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={COLOR_RECEITA} stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLOR_DESPESA} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={COLOR_DESPESA} stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorAporte" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLOR_APORTE} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={COLOR_APORTE} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#9CA3AF" />
                                <YAxis hide />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#9CA3AF" opacity={0.3} />
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{
                                        backgroundColor: '#fff', 
                                        border: '1px solid #e5e7eb', 
                                        borderRadius: '0.5rem',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        color: '#000'
                                    }}
                                />
                                <Area type="monotone" dataKey="Receitas" stroke={COLOR_RECEITA} fillOpacity={1} fill="url(#colorRec)" name="Receitas" />
                                <Area type="monotone" dataKey="Despesas" stroke={COLOR_DESPESA} fillOpacity={1} fill="url(#colorDesp)" name="Despesas" />
                                <Area type="monotone" dataKey="Aportes" stroke={COLOR_APORTE} fillOpacity={1} fill="url(#colorAporte)" name="Aportes" />
                                <Legend />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Pizza */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Distribuição em {new Date(selectedMonth + '-02').toLocaleDateString('pt-BR', { month: 'long' })}</h4>
                    {pieData.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{
                                            backgroundColor: '#fff', 
                                            border: '1px solid #e5e7eb', 
                                            borderRadius: '0.5rem',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            color: '#000'
                                        }} 
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                            Sem dados suficientes neste mês.
                        </div>
                    )}
                </div>
            </div>

             {/* Tabela Detalhada de Categorias */}
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white">Detalhamento de Gastos (Por Categoria)</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3">Categoria</th>
                                <th className="px-6 py-3 text-right">Valor Total</th>
                                <th className="px-6 py-3 text-right">% das Despesas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-900 dark:text-white">
                            {categoryData.map((cat, idx) => {
                                const percentage = monthTotals.desp > 0 ? ((cat.value / monthTotals.desp) * 100).toFixed(1) : '0';
                                return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium flex items-center">
                                            <div className="w-3 h-3 rounded-full mr-3 bg-gray-400 dark:bg-gray-500"></div>
                                            {cat.name}
                                        </td>
                                        <td className="px-6 py-4 text-right">{formatCurrency(cat.value)}</td>
                                        <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">{percentage}%</td>
                                    </tr>
                                );
                            })}
                             {categoryData.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Nenhum dado de despesa neste mês.</td>
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
