
import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface LoginPageProps {
  onLogin: (user: User, token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true); // Toggle entre Login e Cadastro

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        if (isLoginMode) {
            // --- LOGIN ---
            const response = await api.login({ email, password });
            
            if (response.error) {
                setError(response.message || 'Falha na autenticação.');
            } else if (response.token && response.user) {
                onLogin(response.user, response.token);
            } else {
                setError('Resposta inválida do servidor.');
            }
        } else {
            // --- CADASTRO ---
            if (password.length < 6) {
                setError("A senha deve ter no mínimo 6 caracteres.");
                setIsLoading(false);
                return;
            }
            if (!name || !email || !password || !phone || !cpf) {
                setError("Por favor, preencha todos os campos.");
                setIsLoading(false);
                return;
            }

            const createResponse = await api.createUser({ name, email, password, phone, cpf });
            
            if (createResponse.error) {
                setError(createResponse.message || 'Erro ao criar conta.');
            } else {
                // Se criou com sucesso, faz o login automático
                const loginResponse = await api.login({ email, password });
                if (loginResponse.token && loginResponse.user) {
                    onLogin(loginResponse.user, loginResponse.token);
                } else {
                    // Fallback: pede para o usuário logar
                    setIsLoginMode(true);
                    alert("Conta criada com sucesso! Por favor, faça login.");
                }
            }
        }
    } catch (e) {
        setError('Erro de conexão com o servidor. Verifique sua internet.');
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const toggleMode = () => {
      setIsLoginMode(!isLoginMode);
      setError('');
      // Limpa campos sensíveis ao trocar
      setPassword(''); 
  };
  
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    Meu<span className="text-blue-500">Fin</span>
                </h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {isLoginMode ? 'Acesse sua conta para gerenciar suas finanças' : 'Crie sua conta gratuitamente'}
                </p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
                {/* Campos de Cadastro */}
                {!isLoginMode && (
                    <>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                        <input id="name" name="name" type="text" required={!isLoginMode}
                            className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-gray-200 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            placeholder="Seu Nome" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                        <input id="phone" name="phone" type="text" required={!isLoginMode}
                            className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-gray-200 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div>
                         <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                         <input id="cpf" name="cpf" type="text" required={!isLoginMode}
                             className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-gray-200 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                             placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} />
                    </div>
                    </>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input id="email" name="email" type="email" autoComplete="email" required
                        className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-gray-200 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="seuemail@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                    <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                    <input id="password" name="password" type="password" autoComplete={isLoginMode ? "current-password" : "new-password"} required
                        className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-gray-200 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder={isLoginMode ? "Sua senha" : "Crie uma senha"} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
            </div>

            {isLoginMode && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                    <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600 rounded bg-slate-700" />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Lembrar-me</label>
                    </div>
                    <div className="text-sm">
                    <a href="#" className="font-medium text-blue-500 hover:text-blue-400">Esqueceu sua senha?</a>
                    </div>
                </div>
            )}

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            
            <button type="submit" disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:bg-blue-500 disabled:cursor-not-allowed">
                {isLoading ? 'Processando...' : (isLoginMode ? 'Entrar' : 'Criar Conta')}
            </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isLoginMode ? "Não tem uma conta?" : "Já tem uma conta?"}{' '}
                    <button onClick={toggleMode} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        {isLoginMode ? "Cadastre-se" : "Faça Login"}
                    </button>
                </p>
            </div>
        </div>
      
      <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>&copy; 2024 GTS - Global Tech Software</p>
        <p>Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default LoginPage;
