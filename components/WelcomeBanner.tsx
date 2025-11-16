import React from 'react';
import { RocketLaunchIcon } from './icons/RocketLaunchIcon';
import { PlusIcon } from './icons/PlusIcon';

interface WelcomeBannerProps {
    onActionClick: () => void;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onActionClick }) => {
    return (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-8 rounded-xl shadow-lg text-white text-center flex flex-col items-center">
            <div className="mb-4">
                <RocketLaunchIcon className="h-16 w-16 text-white opacity-90" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Bem-vindo(a) ao MeuFin!</h2>
            <p className="text-lg opacity-90 max-w-2xl mb-6">
                Comece a organizar suas finanças de forma simples e visual. Adicione sua primeira transação para ver seu dashboard ganhar vida.
            </p>
            <button
                onClick={onActionClick}
                className="flex items-center justify-center bg-white text-blue-600 px-6 py-3 rounded-full hover:bg-gray-100 transition-all duration-300 text-md font-bold shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
                <PlusIcon className="h-5 w-5 mr-2" />
                Adicionar Primeira Transação
            </button>
        </div>
    );
};

export default WelcomeBanner;