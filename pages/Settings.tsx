
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
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';

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
            className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
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

  const handleRequestPaymentLink = () => {
      // Redireciona para o WhatsApp
      const message = `Olá, gostaria de realizar o pagamento da mensalidade do FinDash. Meu email é: ${currentUser.email}`;
      const url = `https://wa.me/5513996104848?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
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
        <h3 className="text-3xl font-bold text-gray-800 mb-6">Configurações</h3>
        
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Profile Section - Estilo Branco Puro */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            <h4 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 border-gray-100">Perfil</h4>
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
                <div className="relative group">
                    <img 
                        src={currentUser.avatar || `https://i.pravatar.cc/150?u=${currentUser.email}`} 
                        alt="Avatar"
                        className="h-28 w-28 rounded-full object-cover bg-gray-100 ring-4 ring-white shadow-lg"
                    />
                    <button 
                        onClick={handleAvatarClick}
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center rounded-full transition-all duration-300"
                        aria-label="Alterar foto de perfil"
                    >
                        <CameraIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300" />
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
                    <div className="space-y-5">
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Nome</label>
                          <input type="text" value={currentUser.name} disabled className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-500 cursor-not-allowed" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                              <input type="email" value={currentUser.email} disabled className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-500 cursor-not-allowed" />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">CPF</label>
                              <input type="text" value={currentUser.cpf || 'Não informado'} disabled className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-500 cursor-not-allowed" />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone</label>
                          <input type="text" value={currentUser.phone || 'Não informado'} disabled className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm text-gray-500 cursor-not-allowed" />
                      </div>
                      <button onClick={() => setIsPasswordModalOpen(true)} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">Alterar Senha</button>
                    </div>
                </div>
            </div>
          </div>

          {/* SUBSCRIPTION SECTION - Estilo Branco Puro */}
          {!isAdmin && (
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-green-100">
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100">
                    <h4 className="text-xl font-bold text-gray-800 flex items-center">
                        <CreditCardIcon className="h-6 w-6 mr-2 text-green-600" />
                        Minha Assinatura
                    </h4>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                        currentUser.subscriptionStatus === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                        {currentUser.subscriptionStatus === 'ACTIVE' ? 'ATIVA' : 'PENDENTE'}
                    </span>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-6 md:mb-0">
                        <p className="text-gray-600 font-medium">Plano Atual</p>
                        <p className="text-4xl font-extrabold text-gray-900 mt-1">
                            {currentUser.plan === 'VIP' ? 'VIP' : currentUser.plan === 'PRO' ? 'R$ 29,90' : 'Grátis'}
                            <span className="text-sm font-semibold text-gray-500">
                                {currentUser.plan === 'VIP' ? ' / Vitalício' : currentUser.plan === 'PRO' ? '/mês' : ''}
                            </span>
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                             {currentUser.plan === 'VIP' 
                                ? 'Acesso vitalício completo a todos os recursos.' 
                                : currentUser.plan === 'PRO' 
                                    ? 'Acesso a Dashboard, Investimentos, Agenda e Relatórios.' 
                                    : 'Acesso básico ao Dashboard e Transações.'}
                        </p>
                    </div>
                    <div>
                        {currentUser.subscriptionStatus !== 'ACTIVE' && currentUser.plan !== 'FREE' ? (
                            <button 
                                onClick={handleRequestPaymentLink}
                                className="bg-[#25D366] text-white px-8 py-3.5 rounded-xl hover:bg-[#128C7E] transition-all duration-300 font-bold shadow-lg hover:shadow-xl flex items-center transform hover:-translate-y-0.5"
                            >
                                <WhatsAppIcon className="h-5 w-5 mr-2 text-white" />
                                Solicitar Link de Pagamento
                            </button>
                        ) : (
                            <button disabled className="bg-gray-100 text-green-600 px-8 py-3.5 rounded-xl font-bold border border-green-200 cursor-default flex items-center">
                                <span className="mr-2">✓</span> Status OK
                            </button>
                        )}
                    </div>
                </div>
            </div>
          )}

          {/* User Management Section - ONLY VISIBLE TO ADMIN */}
          {isAdmin && (
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-100">
                    <h4 className="text-xl font-bold text-blue-600 flex items-center">
                        <UsersIcon className="h-6 w-6 mr-2" />
                        Painel Administrativo (SaaS)
                    </h4>
                </div>
                
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <p className="font-bold text-gray-800">Gerenciar Assinantes</p>
                        <p className="text-sm text-gray-500">Controle manual de usuários.</p>
                    </div>
                    <button onClick={() => setIsCreateUserModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-md">
                        Adicionar Admin/Teste
                    </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plano</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {clients.map((client, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{client.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.plan || 'FREE'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                                            client.subscriptionStatus === 'ACTIVE' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                            {client.subscriptionStatus === 'ACTIVE' ? 'Ativo' : 'Pendente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {clients.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">Nenhum cliente encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {/* Appearance Section - Estilo Branco Puro */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 border-gray-100">Aparência</h4>
              <div className="flex items-center justify-between">
                  <div>
                      <p className="font-bold text-gray-800">Modo Escuro</p>
                      <p className="text-sm text-gray-500">Personalize a aparência da interface.</p>
                  </div>
                  <ThemeToggle theme={theme} setTheme={setTheme} />
              </div>
          </div>

          {/* Data Management Section - Estilo Branco Puro */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
              <h4 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 border-gray-100">Gerenciamento de Dados</h4>
              <div className="space-y-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="font-bold text-gray-800">Exportar Dados</p>
                          <p className="text-sm text-gray-500">Faça um backup de suas transações e investimentos.</p>
                      </div>
                      <button onClick={handleExport} className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-bold">Exportar</button>
                  </div>
                  <div className="flex items-center justify-between border-t pt-6 border-red-50">
                      <div>
                          <p className="font-bold text-red-600">Apagar Conta</p>
                          <p className="text-sm text-gray-500">Esta ação é irreversível e excluirá todos os seus dados.</p>
                      </div>
                      <button onClick={handleDeleteAccount} className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-5 py-2.5 rounded-lg transition-colors text-sm font-bold">Apagar</button>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
