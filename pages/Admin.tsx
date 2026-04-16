
import React, { useState, useEffect } from 'react';
import { User, Plan } from '../types';
import { api } from '../services/api';

const Admin: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const fetchedUsers = await api.getAllUsers('');
                if (fetchedUsers) setUsers(fetchedUsers);
            } catch (error) {
                console.error("Erro ao carregar usuários:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleUpdatePlan = async (userId: string, newPlan: Plan) => {
        setUpdatingUserId(userId);
        try {
            await api.updatePlan(newPlan, 'MONTHLY', userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
        } catch (error) {
            console.error("Erro ao atualizar plano:", error);
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleToggleStatus = async (email: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            await api.toggleUserStatus({ targetEmail: email, status: newStatus }, '');
            setUsers(prev => prev.map(u => u.email === email ? { ...u, subscriptionStatus: newStatus as any } : u));
        } catch (error) {
            console.error("Erro ao alternar status:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
                <p className="text-sm text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis">Gerenciamento de usuários e planos</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Plano</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs mr-3">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select 
                                            value={user.plan} 
                                            onChange={(e) => handleUpdatePlan(user.id!, e.target.value as Plan)}
                                            disabled={updatingUserId === user.id}
                                            className="text-xs font-bold bg-gray-100 dark:bg-slate-700 border-none rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="FREE">FREE</option>
                                            <option value="PRO">PRO</option>
                                            <option value="VIP">VIP</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            user.subscriptionStatus === 'ACTIVE' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                            {user.subscriptionStatus || 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => handleToggleStatus(user.email, user.subscriptionStatus || 'INACTIVE')}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors"
                                        >
                                            {user.subscriptionStatus === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Admin;
