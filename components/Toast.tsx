
import React, { useEffect } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastProps {
    toast: ToastMessage;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Some após 3 segundos
        return () => clearTimeout(timer);
    }, [toast, onClose]);

    let bgColor = 'bg-blue-500';
    let Icon = CheckCircleIcon;

    if (toast.type === 'success') {
        bgColor = 'bg-green-500';
        Icon = CheckCircleIcon;
    } else if (toast.type === 'error') {
        bgColor = 'bg-red-500';
        Icon = TrashIcon;
    }

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center ${bgColor} text-white px-6 py-3 rounded-lg shadow-xl transform transition-all duration-300 ease-in-out animate-slide-in-right`}>
            <Icon className="h-6 w-6 mr-3" />
            <span className="font-medium mr-4">{toast.message}</span>
            <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">
                <XIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

export default Toast;
