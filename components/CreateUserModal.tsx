
import React, { useState, useEffect } from 'react';
import { User, Language } from '../types';
import { XIcon } from './icons/XIcon';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (newUser: Omit<User, 'id'>) => Promise<{success: boolean, message: string}>;
    // Added missing language prop
    language: Language;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onCreate, language }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [cpf, setCpf] = useState('');
    
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setEmail('');
            setPassword('');
            setPhone('');
            setCpf('');
            setError('');
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsLoading(true);
        // Enviamos 'plan: FREE' para satisfazer a interface User
        const result = await onCreate({ 
            name, 
            email, 
            password, 
            phone, 
            cpf,
            plan: 'FREE' 
        });
        setIsLoading(false);

        if (result.success) {
            alert('Usuário criado com sucesso!');
            onClose();
        } else {
            setError(result.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                            Criar Novo Usuário
                        </h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="create-name"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                            <input type="text" id="create-name" value={name}
                                onChange={e => setName(e.target.value)} required
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                        <div>
                            <label htmlFor="create-phone"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                            <input type="text" id="create-phone" value={phone}
                                onChange={e => setPhone(e.target.value)} required placeholder="(00) 00000-0000"
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                        <div>
                            <label htmlFor="create-cpf"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPF</label>
                            <input type="text" id="create-cpf" value={cpf}
                                onChange={e => setCpf(e.target.value)} required placeholder="000.000.000-00"
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                        <div>
                            <label htmlFor="create-email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input type="email" id="create-email" value={email}
                                onChange={e => setEmail(e.target.value)} required
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                        <div>
                            <label htmlFor="create-password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                            <input type="password" id="create-password" value={password}
                                onChange={e => setPassword(e.target.value)} required
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center pt-2">{error}</p>}
                    </div>
                    <div
                        className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                        <button type="button" onClick={onClose}
                            className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold text-sm">Cancelar
                        </button>
                        <button type="submit" disabled={isLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm disabled:bg-blue-400 disabled:cursor-not-allowed">
                            {isLoading ? 'Criando...' : 'Criar Usuário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserModal;
