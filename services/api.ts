
import { User, PersonalTransaction, Investment, CalendarEvent, Plan, BillingCycle, Language } from '../types';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_WbdPuvqgK32yOyn76CBItcB-d3zmcBcZq70cBwafSZJgqyA61685U1plUtfc4qri/exec';

const getUrl = (route: string, token?: string) => {
    let url = `${GOOGLE_SCRIPT_URL}?route=${route}`;
    if (token) url += `&token=${encodeURIComponent(token)}`;
    return url;
};

const postData = async (route: string, data: any) => {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?route=${route}`, {
            method: 'POST',
            redirect: "follow",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(data)
        });
        const text = await response.text();
        return JSON.parse(text);
    } catch (error) {
        return { error: true, message: "Erro de conexão." };
    }
};

export const api = {
    login: async (credentials: any) => postData('auth/login', credentials),
    createUser: async (user: Omit<User, 'id'>) => postData('users', user),
    getMe: async (token: string) => {
        const response = await fetch(getUrl('users/me', token));
        const text = await response.text();
        try { return JSON.parse(text); } catch { return null; }
    },
    updateLanguage: async (language: Language, token: string) => {
        return postData('users/me/language', { language, token });
    },
    updatePlan: async (plan: Plan, cycle: BillingCycle, token: string) => postData('users/me/plan', { plan, billingCycle: cycle, token }),
    getTransactions: async (token: string) => {
        const response = await fetch(getUrl('transactions', token));
        const text = await response.text();
        try { return JSON.parse(text); } catch { return []; }
    },
    createTransaction: async (transaction: Omit<PersonalTransaction, 'id'> & { id?: string }, token: string) => {
        return postData('transactions', { ...transaction, token });
    },
    deleteTransaction: async (id: string, token: string) => postData('transactions/delete', { id, token }),
    getInvestments: async (token: string) => {
        const response = await fetch(getUrl('investments', token));
        const text = await response.text();
        try { return JSON.parse(text); } catch { return []; }
    },
    createInvestment: async (investment: Omit<Investment, 'id'>, token: string) => postData('investments', { ...investment, token }),
    withdrawInvestment: async (id: string, token: string) => postData('investments/withdraw', { id, token }),
    deleteInvestment: async (id: string, token: string) => postData('investments/delete', { id, token }),
    getCalendarEvents: async (token: string) => {
        const response = await fetch(getUrl('calendar', token));
        const text = await response.text();
        try { return JSON.parse(text); } catch { return []; }
    },
    createCalendarEvent: async (event: Omit<CalendarEvent, 'id'>, token: string) => postData('calendar', { ...event, token }),
    toggleCalendarEvent: async (id: string, done: boolean, token: string) => postData('calendar/toggle', { id, done, token }),
    deleteCalendarEvent: async (id: string, token: string) => postData('calendar/delete', { id, token }),
    updatePassword: async (data: {currentPassword: string, newPassword: string}, token: string) => postData('users/me/password', { ...data, token }),
    updateAvatar: async (data: {avatar: string}, token: string) => postData('users/me/avatar', { ...data, token }),
    getAllUsers: async (token: string) => {
        const response = await fetch(getUrl('users', token));
        const text = await response.text();
        try { return JSON.parse(text); } catch { return []; }
    },
    toggleUserStatus: async (data: {targetEmail: string, status: string}, token: string) => {
        return postData('users/me/status', { ...data, token });
    }
};
