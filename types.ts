
export type Page = 'Dashboard' | 'Transações' | 'Investimentos' | 'Agenda' | 'Configurações' | 'Relatórios';
export type Theme = 'light' | 'dark';
export type Plan = 'FREE' | 'PRO' | 'VIP';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';
export type Currency = 'BRL' | 'USD';
// Added Language type to fix missing export errors
export type Language = 'pt-BR' | 'en-US';

export enum TransactionType {
  Receita = 'Receita',
  Despesa = 'Despesa',
}

export interface PersonalTransaction {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  type: TransactionType;
  category: string;
}

export interface Investment {
    id: string;
    name: string;
    initialAmount: number;
    currentValue: number;
    yieldRate: number; // Percentage
    currency: Currency;
}

export interface CalendarEvent {
    id: string;
    description: string;
    date: string;
    done: boolean;
}

export interface User {
  name: string;
  email: string;
  password?: string;
  avatar?: string; // base64 encoded image
  phone?: string;
  cpf?: string;
  subscriptionStatus?: 'ACTIVE' | 'PENDING' | 'OVERDUE';
  plan: Plan;
  billingCycle?: BillingCycle;
  // Added language property to User interface
  language?: Language;
}
