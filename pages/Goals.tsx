import React, { useState, useMemo } from 'react';
import { Goal, GoalMilestone, Currency, Language, User } from '../types';
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  PiggyBank, 
  TrendingUp, 
  Clock, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Sliders, 
  Check, 
  RotateCcw,
  Layers,
  Award,
  DollarSign,
  Search,
  ArrowRight
} from 'lucide-react';
import GoalModal from '../components/GoalModal';
import GoalDepositModal from '../components/GoalDepositModal';
import { useTranslation } from '../translations';

interface GoalsProps {
  goals: Goal[];
  onSaveGoal: (goal: Omit<Goal, 'id'> & { id?: string }, initialDeductFromBalance?: boolean) => void;
  onDeleteGoal: (id: string) => void;
  onDepositToGoal: (
    goalId: string, 
    amount: number, 
    milestoneId?: string, 
    deductFromBalance?: boolean, 
    date?: string, 
    note?: string
  ) => void;
  onToggleMilestoneQuick: (goalId: string, milestoneId: string, deductFromBalance?: boolean) => void;
  language: Language;
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  currentUser?: User | null;
}

export const Goals: React.FC<GoalsProps> = ({
  goals = [],
  onSaveGoal,
  onDeleteGoal,
  onDepositToGoal,
  onToggleMilestoneQuick,
  language,
  selectedCurrency,
  onCurrencyChange,
  currentUser
}) => {
  const t = useTranslation(language);
  const isPT = language === 'pt-BR';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [depositModalGoal, setDepositModalGoal] = useState<Goal | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<GoalMilestone | null>(null);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const formatCurrency = (val: number, cur: Currency = selectedCurrency) => {
    const symbol = cur === 'BRL' ? 'R$ ' : '$ ';
    return symbol + (Number(val) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Filtered goals by currency and filter tabs
  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      const gCurr = (g.currency || 'BRL').toUpperCase();
      const selCurr = selectedCurrency.toUpperCase();
      const matchCurrency = gCurr === selCurr;
      const matchSearch = searchQuery 
        ? g.title.toLowerCase().includes(searchQuery.toLowerCase()) || (g.category || '').toLowerCase().includes(searchQuery.toLowerCase()) 
        : true;
      const gCurrent = Number(g.currentAmount) || 0;
      const gTarget = Number(g.targetAmount) || 0;
      const isDone = g.status === 'COMPLETED' || (gCurrent >= gTarget && gTarget > 0);
      const matchStatus = statusFilter === 'ALL' 
        ? true 
        : statusFilter === 'COMPLETED' 
          ? isDone 
          : !isDone;
      return matchCurrency && matchSearch && matchStatus;
    });
  }, [goals, selectedCurrency, searchQuery, statusFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    const selCurr = selectedCurrency.toUpperCase();
    const currencyGoals = goals.filter(g => (g.currency || 'BRL').toUpperCase() === selCurr);
    const totalTarget = currencyGoals.reduce((acc, g) => acc + (Number(g.targetAmount) || 0), 0);
    const totalSaved = currencyGoals.reduce((acc, g) => acc + (Number(g.currentAmount) || 0), 0);
    const totalRemaining = Math.max(0, totalTarget - totalSaved);
    const completedCount = currencyGoals.filter(g => g.status === 'COMPLETED' || ((Number(g.currentAmount) || 0) >= (Number(g.targetAmount) || 1) && (Number(g.targetAmount) || 0) > 0)).length;
    const inProgressCount = currencyGoals.length - completedCount;
    const globalPercent = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

    return {
      totalTarget,
      totalSaved,
      totalRemaining,
      completedCount,
      inProgressCount,
      globalPercent,
      count: currencyGoals.length
    };
  }, [goals, selectedCurrency]);

  const handleCreateNew = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleDelete = (goal: Goal) => {
    const msg = isPT 
      ? `Tem certeza que deseja excluir a meta "${goal.title}"?`
      : `Are you sure you want to delete the goal "${goal.title}"?`;
    if (window.confirm(msg)) {
      onDeleteGoal(goal.id);
    }
  };

  const handleOpenDeposit = (goal: Goal, milestone?: GoalMilestone) => {
    setDepositModalGoal(goal);
    setSelectedMilestone(milestone || null);
  };

  const toggleExpand = (goalId: string) => {
    setExpandedGoalId(prev => prev === goalId ? null : goalId);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {isPT ? 'Metas & Objetivos' : 'Goals & Objectives'}
              </h2>
              <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
                {isPT ? 'Crie suas metas com cronograma mensal inteligente e marque cada parcela guardada' : 'Track your savings with smart monthly schedules and interactive milestones'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          {/* CURRENCY TOGGLE */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex gap-1">
            <button
              onClick={() => onCurrencyChange('BRL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedCurrency === 'BRL'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              BRL (R$)
            </button>
            <button
              onClick={() => onCurrencyChange('USD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                selectedCurrency === 'USD'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              USD ($)
            </button>
          </div>

          {/* NEW GOAL BUTTON */}
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs md:text-sm shadow-xl shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isPT ? 'Nova Meta' : 'New Goal'}</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* TOTAL GUARDADO */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isPT ? 'Total Já Guardado' : 'Total Saved'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(stats.totalSaved)}
          </p>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>{isPT ? 'Progresso Geral' : 'Overall Progress'}</span>
              <span>{stats.globalPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-700 rounded-full"
                style={{ width: `${stats.globalPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* VALOR TOTAL ALVO */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isPT ? 'Total dos Objetivos' : 'Target Sum'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(stats.totalTarget)}
          </p>
          <p className="text-xs text-slate-500 font-semibold mt-2">
            {stats.count} {isPT ? (stats.count === 1 ? 'meta planejada' : 'metas planejadas') : 'goals planned'}
          </p>
        </div>

        {/* VALOR RESTANTE */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isPT ? 'Falta Guardar' : 'Remaining'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {formatCurrency(stats.totalRemaining)}
          </p>
          <p className="text-xs text-slate-500 font-semibold mt-2">
            {isPT ? 'Para atingir 100% dos planos' : 'To complete all objectives'}
          </p>
        </div>

        {/* METAS CONCLUÍDAS */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isPT ? 'Concluídas / Em Curso' : 'Completed / Active'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {stats.completedCount} <span className="text-xs font-semibold text-slate-400">/ {stats.count}</span>
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              {stats.completedCount} {isPT ? 'finalizadas' : 'done'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              {stats.inProgressCount} {isPT ? 'em andamento' : 'in progress'}
            </span>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {isPT ? 'Todas as Metas' : 'All Goals'} ({goals.filter(g => (g.currency || 'BRL') === selectedCurrency).length})
          </button>
          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {isPT ? 'Em Andamento' : 'In Progress'} ({stats.inProgressCount})
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'COMPLETED'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {isPT ? 'Concluídas' : 'Completed'} ({stats.completedCount})
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isPT ? 'Buscar meta...' : 'Search goal...'}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* GOALS LIST */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
            {isPT ? 'Nenhuma meta encontrada' : 'No goals found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            {isPT
              ? 'Defina objetivos como "Juntar R$ 1.000 em 6 meses" e deixe o sistema criar o cronograma perfeito de economia para você!'
              : 'Create objectives like "Save $1,000 in 6 months" and let the system build the perfect monthly savings schedule for you!'}
          </p>
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-xl shadow-blue-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isPT ? 'Criar Minha Primeira Meta' : 'Create My First Goal'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGoals.map((goal) => {
            const isCompleted = goal.status === 'COMPLETED' || goal.currentAmount >= goal.targetAmount;
            const percent = Math.min(100, Math.round(((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const isExpanded = expandedGoalId === goal.id;
            const completedMilestones = (goal.milestones || []).filter(m => m.isCompleted || ((m.savedAmount || 0) >= m.targetAmount && m.targetAmount > 0)).length;
            const partialMilestones = (goal.milestones || []).filter(m => !m.isCompleted && (m.savedAmount || 0) > 0 && (m.savedAmount || 0) < m.targetAmount).length;
            const totalMilestones = (goal.milestones || []).length;
            const remainingMonths = Math.max(0, totalMilestones - completedMilestones);

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                {/* CARD MAIN HEADER & PROGRESS */}
                <div className="p-5 md:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* TITLE & BADGES */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                          : 'bg-blue-600 text-white shadow-blue-500/20'
                      }`}>
                        {isCompleted ? <Award className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {goal.category}
                          </span>
                          {isCompleted ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {isPT ? 'META CONCLUÍDA 🎉' : 'GOAL COMPLETED 🎉'}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                              {remainingMonths} {isPT ? 'meses restantes' : 'months left'}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                          {goal.title}
                        </h3>

                        {goal.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* STATS SUMMARY ON THE RIGHT */}
                    <div className="flex items-center gap-6 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          {isPT ? 'Guardado' : 'Saved'}
                        </span>
                        <span className="text-lg md:text-xl font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(goal.currentAmount, goal.currency)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          {isPT ? 'Objetivo Total' : 'Target'}
                        </span>
                        <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
                          {formatCurrency(goal.targetAmount, goal.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                        {isPT ? 'Progresso do objetivo:' : 'Progress:'}
                        <strong className="text-slate-800 dark:text-slate-200">{percent}%</strong>
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {isPT ? 'Falta guardar: ' : 'Remaining: '}
                        <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(remaining, goal.currency)}</strong>
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-700/80 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-500 shadow-sm'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* ACTION BUTTONS & SCHEDULE EXPANDER */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {/* BOTÃO INTERATIVO DE GUARDAR DINHEIRO */}
                      {!isCompleted && (
                        <button
                          onClick={() => handleOpenDeposit(goal)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <PiggyBank className="w-4 h-4" />
                          <span>{isPT ? '+ Guardar Dinheiro' : '+ Save Money'}</span>
                        </button>
                      )}

                      {/* TOGGLE CRONOGRAMA */}
                      <button
                        onClick={() => toggleExpand(goal.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                          isExpanded
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 text-blue-500" />
                        <span>
                          {isPT ? 'Cronograma Mensal' : 'Monthly Schedule'} ({completedMilestones}/{totalMilestones})
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 ml-0.5" /> : <ChevronDown className="w-4 h-4 ml-0.5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={isPT ? 'Editar Meta' : 'Edit Goal'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title={isPT ? 'Excluir Meta' : 'Delete Goal'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* CRONOGRAMA INTERATIVO EXPANSÍVEL (A TABELA E CHECKPOINTS DO USUÁRIO) */}
                {isExpanded && (
                  <div className="bg-slate-50/70 dark:bg-slate-900/60 p-5 md:p-6 border-t border-slate-200/80 dark:border-slate-800 space-y-4 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-600" />
                          {isPT ? 'Cronograma de Aportes Mês a Mês' : 'Month-by-Month Savings Table'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {isPT
                            ? 'Clique em qualquer mês para marcar o valor guardado ou fazer o aporte!'
                            : 'Click any month below to mark the saved amount or make a deposit!'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {completedMilestones} {isPT ? 'guardados' : 'saved'}
                        </span>
                        {partialMilestones > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-extrabold">
                              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                              {partialMilestones} {isPT ? 'parciais' : 'partial'}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-slate-400">
                          {totalMilestones - completedMilestones - partialMilestones} {isPT ? 'pendentes' : 'pending'}
                        </span>
                      </div>
                    </div>

                    {/* TABELA / GRADE INTERATIVA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(goal.milestones || []).map((m) => {
                        const target = Number(m.targetAmount) || 0;
                        const saved = Number(m.savedAmount) || 0;
                        const isDone = m.isCompleted || (saved >= target && target > 0);
                        const remaining = Math.max(0, target - saved);
                        const isPartial = saved > 0 && !isDone;
                        const milestonePercent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              if (!isDone) {
                                // Direct interactive click to save (will suggest remaining if partial)!
                                handleOpenDeposit(goal, m);
                              } else {
                                // Toggle back if user wants
                                if (window.confirm(isPT ? `Deseja reabrir a parcela de ${m.monthLabel}?` : `Reopen installment for ${m.monthLabel}?`)) {
                                  onToggleMilestoneQuick(goal.id, m.id);
                                }
                              }
                            }}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group relative ${
                              isDone
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 shadow-sm'
                                : isPartial
                                ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-300 dark:border-amber-700/70 shadow-sm hover:border-amber-400'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                  isDone
                                    ? 'bg-emerald-600 text-white'
                                    : isPartial
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                }`}>
                                  {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : m.monthNumber}
                                </span>
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                                  {m.monthLabel}
                                </span>
                              </div>

                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                                  : isPartial
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                              }`}>
                                {isDone 
                                  ? (isPT ? 'Guardado' : 'Saved') 
                                  : isPartial 
                                  ? (isPT ? `Parcial (${milestonePercent}%)` : `Partial (${milestonePercent}%)`) 
                                  : (isPT ? 'Pendente' : 'Pending')}
                              </span>
                            </div>

                            {/* MINI BARRA DE PROGRESSO SE PARCIAL */}
                            {isPartial && (
                              <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 h-1.5 rounded-full overflow-hidden my-2">
                                <div 
                                  className="h-full rounded-full transition-all duration-500 bg-amber-500"
                                  style={{ width: `${milestonePercent}%` }}
                                />
                              </div>
                            )}

                            {/* VALORES DO MÊS */}
                            <div className="mt-2.5 flex items-baseline justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block">
                                  {isPT ? 'Meta da Parcela' : 'Installment Target'}
                                </span>
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                  {formatCurrency(target, goal.currency)}
                                </span>
                              </div>

                              {isDone ? (
                                <div className="text-right">
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                                    {isPT ? 'Guardado ✓' : 'Saved ✓'}
                                  </span>
                                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(saved || target, goal.currency)}
                                  </span>
                                </div>
                              ) : isPartial ? (
                                <div className="text-right">
                                  <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 block">
                                    {isPT ? 'Falta Guardar:' : 'Left to Save:'}
                                  </span>
                                  <span className="text-sm font-black text-amber-700 dark:text-amber-300">
                                    {formatCurrency(remaining, goal.currency)}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-right">
                                  <span className="text-[10px] font-bold text-slate-400 block">
                                    {isPT ? 'A Guardar' : 'To Save'}
                                  </span>
                                  <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                                    {formatCurrency(target, goal.currency)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* INFORMAÇÕES EXTRAS E BOTÃO DE AÇÃO */}
                            {isPartial && (
                              <div className="mt-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-[11px] gap-2">
                                <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                                  {isPT ? 'Já guardado: ' : 'Saved: '}
                                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(saved, goal.currency)}</strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDeposit(goal, m);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black shadow-sm transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                >
                                  <span>{isPT ? 'Guardar Restante' : 'Save Left'}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {!isDone && !isPartial && (
                              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400">
                                  {isPT ? '👉 Clique p/ guardar' : '👉 Click to save'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDeposit(goal, m);
                                  }}
                                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black shadow-sm transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                                >
                                  <span>{isPT ? 'Guardar' : 'Save'}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {isDone && (
                              <div className="mt-2 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium text-right">
                                {isPT ? '✓ Parcela concluída (clique p/ reabrir)' : '✓ Completed (click to reopen)'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CRIAR / EDITAR META */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveGoal}
        goal={editingGoal}
        language={language}
        defaultCurrency={selectedCurrency}
      />

      {/* MODAL APORTE / GUARDAR VALOR NA META */}
      <GoalDepositModal
        isOpen={!!depositModalGoal}
        onClose={() => {
          setDepositModalGoal(null);
          setSelectedMilestone(null);
        }}
        goal={depositModalGoal}
        milestone={selectedMilestone}
        onConfirmDeposit={onDepositToGoal}
        language={language}
      />
    </div>
  );
};

export default Goals;
