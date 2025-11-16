
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
