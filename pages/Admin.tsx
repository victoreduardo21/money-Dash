
import React, { useState, useEffect } from 'react';
import { User, Plan } from '../types';
import { api } from '../services/api';
import { db } from '../services/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

const Admin: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snap) => {
            const fetchedUsers = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
            setUsers(fetchedUsers);
            setIsLoading(false);
        }, (error) => {
            console.error("Erro ao carregar usuários:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
                    <p className="text-sm text-gray-500">Gerenciamento de {users.length} usuários cadastrados</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Permissão</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contato</th>
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
                                                {user.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name || 'Sem nome'}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-medium ${user.role === 'admin' ? 'text-purple-600' : 'text-gray-600'}`}>
                                            {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.phone ? (
                                            <a 
                                                href={`https://wa.me/${user.phone.replace(/\D/g, '')}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs font-medium text-green-600 hover:text-green-500 flex items-center gap-1"
                                            >
                                                {user.phone}
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Não informado</span>
                                        )}
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
