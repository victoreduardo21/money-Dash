
import React, { useState, useRef } from 'react';
import { CalendarEvent, Language } from '../types';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XIcon } from '../components/icons/XIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { useTranslation } from '../translations';

interface AgendaProps {
    tasks: CalendarEvent[];
    onAddTask: (task: Omit<CalendarEvent, 'id'>) => Promise<void> | void;
    onToggleTask: (id: string, done: boolean) => void;
    onDeleteTask: (id: string) => void;
    language: Language;
}

const Agenda: React.FC<AgendaProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask, language }) => {
    const t = useTranslation(language);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (newTaskDesc && newTaskDate) {
            setIsSubmitting(true);
            try {
                await onAddTask({ description: newTaskDesc, date: newTaskDate, done: false });
                setNewTaskDesc('');
                setNewTaskDate('');
                setIsModalOpen(false);
            } catch (error) {
                console.error(error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const triggerDatePicker = () => {
        if (dateInputRef.current && 'showPicker' in dateInputRef.current) {
            (dateInputRef.current as any).showPicker();
        } else if (dateInputRef.current) {
            (dateInputRef.current as any).focus();
        }
    };

    const sortedTasks = [...tasks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const getTodayString = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const todayStr = getTodayString();

    return (
        <div>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <CalendarIcon className="h-7 w-7 text-blue-600" />
                    {t('agenda')}
                </h3>
                <button onClick={() => { setNewTaskDate(getTodayString()); setIsModalOpen(true); setIsSubmitting(false); }} 
                    className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors duration-200 text-xs font-bold shadow-md"
                >
                    <PlusIcon className="h-4 w-4 mr-1.5" />
                    {t('addReminder')}
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
                {sortedTasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-lg font-medium">{t('noReminders')}</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {sortedTasks.map((task) => {
                             let taskDateStr = task.date.includes('T') ? task.date.split('T')[0] : task.date;
                             const isPast = taskDateStr < todayStr;
                             const isToday = taskDateStr === todayStr;
                             
                             return (
                                 <li key={task.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 group ${task.done ? 'bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'}`}>
                                    <div className="flex items-center space-x-3 cursor-pointer flex-grow" onClick={() => onToggleTask(task.id, !task.done)}>
                                        <div className={`p-1.5 rounded-full transition-all duration-300 ${task.done ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-gray-300 bg-gray-50 dark:bg-gray-700 group-hover:text-blue-500'}`}>
                                            <CheckCircleIcon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-3"> 
                                            <p className={`font-bold text-base transition-all duration-300 break-words whitespace-pre-wrap ${task.done ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200'}`}>
                                                {task.description}
                                            </p>
                                            <div className="flex items-center text-sm mt-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold mr-2 ${
                                                    task.done ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' : 
                                                    isPast ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 
                                                    isToday ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 
                                                    'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                                                }`}>
                                                    {task.done ? t('done') : isPast ? t('past') : isToday ? t('today') : t('future')}
                                                </span>
                                                <span className={`${task.done ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {new Date(task.date).toLocaleDateString(language, { timeZone: 'UTC' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-2 text-gray-300 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex-shrink-0">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md m-4 p-6">
                        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('addReminder')}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <XIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('whatToDo')}</label>
                                <input type="text" value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)}
                                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
                                    placeholder="Ex: Pagar fatura do cartão"
                                    required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('when')}</label>
                                <div onClick={triggerDatePicker} className="relative group cursor-pointer">
                                    <input 
                                        ref={dateInputRef}
                                        type="date" 
                                        value={newTaskDate} 
                                        onChange={(e) => setNewTaskDate(e.target.value)}
                                        className="w-full pl-4 pr-10 py-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white font-medium"
                                        required 
                                    />
                                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-blue-500 pointer-events-none transition-colors" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 gap-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">{t('cancel')}</button>
                                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-70">
                                    {isSubmitting ? t('saving') : t('add')}
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
