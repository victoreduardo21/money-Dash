import React, { useState, useEffect, useMemo } from 'react';
import { Goal, GoalMilestone, Currency, Language } from '../types';
import { X, Target, Calendar, DollarSign, Sparkles, CheckCircle2, ChevronRight, Layers, Sliders } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'id'> & { id?: string }) => void;
  goal?: Goal | null;
  language: Language;
  defaultCurrency?: Currency;
}

const CATEGORIES = [
  { id: 'Reserva', label: 'Reserva de Emergência', icon: '🛡️' },
  { id: 'Compras', label: 'Bens & Eletrônicos', icon: '📱' },
  { id: 'Viagem', label: 'Viagem & Férias', icon: '✈️' },
  { id: 'Veículo', label: 'Carro / Moto', icon: '🚗' },
  { id: 'Imóvel', label: 'Casa Própria', icon: '🏠' },
  { id: 'Educação', label: 'Estudos & Cursos', icon: '🎓' },
  { id: 'Outro', label: 'Outro Objetivo', icon: '🎯' }
];

const PRESET_TITLES = [
  'Juntar R$ 1.000',
  'Reserva de Emergência',
  'Viagem dos Sonhos',
  'Comprar Notebook Novo',
  'IPVA & IPTU do Ano'
];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  goal,
  language,
  defaultCurrency = 'BRL'
}) => {
  const isPT = language === 'pt-BR';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Reserva');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('0');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [targetMonths, setTargetMonths] = useState<number>(6);
  const [startMonth, setStartMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [distributionType, setDistributionType] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');
  const [customMonthlyTargets, setCustomMonthlyTargets] = useState<number[]>([]);
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill when editing
  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setCategory(goal.category || 'Reserva');
      setTargetAmount(String(goal.targetAmount));
      setInitialAmount(String(goal.currentAmount || 0));
      setCurrency(goal.currency || defaultCurrency);
      setTargetMonths(goal.targetMonths || 6);
      setStartMonth(goal.startDate || new Date().toISOString().slice(0, 7));
      setDistributionType(goal.distributionType === 'CUSTOM' ? 'CUSTOM' : 'EQUAL');
      setDescription(goal.description || '');
      if (goal.milestones && goal.milestones.length > 0) {
        setCustomMonthlyTargets(goal.milestones.map(m => m.targetAmount));
      }
    } else {
      setTitle('');
      setCategory('Reserva');
      setTargetAmount('1000');
      setInitialAmount('0');
      setCurrency(defaultCurrency);
      setTargetMonths(6);
      const d = new Date();
      setStartMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      setDistributionType('EQUAL');
      setDescription('');
      setErrorMsg('');
      setCustomMonthlyTargets([]);
    }
  }, [goal, isOpen, defaultCurrency]);

  // Generate milestone schedule preview dynamically
  const previewMilestones = useMemo<GoalMilestone[]>(() => {
    const total = parseFloat(targetAmount) || 0;
    const months = Math.max(1, targetMonths || 1);
    if (total <= 0) return [];

    const milestonesList: GoalMilestone[] = [];
    const [startYear, startM] = startMonth.split('-').map(Number);
    const dateObj = new Date(startYear, startM - 1, 1);

    if (distributionType === 'EQUAL') {
      const baseMonthly = Math.floor((total / months) * 100) / 100;
      let remainder = Number((total - baseMonthly * months).toFixed(2));

      for (let i = 1; i <= months; i++) {
        const currentMilestoneDate = new Date(dateObj.getFullYear(), dateObj.getMonth() + (i - 1), 1);
        const monthName = currentMilestoneDate.toLocaleDateString(language, { month: 'short', year: '2-digit' });
        const targetVal = i === months ? Number((baseMonthly + remainder).toFixed(2)) : baseMonthly;

        milestonesList.push({
          id: goal?.milestones?.[i - 1]?.id || `m_${i}_${Date.now()}`,
          monthNumber: i,
          monthLabel: `Mês ${i} (${monthName})`,
          targetAmount: targetVal,
          savedAmount: goal?.milestones?.[i - 1]?.savedAmount || 0,
          isCompleted: goal?.milestones?.[i - 1]?.isCompleted || false
        });
      }
    } else {
      // CUSTOM distribution
      for (let i = 1; i <= months; i++) {
        const currentMilestoneDate = new Date(dateObj.getFullYear(), dateObj.getMonth() + (i - 1), 1);
        const monthName = currentMilestoneDate.toLocaleDateString(language, { month: 'short', year: '2-digit' });
        const targetVal = customMonthlyTargets[i - 1] ?? Math.round(total / months);

        milestonesList.push({
          id: goal?.milestones?.[i - 1]?.id || `m_${i}_${Date.now()}`,
          monthNumber: i,
          monthLabel: `Mês ${i} (${monthName})`,
          targetAmount: targetVal,
          savedAmount: goal?.milestones?.[i - 1]?.savedAmount || 0,
          isCompleted: goal?.milestones?.[i - 1]?.isCompleted || false
        });
      }
    }

    return milestonesList;
  }, [targetAmount, targetMonths, startMonth, distributionType, customMonthlyTargets, goal, language]);

  const customSum = useMemo(() => {
    return customMonthlyTargets.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  }, [customMonthlyTargets]);

  const handleCustomTargetChange = (index: number, val: number) => {
    const updated = [...customMonthlyTargets];
    // Fill up to index if not populated
    for (let i = 0; i < targetMonths; i++) {
      if (updated[i] === undefined) {
        updated[i] = previewMilestones[i]?.targetAmount || 0;
      }
    }
    updated[index] = Math.max(0, val);
    setCustomMonthlyTargets(updated);
  };

  const handlePresetSelect = (preset: string) => {
    setTitle(preset);
    if (preset === 'Juntar R$ 1.000') {
      setTargetAmount('1000');
      setTargetMonths(6);
    } else if (preset === 'Reserva de Emergência') {
      setTargetAmount('5000');
      setTargetMonths(12);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount);
    const numInitial = parseFloat(initialAmount) || 0;

    if (!title.trim()) {
      setErrorMsg(isPT ? 'Por favor, informe o título da meta.' : 'Please enter a goal title.');
      return;
    }
    if (!numTarget || numTarget <= 0) {
      setErrorMsg(isPT ? 'Informe um valor alvo válido.' : 'Please enter a valid target amount.');
      return;
    }
    if (targetMonths < 1 || targetMonths > 120) {
      setErrorMsg(isPT ? 'O prazo deve ser entre 1 e 120 meses.' : 'Months must be between 1 and 120.');
      return;
    }

    // Calculate deadline date
    const [y, m] = startMonth.split('-').map(Number);
    const deadlineObj = new Date(y, m - 1 + targetMonths, 0);
    const deadlineDate = deadlineObj.toISOString().slice(0, 10);

    // Build final milestones
    let finalMilestones = previewMilestones;
    if (numInitial > 0 && (!goal || goal.currentAmount === 0)) {
      // Allocate initial amount to early milestones if user has starting capital
      let remainingInit = numInitial;
      finalMilestones = finalMilestones.map(ms => {
        if (remainingInit <= 0) return ms;
        const toSave = Math.min(remainingInit, ms.targetAmount);
        remainingInit -= toSave;
        return {
          ...ms,
          savedAmount: toSave,
          isCompleted: toSave >= ms.targetAmount
        };
      });
    }

    onSave({
      ...(goal?.id ? { id: goal.id } : {}),
      title: title.trim(),
      description: description.trim(),
      category,
      targetAmount: numTarget,
      currentAmount: goal ? goal.currentAmount : numInitial,
      currency,
      targetMonths,
      startDate: startMonth,
      deadlineDate,
      distributionType,
      status: (goal?.currentAmount || numInitial) >= numTarget ? 'COMPLETED' : 'IN_PROGRESS',
      milestones: finalMilestones,
      createdAt: goal?.createdAt || new Date().toISOString()
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {goal ? (isPT ? 'Editar Meta & Cronograma' : 'Edit Goal & Schedule') : (isPT ? 'Nova Meta & Objetivo' : 'New Goal & Target')}
              </h3>
              <p className="text-xs font-semibold text-slate-400">
                {isPT ? 'Defina seu objetivo e o sistema cria o cronograma mensal de economia' : 'Set your target and get an automatic monthly savings plan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:rose-400 text-xs font-bold rounded-2xl">
              {errorMsg}
            </div>
          )}

          {/* PRESETS CHIPS */}
          {!goal && (
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                {isPT ? 'Sugestões Rápidas' : 'Quick Suggestions'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TITLES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TITULO & CATEGORIA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                {isPT ? 'Título do seu Objetivo *' : 'Goal Title *'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={isPT ? 'Ex: Juntar R$ 1.000 em 6 meses' : 'Ex: Save $1,000 in 6 months'}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                {isPT ? 'Categoria' : 'Category'}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* VALOR ALVO & MOEDA & INICIAL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                {isPT ? 'Valor da Meta *' : 'Target Amount *'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400">
                  {currency === 'BRL' ? 'R$' : '$'}
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value)}
                  placeholder="1000.00"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                {isPT ? 'Moeda' : 'Currency'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCurrency('BRL')}
                  className={`py-2.5 rounded-xl font-bold text-xs transition-all border ${
                    currency === 'BRL'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  🇧🇷 Real (BRL)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`py-2.5 rounded-xl font-bold text-xs transition-all border ${
                    currency === 'USD'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  🇺🇸 Dólar (USD)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                {isPT ? 'Já guardou algum valor?' : 'Starting Amount?'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400">
                  {currency === 'BRL' ? 'R$' : '$'}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={initialAmount}
                  onChange={e => setInitialAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* PRAZO EM MESES & MÊS DE INÍCIO */}
          <div className="p-5 rounded-3xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  {isPT ? 'Prazo para Juntar o Dinheiro' : 'Timeframe to reach goal'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isPT ? 'Em quantos meses você quer alcançar este valor?' : 'In how many months do you want to hit this goal?'}
                </p>
              </div>

              {/* Quick Months Buttons */}
              <div className="flex gap-1.5">
                {[3, 6, 12, 24].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTargetMonths(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      targetMonths === m
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                    }`}
                  >
                    {m} {isPT ? 'meses' : 'mos'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  {isPT ? 'Número de Meses (Personalizado)' : 'Number of Months'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={targetMonths}
                  onChange={e => setTargetMonths(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  {isPT ? 'Mês de Início' : 'Start Month'}
                </label>
                <input
                  type="month"
                  value={startMonth}
                  onChange={e => setStartMonth(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm"
                />
              </div>
            </div>

            {/* MODO DE DISTRIBUIÇÃO */}
            <div className="pt-2 border-t border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-500" />
                {isPT ? 'Divisão das Parcelas Mensais:' : 'Monthly Distribution:'}
              </span>
              <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setDistributionType('EQUAL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    distributionType === 'EQUAL'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isPT ? 'Valores Iguais' : 'Equal Split'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDistributionType('CUSTOM');
                    if (customMonthlyTargets.length === 0) {
                      setCustomMonthlyTargets(previewMilestones.map(m => m.targetAmount));
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    distributionType === 'CUSTOM'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isPT ? 'Personalizado (Mês a Mês)' : 'Custom Per Month'}
                </button>
              </div>
            </div>
          </div>

          {/* PREVIEW DO CRONOGRAMA INTELIGENTE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {isPT ? 'Cronograma Gerado pelo Sistema' : 'Generated Savings Schedule'}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {isPT ? 'Média: ' : 'Avg: '}
                  {currency === 'BRL' ? 'R$ ' : '$ '}
                  {targetMonths > 0 && targetAmount
                    ? ((parseFloat(targetAmount) || 0) / targetMonths).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0,00'}/mês
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isPT
                ? 'Aqui está a tabela do seu plano. Ao criar a meta, você poderá ir clicando em cada mês conforme for guardando o dinheiro!'
                : 'Here is your plan schedule. Once created, you can simply click each milestone as you save the money!'}
            </p>

            <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
              {previewMilestones.map((m, idx) => (
                <div key={m.id || idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold flex items-center justify-center text-[10px] shrink-0">
                      {m.monthNumber}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {m.monthLabel}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {isPT ? 'Aporte sugerido' : 'Suggested deposit'}
                      </span>
                    </div>
                  </div>

                  {distributionType === 'CUSTOM' ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-400 text-xs">{currency === 'BRL' ? 'R$' : '$'}</span>
                      <input
                        type="number"
                        step="any"
                        value={customMonthlyTargets[idx] ?? m.targetAmount}
                        onChange={e => handleCustomTargetChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 text-right font-black rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {currency === 'BRL' ? 'R$ ' : '$ '}
                        {m.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {distributionType === 'CUSTOM' && (
              <div className="flex justify-between items-center text-xs px-2 pt-1 font-bold">
                <span className="text-slate-500">{isPT ? 'Soma das parcelas customizadas:' : 'Sum of custom installments:'}</span>
                <span className={customSum === parseFloat(targetAmount) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                  {currency === 'BRL' ? 'R$ ' : '$ '}
                  {customSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {customSum !== parseFloat(targetAmount) && (
                    <span className="text-[10px] ml-1.5 font-normal">
                      ({isPT ? 'Alvo: ' : 'Target: '}
                      {parseFloat(targetAmount || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </form>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            {isPT ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            {goal ? (isPT ? 'Salvar Alterações' : 'Save Changes') : (isPT ? 'Criar Meta & Cronograma' : 'Create Goal & Schedule')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalModal;
