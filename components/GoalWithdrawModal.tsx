import React, { useState, useEffect } from 'react';
import { Goal, Language } from '../types';
import { X, ArrowDownCircle, AlertCircle, Calendar, CheckCircle2, Wallet, ArrowRight } from 'lucide-react';

interface GoalWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onConfirmWithdraw: (
    goalId: string,
    amount: number,
    creditToBalance?: boolean,
    date?: string,
    note?: string
  ) => void;
  language: Language;
}

export const GoalWithdrawModal: React.FC<GoalWithdrawModalProps> = ({
  isOpen,
  onClose,
  goal,
  onConfirmWithdraw,
  language
}) => {
  const isPT = language === 'pt-BR';
  const [amount, setAmount] = useState<string>('');
  const [creditToBalance, setCreditToBalance] = useState<boolean>(true);
  const [withdrawDate, setWithdrawDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const currentSaved = goal ? Number(goal.currentAmount) || 0 : 0;
  const currencySymbol = goal?.currency === 'USD' ? '$' : 'R$';

  useEffect(() => {
    if (goal) {
      // Default to full current amount or leave empty
      const saved = Number(goal.currentAmount) || 0;
      setAmount(saved > 0 ? String(saved) : '');
      setNote(isPT ? 'Resgate de valor da meta' : 'Goal withdrawal');
      setWithdrawDate(new Date().toISOString().slice(0, 10));
      setCreditToBalance(true);
      setErrorMsg('');
    }
  }, [goal, isOpen, isPT]);

  if (!isOpen || !goal) return null;

  const numAmount = parseFloat(amount) || 0;
  const remainingInGoal = Math.max(0, currentSaved - numAmount);
  const isAmountValid = numAmount > 0 && numAmount <= currentSaved;

  const handleApplyPreset = (percent: number) => {
    const val = Math.round((currentSaved * percent) * 100) / 100;
    setAmount(String(val));
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      setErrorMsg(isPT ? 'Informe um valor válido maior que zero.' : 'Please enter a valid amount greater than zero.');
      return;
    }

    if (numAmount > currentSaved) {
      setErrorMsg(
        isPT 
          ? `O valor informado não pode ser maior que o saldo guardado (${currencySymbol} ${currentSaved.toFixed(2)}).` 
          : `Amount cannot exceed current saved balance (${currencySymbol} ${currentSaved.toFixed(2)}).`
      );
      return;
    }

    onConfirmWithdraw(
      goal.id,
      numAmount,
      creditToBalance,
      withdrawDate,
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
        <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {isPT ? 'Resgatar Valor da Meta' : 'Withdraw from Goal'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {goal.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
          {/* SALDO DISPONÍVEL NA META */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                {isPT ? 'Saldo Disponível para Resgate' : 'Available Saved Balance'}
              </span>
              <span className="text-lg font-black text-amber-900 dark:text-amber-200">
                {currencySymbol} {currentSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span>{isPT ? 'Meta Alvo: ' : 'Target: '}</span>
              <strong className="text-slate-700 dark:text-slate-300">
                {currencySymbol} {Number(goal.targetAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* INPUT DO VALOR */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isPT ? 'Quanto deseja resgatar?' : 'How much to withdraw?'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={currentSaved}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="0.00"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                autoFocus
              />
            </div>

            {/* BOTÕES DE PRESET / ATALHOS */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => handleApplyPreset(0.25)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-all shrink-0"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(0.50)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-all shrink-0"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(0.75)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-all shrink-0"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(1)}
                className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 text-amber-800 dark:text-amber-300 text-[11px] font-black transition-all shrink-0 flex items-center gap-1"
              >
                <span>{isPT ? 'Resgatar Tudo (100%)' : 'Withdraw All (100%)'}</span>
              </button>
            </div>
          </div>

          {/* SIMULAÇÃO DO SALDO APÓS RESGATE */}
          {numAmount > 0 && numAmount <= currentSaved && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                {isPT ? 'Saldo restante na meta:' : 'Remaining in goal:'}
              </span>
              <span className="font-black text-slate-900 dark:text-white text-sm">
                {currencySymbol} {remainingInGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* OPÇÃO DE CREDITAR NO SALDO DA CONTA CORRENTE */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={creditToBalance}
                onChange={e => setCreditToBalance(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {isPT ? 'Creditar no saldo disponível da conta corrente' : 'Add to available account balance'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight mt-0.5">
                  {isPT 
                    ? 'Gera uma transação de Receita (Resgate) aumentando seu saldo de caixa.'
                    : 'Creates an Income (Withdrawal) transaction increasing your cash balance.'}
                </span>
              </div>
            </label>
          </div>

          {/* DATA DO RESGATE */}
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                {isPT ? 'Data do Resgate' : 'Withdrawal Date'}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={withdrawDate}
                  onChange={e => setWithdrawDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* MOTIVO / NOTA OPCIONAL */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                {isPT ? 'Motivo / Observação (opcional)' : 'Reason / Note (optional)'}
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={isPT ? 'Ex: Despesa imprevista, oportunidade...' : 'E.g., Unexpected expense...'}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* MENSAGEM DE ERRO */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* INFORMATIVO */}
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isPT 
              ? '💡 Sua meta e seu cronograma continuam existindo! Você pode continuar aportando nela normalmente a qualquer momento.'
              : '💡 Your goal and schedule remain intact! You can continue depositing into it at any time.'}
          </p>

          {/* FOOTER ACTIONS */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors"
            >
              {isPT ? 'Cancelar' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={!isAmountValid}
              className={`px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 ${
                isAmountValid
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20 active:scale-95 cursor-pointer'
                  : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>{isPT ? 'Confirmar Resgate' : 'Confirm Withdrawal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalWithdrawModal;
