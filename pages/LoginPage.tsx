
import React, { useState, useEffect } from 'react';
import { User, Plan } from '../types';
import { api } from '../services/api';

const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

interface LoginPageProps {
  onLogin: (user: User, token: string) => void;
  onBack: () => void;
  initialMode?: 'login' | 'register';
  selectedPlan?: Plan;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack, initialMode = 'login', selectedPlan = 'FREE' }) => {
  const [isLoginMode, setIsLoginMode] = useState(initialMode === 'login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
      setIsLoginMode(initialMode === 'login');
  }, [initialMode]);

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

            // Envia o PLANO selecionado.
            const createResponse = await api.createUser({ 
                name, 
                email, 
                password, 
                phone, 
                cpf, 
                plan: selectedPlan as Plan 
            });
            
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
      setPassword(''); 
  };
  
  return (
    <div className="flex min-h-screen bg-white font-sans">
        {/* Lado Esquerdo - Visual/Marketing (Midnight Blue Profundo) */}
        <div className="hidden md:flex md:w-1/2 bg-[#020617] flex-col justify-center px-12 lg:px-24 relative overflow-hidden">
            {/* Background Gradient simulando o glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            
            {/* Botão Voltar Desktop */}
            <button 
                onClick={onBack}
                className="absolute top-8 left-8 flex items-center text-gray-400 hover:text-white transition-colors z-20"
            >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Voltar para o site
            </button>

            <div className="relative z-10 text-white">
                {/* Logo da Marca */}
                <div className="mb-8 flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                    </div>
                    <span className="text-2xl font-bold tracking-wide">FinDash</span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                    FinDash <br />
                    Gestão Financeira <br />
                    <span className="text-blue-500">Pessoal</span>
                </h1>
                <p className="text-gray-400 text-lg mb-10 max-w-md leading-relaxed">
                    Organize suas receitas, despesas e investimentos em um único lugar. 
                    Tenha clareza sobre seu dinheiro e alcance seus objetivos.
                </p>
                
                {/* Mostra o plano selecionado durante o cadastro */}
                {!isLoginMode && (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 inline-block">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Plano Selecionado</p>
                        <div className="flex items-center gap-2">
                             <div className={`w-3 h-3 rounded-full ${selectedPlan === 'VIP' ? 'bg-purple-500' : selectedPlan === 'PRO' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                             <span className="text-xl font-bold">{selectedPlan === 'FREE' ? 'Grátis' : selectedPlan}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Lado Direito - Formulário (Branco Clarinho) */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white text-gray-800 relative">
            
            {/* Botão Voltar Mobile */}
            <button 
                onClick={onBack}
                className="absolute top-6 left-6 md:hidden flex items-center text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Voltar
            </button>

            <div className="w-full max-w-md space-y-8">
                {/* Header Mobile - Visível apenas em telas pequenas */}
                <div className="md:hidden text-center mb-6 mt-8">
                     <h1 className="text-3xl font-extrabold text-[#020617] flex items-center justify-center gap-2">
                        <span className="text-blue-600">
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        </span>
                        FinDash
                     </h1>
                </div>

                <div className="text-left">
                    <h2 className="text-3xl font-bold text-gray-900">
                        {isLoginMode ? 'Acesse sua conta' : 'Crie sua conta'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        {isLoginMode ? 'Bem-vindo de volta!' : 'Preencha seus dados para começar.'}
                    </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {!isLoginMode && (
                            <>
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                    <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Seu Nome"
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder-gray-400 transition duration-200" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                    <input id="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="(00) 00000-0000"
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder-gray-400 transition duration-200" />
                                </div>
                                <div>
                                    <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                                    <input id="cpf" type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} required placeholder="000.000.000-00"
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder-gray-400 transition duration-200" />
                                </div>
                            </>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="exemplo@email.com"
                                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder-gray-400 transition duration-200" />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-gray-900 placeholder-gray-400 transition duration-200" />
                        </div>
                    </div>

                    {isLoginMode && (
                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer">
                                <input id="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <span className="ml-2 block text-sm text-gray-600">Lembrar-me</span>
                            </label>
                            <div className="text-sm">
                                <a href="#" className="font-medium text-blue-700 hover:text-blue-600">Esqueceu a senha?</a>
                            </div>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <button type="submit" disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-[#020617] hover:bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide">
                        {isLoading ? 'Carregando...' : (isLoginMode ? 'Entrar' : 'Cadastrar')}
                    </button>

                    <div className="mt-6 text-center">
                        <button type="button" onClick={toggleMode} className="text-sm font-bold text-blue-700 hover:text-blue-800 transition-colors">
                            {isLoginMode ? "Não tem conta? Cadastre-se" : "Já tem uma conta? Faça Login"}
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Protegido por reCAPTCHA e sujeito à Política de Privacidade.<br/>
                            Powered by <strong className="text-blue-600">GTS AI</strong> - Global Tech Software.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};

export default LoginPage;
