
export type Page = 'Dashboard' | 'Transações' | 'Investimentos' | 'Metas' | 'Agenda' | 'Insights' | 'Configurações' | 'Relatórios' | 'Admin' | 'Créditos' | 'Assinaturas' | 'Open Finance';
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
  userId?: string;
  createdAt?: string;
}

export interface Investment {
    id: string;
    name: string;
    initialAmount: number;
    currentValue: number;
    yieldRate: number; // Percentage
    currency: Currency;
    userId?: string;
    goalId?: string;
    category?: string;
}

export interface CalendarEvent {
    id: string;
    description: string;
    date: string;
    done: boolean;
    userId?: string;
}

export interface Subscription {
    id: string;
    description: string;
    amount: number;
    currency: Currency;
    dueDay: number;
    category: string;
    status: 'ACTIVE' | 'PAUSED';
    userId?: string;
    startDate?: string;
}

export interface CreditCard {
    id: string;
    name: string;
    limit: number;
    closingDay: number;
    dueDay: number;
    currency: Currency;
    userId?: string;
}

export interface CreditTransaction {
    id: string;
    cardId: string; // "cheque_especial" as a special ID or a separate flag
    description: string;
    amount: number;
    installments: number; // Current installment / Total installments (e.g., 1/12)
    totalInstallments: number;
    date: string;
    category: string;
    userId?: string;
    isOverdraft?: boolean;
    status?: 'PENDING' | 'PAID';
    paymentDate?: string;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  messages: AiMessage[];
  lastUpdate: string;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string; // base64 encoded image
  phone?: string;
  cpf?: string;
  cnpj?: string;
  companyName?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  onboardingObjective?: string;
  onboardingReason?: string;
  subscriptionStatus?: 'ACTIVE' | 'PENDING' | 'OVERDUE' | 'INACTIVE';
  plan: Plan;
  billingCycle?: BillingCycle;
  // Added language property to User interface
  language?: Language;
  role?: 'admin' | 'user';
  phoneVerified?: boolean;
  emailVerified?: boolean;
  overdraftLimit?: number;
  emailNotifications?: boolean;
  emailNotificationsDaysAndBefore?: number; // e.g. 1, 2, 3 days before
  createdAt?: string;
}

export interface SystemNotification {
    id: string;
    title: string;
    message: string;
    userId: string; // 'all' for general, or target userId for specific
    createdAt: string;
}

export interface GoalMilestone {
  id: string;
  monthNumber: number; // 1, 2, 3...
  monthLabel: string; // Ex: "Mês 1 (Set/2026)"
  targetAmount: number; // Valor previsto para guardar neste mês
  savedAmount: number; // Valor efetivamente já guardado neste mês
  isCompleted: boolean; // Se a meta deste mês foi cumprida
  completedAt?: string;
  notes?: string;
}

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  milestoneId?: string;
  note?: string;
  deductFromBalance?: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  currency: Currency;
  targetMonths: number;
  startDate: string; // YYYY-MM
  deadlineDate: string; // YYYY-MM
  distributionType: 'EQUAL' | 'CUSTOM' | 'PROGRESSIVE';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
  icon?: string;
  color?: string;
  milestones: GoalMilestone[];
  contributions?: GoalContribution[];
  createdAt: string;
  updatedAt?: string;
}

export interface PluggyConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  autoSync?: boolean;
  autoImportTransactions?: boolean;
  defaultSyncIntervalHours?: number;
  webhookUrl?: string;
}

export interface PluggyConnector {
  id: number;
  name: string;
  primaryColor: string;
  institutionUrl: string;
  imageUrl: string;
  type: string;
  popular?: boolean;
  supportsPayment?: boolean;
}

export interface BankAccount {
  id: string;
  itemId: string;
  type: string;
  subtype?: string;
  name: string;
  balance: number;
  currencyCode?: Currency;
  bankName: string;
  accountNumber?: string;
  agency?: string;
  color?: string;
  creditLimit?: number;
  autoSyncTransactions?: boolean;
  updatedAt?: string;
  userId?: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  itemId?: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  category?: string;
  date: string;
  bankName?: string;
  status?: string;
  imported?: boolean;
  userId?: string;
  importedAt?: string;
}

export interface BankConnection {
  id: string;
  itemId: string;
  connector: PluggyConnector;
  status: string;
  executionStatus: string;
  lastUpdatedAt: string;
  createdAt: string;
  accountsCount: number;
  userId: string;
}
