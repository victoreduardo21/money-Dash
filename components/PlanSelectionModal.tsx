
import React, { useState } from 'react';
import { Plan } from '../types';
import { XIcon } from './icons/XIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface PlanSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmUpgrade: (plan: Plan) => void;
    currentPlan: Plan;
}

const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ isOpen, onClose, onConfirmUpgrade, currentPlan }) => {
    const [selectedPlan, setSelectedPlan] = useState<Plan>('PRO');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedPlan === currentPlan) {
            alert("Você já possui este plano.");
            return;
        }
        if (window.confirm(`Tem certeza que deseja mudar seu plano para ${selectedPlan}? O acesso será liberado imediatamente.`)) {
            onConfirmUpgrade(selectedPlan);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-2xl font-extrabold text-gray-800">Atualize seu Plano</h3>
                        <p className="text-sm text-gray-500">Escolha o nível de controle que você deseja.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto bg-gray-50">
                    <div className="grid md:grid-cols-2 gap-6">
                        
                        {/* PLANO PRO */}
                        <div 
                            onClick={() => setSelectedPlan('PRO')}
                            className={`cursor-pointer relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 ${selectedPlan === 'PRO' ? 'border-blue-600 shadow-xl scale-[1.02]' : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-blue-600 font-bold tracking-wider text-xs uppercase bg-blue-50 px-2 py-1 rounded-md">Recomendado</span>
                                    <h4 className="text-2xl font-bold text-gray-900 mt-2">Plano PRO</h4>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'PRO' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                                    {selectedPlan === 'PRO' && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <span className="text-4xl font-extrabold text-gray-900">R$ 39,90</span>
                                <span className="text-gray-500">/mês</span>
                            </div>

                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500" /> <strong>Tudo do plano Grátis</strong></li>
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Gestão de Investimentos</li>
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Agenda Financeira</li>
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Relatórios Avançados</li>
                            </ul>
                        </div>

                        {/* PLANO VIP */}
                        <div 
                            onClick={() => setSelectedPlan('VIP')}
                            className={`cursor-pointer relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 ${selectedPlan === 'VIP' ? 'border-purple-600 shadow-xl scale-[1.02]' : 'border-gray-200 hover:border-purple-300 hover:shadow-lg'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-purple-600 font-bold tracking-wider text-xs uppercase bg-purple-50 px-2 py-1 rounded-md">Exclusivo</span>
                                    <h4 className="text-2xl font-bold text-gray-900 mt-2">Plano VIP</h4>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'VIP' ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}`}>
                                    {selectedPlan === 'VIP' && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <span className="text-4xl font-extrabold text-gray-900">R$ 79,90</span>
                                <span className="text-gray-500">/mês</span>
                            </div>

                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600" /> <strong>Tudo do plano PRO</strong></li>
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600" /> Prioridade no Suporte</li>
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600" /> <strong>Acesso ao sistema via WhatsApp</strong></li>
                                <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600" /> Assistente Financeiro IA</li>
                            </ul>
                        </div>

                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className={`px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-transform transform active:scale-95 ${
                            selectedPlan === 'VIP' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                        }`}
                    >
                        Confirmar Upgrade para {selectedPlan}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanSelectionModal;
