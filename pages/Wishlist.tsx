import React, { useState, useMemo } from 'react';
import { WishlistItem, Currency, Language, PersonalTransaction, TransactionType, Investment, Goal } from '../types';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  Trophy,
  Trash2,
  Edit3,
  Search,
  Sparkles,
  RotateCcw,
  Tag,
  Calendar,
  Wallet,
  ArrowUpDown,
  X,
  Receipt,
  Check,
  Link2,
  ExternalLink
} from 'lucide-react';

interface WishlistProps {
  items: WishlistItem[];
  transactions: PersonalTransaction[];
  investments?: Investment[];
  goals?: Goal[];
  onSaveItem: (item: Omit<WishlistItem, 'id'> & { id?: string }) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onTogglePurchased: (item: WishlistItem) => Promise<void>;
  onRecordExpense?: (item: WishlistItem) => Promise<void>;
  language: Language;
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

const CATEGORIES = [
  'Casa & Móveis',
  'Veículos',
  'Eletrônicos',
  'Viagens & Lazer',
  'Roupas & Estilo',
  'Educação',
  'Saúde & Bem-estar',
  'Outros'
];

export const Wishlist: React.FC<WishlistProps> = ({
  items = [],
  transactions = [],
  investments = [],
  goals = [],
  onSaveItem,
  onDeleteItem,
  onTogglePurchased,
  onRecordExpense,
  language,
  selectedCurrency,
  onCurrencyChange
}) => {
  const isPT = language === 'pt-BR';

  // Quick add state
  const [quickName, setQuickName] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [quickLink, setQuickLink] = useState('');
  const [quickCategory, setQuickCategory] = useState('Casa & Móveis');
  const [quickPriority, setQuickPriority] = useState<'ALTA' | 'MEDIA' | 'BAIXA'>('MEDIA');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  // Filters & sorting
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PURCHASED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRICE_DESC' | 'PRICE_ASC' | 'PRIORITY'>('NEWEST');

  // Edit / Create detail modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalPrice, setModalPrice] = useState('');
  const [modalLink, setModalLink] = useState('');
  const [modalCurrency, setModalCurrency] = useState<Currency>(selectedCurrency);
  const [modalCategory, setModalCategory] = useState('Casa & Móveis');
  const [modalPriority, setModalPriority] = useState<'ALTA' | 'MEDIA' | 'BAIXA'>('MEDIA');
  const [modalTargetDate, setModalTargetDate] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalStatus, setModalStatus] = useState<'PENDING' | 'PURCHASED'>('PENDING');
  const [recordedExpenseIds, setRecordedExpenseIds] = useState<string[]>([]);

  const getSafeLinkInfo = (rawUrl?: string): { href: string; host: string } | null => {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;
    const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
      return {
        href: parsed.href,
        host: parsed.hostname.replace(/^www\./i, '')
      };
    } catch {
      return null;
    }
  };

  const formatCurrency = (val: number, cur: Currency = selectedCurrency) => {
    const symbol = cur === 'BRL' ? 'R$ ' : '$ ';
    return symbol + (Number(val) || 0).toLocaleString(cur === 'BRL' ? 'pt-BR' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // User's actual available balance & total net worth in selected currency
  const financialTotals = useMemo(() => {
    const selCurr = selectedCurrency.toUpperCase();
    const txs = transactions.filter(t => (t.currency || 'BRL').toUpperCase() === selCurr);
    const availableBalance = txs.reduce(
      (acc, t) => acc + (t.type === TransactionType.Receita ? (Number(t.amount) || 0) : -(Number(t.amount) || 0)),
      0
    );

    const tradInvs = investments
      .filter(i => !i.goalId && !i.name.startsWith('Meta: ') && !i.name.startsWith('🎯 Meta: '))
      .filter(i => (i.currency || 'BRL').toUpperCase() === selCurr)
      .reduce((acc, i) => acc + (Number(i.currentValue) || 0), 0);

    const goalsSaved = goals
      .filter(g => (g.currency || 'BRL').toUpperCase() === selCurr)
      .reduce((acc, g) => acc + (Number(g.currentAmount) || 0), 0);

    return {
      availableBalance,
      totalPatrimony: availableBalance + tradInvs + goalsSaved
    };
  }, [transactions, investments, goals, selectedCurrency]);

  // Currency-filtered items
  const currencyItems = useMemo(() => {
    const selCurr = selectedCurrency.toUpperCase();
    return items.filter(item => (item.currency || 'BRL').toUpperCase() === selCurr);
  }, [items, selectedCurrency]);

  // Cart & wishlist statistics
  const stats = useMemo(() => {
    const pendingItems = currencyItems.filter(i => i.status !== 'PURCHASED');
    const purchasedItems = currencyItems.filter(i => i.status === 'PURCHASED');

    const pendingTotal = pendingItems.reduce((acc, i) => acc + (Number(i.price) || 0), 0);
    const purchasedTotal = purchasedItems.reduce((acc, i) => acc + (Number(i.price) || 0), 0);
    const grandTotal = pendingTotal + purchasedTotal;

    const conqueredPercent = currencyItems.length > 0
      ? Math.round((purchasedItems.length / currencyItems.length) * 100)
      : 0;

    return {
      pendingItems,
      purchasedItems,
      pendingTotal,
      purchasedTotal,
      grandTotal,
      pendingCount: pendingItems.length,
      purchasedCount: purchasedItems.length,
      totalCount: currencyItems.length,
      conqueredPercent
    };
  }, [currencyItems]);

  // Filtered and sorted display list
  const displayedItems = useMemo(() => {
    const priorityRank = { ALTA: 3, MEDIA: 2, BAIXA: 1 };

    return currencyItems
      .filter(item => {
        const matchStatus = statusFilter === 'ALL'
          ? true
          : statusFilter === 'PURCHASED'
            ? item.status === 'PURCHASED'
            : item.status !== 'PURCHASED';
        const q = searchQuery.trim().toLowerCase();
        const matchSearch = q
          ? item.name.toLowerCase().includes(q) ||
            (item.category || '').toLowerCase().includes(q) ||
            (item.notes || '').toLowerCase().includes(q) ||
            (item.link || '').toLowerCase().includes(q)
          : true;
        return matchStatus && matchSearch;
      })
      .sort((a, b) => {
        // Keep pending before purchased in ALL view unless sorting explicitly by price
        if (sortBy === 'NEWEST' && statusFilter === 'ALL' && a.status !== b.status) {
          return a.status === 'PENDING' ? -1 : 1;
        }
        if (sortBy === 'PRICE_DESC') return (Number(b.price) || 0) - (Number(a.price) || 0);
        if (sortBy === 'PRICE_ASC') return (Number(a.price) || 0) - (Number(b.price) || 0);
        if (sortBy === 'PRIORITY') return (priorityRank[b.priority] || 2) - (priorityRank[a.priority] || 2);
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [currencyItems, statusFilter, searchQuery, sortBy]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = quickName.trim();
    const numPrice = parseFloat(quickPrice.replace(',', '.'));
    if (!trimmedName || isNaN(numPrice) || numPrice < 0) return;

    const linkInfo = getSafeLinkInfo(quickLink);

    setIsSubmittingQuick(true);
    try {
      await onSaveItem({
        name: trimmedName,
        price: numPrice,
        currency: selectedCurrency,
        category: quickCategory,
        priority: quickPriority,
        status: 'PENDING',
        link: linkInfo ? linkInfo.href : '',
        notes: '',
        targetDate: '',
        createdAt: new Date().toISOString()
      });
      setQuickName('');
      setQuickPrice('');
      setQuickLink('');
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  const openModal = (item: WishlistItem | null) => {
    setEditingItem(item);
    if (item) {
      setModalName(item.name);
      setModalPrice(String(item.price));
      setModalLink(item.link || '');
      setModalCurrency(item.currency || selectedCurrency);
      setModalCategory(item.category || 'Casa & Móveis');
      setModalPriority(item.priority || 'MEDIA');
      setModalTargetDate(item.targetDate || '');
      setModalNotes(item.notes || '');
      setModalStatus(item.status || 'PENDING');
    } else {
      setModalName('');
      setModalPrice('');
      setModalLink('');
      setModalCurrency(selectedCurrency);
      setModalCategory('Casa & Móveis');
      setModalPriority('MEDIA');
      setModalTargetDate('');
      setModalNotes('');
      setModalStatus('PENDING');
    }
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = modalName.trim();
    const numPrice = parseFloat(modalPrice.replace(',', '.'));
    if (!trimmedName || isNaN(numPrice) || numPrice < 0) return;

    const linkInfo = getSafeLinkInfo(modalLink);

    await onSaveItem({
      ...(editingItem?.id ? { id: editingItem.id } : {}),
      name: trimmedName,
      price: numPrice,
      currency: modalCurrency,
      category: modalCategory,
      priority: modalPriority,
      status: modalStatus,
      link: linkInfo ? linkInfo.href : '',
      targetDate: modalTargetDate,
      notes: modalNotes.trim(),
      purchasedAt: modalStatus === 'PURCHASED' ? (editingItem?.purchasedAt || new Date().toISOString()) : '',
      createdAt: editingItem?.createdAt || new Date().toISOString()
    });
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = (item: WishlistItem) => {
    const msg = isPT
      ? `Remover "${item.name}" da sua lista de desejos?`
      : `Remove "${item.name}" from your wishlist?`;
    if (window.confirm(msg)) {
      onDeleteItem(item.id);
    }
  };

  const handleRecordExpenseClick = async (item: WishlistItem) => {
    if (!onRecordExpense) return;
    const msg = isPT
      ? `Deseja lançar "${item.name}" (${formatCurrency(item.price, item.currency)}) como uma Despesa nas suas Transações?`
      : `Record "${item.name}" (${formatCurrency(item.price, item.currency)}) as an Expense in Transactions?`;
    if (window.confirm(msg)) {
      await onRecordExpense(item);
      setRecordedExpenseIds(prev => [...prev, item.id]);
    }
  };

  const priorityBadge = (priority: 'ALTA' | 'MEDIA' | 'BAIXA') => {
    if (priority === 'ALTA') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
          {isPT ? 'Alta Prioridade' : 'High Priority'}
        </span>
      );
    }
    if (priority === 'BAIXA') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {isPT ? 'Baixa' : 'Low'}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
        {isPT ? 'Média' : 'Medium'}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
              <span>{isPT ? 'Lista de Desejos' : 'Shopping Wishlist'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {isPT ? 'Carrinho de Compras Futuras' : 'Future Purchases Cart'}
              </span>
            </h2>
            <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {isPT
                ? 'Anote tudo o que você deseja comprar (ex: carro, sofá), veja o total do carrinho e marque como Conquistado quando comprar.'
                : 'Save things you plan to buy, track the total cart value, and mark items as conquered when purchased.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          {/* CURRENCY TOGGLE */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex gap-1">
            <button
              type="button"
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
              type="button"
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

          <button
            type="button"
            onClick={() => openModal(null)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs md:text-sm shadow-xl shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isPT ? 'Novo Desejo' : 'New Item'}</span>
          </button>
        </div>
      </div>

      {/* CART SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL NO CARRINHO (FALTA COMPRAR) */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-blue-200/80 dark:border-blue-900/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {isPT ? 'Total no Carrinho (A Comprar)' : 'Cart Total (To Buy)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(stats.pendingTotal)}
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
            {stats.pendingCount} {isPT ? (stats.pendingCount === 1 ? 'item pendente' : 'itens pendentes') : 'pending items'}
          </p>
        </div>

        {/* TOTAL CONQUISTADO */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {isPT ? 'Total Conquistado' : 'Total Conquered'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(stats.purchasedTotal)}
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
            {stats.purchasedCount} {isPT ? (stats.purchasedCount === 1 ? 'item comprado' : 'itens comprados') : 'items bought'} ({stats.conqueredPercent}%)
          </p>
        </div>

        {/* VALOR TOTAL DA LISTA (TUDO NO CARRINHO) */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isPT ? 'Total Geral da Lista' : 'Grand List Total'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
            {formatCurrency(stats.grandTotal)}
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
            {stats.totalCount} {isPT ? (stats.totalCount === 1 ? 'desejo anotado' : 'desejos anotados') : 'total items'}
          </p>
        </div>

        {/* SEU SALDO / PODER DE COMPRA */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isPT ? 'Seu Saldo Disponível' : 'Your Available Balance'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black tracking-tight ${
            financialTotals.availableBalance >= 0
              ? 'text-slate-900 dark:text-white'
              : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(financialTotals.availableBalance)}
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 truncate">
            {isPT ? 'Patrimônio total: ' : 'Net worth: '}
            <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(financialTotals.totalPatrimony)}</strong>
          </p>
        </div>
      </div>

      {/* QUICK ADD BAR */}
      <form
        onSubmit={handleQuickAdd}
        className="bg-white dark:bg-slate-800/90 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {isPT ? 'Adicionar Item Rápido ao Carrinho' : 'Quick Add to Cart'}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5">
            <input
              type="text"
              required
              value={quickName}
              onChange={e => setQuickName(e.target.value)}
              placeholder={isPT ? 'O que deseja comprar? (Ex: Sofá, Carro, TV...)' : 'What do you want to buy?'}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="lg:col-span-2 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
              {selectedCurrency === 'BRL' ? 'R$' : '$'}
            </span>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={quickPrice}
              onChange={e => setQuickPrice(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={quickCategory}
              onChange={e => setQuickCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <select
              value={quickPriority}
              onChange={e => setQuickPriority(e.target.value as 'ALTA' | 'MEDIA' | 'BAIXA')}
              className="w-full px-2.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALTA">{isPT ? 'Alta' : 'High'}</option>
              <option value="MEDIA">{isPT ? 'Média' : 'Med'}</option>
              <option value="BAIXA">{isPT ? 'Baixa' : 'Low'}</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={isSubmittingQuick}
              className="w-full h-full min-h-[42px] px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isPT ? 'Adicionar' : 'Add'}</span>
            </button>
          </div>
        </div>

        <div className="mt-3 relative">
          <Link2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={quickLink}
            onChange={e => setQuickLink(e.target.value)}
            placeholder={isPT ? 'Link de onde está vendo essa compra (opcional — ex: https://www.mercadolivre.com.br/...)' : 'Store or listing URL (optional)'}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {isPT ? 'Todos' : 'All'} ({stats.totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'PENDING'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {isPT ? 'No Carrinho' : 'In Cart'} ({stats.pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PURCHASED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'PURCHASED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {isPT ? 'Conquistados' : 'Conquered'} ({stats.purchasedCount})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isPT ? 'Buscar item...' : 'Search item...'}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NEWEST">{isPT ? 'Mais recentes' : 'Newest'}</option>
              <option value="PRICE_DESC">{isPT ? 'Maior valor' : 'Highest price'}</option>
              <option value="PRICE_ASC">{isPT ? 'Menor valor' : 'Lowest price'}</option>
              <option value="PRIORITY">{isPT ? 'Prioridade' : 'Priority'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT: ITEMS LIST + SHOPPING CART RECEIPT SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: ITEMS LIST */}
        <div className="lg:col-span-8 space-y-3.5">
          {displayedItems.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                {isPT ? 'Seu carrinho de desejos está vazio' : 'Your shopping wishlist is empty'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                {isPT
                  ? 'Adicione itens que você pretende comprar no futuro, como um carro, sofá, celular ou viagem, e acompanhe o custo total.'
                  : 'Add items you plan to purchase in the future and keep track of their total cost.'}
              </p>
              <button
                type="button"
                onClick={() => openModal(null)}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-xl shadow-blue-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isPT ? 'Adicionar Primeiro Item' : 'Add First Item'}</span>
              </button>
            </div>
          ) : (
            displayedItems.map(item => {
              const isPurchased = item.status === 'PURCHASED';
              const price = Number(item.price) || 0;
              const canAffordNow = !isPurchased && financialTotals.availableBalance >= price && price > 0;
              const missingInBalance = Math.max(0, price - Math.max(0, financialTotals.availableBalance));
              const linkInfo = getSafeLinkInfo(item.link);

              return (
                <div
                  key={item.id}
                  className={`p-4 md:p-5 rounded-3xl border transition-all duration-200 ${
                    isPurchased
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-800/60 shadow-sm'
                      : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* ITEM INFO */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        isPurchased
                          ? 'bg-emerald-500 text-white'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      }`}>
                        {isPurchased ? <Trophy className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            {item.category || 'Geral'}
                          </span>
                          {!isPurchased && priorityBadge(item.priority || 'MEDIA')}
                          {isPurchased && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {isPT ? 'Conquistado' : 'Conquered'}
                            </span>
                          )}
                        </div>

                        <h4 className={`text-base md:text-lg font-black tracking-tight truncate ${
                          isPurchased
                            ? 'text-emerald-900 dark:text-emerald-200 line-through decoration-emerald-500/60'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {item.name}
                        </h4>

                        {item.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {item.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-3 flex-wrap mt-2 text-[11px] font-semibold text-slate-400">
                          {linkInfo && (
                            <a
                              href={linkInfo.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold transition-colors"
                              title={linkInfo.href}
                            >
                              <Link2 className="w-3 h-3" />
                              <span className="max-w-[180px] truncate">{linkInfo.host}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          )}
                          {item.targetDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {isPT ? 'Previsão: ' : 'Target: '}{item.targetDate}
                            </span>
                          )}
                          {isPurchased && item.purchasedAt && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {isPT ? 'Comprado em ' : 'Bought on '}
                              {new Date(item.purchasedAt).toLocaleDateString(language)}
                            </span>
                          )}
                          {!isPurchased && price > 0 && (
                            canAffordNow ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                {isPT ? 'Saldo disponível cobre este item' : 'Covered by available balance'}
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-bold">
                                {isPT ? `Falta ${formatCurrency(missingInBalance, item.currency)} no saldo` : `${formatCurrency(missingInBalance, item.currency)} short`}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PRICE & ACTIONS */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-700 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          {isPT ? 'Valor / Custo' : 'Cost'}
                        </span>
                        <span className={`text-xl font-black tracking-tight ${
                          isPurchased
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {formatCurrency(price, item.currency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {!isPurchased ? (
                          <button
                            type="button"
                            onClick={() => onTogglePurchased(item)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            title={isPT ? 'Marcar este item como já comprado / conquistado' : 'Mark as purchased'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isPT ? 'Conquistado' : 'Conquered'}</span>
                          </button>
                        ) : (
                          <>
                            {onRecordExpense && !recordedExpenseIds.includes(item.id) && (
                              <button
                                type="button"
                                onClick={() => handleRecordExpenseClick(item)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-all cursor-pointer"
                                title={isPT ? 'Lançar como despesa no extrato' : 'Log as expense'}
                              >
                                {isPT ? 'Lançar Despesa' : 'Log Expense'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onTogglePurchased(item)}
                              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                              title={isPT ? 'Voltar para o carrinho' : 'Return to cart'}
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{isPT ? 'Desfazer' : 'Undo'}</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => openModal(item)}
                          className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                          title={isPT ? 'Editar item' : 'Edit item'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title={isPT ? 'Excluir item' : 'Delete item'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT: SHOPPING CART CHECKOUT RECEIPT SUMMARY */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm p-5 md:p-6 lg:sticky lg:top-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {isPT ? 'Resumo do Carrinho' : 'Cart Summary'}
                </h3>
                <p className="text-[11px] font-semibold text-slate-400">
                  {stats.pendingCount} {isPT ? 'itens a comprar' : 'items to buy'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {stats.conqueredPercent}% {isPT ? 'conquistado' : 'done'}
            </span>
          </div>

          {/* PROGRESS BAR */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              <span>{isPT ? 'Conquistas da Lista' : 'Wishlist Progress'}</span>
              <span>{stats.purchasedCount}/{stats.totalCount}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.conqueredPercent}%` }}
              />
            </div>
          </div>

          {/* MINI RECEIPT OF PENDING ITEMS */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {isPT ? 'Itens no Carrinho' : 'Items in Cart'}
            </p>
            {stats.pendingItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                {isPT ? 'Nenhum item pendente no momento.' : 'No pending items.'}
              </p>
            ) : (
              stats.pendingItems.map(pi => {
                const piLink = getSafeLinkInfo(pi.link);
                return (
                  <div key={pi.id} className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-dashed border-slate-100 dark:border-slate-700/70">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{pi.name}</span>
                      {piLink && (
                        <a
                          href={piLink.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 shrink-0"
                          title={piLink.href}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <span className="font-black text-slate-900 dark:text-white shrink-0">
                      {formatCurrency(pi.price, pi.currency)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* TOTALS BREAKDOWN */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400">
                {isPT ? 'Subtotal A Comprar:' : 'Pending Subtotal:'}
              </span>
              <span className="font-black text-blue-600 dark:text-blue-400">
                {formatCurrency(stats.pendingTotal)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400">
                {isPT ? 'Já Conquistados:' : 'Already Bought:'}
              </span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(stats.purchasedTotal)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isPT ? 'Total Geral do Carrinho' : 'Cart Grand Total'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {stats.totalCount} {isPT ? 'itens' : 'items'}
                </span>
              </div>
              <span className="text-xl font-black text-white">
                {formatCurrency(stats.grandTotal)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                <span>{isPT ? 'Seu Saldo Atual:' : 'Current Balance:'}</span>
                <span>{formatCurrency(financialTotals.availableBalance)}</span>
              </div>
              {stats.pendingTotal > 0 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {financialTotals.availableBalance >= stats.pendingTotal
                    ? (isPT ? '🎉 Seu saldo atual já cobre todo o carrinho!' : '🎉 Your balance covers the entire cart!')
                    : (isPT
                        ? `Falta ${formatCurrency(stats.pendingTotal - Math.max(0, financialTotals.availableBalance))} para comprar tudo do carrinho.`
                        : `${formatCurrency(stats.pendingTotal - Math.max(0, financialTotals.availableBalance))} left to buy everything.`)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED ADD / EDIT MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingItem
                      ? (isPT ? 'Editar Item da Lista' : 'Edit Wishlist Item')
                      : (isPT ? 'Novo Desejo de Compra' : 'New Purchase Wish')}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    {isPT ? 'Informe o item e o custo previsto' : 'Enter item details and estimated price'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {isPT ? 'O que você quer comprar? *' : 'Item Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={e => setModalName(e.target.value)}
                  placeholder={isPT ? 'Ex: Carro, Sofá 3 lugares, Notebook...' : 'Ex: Car, Sofa, Laptop...'}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {isPT ? 'Valor / Custo *' : 'Price / Cost *'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-xs text-slate-400">
                      {modalCurrency === 'BRL' ? 'R$' : '$'}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={modalPrice}
                      onChange={e => setModalPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      onClick={() => setModalCurrency('BRL')}
                      className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                        modalCurrency === 'BRL'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      BRL (R$)
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalCurrency('USD')}
                      className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                        modalCurrency === 'USD'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {isPT ? 'Categoria' : 'Category'}
                  </label>
                  <select
                    value={modalCategory}
                    onChange={e => setModalCategory(e.target.value)}
                    className="w-full px-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {isPT ? 'Prioridade' : 'Priority'}
                  </label>
                  <select
                    value={modalPriority}
                    onChange={e => setModalPriority(e.target.value as 'ALTA' | 'MEDIA' | 'BAIXA')}
                    className="w-full px-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALTA">{isPT ? 'Alta Prioridade' : 'High'}</option>
                    <option value="MEDIA">{isPT ? 'Média' : 'Medium'}</option>
                    <option value="BAIXA">{isPT ? 'Baixa' : 'Low'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {isPT ? 'Previsão de Compra (Opcional)' : 'Target Date (Optional)'}
                  </label>
                  <input
                    type="month"
                    value={modalTargetDate}
                    onChange={e => setModalTargetDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    {isPT ? 'Status' : 'Status'}
                  </label>
                  <select
                    value={modalStatus}
                    onChange={e => setModalStatus(e.target.value as 'PENDING' | 'PURCHASED')}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">{isPT ? 'No Carrinho (A Comprar)' : 'In Cart (Pending)'}</option>
                    <option value="PURCHASED">{isPT ? 'Conquistado (Já Comprado)' : 'Conquered (Bought)'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {isPT ? 'Link do Anúncio / Loja (Opcional)' : 'Store / Listing Link (Optional)'}
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={modalLink}
                    onChange={e => setModalLink(e.target.value)}
                    placeholder={isPT ? 'Ex: https://www.mercadolivre.com.br/... ou webmotors.com.br/...' : 'https://...'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {isPT ? 'Observações (Opcional)' : 'Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                  placeholder={isPT ? 'Ex: Modelo desejado, cor, detalhes da loja...' : 'Store, model, or notes...'}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isPT ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  {editingItem ? (isPT ? 'Salvar Alterações' : 'Save Changes') : (isPT ? 'Adicionar ao Carrinho' : 'Add to Cart')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
