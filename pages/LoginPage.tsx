
import React, { useState, useEffect } from 'react';
import { User, Plan, BillingCycle } from '../types';
import { api } from '../services/api';
import { auth } from '../services/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';

const ArrowLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

interface LoginPageProps {
  onLogin: (user: User, token: string) => void; // token will be UID
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
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => { setIsLoginMode(initialMode === 'login'); }, [initialMode]);

  const handleForgotPassword = async () => {
    if (!email) {
      return setError('Por favor, digite seu e-mail para recuperar a senha.');
    }
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setError('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (e: any) {
      console.error(e);
      setError('Erro ao enviar e-mail de recuperação.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        if (isLoginMode) {
            const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            const user = userCredential.user;
            // Get user data from Firestore
            const userData = await api.getMe(user.uid);
            if (userData) {
                onLogin(userData, user.uid);
            } else {
                // If user auth exists but Firestore doc doesn't (shouldn't happen with correct flow)
                setError('Perfil não encontrado no banco de dados.');
            }
        } else {
            if (password.length < 6) {
                setIsLoading(false);
                return setError("A senha deve ter no mínimo 6 caracteres.");
            }
            
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            const user = userCredential.user;
            
            await updateProfile(user, { displayName: name });
            
            const newUser: User = {
                name,
                email: email.trim().toLowerCase(),
                phone,
                cpf,
                plan: selectedPlan as Plan,
                billingCycle: selectedBillingCycle as BillingCycle,
                subscriptionStatus: 'ACTIVE'
            };
            
            await api.createUser(newUser, user.uid);
            onLogin(newUser, user.uid);
        }
    } catch (e: any) {
        console.error(e);
        if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
            setError('E-mail ou senha incorretos.');
        } else if (e.code === 'auth/email-already-in-use') {
            setError('Este e-mail já está sendo utilizado.');
        } else {
            setError('Falha na comunicação com o Firebase.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  // Classes forçadas com ! para garantir branco puro e texto preto
  const inputClasses = "w-full px-4 py-3 rounded-lg border border-gray-300 !bg-white !text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm font-medium";

  return (
    <div className="flex min-h-screen bg-white font-sans overflow-hidden">
        <div className="hidden md:flex md:w-1/2 bg-[#020617] flex-col justify-center px-24 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]"></div>
            <button onClick={onBack} className="absolute top-8 left-8 flex items-center text-gray-400 hover:text-white transition-colors z-20">
                <ArrowLeftIcon className="h-5 w-5 mr-2" /> Voltar para o site
            </button>
            <div className="relative z-10 text-white">
                <div className="mb-8 flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg></div>
                    <span className="text-2xl font-bold">Money Dashs</span>
                </div>
                <h1 className="text-5xl font-bold leading-tight mb-6">Controle Financeiro <br /><span className="text-blue-500">Sem Complicação.</span></h1>
                <p className="text-gray-400 text-lg max-w-md">Gerencie suas contas, investimentos e planeje seu futuro em um só lugar.</p>
            </div>
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white text-gray-800">
            <div className="w-full max-w-md space-y-8 animate-fade-in-up">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{isLoginMode ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
                    <p className="mt-2 text-sm text-gray-500 font-medium">{isLoginMode ? 'Acesse sua conta para continuar.' : 'Comece a organizar suas finanças hoje.'}</p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                    <div className="md:hidden text-center mb-6">
                        <h1 className="text-3xl font-extrabold text-[#020617] flex items-center justify-center gap-2">
                            <span className="text-blue-600">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                            </span>
                            Money Dashs
                        </h1>
                    </div>
                    {!isLoginMode && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Nome Completo</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Seu nome" className={inputClasses} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Telefone</label>
                                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="(00) 00000-0000" className={inputClasses} />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">CPF</label>
                                    <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} required placeholder="000.000.000-00" className={inputClasses} />
                                </div>
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

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={isLoading} className="w-full py-4 bg-[#020617] text-white rounded-xl font-bold hover:bg-black transition-all shadow-xl disabled:opacity-50 transform active:scale-95">
                        {isLoading ? 'CARREGANDO...' : (isLoginMode ? 'ENTRAR' : 'CADASTRAR AGORA')}
                    </button>

                    {isLoginMode && (
                        <div className="text-center">
                            <button type="button" onClick={handleForgotPassword} disabled={isResetting} className="text-xs text-blue-600 font-bold hover:underline">
                                Esqueceu sua senha?
                            </button>
                        </div>
                    )}

                    <p className="text-center text-sm font-semibold text-gray-500">
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
