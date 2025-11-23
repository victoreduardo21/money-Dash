import { User, PersonalTransaction, Investment } from '../types';

// Este arquivo centraliza a comunicação com o Backend.
// Atualmente ele não está sendo usado (o App usa localStorage), 
// mas serve de guia para a futura integração.

const API_URL = 'https://api.seusistema.com/v1';

export const api = {
    // Autenticação
    login: async (credentials: any) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return response.json();
    },

    // Transações
    getTransactions: async (token: string) => {
        const response = await fetch(`${API_URL}/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    createTransaction: async (transaction: Omit<PersonalTransaction, 'id'>, token: string) => {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(transaction)
        });
        return response.json();
    },

    // Investimentos
    getInvestments: async (token: string) => {
        const response = await fetch(`${API_URL}/investments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    }
};
