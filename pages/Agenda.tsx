
import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XIcon } from '../components/icons/XIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';

interface AgendaProps {
    tasks: CalendarEvent[];
    onAddTask: (task: Omit<CalendarEvent, 'id'>) => void;
    onToggleTask: (id: string, done: boolean) => void;
    onDeleteTask: (id: string) => void;
}

const Agenda: React.FC<AgendaProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskDesc && newTaskDate) {
            onAddTask({
                description: newTaskDesc,
                date: newTaskDate,
                done: false
            });
            setNewTaskDesc('');
            setNewTaskDate('');
            setIsModalOpen(false);
        }
    };

    // Agrupar tarefas por data e ordenar cronologicamente
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Obter data de hoje localmente (YYYY-MM-DD) para comparação correta
    const getTodayString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const todayStr = getTodayString();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                    <CalendarIcon className="h-8 w-8 text-blue-600" />
                    Minha Agenda
                </h3>
                <button 
                    onClick={() => {
                        setNewTaskDate(new Date().toISOString().split('T')[0]);
                        setIsModalOpen(true);
                    }} 
                    className="flex items-center justify-center bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors duration-200 text-sm font-bold shadow-md hover:shadow-lg"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Adicionar Lembrete
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
                {sortedTasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-lg font-medium">Sua agenda está vazia.</p>
                        <p className="text-sm mt-1 text-gray-400">Adicione lembretes para organizar seu dia.</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {sortedTasks.map((task) => {
                             // Lógica corrigida: Comparação de strings de data local
                             let taskDateStr = task.date;
                             if(taskDateStr.includes('T')) taskDateStr = taskDateStr.split('T')[0];

                             // Só é passado se a data da tarefa for MENOR que hoje. Se for IGUAL, é Hoje.
                             const isPast = taskDateStr < todayStr;
                             const isToday = taskDateStr === todayStr;
                             
                             return (
                                <li key={task.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group ${task.done ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'}`}>
                                    <div className="flex items-center space-x-4 cursor-pointer flex-grow" onClick={() => onToggleTask(task.id, !task.done)}>
                                        <div 
                                            className={`p-2 rounded-full transition-all duration-300 ${task.done ? 'text-green-500 bg-green-50 scale-110' : 'text-gray-300 bg-gray-50 group-hover:text-blue-500 group-hover:bg-blue-50'}`}
                                        >
                                            <CheckCircleIcon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-4"> 
                                            {/* Adicionado break-words e whitespace-pre-wrap para permitir quebra de linha de textos longos */}
                                            <p className={`font-bold text-lg transition-all duration-300 break-words whitespace-pre-wrap ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                {task.description}
                                            </p>
                                            <div className="flex items-center text-sm mt-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold mr-2 ${
                                                    task.done ? 'bg-gray-100 text-gray-500' : 
                                                    isPast ? 'bg-red-100 text-red-700' : 
                                                    isToday ? 'bg-blue-100 text-blue-700' : 
                                                    'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                    {task.done ? 'Concluído' : isPast ? 'Atrasado' : isToday ? 'Hoje' : 'Futuro'}
                                                </span>
                                                <span className={`${task.done ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {new Date(task.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { 
                                            e.preventDefault();
                                            e.stopPropagation();
                                            e.nativeEvent.stopImmediatePropagation();
                                            onDeleteTask(task.id); 
                                        }}
                                        className="relative z-10 p-2 text-gray-300 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors ml-4 flex-shrink-0"
                                        title="Excluir"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Modal de Adição */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 p-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-xl font-bold text-gray-800">Novo Lembrete</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">O que você faz?</label>
                                <input 
                                    type="text" 
                                    value={newTaskDesc}
                                    onChange={(e) => setNewTaskDesc(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-900"
                                    placeholder="Ex: Pagar"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Quando?</label>
                                <input 
                                    type="date" 
                                    value={newTaskDate}
                                    onChange={(e) => setNewTaskDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-900"
                                    required
                                />
                            </div>
                            <div className="flex justify-end pt-4 gap-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/30">
                                    Adicionar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agenda;
