
export type Page = 'Dashboard' | 'Transações' | 'Investimentos' | 'Agenda' | 'Configurações' | 'Relatórios';
export type Theme = 'light' | 'dark';
export type Plan = 'FREE' | 'PRO' | 'VIP';

export enum TransactionType {
  Receita = 'Receita',
  Despesa = 'Despesa',
}

export interface PersonalTransaction {
  id: string;
  description: string;
  amount: number;
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
}
