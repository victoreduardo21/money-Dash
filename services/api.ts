
import { User, PersonalTransaction, Investment } from '../types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_WbdPuvqgK32yOyn76CBItcB-d3zmcBcZq70cBwafSZJgqyA61685U1plUtfc4qri/exec';

// Helper para montar a URL com query params
const getUrl = (route: string, token?: string) => {
    let url = `${GOOGLE_SCRIPT_URL}?route=${route}`;
    if (token) {
        url += `&token=${encodeURIComponent(token)}`;
    }
    return url;
};

export const api = {
    // Autenticação
    login: async (credentials: any) => {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?route=auth/login`, {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        return response.json();
    },

    createUser: async (user: Omit<User, 'id'>) => {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?route=users`, {
            method: 'POST',
            body: JSON.stringify(user)
        });
        return response.json();
    },

    // Transações
    getTransactions: async (token: string) => {
        const response = await fetch(getUrl('transactions', token));
        return response.json();
    },

    createTransaction: async (transaction: Omit<PersonalTransaction, 'id'>, token: string) => {
        const payload = { ...transaction, token }; 
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?route=transactions`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return response.json();
    },

    // Investimentos
    getInvestments: async (token: string) => {
        const response = await fetch(getUrl('investments', token));
        return response.json();
    },
    
    createInvestment: async (investment: Omit<Investment, 'id'>, token: string) => {
        const payload = { ...investment, token };
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?route=investments`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return response.json();
    },

    // Usuário
    updatePassword: async (data: {currentPassword: string, newPassword: string}, token: string) => {
         const payload = { ...data, token };
         const response = await fetch(`${GOOGLE_SCRIPT_URL}?route=users/me/password`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return response.json();
    },

    updateAvatar: async (data: {avatar: string}, token: string) => {
         const payload = { ...data, token };
         const response = await fetch(`${GOOGLE_SCRIPT_URL}?route=users/me/avatar`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return response.json();
    }
};
