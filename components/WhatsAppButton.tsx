
import React, { useState } from 'react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { XIcon } from './icons/XIcon';

const WhatsAppButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const phoneNumber = '5513996104848';
    
    // Opções de mensagem automática
    const options = [
        { label: "Falar sobre meu Plano", message: "Olá! Gostaria de falar sobre meu plano atual." },
        { label: "Trocar/Cancelar Assinatura", message: "Olá! Gostaria de tratar sobre a troca ou cancelamento da minha assinatura." },
        { label: "Suporte Técnico", message: "Olá! Preciso de ajuda técnica com o Money Dashs." },
        { label: "Dúvidas Gerais", message: "Olá! Tenho uma dúvida sobre o sistema." }
    ];

    const handleOptionClick = (message: string) => {
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Menu de Opções */}
            {isOpen && (
                <div className="mb-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-2 w-72 animate-fade-in-up origin-bottom-right">
                    <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-700 mb-1">
                         <p className="text-sm font-bold text-gray-800 dark:text-white">Central de Ajuda</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400">Como podemos te ajudar hoje?</p>
                    </div>
                    <div className="space-y-1">
                        {options.map((opt, index) => (
                            <button
                                key={index}
                                onClick={() => handleOptionClick(opt.message)}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 rounded-xl transition-all duration-200 flex items-center group"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-3 opacity-50 group-hover:opacity-100 transition-opacity"></span>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Botão Flutuante */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center border-2 border-transparent ${
                    isOpen 
                    ? 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-200 border-gray-200 dark:border-gray-600 rotate-90' 
                    : 'bg-[#25D366] text-white hover:bg-[#128C7E]'
                }`}
                title={isOpen ? "Fechar" : "Fale conosco no WhatsApp"}
            >
                {isOpen ? <XIcon className="h-7 w-7" /> : <WhatsAppIcon className="h-8 w-8" />}
            </button>
        </div>
    );
};

export default WhatsAppButton;
