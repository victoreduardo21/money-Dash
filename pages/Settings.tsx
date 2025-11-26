
import React, { useState, useRef } from 'react';
import { Theme, User } from '../types';
import { SunIcon } from '../components/icons/SunIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
import { CameraIcon } from '../components/icons/CameraIcon';
import ChangePasswordModal from '../components/ChangePasswordModal';
import CreateUserModal from '../components/CreateUserModal';

interface SettingsProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currentUser: User;
    onUpdatePassword: (currentPassword: string, newPassword: string) => void;
    onUpdateAvatar: (avatar: string) => void;
    onCreateUser: (newUser: Omit<User, 'id'>) => Promise<{success: boolean, message: string}>;
}

const ThemeToggle: React.FC<{ theme: Theme; setTheme: (theme: Theme) => void; }> = ({ theme, setTheme }) => {
    const isDark = theme === 'dark';

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <button
            onClick={toggleTheme}
            className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${
                isDark ? 'bg-blue-600' : 'bg-gray-300'
            }`}
        >
            <span className="sr-only">Alternar tema</span>
            <span
                className={`inline-block h-6 w-6 transform bg-white rounded-full transition-transform duration-300 ease-in-out flex items-center justify-center ${
                    isDark ? 'translate-x-7' : 'translate-x-1'
                }`}
            >
                {isDark ? <MoonIcon className="h-4 w-4 text-blue-600" /> : <SunIcon className="h-4 w-4 text-yellow-500" />}
            </span>
        </button>
    );
};


const Settings: React.FC<SettingsProps> = ({ theme, setTheme, currentUser, onUpdatePassword, onUpdateAvatar, onCreateUser }) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            onUpdateAvatar(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleExport = () => {
    alert("Funcionalidade de exportação de dados a ser implementada. Seus dados seriam exportados como um arquivo CSV.");
  };

  const handleDeleteAccount = () => {
    if (window.confirm("ATENÇÃO: Esta ação é irreversível e apagará todos os seus dados. Deseja continuar?")) {
      alert("Sua conta e todos os dados foram apagados. Você será desconectado.");
      // In a real app, you would call an API here and then log the user out.
    }
  };

  return (
    <>
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={onUpdatePassword}
      />
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onCreate={onCreateUser}
      />
      <div>
        <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Configurações</h3>
        
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Profile Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Perfil</h4>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative group">
                    <img 
                        src={currentUser.avatar || `https://i.pravatar.cc/150?u=${currentUser.email}`} 
                        alt="Avatar"
                        className="h-24 w-24 rounded-full object-cover"
                    />
                    <button 
                        onClick={handleAvatarClick}
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full transition-opacity duration-300"
                        aria-label="Alterar foto de perfil"
                    >
                        <CameraIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                    <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                </div>
                <div className="flex-grow w-full">
                    <div className="space-y-4">
                      <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                          <input type="text" id="name" value={currentUser.name} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                      </div>
                      <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                          <input type="email" id="email" value={currentUser.email} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                      </div>
                      <button onClick={() => setIsPasswordModalOpen(true)} className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">Alterar Senha</button>
                    </div>
                </div>
            </div>
          </div>

          {/* User Management Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Gerenciamento de Usuários</h4>
              <div className="flex items-center justify-between">
                  <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Adicionar Usuário</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Crie novas contas de usuário para o sistema.</p>
                  </div>
                  <button onClick={() => setIsCreateUserModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">Criar Novo Usuário</button>
              </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Aparência</h4>
              <div className="flex items-center justify-between">
                  <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">Modo Escuro</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Personalize a aparência da interface.</p>
                  </div>
                  <ThemeToggle theme={theme} setTheme={setTheme} />
              </div>
          </div>

          {/* Data Management Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Gerenciamento de Dados</h4>
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">Exportar Dados</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Faça um backup de suas transações e investimentos.</p>
                      </div>
                      <button onClick={handleExport} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium">Exportar</button>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4 border-red-200 dark:border-red-900/50">
                      <div>
                          <p className="font-medium text-red-600 dark:text-red-400">Apagar Conta</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Esta ação é irreversível e excluirá todos os seus dados.</p>
                      </div>
                      <button onClick={handleDeleteAccount} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">Apagar</button>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
