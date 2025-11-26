
import { User, PersonalTransaction, Investment } from '../types';

// URL atualizada e correta (versão /exec)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_WbdPuvqgK32yOyn76CBItcB-d3zmcBcZq70cBwafSZJgqyA61685U1plUtfc4qri/exec';

// Helper para montar a URL com query params
const getUrl = (route: string, token?: string) => {
    let url = `${GOOGLE_SCRIPT_URL}?route=${route}`;
    if (token) {
        url += `&token=${encodeURIComponent(token)}`;
    }
    return url;
};

// Helper para fazer POST request evitando CORS Preflight complexo
// Enviamos como text/plain, mas o body é JSON string.
const postData = async (route: string, data: any) => {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?route=${route}`, {
            method: 'POST',
            redirect: "follow", // Importante para seguir o redirect do Google
            headers: {
                "Content-Type": "text/plain;charset=utf-8", // Truque para evitar Preflight
            },
            body: JSON.stringify(data)
        });

        const text = await response.text();
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Erro ao fazer parse do JSON vindo do Google:", text);
            return { error: true, message: "Erro de comunicação com o servidor. Tente novamente." };
        }
    } catch (error) {
        console.error("Erro de rede:", error);
        return { error: true, message: "Erro de conexão." };
    }
};

export const api = {
    // Autenticação
    login: async (credentials: any) => {
        return postData('auth/login', credentials);
    },

    createUser: async (user: Omit<User, 'id'>) => {
        return postData('users', user);
    },

    // Transações
    getTransactions: async (token: string) => {
        try {
            const response = await fetch(getUrl('transactions', token));
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch {
                return [];
            }
        } catch (e) {
            return [];
        }
    },

    createTransaction: async (transaction: Omit<PersonalTransaction, 'id'>, token: string) => {
        const payload = { ...transaction, token }; 
        return postData('transactions', payload);
    },

    // Investimentos
    getInvestments: async (token: string) => {
        try {
            const response = await fetch(getUrl('investments', token));
            const text = await response.text();
             try {
                return JSON.parse(text);
            } catch {
                return [];
            }
        } catch (e) {
            return [];
        }
    },
    
    createInvestment: async (investment: Omit<Investment, 'id'>, token: string) => {
        const payload = { ...investment, token };
        return postData('investments', payload);
    },

    // Usuário
    updatePassword: async (data: {currentPassword: string, newPassword: string}, token: string) => {
         const payload = { ...data, token };
         return postData('users/me/password', payload);
    },

    updateAvatar: async (data: {avatar: string}, token: string) => {
         const payload = { ...data, token };
         return postData('users/me/avatar', payload);
    }
};
