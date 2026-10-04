import React, { useState, useMemo } from 'react';
import { Investment, Goal, Currency, Language } from '../types';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ArrowDownIcon } from '../components/icons/ArrowDownIcon';
import InvestmentModal from '../components/InvestmentModal';
import { GoalDepositModal } from '../components/GoalDepositModal';
import GoalModal from '../components/GoalModal';
import { useTranslation } from '../translations';
import { Target, PiggyBank, ArrowUpRight, ExternalLink, Sparkles } from 'lucide-react';

interface InvestmentsProps {
    investments: Investment[];
    setInvestments: React.Dispatch<React.SetStateAction<Investment[]>>;
    onSaveInvestment: (investment: Omit<Investment, 'id'> & { id?: string }) => void;
    onDeleteInvestment: (id: string) => void;
    onWithdrawInvestment: (id: string) => void;
    language: Language;
    goals?: Goal[];
    onDepositToGoal?: (goalId: string, amount: number, milestoneId?: string, deductFromBalance?: boolean, date?: string, note?: string) => void;
    onWithdrawGoal?: (goalId: string, amount?: number) => void;
    onSaveGoal?: (goal: Omit<Goal, 'id'> & { id?: string }, initialDeductFromBalance?: boolean) => void;
    onDeleteGoal?: (id: string) => void;
    setActivePage?: (page: any) => void;
}

type TabFilter = 'ALL' | 'ASSETS' | 'GOALS';

const Investments: React.FC<InvestmentsProps> = ({ 
    investments = [], 
    onSaveInvestment, 
    onDeleteInvestment, 
    onWithdrawInvestment, 
    language,
    goals = [],
    onDepositToGoal,
    onWithdrawGoal,
    onSaveGoal,
    onDeleteGoal,
    setActivePage
}) => {
    const t = useTranslation(language);
    const isPT = language === 'pt-BR';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
    const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<Goal | null>(null);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [activeTab, setActiveTab] = useState<TabFilter>('ALL');

    const formatCurrency = (value: number, currency: Currency = 'BRL') => {
        if (currency === 'BRL') {
            return `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `$ ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Separate traditional portfolio assets from goal-linked investment assets
    const traditionalInvestments = useMemo(() => {
        return (investments || []).filter(i => !i.goalId && !i.name.startsWith('Meta: ') && !i.name.startsWith('🎯 Meta: '));
    }, [investments]);

    // Any goal investment in the investments collection that doesn't correspond to an existing goal object
    const orphanGoalInvestments = useMemo(() => {
        return (investments || []).filter(i => 
            (Boolean(i.goalId) || i.name.startsWith('Meta: ') || i.name.startsWith('🎯 Meta: ')) &&
            !goals.some(g => g.id === i.goalId || `goal_inv_${g.id}` === i.id)
        );
    }, [investments, goals]);

    // Calculate aggregated statistics combining traditional investments and saved goals
    const stats = useMemo(() => {
        const brlInvestments = traditionalInvestments.filter(i => (i.currency || 'BRL').toUpperCase() === 'BRL');
        const usdInvestments = traditionalInvestments.filter(i => (i.currency || '').toUpperCase() === 'USD');

        const brlGoals = (goals || []).filter(g => (g.currency || 'BRL').toUpperCase() === 'BRL');
        const usdGoals = (goals || []).filter(g => (g.currency || '').toUpperCase() === 'USD');

        const orphanBrl = orphanGoalInvestments.filter(i => (i.currency || 'BRL').toUpperCase() === 'BRL');
        const orphanUsd = orphanGoalInvestments.filter(i => (i.currency || '').toUpperCase() === 'USD');

        const investBrl = brlInvestments.reduce((acc, i) => acc + (Number(i.currentValue) || 0), 0);
        const goalsBrl = brlGoals.reduce((acc, g) => acc + (Number(g.currentAmount) || 0), 0) +
                         orphanBrl.reduce((acc, i) => acc + (Number(i.currentValue) || 0), 0);

        const investUsd = usdInvestments.reduce((acc, i) => acc + (Number(i.currentValue) || 0), 0);
        const goalsUsd = usdGoals.reduce((acc, g) => acc + (Number(g.currentAmount) || 0), 0) +
                         orphanUsd.reduce((acc, i) => acc + (Number(i.currentValue) || 0), 0);

        return {
            totalBrl: investBrl + goalsBrl,
            investBrl,
            goalsBrl,
            rentabilidadeBrl: brlInvestments.reduce((acc, i) => acc + ((Number(i.currentValue) || 0) - (Number(i.initialAmount) || 0)), 0),

            totalUsd: investUsd + goalsUsd,
            investUsd,
            goalsUsd,
            rentabilidadeUsd: usdInvestments.reduce((acc, i) => acc + ((Number(i.currentValue) || 0) - (Number(i.initialAmount) || 0)), 0)
        };
    }, [traditionalInvestments, goals, orphanGoalInvestments]);

    const handleOpenModal = (investment: Investment | null) => {
        setSelectedInvestment(investment);
        setIsModalOpen(true);
    };

    const handleWithdraw = (inv: Investment) => {
        const confirmMsg = isPT
            ? `Deseja retirar ${formatCurrency(inv.currentValue, inv.currency)} de "${inv.name}"? O valor será adicionado ao seu saldo disponível.`
            : `Do you want to withdraw ${formatCurrency(inv.currentValue, inv.currency)} from "${inv.name}"? The amount will be added to your available balance.`;
        
        if (window.confirm(confirmMsg)) {
            onWithdrawInvestment(inv.id);
        }
    };

    const handleWithdrawGoalAction = (goal: Goal) => {
        const current = Number(goal.currentAmount) || 0;
        if (current <= 0) {
            alert(isPT ? 'Esta meta ainda não possui saldo guardado para resgate.' : 'This goal has no saved balance to withdraw.');
            return;
        }

        const confirmMsg = isPT
            ? `Deseja resgatar ${formatCurrency(current, goal.currency)} da meta "${goal.title}"? O valor retornará diretamente para a sua conta corrente (saldo disponível).`
            : `Do you want to withdraw ${formatCurrency(current, goal.currency)} from "${goal.title}"? The funds will return to your available balance.`;

        if (window.confirm(confirmMsg)) {
            if (onWithdrawGoal) {
                onWithdrawGoal(goal.id, current);
            }
        }
    };

    const handleDeleteGoalAction = (goal: Goal) => {
        const confirmMsg = isPT
            ? `Deseja realmente excluir a meta "${goal.title}" e seu registro em Investimentos?`
            : `Are you sure you want to delete the goal "${goal.title}" and its investment record?`;

        if (window.confirm(confirmMsg)) {
            if (onDeleteGoal) {
                onDeleteGoal(goal.id);
            }
        }
    };

    const totalTraditionalCount = traditionalInvestments.length;
    const totalGoalsCount = (goals || []).length + orphanGoalInvestments.length;
    const totalItemsCount = totalTraditionalCount + totalGoalsCount;

    return (
        <div className="space-y-6">
            {/* MODAL PARA INVESTIMENTOS TRADICIONAIS */}
            <InvestmentModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={(inv) => { onSaveInvestment(inv); setIsModalOpen(false); }}
                investment={selectedInvestment}
                language={language}
            />

            {/* MODAL PARA CRIAR / EDITAR METAS DIRETAMENTE DE INVESTIMENTOS */}
            {onSaveGoal && (
                <GoalModal
                    isOpen={isGoalModalOpen}
                    onClose={() => {
                        setIsGoalModalOpen(false);
                        setEditingGoal(null);
                    }}
                    onSave={(goalData, deduct) => {
                        onSaveGoal(goalData, deduct);
                        setIsGoalModalOpen(false);
                        setEditingGoal(null);
                    }}
                    goal={editingGoal}
                    language={language}
                />
            )}

            {/* MODAL PARA APORTAR EM METAS DIRETAMENTE DE INVESTIMENTOS */}
            <GoalDepositModal
                isOpen={Boolean(selectedGoalForDeposit)}
                onClose={() => setSelectedGoalForDeposit(null)}
                goal={selectedGoalForDeposit}
                milestone={null}
                onConfirmDeposit={(goalId, amount, milestoneId, deduct, date, note) => {
                    if (onDepositToGoal) {
                        onDepositToGoal(goalId, amount, milestoneId, deduct, date, note);
                    }
                    setSelectedGoalForDeposit(null);
                }}
                language={language}
            />

            {/* HEADER COM TÍTULO E BOTÕES DE NOVO ATIVO E NOVA META */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span>{t('investments')}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            Ativos & Metas
                        </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isPT 
                            ? 'Acompanhe seus ativos financeiros e suas reservas guardadas em metas em um só lugar' 
                            : 'Track your financial assets and goal-linked investments all in one place'}
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    {setActivePage && (
                        <button
                            type="button"
                            onClick={() => setActivePage('Metas')}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200/80 dark:border-slate-700 transition-all active:scale-95"
                            title={isPT ? 'Ir para o painel completo de metas' : 'Go to goals'}
                        >
                            <Target className="w-3.5 h-3.5 text-blue-500" />
                            <span>{isPT ? 'Painel de Metas' : 'Goals'}</span>
                        </button>
                    )}

                    {onSaveGoal && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingGoal(null);
                                setIsGoalModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl transition-all font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
                        >
                            <Target className="w-3.5 h-3.5" />
                            <span>{isPT ? '+ Nova Meta' : '+ New Goal'}</span>
                        </button>
                    )}

                    <button 
                        type="button"
                        onClick={() => handleOpenModal(null)} 
                        className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        {t('newAsset')}
                    </button>
                </div>
            </div>
            
            {/* CARDS DE RESUMO (CARTEIRA BRL E USD INTEGRANDO INVESTIMENTOS + METAS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {/* 🇧🇷 CARTEIRA BRL */}
                <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="text-xl">🇧🇷</span> {t('brlWallet')}
                        </h4>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {isPT ? 'Patrimônio Total' : 'Net Worth'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {t('netWorth')}
                            </p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                                {formatCurrency(stats.totalBrl, 'BRL')}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {t('yield')} ({isPT ? 'Ativos' : 'Assets'})
                            </p>
                            <p className={`text-xl font-bold mt-0.5 ${stats.rentabilidadeBrl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {stats.rentabilidadeBrl >= 0 ? '+' : ''}{formatCurrency(stats.rentabilidadeBrl, 'BRL')}
                            </p>
                        </div>
                    </div>

                    {/* DETALHAMENTO DA COMPOSIÇÃO BRL */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                            {isPT ? 'Ativos em Carteira: ' : 'Assets: '}
                            <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(stats.investBrl, 'BRL')}</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                            {isPT ? 'Metas & Reservas: ' : 'Goals: '}
                            <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(stats.goalsBrl, 'BRL')}</strong>
                        </span>
                    </div>
                </div>

                {/* 🇺🇸 CARTEIRA USD */}
                <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="text-xl">🇺🇸</span> {t('usdWallet')}
                        </h4>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            USD Portfolio
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {t('netWorth')}
                            </p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                                {formatCurrency(stats.totalUsd, 'USD')}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {t('yield')} ({isPT ? 'Ativos' : 'Assets'})
                            </p>
                            <p className={`text-xl font-bold mt-0.5 ${stats.rentabilidadeUsd >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {stats.rentabilidadeUsd >= 0 ? '+' : ''}{formatCurrency(stats.rentabilidadeUsd, 'USD')}
                            </p>
                        </div>
                    </div>

                    {/* DETALHAMENTO DA COMPOSIÇÃO USD */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                            {isPT ? 'Ativos em Carteira: ' : 'Assets: '}
                            <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(stats.investUsd, 'USD')}</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                            {isPT ? 'Metas & Reservas: ' : 'Goals: '}
                            <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(stats.goalsUsd, 'USD')}</strong>
                        </span>
                    </div>
                </div>
            </div>
            
            {/* SEÇÃO PRINCIPAL DE ATIVOS & INVESTIMENTOS */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden">
                {/* HEADER COM ABAS DE FILTRO */}
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {isPT ? 'Meus Ativos & Investimentos' : 'My Assets & Investments'}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {isPT ? 'Todos os seus investimentos e metas guardadas' : 'All your investments and goal savings'}
                        </p>
                    </div>

                    {/* TABS DE SELEÇÃO */}
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setActiveTab('ALL')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                                activeTab === 'ALL'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            {isPT ? 'Todos' : 'All'} ({totalItemsCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('ASSETS')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${
                                activeTab === 'ASSETS'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            {isPT ? 'Ativos Financeiros' : 'Assets'} ({totalTraditionalCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('GOALS')}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                                activeTab === 'GOALS'
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Target className="w-3 h-3" />
                            <span>{isPT ? 'Metas & Objetivos' : 'Goals'} ({totalGoalsCount})</span>
                        </button>
                    </div>
                </div>

                {/* EMPTY STATE SE NADA CADASTRADO */}
                {totalItemsCount === 0 && (
                    <div className="p-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                            <TrendingUpIcon className="w-6 h-6" />
                        </div>
                        <h5 className="font-bold text-slate-800 dark:text-slate-200">
                            {isPT ? 'Nenhum investimento ou meta cadastrada' : 'No investments or goals yet'}
                        </h5>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            {isPT 
                                ? 'Cadastre seus ativos financeiros ou crie metas no setor de Metas & Objetivos para acompanhar tudo aqui.' 
                                : 'Add assets or create goals to track them all in one place.'}
                        </p>
                    </div>
                )}

                {/* MOBILE ASSETS & GOALS VIEW */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/60">
                    {/* TRADITIONAL INVESTMENTS */}
                    {(activeTab === 'ALL' || activeTab === 'ASSETS') && traditionalInvestments.map(inv => {
                        const profit = (Number(inv.currentValue) || 0) - (Number(inv.initialAmount) || 0);
                        return (
                            <div key={inv.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
                                            <TrendingUpIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 dark:text-white text-sm">{inv.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-slate-500 uppercase font-black">
                                                    {inv.currency === 'BRL' ? '🇧🇷 BRL' : '🇺🇸 USD'}
                                                </span>
                                                <span className="text-[10px] text-slate-400">•</span>
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    {inv.yieldRate}% CDI/Meta
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleOpenModal(inv)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onDeleteInvestment(inv.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div>
                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{t('currentValue')}</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(inv.currentValue, inv.currency)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{t('yield')}</p>
                                        <p className={`text-sm font-black ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {profit >= 0 ? '+' : ''}{formatCurrency(profit, inv.currency)}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleWithdraw(inv)} 
                                    className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <ArrowDownIcon className="w-3.5 h-3.5" />
                                    <span>Resgatar Valor</span>
                                </button>
                            </div>
                        );
                    })}

                    {/* GOALS INVESTMENTS (METAS E OBJETIVOS) */}
                    {(activeTab === 'ALL' || activeTab === 'GOALS') && (goals || []).map(goal => {
                        const saved = Number(goal.currentAmount) || 0;
                        const target = Number(goal.targetAmount) || 0;
                        const percent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
                        const isDone = saved >= target && target > 0;

                        return (
                            <div key={goal.id} className="p-4 space-y-3 bg-blue-50/20 dark:bg-blue-950/10">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-black text-slate-900 dark:text-white text-sm">{goal.title}</p>
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                                    🎯 Meta
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-slate-500 uppercase font-black">
                                                    {(goal.currency || 'BRL') === 'BRL' ? '🇧🇷 BRL' : '🇺🇸 USD'}
                                                </span>
                                                <span className="text-[10px] text-slate-400">•</span>
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    {goal.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-1">
                                        {onSaveGoal && (
                                            <button 
                                                onClick={() => { setEditingGoal(goal); setIsGoalModalOpen(true); }} 
                                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                                title={isPT ? 'Editar meta' : 'Edit goal'}
                                            >
                                                <EditIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        {onDeleteGoal && (
                                            <button 
                                                onClick={() => handleDeleteGoalAction(goal)} 
                                                className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                                title={isPT ? 'Excluir meta e investimento' : 'Delete goal'}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        {setActivePage && (
                                            <button 
                                                onClick={() => setActivePage('Metas')} 
                                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                                title={isPT ? 'Ver no setor de Metas' : 'View in Goals'}
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                                                {isPT ? 'Total Guardado' : 'Saved Amount'}
                                            </p>
                                            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(saved, goal.currency)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                                                {isPT ? 'Objetivo Total' : 'Target'}
                                            </p>
                                            <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                                                {formatCurrency(target, goal.currency)} ({percent}%)
                                            </p>
                                        </div>
                                    </div>

                                    {/* PROGRESS BAR */}
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setSelectedGoalForDeposit(goal)}
                                        className="py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
                                    >
                                        <PiggyBank className="w-3.5 h-3.5" />
                                        <span>+ Aportar</span>
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={() => handleWithdrawGoalAction(goal)}
                                        className="py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all flex items-center justify-center gap-1 active:scale-95"
                                    >
                                        <ArrowDownIcon className="w-3.5 h-3.5" />
                                        <span>Resgatar</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* ORPHAN GOAL INVESTMENTS (MOBILE) */}
                    {(activeTab === 'ALL' || activeTab === 'GOALS') && orphanGoalInvestments.map(inv => {
                        return (
                            <div key={inv.id} className="p-4 space-y-3 bg-blue-50/20 dark:bg-blue-950/10">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-black text-slate-900 dark:text-white text-sm">{inv.name}</p>
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                                    🎯 Meta
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-slate-500 uppercase font-black">
                                                    {inv.currency === 'BRL' ? '🇧🇷 BRL' : '🇺🇸 USD'}
                                                </span>
                                                <span className="text-[10px] text-slate-400">•</span>
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    {inv.category || 'Meta / Reserva'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => onDeleteInvestment(inv.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div>
                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{isPT ? 'Total Guardado' : 'Saved Amount'}</p>
                                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(inv.currentValue, inv.currency)}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleWithdraw(inv)} 
                                    className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <ArrowDownIcon className="w-3.5 h-3.5" />
                                    <span>Resgatar</span>
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* DESKTOP ASSETS & GOALS VIEW */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-5 py-3.5">{t('asset')} / Meta</th>
                                <th className="px-4 py-3.5 text-center">Tipo</th>
                                <th className="px-4 py-3.5 text-center">Moeda</th>
                                <th className="px-5 py-3.5 text-right">{t('currentValue')} / Guardado</th>
                                <th className="px-5 py-3.5 text-right">Rendimento / Meta Alvo</th>
                                <th className="px-5 py-3.5 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {/* TRADITIONAL INVESTMENTS */}
                            {(activeTab === 'ALL' || activeTab === 'ASSETS') && traditionalInvestments.map(inv => {
                                const profit = (Number(inv.currentValue) || 0) - (Number(inv.initialAmount) || 0);
                                return (
                                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                                                    <TrendingUpIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{inv.name}</p>
                                                    <p className="text-[11px] text-slate-400">{inv.yieldRate}% CDI/Meta</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                                Ativo
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center font-black text-xs text-slate-600 dark:text-slate-300">
                                            {inv.currency === 'BRL' ? '🇧🇷 BRL' : '🇺🇸 USD'}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-black text-slate-900 dark:text-white text-base">
                                            {formatCurrency(inv.currentValue, inv.currency)}
                                        </td>
                                        <td className={`px-5 py-3.5 text-right font-black ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {profit >= 0 ? '+' : ''}{formatCurrency(profit, inv.currency)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex justify-end items-center gap-1.5">
                                                <button 
                                                    onClick={() => handleWithdraw(inv)} 
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200 dark:border-emerald-800"
                                                    title={isPT ? 'Resgatar para saldo disponível' : 'Withdraw to balance'}
                                                >
                                                    <ArrowDownIcon className="w-3 h-3" />
                                                    Resgatar
                                                </button>
                                                <button onClick={() => handleOpenModal(inv)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => onDeleteInvestment(inv.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* GOALS INVESTMENTS (METAS E OBJETIVOS) */}
                            {(activeTab === 'ALL' || activeTab === 'GOALS') && (goals || []).map(goal => {
                                const saved = Number(goal.currentAmount) || 0;
                                const target = Number(goal.targetAmount) || 0;
                                const percent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
                                const isDone = saved >= target && target > 0;

                                return (
                                    <tr key={goal.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 bg-blue-50/10 dark:bg-blue-950/5 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                                                    <Target className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{goal.title}</p>
                                                        {isDone && (
                                                            <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                                Concluída ✓
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 font-semibold">{goal.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                                🎯 Meta
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center font-black text-xs text-slate-600 dark:text-slate-300">
                                            {(goal.currency || 'BRL') === 'BRL' ? '🇧🇷 BRL' : '🇺🇸 USD'}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 text-base">
                                            {formatCurrency(saved, goal.currency)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    Alvo: {formatCurrency(target, goal.currency)} ({percent}%)
                                                </span>
                                                <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex justify-end items-center gap-1.5">
                                                <button 
                                                    type="button"
                                                    onClick={() => setSelectedGoalForDeposit(goal)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                                                    title={isPT ? 'Aportar nesta meta' : 'Deposit in this goal'}
                                                >
                                                    <PiggyBank className="w-3 h-3" />
                                                    + Aportar
                                                </button>
                                                
                                                <button 
                                                    type="button"
                                                    onClick={() => handleWithdrawGoalAction(goal)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200 dark:border-emerald-800"
                                                    title={isPT ? 'Resgatar para saldo disponível' : 'Withdraw to balance'}
                                                >
                                                    <ArrowDownIcon className="w-3 h-3" />
                                                    Resgatar
                                                </button>

                                                {setActivePage && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setActivePage('Metas')} 
                                                        className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                        title={isPT ? 'Ver cronograma e detalhes da meta' : 'View goal schedule'}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {onSaveGoal && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => { setEditingGoal(goal); setIsGoalModalOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                        title={isPT ? 'Editar meta' : 'Edit goal'}
                                                    >
                                                        <EditIcon className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {onDeleteGoal && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleDeleteGoalAction(goal)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                        title={isPT ? 'Excluir meta e investimento' : 'Delete goal'}
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* ORPHAN GOAL INVESTMENTS (DESKTOP) */}
                            {(activeTab === 'ALL' || activeTab === 'GOALS') && orphanGoalInvestments.map(inv => {
                                return (
                                    <tr key={inv.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 bg-blue-50/10 dark:bg-blue-950/5 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                                                    <Target className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{inv.name}</p>
                                                    <p className="text-[11px] text-slate-400 font-semibold">{inv.category || 'Meta / Reserva'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                                🎯 Meta
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center font-black text-xs text-slate-600 dark:text-slate-300">
                                            {inv.currency === 'BRL' ? '🇧🇷 BRL' : '🇺🇸 USD'}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 text-base">
                                            {formatCurrency(inv.currentValue, inv.currency)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-bold text-slate-400 text-xs">
                                            Reserva / Meta
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex justify-end items-center gap-1.5">
                                                <button 
                                                    onClick={() => handleWithdraw(inv)} 
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200 dark:border-emerald-800"
                                                >
                                                    <ArrowDownIcon className="w-3 h-3" />
                                                    Resgatar
                                                </button>
                                                <button onClick={() => onDeleteInvestment(inv.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Investments;
