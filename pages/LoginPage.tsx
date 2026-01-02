
import React, { useState, useEffect } from 'react';
import { User, Plan, BillingCycle } from '../types';
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
  selectedBillingCycle?: BillingCycle;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack, initialMode = 'login', selectedPlan = 'FREE', selectedBillingCycle = 'MONTHLY' }) => {
  const [isLoginMode, setIsLoginMode] = useState(initialMode === 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { setIsLoginMode(initialMode === 'login'); }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        if (isLoginMode) {
            const response = await api.login({ email: email.trim().toLowerCase(), password });
            if (response && response.token && response.user) {
                onLogin(response.user, response.token);
            } else {
                setError(response?.message || 'E-mail ou senha incorretos.');
            }
        } else {
            if (password.length < 6) return setError("A senha deve ter no mínimo 6 caracteres.");
            const res = await api.createUser({ name, email: email.trim().toLowerCase(), password, phone, cpf, plan: selectedPlan, billingCycle: selectedBillingCycle });
            if (res.error) {
                setError(res.message || 'Erro ao criar conta.');
            } else {
                const loginRes = await api.login({ email, password });
                if (loginRes.token) onLogin(loginRes.user, loginRes.token);
                else setIsLoginMode(true);
            }
        }
    } catch (e) {
        setError('Falha na comunicação com o servidor.');
    } finally {
        setIsLoading(false);
    }
  };

  // Classes forçadas para branco para evitar conflitos de tema
  const inputClasses = "w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm font-medium";

  return (
    <div className="flex min-h-screen bg-white font-sans">
        <div className="hidden md:flex md:w-1/2 bg-[#020617] flex-col justify-center px-24 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]"></div>
            <button onClick={onBack} className="absolute top-8 left-8 flex items-center text-gray-400 hover:text-white transition-colors z-20">
                <ArrowLeftIcon className="h-5 w-5 mr-2" /> Voltar para o site
            </button>
            <div className="relative z-10 text-white">
                <div className="mb-8 flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg></div>
                    <span className="text-2xl font-bold">FinDash</span>
                </div>
                <h1 className="text-5xl font-bold leading-tight mb-6">Controle Financeiro <br /><span className="text-blue-500">Sem Complicação.</span></h1>
                <p className="text-gray-400 text-lg max-w-md">Gerencie suas contas, investimentos e planeje seu futuro em um só lugar.</p>
            </div>
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white text-gray-800">
            <div className="w-full max-w-md space-y-8">
                <div className="text-left">
                    <h2 className="text-3xl font-bold text-gray-900">{isLoginMode ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
                    <p className="mt-2 text-sm text-gray-500">{isLoginMode ? 'Acesse sua conta para continuar.' : 'Comece a organizar suas finanças hoje.'}</p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    {!isLoginMode && (
                        <div className="space-y-4">
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Nome Completo" className={inputClasses} />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Telefone" className={inputClasses} />
                                <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} required placeholder="CPF" className={inputClasses} />
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">E-mail</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            placeholder="exemplo@email.com" 
                            className={inputClasses} 
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Senha</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            placeholder="••••••••" 
                            className={inputClasses} 
                        />
                    </div>

                    {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 text-center">{error}</div>}

                    <button type="submit" disabled={isLoading} className="w-full py-4 bg-[#020617] text-white rounded-lg font-bold hover:bg-black transition-all shadow-xl disabled:opacity-50">
                        {isLoading ? 'CARREGANDO...' : (isLoginMode ? 'ENTRAR' : 'CADASTRAR AGORA')}
                    </button>

                    <p className="text-center text-sm font-medium">
                        {isLoginMode ? 'Não tem uma conta?' : 'Já possui conta?'} 
                        <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="ml-1 text-blue-600 font-bold hover:underline">
                            {isLoginMode ? 'Registre-se' : 'Faça login'}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    </div>
  );
};

export default LoginPage;
