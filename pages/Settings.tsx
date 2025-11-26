
import React, { useState, useRef, useEffect } from 'react';
import { Theme, User } from '../types';
import { SunIcon } from '../components/icons/SunIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
import { CameraIcon } from '../components/icons/CameraIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { CreditCardIcon } from '../components/icons/CreditCardIcon';
import ChangePasswordModal from '../components/ChangePasswordModal';
import CreateUserModal from '../components/CreateUserModal';
import { api } from '../services/api';

// ============================================================================
// CONFIGURAÇÃO DE ADMIN
// Substitua pelo seu email real de login para ter acesso ao painel de gerenciamento
// ============================================================================
const ADMIN_EMAIL = 'eduardopontesdias@outlook.com'; 

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
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State para lista de clientes (apenas Admin)
  const [clients, setClients] = useState<User[]>([]);
  const isAdmin = currentUser.email === ADMIN_EMAIL;

  useEffect(() => {
      // Se for admin, busca a lista de todos os usuários
      if (isAdmin) {
          const fetchUsers = async () => {
              // Como a API espera um token, passamos um token fake ou o email base64 se já tivermos
              // No setup atual, o token é o email base64. 
              const token = btoa(currentUser.email);
              const users = await api.getAllUsers(token);
              if (Array.isArray(users)) {
                  setClients(users);
              }
          };
          fetchUsers();
      }
  }, [isAdmin, currentUser.email]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Função para redimensionar e comprimir a imagem
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 200; // Reduz para 200px para caber na planilha
                const MAX_HEIGHT = 200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Converte para JPEG com qualidade 0.7 para reduzir o tamanho da string Base64
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        try {
            const compressedBase64 = await compressImage(file);
            onUpdateAvatar(compressedBase64);
        } catch (error) {
            console.error("Erro ao processar imagem", error);
            alert("Erro ao processar a imagem. Tente uma imagem menor.");
        }
    }
  };

  const handleGeneratePayment = async () => {
    if (!currentUser.cpf || !currentUser.phone) {
        alert("Para gerar a cobrança, precisamos do seu CPF e Telefone. Por favor, atualize o Admin.");
        return;
    }

    setIsPaymentLoading(true);
    const token = btoa(currentUser.email);
    const response = await api.createSubscriptionCharge(token);
    setIsPaymentLoading(false);

    if (response.success) {
        if (window.confirm("Link de pagamento gerado! Deseja abrir agora?")) {
            window.open(response.paymentUrl, '_blank');
        } else {
            alert(`Link para pagamento: ${response.paymentUrl}`);
        }
    } else {
        alert("Erro ao gerar pagamento: " + (response.message || "Tente novamente."));
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
                        className="h-24 w-24 rounded-full object-cover bg-gray-200"
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
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                          <input type="text" value={currentUser.name} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                              <input type="email" value={currentUser.email} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPF</label>
                              <input type="text" value={currentUser.cpf || 'Não informado'} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                          <input type="text" value={currentUser.phone || 'Não informado'} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                      </div>
                      <button onClick={() => setIsPasswordModalOpen(true)} className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">Alterar Senha</button>
                    </div>
                </div>
            </div>
          </div>

          {/* SUBSCRIPTION SECTION */}
          {!isAdmin && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-green-500 dark:border-green-600">
                <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                        <CreditCardIcon className="h-6 w-6 mr-2" />
                        Minha Assinatura
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        currentUser.subscriptionStatus === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                        {currentUser.subscriptionStatus === 'ACTIVE' ? 'ATIVA' : 'PENDENTE'}
                    </span>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <p className="text-gray-700 dark:text-gray-300 font-medium">Plano Mensal</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">R$ 50,00<span className="text-sm font-normal text-gray-500">/mês</span></p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Acesso completo ao Dashboard, Gráficos e Gestão de Carteira.</p>
                    </div>
                    <div>
                        {currentUser.subscriptionStatus !== 'ACTIVE' ? (
                            <button 
                                onClick={handleGeneratePayment}
                                disabled={isPaymentLoading}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-bold shadow-md disabled:bg-gray-400"
                            >
                                {isPaymentLoading ? 'Gerando...' : 'Pagar Agora (Pix/Boleto)'}
                            </button>
                        ) : (
                            <button disabled className="bg-gray-100 text-green-600 px-6 py-3 rounded-lg font-bold border border-green-200 cursor-default">
                                Assinatura em dia
                            </button>
                        )}
                    </div>
                </div>
            </div>
          )}

          {/* User Management Section - ONLY VISIBLE TO ADMIN */}
          {isAdmin && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-blue-500 dark:border-blue-700">
                <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
                    <h4 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
                        <UsersIcon className="h-6 w-6 mr-2" />
                        Painel Administrativo (SaaS)
                    </h4>
                </div>
                
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">Gerenciar Assinantes</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Controle manual de usuários para cobrança (R$ 50/mês).</p>
                    </div>
                    <button onClick={() => setIsCreateUserModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        Adicionar Admin/Teste
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefone</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {clients.map((client, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{client.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{client.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{client.phone || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            client.subscriptionStatus === 'ACTIVE' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        }`}>
                                            {client.subscriptionStatus === 'ACTIVE' ? 'Ativo' : 'Pendente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {clients.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum cliente encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

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
