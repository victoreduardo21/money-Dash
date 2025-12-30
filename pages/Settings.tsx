
import React, { useState, useEffect, useMemo } from 'react';
import { Theme, User, Language } from '../types';
import { SunIcon } from '../components/icons/SunIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { CreditCardIcon } from '../components/icons/CreditCardIcon';
import ChangePasswordModal from '../components/ChangePasswordModal';
import CreateUserModal from '../components/CreateUserModal';
import { api } from '../services/api';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { useTranslation } from '../translations';

const ADMIN_EMAIL = 'eduardopontesdias@outlook.com'; 

interface SettingsProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currentUser: User;
    onUpdatePassword: (currentPassword: string, newPassword: string) => void;
    onUpdateAvatar: (avatar: string) => void;
    onCreateUser: (newUser: Omit<User, 'id'>) => Promise<{success: boolean, message: string}>;
    language: Language;
    onLanguageChange: (lang: Language) => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, setTheme, currentUser, onUpdatePassword, onUpdateAvatar, onCreateUser, language, onLanguageChange }) => {
  const t = useTranslation(language);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [clients, setClients] = useState<User[]>([]);
  const isAdmin = currentUser.email === ADMIN_EMAIL;

  const loadAdminData = async () => {
    if (isAdmin) {
        const users = await api.getAllUsers(btoa(currentUser.email));
        if (Array.isArray(users)) setClients(users);
    }
  };

  useEffect(() => {
      loadAdminData();
  }, [isAdmin, currentUser.email]);

  const userInitials = useMemo(() => {
      const name = currentUser?.name || 'U';
      const parts = name.trim().split(' ');
      return parts.length === 1 ? parts[0].substring(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [currentUser]);
  
  const getPriceDisplay = () => {
      if (currentUser.plan === 'FREE') return t('language') === 'Idioma' ? 'Grátis' : 'Free';
      const isAnnual = currentUser.billingCycle === 'ANNUAL';
      if (currentUser.plan === 'VIP') return isAnnual ? 'R$ 799,90' : 'R$ 79,90';
      if (currentUser.plan === 'PRO') return isAnnual ? 'R$ 399,90' : 'R$ 39,90';
      return 'FREE';
  };

  const handleToggleStatus = async (user: User) => {
      const newStatus = user.subscriptionStatus === 'ACTIVE' ? 'PENDING' : 'ACTIVE';
      const confirmMsg = newStatus === 'PENDING' ? t('confirmDeactivate') : t('confirmActivate');
      
      if (window.confirm(confirmMsg)) {
          try {
              await api.toggleUserStatus(user.email, newStatus, btoa(currentUser.email));
              loadAdminData(); // Recarrega a lista
          } catch (error) {
              alert("Erro ao alterar status.");
          }
      }
  };

  return (
    <>
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onSave={onUpdatePassword} language={language} />
      <CreateUserModal isOpen={isCreateUserModalOpen} onClose={() => setIsCreateUserModalOpen(false)} onCreate={onCreateUser} language={language} />
      <div>
        <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">{t('settings')}</h3>
        
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* PERFIL */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">{t('profile')}</h4>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
                <div className="h-28 w-28 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-4xl font-bold text-blue-700 dark:text-blue-200 shadow-lg border-4 border-white dark:border-gray-600">{userInitials}</div>
                <div className="flex-grow w-full space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('name')}</label>
                        <input type="text" value={currentUser.name} disabled className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-sm text-gray-500" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" value={currentUser.email} disabled className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-sm text-gray-500" /></div>
                        <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('cpf')}</label><input type="text" value={currentUser.cpf || '-'} disabled className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-sm text-gray-500" /></div>
                    </div>
                    <button onClick={() => setIsPasswordModalOpen(true)} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700">{t('changePassword')}</button>
                </div>
            </div>
          </div>

          {!isAdmin && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-green-100 dark:border-green-900/30">
                <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white flex items-center"><CreditCardIcon className="h-6 w-6 mr-2 text-green-600" />{t('mySubscription')}</h4>
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-green-100 text-green-700">{currentUser.subscriptionStatus === 'ACTIVE' ? t('active') : t('pending')}</span>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-6 md:mb-0">
                        <p className="text-gray-600 dark:text-gray-400 font-medium">{t('plan')}</p>
                        <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1">{getPriceDisplay()}<span className="text-sm font-semibold text-gray-500 ml-1">{currentUser.plan !== 'FREE' ? (currentUser.billingCycle === 'ANNUAL' ? (t('language') === 'Idioma' ? '/ano' : '/yr') : (t('language') === 'Idioma' ? '/mês' : '/mo')) : ''}</span></p>
                    </div>
                    <button onClick={() => window.open(`https://wa.me/5513996104848?text=${encodeURIComponent(`Email: ${currentUser.email}`)}`, '_blank')} className="bg-[#25D366] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg flex items-center"><WhatsAppIcon className="h-5 w-5 mr-2" />{t('requestPayment')}</button>
                </div>
            </div>
          )}

          {/* PAINEL ADMINISTRATIVO COM BOTÃO DE DESATIVAR */}
          {isAdmin && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                    <h4 className="text-xl font-bold text-blue-600 flex items-center"><UsersIcon className="h-6 w-6 mr-2" />{t('adminPanel')}</h4>
                    <button onClick={() => setIsCreateUserModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all">
                        {t('addAdmin')}
                    </button>
                </div>
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="font-bold text-gray-800 dark:text-white">{t('manageSubscribers')}</p>
                    </div>
                </div>
                <div className="overflow-x-auto rounded-xl border dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('name')}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('plan')}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {clients.map((c, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{c.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{c.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.plan}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${c.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {c.subscriptionStatus === 'ACTIVE' ? t('active') : t('pending')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button 
                                            onClick={() => handleToggleStatus(c)}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                c.subscriptionStatus === 'ACTIVE' 
                                                ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200' 
                                                : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-200'
                                            }`}
                                        >
                                            {c.subscriptionStatus === 'ACTIVE' ? t('deactivate') : t('activate')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {/* APARÊNCIA */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border dark:border-gray-700">
              <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">{t('appearance')}</h4>
              <div className="flex items-center justify-between mb-6"><div><p className="font-bold text-gray-800 dark:text-white">{t('darkMode')}</p></div><button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`w-14 h-8 rounded-full transition-all border-2 flex items-center ${theme === 'dark' ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-300'}`}><span className={`w-6 h-6 bg-white rounded-full transition-all shadow-md flex items-center justify-center ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}>{theme === 'dark' ? <MoonIcon className="h-3 w-3 text-blue-600" /> : <SunIcon className="h-3 w-3 text-yellow-500" />}</span></button></div>
              <div className="flex items-center justify-between border-t pt-6 dark:border-gray-700"><div><p className="font-bold text-gray-800 dark:text-white">{t('language')}</p></div><div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-full border dark:border-gray-600"><button onClick={() => onLanguageChange('pt-BR')} className={`px-3 py-1 rounded-full text-xs font-bold ${language === 'pt-BR' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-400'}`}>PT-BR</button><button onClick={() => onLanguageChange('en-US')} className={`px-3 py-1 rounded-full text-xs font-bold ${language === 'en-US' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-400'}`}>EN-US</button></div></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
