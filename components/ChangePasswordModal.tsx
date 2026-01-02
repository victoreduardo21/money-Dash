
import React, { useState, useEffect } from 'react';
import { XIcon } from './icons/XIcon';
import { Language } from '../types';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (currentPassword: string, newPassword: string) => Promise<void> | void;
    // Added missing language prop
    language: Language;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSave, language }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('As novas senhas não coincidem.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(currentPassword, newPassword);
            onClose();
        } catch (e) {
            setError('Erro ao alterar senha. Verifique sua senha atual.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                            Alterar Senha
                        </h3>
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="current-password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha
                                Atual</label>
                            <input type="password" id="current-password" value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)} required
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                        <div>
                            <label htmlFor="new-password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nova
                                Senha</label>
                            <input type="password" id="new-password" value={newPassword}
                                onChange={e => setNewPassword(e.target.value)} required
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                        <div>
                            <label htmlFor="confirm-password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Nova
                                Senha</label>
                            <input type="password" id="confirm-password" value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)} required
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-200" />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <div
                        className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting}
                            className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold text-sm disabled:opacity-50">Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm disabled:bg-blue-400 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
