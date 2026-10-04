import { BankConnection, BankAccount, BankTransaction, PluggyConnector, PluggyConfig, PersonalTransaction, TransactionType } from '../types';

// Default Brazilian Financial Institutions supported by Pluggy Open Finance
export const DEFAULT_PLUGGY_CONNECTORS: PluggyConnector[] = [
  {
    id: 201,
    name: 'Nubank',
    primaryColor: '#820AD1',
    institutionUrl: 'https://nubank.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    type: 'PERSONAL_BANK',
    popular: true,
    supportsPayment: true
  },
  {
    id: 1,
    name: 'Itaú Unibanco',
    primaryColor: '#EC7000',
    institutionUrl: 'https://www.itau.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    type: 'PERSONAL_BANK',
    popular: true,
    supportsPayment: true
  },
  {
    id: 2,
    name: 'Bradesco',
    primaryColor: '#CC092F',
    institutionUrl: 'https://banco.bradesco',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    type: 'PERSONAL_BANK',
    popular: true,
    supportsPayment: true
  },
  {
    id: 3,
    name: 'Banco do Brasil',
    primaryColor: '#003DA5',
    institutionUrl: 'https://www.bb.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    type: 'PERSONAL_BANK',
    popular: true,
    supportsPayment: true
  },
  {
    id: 4,
    name: 'Santander Brasil',
    primaryColor: '#EC0000',
    institutionUrl: 'https://www.santander.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    type: 'PERSONAL_BANK',
    popular: true,
    supportsPayment: true
  },
  {
    id: 5,
    name: 'Banco Inter',
    primaryColor: '#FF7A00',
    institutionUrl: 'https://inter.co',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    type: 'PERSONAL_BANK',
    popular: true,
    supportsPayment: true
  },
  {
    id: 6,
    name: 'Caixa Econômica Federal',
    primaryColor: '#005CA9',
    institutionUrl: 'https://www.caixa.gov.br',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    type: 'PERSONAL_BANK',
    popular: true,
    supportsPayment: true
  },
  {
    id: 7,
    name: 'BTG Pactual',
    primaryColor: '#001E62',
    institutionUrl: 'https://www.btgpactual.com',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    type: 'INVESTMENT',
    popular: true,
    supportsPayment: false
  },
  {
    id: 8,
    name: 'C6 Bank',
    primaryColor: '#242424',
    institutionUrl: 'https://www.c6bank.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    type: 'PERSONAL_BANK',
    popular: true,
    supportsPayment: true
  },
  {
    id: 9,
    name: 'XP Investimentos',
    primaryColor: '#0A0A0A',
    institutionUrl: 'https://www.xpi.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    type: 'INVESTMENT',
    popular: true,
    supportsPayment: false
  },
  {
    id: 10,
    name: 'Mercado Pago',
    primaryColor: '#009EE3',
    institutionUrl: 'https://www.mercadopago.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    type: 'PERSONAL_BANK',
    popular: true,
    supportsPayment: true
  },
  {
    id: 11,
    name: 'Sicredi',
    primaryColor: '#007A33',
    institutionUrl: 'https://www.sicredi.com.br',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    type: 'PERSONAL_BANK',
    popular: false,
    supportsPayment: true
  }
];

const PLUGGY_CONFIG_KEY = 'pluggy_open_finance_config_v1';
const PLUGGY_TRANSACTIONS_CACHE = 'pluggy_open_finance_txs_v1';

export class PluggyService {
  private static config: PluggyConfig = {
    clientId: 'a4a26fd8-a803-4985-be8d-f56a0f3aa868',
    clientSecret: 'rtJpjYaHbOIvpU64J8AfoAtu17471qQN_hiOoppefRk',
    environment: 'production',
    autoImportTransactions: true,
    defaultSyncIntervalHours: 4
  };

  static getConfig(): PluggyConfig {
    try {
      const stored = localStorage.getItem(PLUGGY_CONFIG_KEY);
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Erro ao carregar config da Pluggy:', e);
    }
    return this.config;
  }

  static saveConfig(newConfig: Partial<PluggyConfig>): PluggyConfig {
    this.config = { ...this.getConfig(), ...newConfig };
    localStorage.setItem(PLUGGY_CONFIG_KEY, JSON.stringify(this.config));
    return this.config;
  }

  static isConfigured(): boolean {
    const cfg = this.getConfig();
    return Boolean(cfg.clientId && cfg.clientSecret);
  }

  /**
   * Get or generate Connect Token using backend route or direct API
   */
  static async getConnectToken(clientUserId?: string): Promise<{ success: boolean; accessToken?: string; error?: string }> {
    // 1. Try backend server route
    try {
      const res = await fetch('/api/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientUserId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) {
          return { success: true, accessToken: data.accessToken };
        }
      }
    } catch (e) {
      console.warn('Tentativa via /api/connect-token falhou, usando autenticação direta Pluggy:', e);
    }

    // 2. Direct Pluggy API fallback
    const authRes = await this.authenticate();
    if (!authRes.success || !authRes.apiKey) {
      return { success: false, error: authRes.error || 'Credenciais Pluggy não autorizadas' };
    }
    return this.createConnectToken(authRes.apiKey);
  }

  /**
   * Sync an item via backend route (recommended for accurate balances and transactions)
   */
  static async syncItemWithBackend(itemId: string, userId: string): Promise<{
    success: boolean;
    accounts: BankAccount[];
    transactions: BankTransaction[];
    bankName: string;
    item?: any;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/pluggy/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, userId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return {
            success: true,
            accounts: data.accounts || [],
            transactions: data.transactions || [],
            bankName: data.bankName || 'Banco Conectado',
            item: data.item
          };
        }
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, accounts: [], transactions: [], bankName: '', error: err.error || 'Erro no sync' };
    } catch (e: any) {
      // If backend call fails, try direct client side
      return this.syncItemDirect(itemId, userId);
    }
  }

  /**
   * Direct sync fallback in case backend is unreachable
   */
  static async syncItemDirect(itemId: string, userId: string): Promise<{
    success: boolean;
    accounts: BankAccount[];
    transactions: BankTransaction[];
    bankName: string;
    error?: string;
  }> {
    const authRes = await this.authenticate();
    if (!authRes.success || !authRes.apiKey) {
      return { success: false, accounts: [], transactions: [], bankName: '', error: authRes.error };
    }

    const accounts = await this.fetchRealAccounts(itemId, authRes.apiKey);
    const transactions: BankTransaction[] = [];

    for (const acc of accounts) {
      const txs = await this.fetchRealTransactions(acc.id, authRes.apiKey, acc.bankName, itemId, userId);
      transactions.push(...txs);
    }

    return {
      success: true,
      accounts,
      transactions,
      bankName: accounts[0]?.bankName || 'Banco Conectado'
    };
  }

  /**
   * Authenticate with Pluggy API to get an API Key
   */
  static async authenticate(clientId?: string, clientSecret?: string): Promise<{ success: boolean; apiKey?: string; error?: string }> {
    const cfg = this.getConfig();
    const id = clientId || cfg.clientId;
    const secret = clientSecret || cfg.clientSecret;

    if (!id || !secret) {
      return { success: false, error: 'Chaves da API Pluggy (Client ID e Secret) não configuradas.' };
    }

    try {
      const res = await fetch('https://api.pluggy.ai/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id, clientSecret: secret })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: errJson.message || `Erro de autenticação HTTP ${res.status}` };
      }

      const data = await res.json();
      return { success: true, apiKey: data.apiKey };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha na conexão com api.pluggy.ai' };
    }
  }

  /**
   * Create an official Connect Token for the Pluggy Connect Widget
   */
  static async createConnectToken(apiKey: string, connectorId?: number): Promise<{ success: boolean; accessToken?: string; error?: string }> {
    try {
      const bodyPayload: any = {};
      if (connectorId) bodyPayload.connectorId = connectorId;

      const res = await fetch('https://api.pluggy.ai/connect_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify(bodyPayload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: errJson.message || `Erro ao gerar Connect Token (HTTP ${res.status})` };
      }

      const data = await res.json();
      return { success: true, accessToken: data.accessToken };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de rede ao conectar com Pluggy' };
    }
  }

  /**
   * Fetch real accounts from an authentic Pluggy Item ID
   */
  static async fetchRealAccounts(itemId: string, apiKey: string): Promise<BankAccount[]> {
    try {
      const res = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, {
        headers: { 'X-API-KEY': apiKey }
      });
      if (!res.ok) return [];
      const data = await res.json();
      const results: any[] = data.results || [];
      return results.map((item: any) => ({
        id: item.id,
        itemId: item.itemId,
        type: item.type === 'CREDIT' ? 'CREDIT' : item.type === 'INVESTMENT' ? 'INVESTMENT' : 'BANK',
        subtype: item.subtype || 'CHECKING_ACCOUNT',
        name: item.name || 'Conta Bancária',
        balance: Math.round(Number(item.balance || 0) * 100) / 100,
        currencyCode: (item.currencyCode || 'BRL') as any,
        bankName: item.bankData?.institutionName || 'Banco Conectado',
        accountNumber: item.number || '••••',
        agency: item.agency || undefined,
        creditLimit: item.creditData?.creditLimit ? Number(item.creditData.creditLimit) : undefined,
        availableCreditLimit: item.creditData?.availableCreditLimit ? Number(item.creditData.availableCreditLimit) : undefined,
        autoSyncTransactions: true,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      console.warn('Erro ao buscar contas reais da Pluggy:', err);
      return [];
    }
  }

  /**
   * Fetch real transactions from an authentic Pluggy Account ID
   */
  static async fetchRealTransactions(
    accountId: string,
    apiKey: string,
    bankName: string,
    itemId: string,
    userId: string
  ): Promise<BankTransaction[]> {
    try {
      const res = await fetch(`https://api.pluggy.ai/transactions?accountId=${accountId}&pageSize=100`, {
        headers: { 'X-API-KEY': apiKey }
      });
      if (!res.ok) return [];
      const data = await res.json();
      const results: any[] = data.results || [];

      return results.map((tx: any) => {
        const rawAmt = Number(tx.amount) || 0;
        const isCredit = tx.type === 'CREDIT' || (tx.type !== 'DEBIT' && rawAmt > 0);
        const positiveAmount = Math.round(Math.abs(rawAmt) * 100) / 100;

        let dateStr = new Date().toISOString().split('T')[0];
        if (tx.date) {
          try {
            dateStr = new Date(tx.date).toISOString().split('T')[0];
          } catch (e) {}
        }

        return {
          id: tx.id,
          accountId,
          itemId,
          bankName,
          description: (tx.description || tx.descriptionRaw || 'Movimentação Bancária').trim(),
          amount: positiveAmount,
          date: dateStr,
          category: tx.category || (isCredit ? 'Receita Bancária' : 'Despesa Bancária'),
          type: isCredit ? 'CREDIT' : 'DEBIT',
          status: tx.status || 'POSTED',
          userId,
          imported: false
        };
      });
    } catch (err) {
      console.warn(`Erro ao buscar transações da conta ${accountId}:`, err);
      return [];
    }
  }

  /**
   * Test Pluggy API connection
   */
  static async testConnection(clientId: string, clientSecret: string, environment?: string): Promise<{ success: boolean; message: string; apiKey?: string }> {
    const authRes = await this.authenticate(clientId, clientSecret);
    if (!authRes.success || !authRes.apiKey) {
      return {
        success: false,
        message: authRes.error || 'Credenciais inválidas. Verifique seu Client ID e Client Secret em dashboard.pluggy.ai'
      };
    }
    return {
      success: true,
      message: 'Conexão com a API da Pluggy Open Finance validada com sucesso!',
      apiKey: authRes.apiKey
    };
  }

  /**
   * Create a Bank Connection from manual or OFX entry
   */
  static createRealConnection(
    connector: PluggyConnector,
    realBalance: number,
    accountNumber: string,
    agency: string = '',
    transactions: BankTransaction[] = [],
    userId: string
  ): { connection: BankConnection; accounts: BankAccount[]; transactions: BankTransaction[] } {
    const timestamp = new Date().toISOString();
    const itemId = 'bank_' + Date.now();
    const connectionId = 'conn_' + Date.now();
    const checkingAccId = 'acc_' + Date.now();

    const checkingAccount: BankAccount = {
      id: checkingAccId,
      itemId,
      type: connector.type === 'INVESTMENT' ? 'INVESTMENT' : 'BANK',
      subtype: connector.type === 'INVESTMENT' ? 'INVESTMENT_ACCOUNT' : 'CHECKING_ACCOUNT',
      name: `${connector.type === 'INVESTMENT' ? 'Investimentos' : 'Conta'} ${connector.name}`,
      balance: Math.round(Number(realBalance || 0) * 100) / 100,
      currencyCode: 'BRL',
      bankName: connector.name,
      accountNumber: accountNumber.trim() || 'Principal',
      agency: agency.trim() || undefined,
      userId,
      autoSyncTransactions: true,
      color: connector.primaryColor,
      updatedAt: timestamp
    };

    const assignedTransactions = transactions.map(t => ({
      ...t,
      accountId: checkingAccId,
      itemId,
      bankName: connector.name,
      userId
    }));

    const connection: BankConnection = {
      id: connectionId,
      itemId,
      connector,
      status: 'UPDATED',
      executionStatus: 'SUCCESS',
      lastUpdatedAt: timestamp,
      createdAt: timestamp,
      accountsCount: 1,
      userId
    };

    if (assignedTransactions.length > 0) {
      const existing = this.getCachedTransactions(userId);
      this.saveCachedTransactions(userId, [...assignedTransactions, ...existing]);
    }

    return {
      connection,
      accounts: [checkingAccount],
      transactions: assignedTransactions
    };
  }

  static getCachedTransactions(userId: string): BankTransaction[] {
    try {
      const raw = localStorage.getItem(`${PLUGGY_TRANSACTIONS_CACHE}_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  static saveCachedTransactions(userId: string, txs: BankTransaction[]) {
    try {
      localStorage.setItem(`${PLUGGY_TRANSACTIONS_CACHE}_${userId}`, JSON.stringify(txs));
    } catch (e) {}
  }

  static clearCachedTransactions(userId: string) {
    try {
      localStorage.removeItem(`${PLUGGY_TRANSACTIONS_CACHE}_${userId}`);
    } catch (e) {}
  }

  /**
   * Convert Open Finance transactions into app's PersonalTransactions
   * Guaranteeing strictly positive amount and proper type (Receita / Despesa)
   */
  static convertToPersonalTransactions(bankTransactions: BankTransaction[], userId: string): Omit<PersonalTransaction, 'id'>[] {
    return bankTransactions.map(tx => ({
      description: `${tx.description} (${tx.bankName})`,
      amount: Math.round(Math.abs(Number(tx.amount) || 0) * 100) / 100,
      type: tx.type === 'CREDIT' ? TransactionType.Receita : TransactionType.Despesa,
      category: tx.category || (tx.type === 'CREDIT' ? 'Receita Bancária' : 'Despesa Bancária'),
      currency: 'BRL',
      date: tx.date,
      userId,
      bankName: tx.bankName,
      isBankImported: true,
      createdAt: new Date().toISOString()
    }));
  }
}
