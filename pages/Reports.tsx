
import React, { useMemo, useState } from 'react';
import { PersonalTransaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { ArrowDownIcon } from '../components/icons/ArrowDownIcon';
import { ArrowUpIcon } from '../components/icons/ArrowUpIcon';

interface ReportsProps {
    transactions: PersonalTransaction[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

    const formatCurrency = (value: number) => {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // 1. Dados para Gráfico de Pizza (Despesas por Categoria)
    const categoryData = useMemo(() => {
        const categories: Record<string, number> = {};
        
        transactions.forEach(t => {
            if (t.type === TransactionType.Despesa && t.date.startsWith(yearFilter)) {
                if (!categories[t.category]) {
                    categories[t.category] = 0;
                }
                categories[t.category] += t.amount;
            }
        });

        return Object.keys(categories).map(key => ({
            name: key,
            value: categories[key]
        })).sort((a, b) => b.value - a.value); // Ordenar do maior para o menor
    }, [transactions, yearFilter]);

    // 2. Dados para Gráfico de Evolução Mensal (Receita vs Despesa)
    const monthlyData = useMemo(() => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const data = months.map(m => ({ name: m, Receitas: 0, Despesas: 0, Saldo: 0 }));

        transactions.forEach(t => {
            if (t.date.startsWith(yearFilter)) {
                const monthIndex = parseInt(t.date.split('-')[1]) - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    if (t.type === TransactionType.Receita) {
                        data[monthIndex].Receitas += t.amount;
                    } else {
                        data[monthIndex].Despesas += t.amount;
                    }
                }
            }
        });
        
        // Calcular saldo
        return data.map(d => ({
            ...d,
            Saldo: d.Receitas - d.Despesas
        }));

    }, [transactions, yearFilter]);

    // Totais do Ano
    const totals = useMemo(() => {
        const rec = monthlyData.reduce((acc, curr) => acc + curr.Receitas, 0);
        const desp = monthlyData.reduce((acc, curr) => acc + curr.Despesas, 0);
        return { rec, desp, saldo: rec - desp };
    }, [monthlyData]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-3xl font-bold text-gray-800">Relatórios Avançados</h3>
                
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex items-center">
                    <label className="mr-2 text-sm font-medium text-gray-600">Ano:</label>
                    <select 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="bg-gray-50 border-none text-sm font-bold text-gray-800 focus:ring-0 cursor-pointer"
                    >
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
            </div>

            {/* Cards de Resumo Anual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-green-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <ArrowUpIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-gray-500 uppercase">Receita Anual</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.rec)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-red-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <ArrowDownIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-gray-500 uppercase">Despesa Anual</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.desp)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <ArrowUpIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-gray-500 uppercase">Saldo Anual</span>
                    </div>
                    <p className={`text-2xl font-bold ${totals.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatCurrency(totals.saldo)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Pizza - Categorias */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                    <h4 className="text-lg font-bold text-gray-800 mb-6">Despesas por Categoria</h4>
                    {categoryData.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                            Sem despesas registradas neste ano.
                        </div>
                    )}
                </div>

                {/* Gráfico de Área - Fluxo de Caixa */}
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                    <h4 className="text-lg font-bold text-gray-800 mb-6">Fluxo de Caixa Mensal</h4>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#9CA3AF" />
                                <YAxis hide />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Area type="monotone" dataKey="Receitas" stroke="#10B981" fillOpacity={1} fill="url(#colorRec)" />
                                <Area type="monotone" dataKey="Despesas" stroke="#EF4444" fillOpacity={1} fill="url(#colorDesp)" />
                                <Legend />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

             {/* Tabela Detalhada de Categorias */}
             <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h4 className="text-lg font-bold text-gray-800">Detalhamento por Categoria</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Categoria</th>
                                <th className="px-6 py-3 text-right">Valor Total</th>
                                <th className="px-6 py-3 text-right">% do Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {categoryData.map((cat, idx) => {
                                const percentage = ((cat.value / totals.desp) * 100).toFixed(1);
                                return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                                            <div className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                                            {cat.name}
                                        </td>
                                        <td className="px-6 py-4 text-right">{formatCurrency(cat.value)}</td>
                                        <td className="px-6 py-4 text-right text-gray-500">{percentage}%</td>
                                    </tr>
                                );
                            })}
                             {categoryData.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Nenhum dado para exibir.</td>
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
