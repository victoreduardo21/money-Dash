import React, { useState, useEffect } from 'react';
import { Goal, GoalMilestone, Currency, Language } from '../types';
import { X, CheckCircle2, PiggyBank, ArrowDownRight, Calendar, AlertCircle } from 'lucide-react';

interface GoalDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  milestone: GoalMilestone | null;
  onConfirmDeposit: (
    goalId: string,
    amount: number,
    milestoneId?: string,
    deductFromBalance?: boolean,
    date?: string,
    note?: string
  ) => void;
  language: Language;
}

export const GoalDepositModal: React.FC<GoalDepositModalProps> = ({
  isOpen,
  onClose,
  goal,
  milestone,
  onConfirmDeposit,
  language
}) => {
  const isPT = language === 'pt-BR';
  const [amount, setAmount] = useState<string>('');
  const [deductFromBalance, setDeductFromBalance] = useState<boolean>(true);
  const [depositDate, setDepositDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (milestone) {
      // If milestone is not completed, pre-fill with remaining needed for this milestone
      const needed = Math.max(0, milestone.targetAmount - (milestone.savedAmount || 0));
      setAmount(String(needed > 0 ? needed : milestone.targetAmount));
      setNote(`Aporte ${milestone.monthLabel}`);
    } else if (goal) {
      // General deposit
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const suggested = goal.milestones.find(m => !m.isCompleted)?.targetAmount || remaining;
      setAmount(String(suggested));
      setNote(isPT ? 'Aporte na Meta' : 'Goal Contribution');
    }
    setErrorMsg('');
  }, [milestone, goal, isOpen, isPT]);

  if (!isOpen || !goal) return null;

  const currencySymbol = goal.currency === 'BRL' ? 'R$' : '$';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg(isPT ? 'Informe um valor válido maior que zero.' : 'Please enter a valid amount greater than zero.');
      return;
    }

    onConfirmDeposit(
      goal.id,
      numAmount,
      milestone?.id,
      deductFromBalance,
      depositDate,
      note.trim()
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {isPT ? 'Registrar Dinheiro Guardado' : 'Record Saved Money'}
              </h3>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[200px]">
                {goal.title}
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

        {/* BODY FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {milestone && (
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                  {isPT ? 'Parcela Selecionada' : 'Selected Milestone'}
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {milestone.monthLabel}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block">
                  {isPT ? 'Meta do mês' : 'Month target'}
                </span>
                <span className="text-xs font-black text-blue-700 dark:text-blue-300">
                  {currencySymbol} {milestone.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* VALOR GUARDADO */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
              {isPT ? 'Quanto você guardou? *' : 'Amount Saved *'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                required
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black text-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                autoFocus
              />
            </div>
            
            {/* Quick buttons if milestone target exists */}
            {milestone && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setAmount(String(milestone.targetAmount))}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  {isPT ? 'Valor da meta integral' : 'Full target'} ({currencySymbol} {milestone.targetAmount})
                </button>
              </div>
            )}
          </div>

          {/* DATA DO APORTE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                {isPT ? 'Data' : 'Date'}
              </label>
              <input
                type="date"
                value={depositDate}
                onChange={e => setDepositDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                {isPT ? 'Anotação (Opcional)' : 'Note (Optional)'}
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={isPT ? 'Ex: Transferência pro cofrinho' : 'Note'}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          {/* OPÇÃO DE DEBITAR DO SALDO DISPONÍVEL */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-3">
            <input
              type="checkbox"
              id="deductBalance"
              checked={deductFromBalance}
              onChange={e => setDeductFromBalance(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <label htmlFor="deductBalance" className="text-xs cursor-pointer">
              <span className="font-black text-slate-900 dark:text-white block">
                {isPT ? 'Registrar saída no Saldo / Transações' : 'Deduct from Available Balance'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                {isPT
                  ? 'Cria automaticamente uma despesa/aporte de categoria "Investimento/Meta" para abater da sua conta e manter seu saldo sincronizado.'
                  : 'Automatically records an investment/expense transaction so your balance stays in sync.'}
              </span>
            </label>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isPT ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isPT ? 'Confirmar Aporte' : 'Confirm Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalDepositModal;
