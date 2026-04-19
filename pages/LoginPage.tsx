
import React, { useState, useEffect } from 'react';
import { User, Plan, BillingCycle, Language } from '../types';
import { api } from '../services/api';
import { auth } from '../services/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    RecaptchaVerifier,
    PhoneAuthProvider
} from 'firebase/auth';
import { useTranslation } from '../translations';
import { CheckCircleIcon } from 'lucide-react';

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
  const t = useTranslation('pt-BR');
  const [isLoginMode, setIsLoginMode] = useState(initialMode === 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // Phone Verification States
  const [showVerification, setShowVerification] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  useEffect(() => { setIsLoginMode(initialMode === 'login'); }, [initialMode]);

  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) return;
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-login', {
      'size': 'invisible',
      'callback': () => {}
    });
  };

  const handleSendCode = async (phoneNum: string) => {
    try {
        setupRecaptcha();
        const verifier = (window as any).recaptchaVerifier;
        const provider = new PhoneAuthProvider(auth);
        const vid = await provider.verifyPhoneNumber(phoneNum, verifier);
        setVerificationId(vid);
        setShowVerification(true);
    } catch (err: any) {
        console.error(err);
        setError("Erro ao enviar SMS. Verifique o número (ex: +5511...)");
    }
  };

  const handleVerifyCode = async () => {
    if (!otp || !verificationId || !registeredUserId) return;
    setIsLoading(true);
    try {
        await api.updateUser(registeredUserId, { phoneVerified: true });
        setIsPendingApproval(true);
        setShowVerification(false);
    } catch (err: any) {
        setError(t('invalidCode'));
    } finally {
        setIsLoading(false);
    }
  };

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
            const userData = await api.getMe(user.uid);
            
            if (userData) {
                if (userData.subscriptionStatus === 'PENDING') {
                    if (!userData.phoneVerified) {
                        setRegisteredUserId(user.uid);
                        setPhone(userData.phone || '');
                        await handleSendCode(userData.phone || '');
                        return;
                    }
                    setIsPendingApproval(true);
                    return;
                }
                onLogin(userData, user.uid);
            } else {
                setError('Perfil não encontrado no banco de dados.');
            }
        } else {
            if (password.length < 6) {
                setIsLoading(false);
                return setError("A senha deve ter no mínimo 6 caracteres.");
            }

            if (!phone.startsWith('+')) {
                setIsLoading(false);
                return setError("O telefone deve conter o código do país (ex: +55...)");
            }
            
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            const user = userCredential.user;
            setRegisteredUserId(user.uid);
            
            await updateProfile(user, { displayName: name });
            
            const newUser: User = {
                name,
                email: email.trim().toLowerCase(),
                phone,
                cpf,
                plan: selectedPlan as Plan,
                billingCycle: selectedBillingCycle as BillingCycle,
                subscriptionStatus: 'PENDING',
                role: 'user',
                phoneVerified: false
            };
            
            const createRes = await api.createUser(newUser, user.uid);
            if (createRes && createRes.error) {
                setError(createRes.message || 'Erro ao salvar perfil.');
                setIsLoading(false);
                return;
            }
            await handleSendCode(phone);
        }
    } catch (e: any) {
        console.error("Auth Error:", e);
        let msg = 'Ocorreu um erro ao processar sua solicitação.';
        
        if (e.code === 'auth/email-already-in-use') {
            msg = 'Este e-mail já está sendo utilizado por outra conta.';
        } else if (e.code === 'auth/weak-password') {
            msg = 'A senha deve ter no mínimo 6 caracteres e ser mais forte.';
        } else if (e.code === 'auth/invalid-email') {
            msg = 'O formato do e-mail é inválido.';
        } else if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
            msg = 'E-mail ou senha incorretos.';
        } else if (e.message?.includes('auth/email-already-in-use')) {
             msg = 'Este e-mail já está sendo utilizado por outra conta.';
        }
        
        setError(msg);
    } finally {
        setIsLoading(false);
    }
  };

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

        <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white text-gray-800 relative">
            <div id="recaptcha-container-login"></div>
            
            <div className="w-full max-w-md space-y-8 animate-fade-in-up">
                {isPendingApproval ? (
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-green-100 p-6 rounded-full">
                                <CheckCircleIcon size={64} className="text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900">{t('pendingApproval')}</h2>
                        <p className="text-gray-500 font-medium">{t('pendingApprovalDesc')}</p>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs font-bold text-blue-600">{t('waitContact')}</p>
                        </div>
                        <button onClick={() => window.location.reload()} className="w-full py-4 bg-[#020617] text-white rounded-xl font-bold shadow-xl">
                            {t('logout').toUpperCase()}
                        </button>
                    </div>
                ) : showVerification ? (
                    <div className="space-y-6">
                        <div className="text-left">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t('verifyPhone')}</h2>
                            <p className="mt-2 text-sm text-gray-500 font-medium">{t('enterCode')}</p>
                        </div>
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                className="w-full px-4 py-4 rounded-xl border border-gray-300 text-center tracking-[1em] font-black text-2xl !bg-white !text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            />
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 text-center">
                                    {error}
                                </div>
                            )}
                            <button 
                                onClick={handleVerifyCode} 
                                disabled={isLoading} 
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'VERIFICANDO...' : 'CONFIRMAR CÓDIGO'}
                            </button>
                            <button 
                                onClick={() => handleSendCode(phone)}
                                className="w-full text-sm font-bold text-gray-500 hover:text-gray-900"
                            >
                                {t('resendCode')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
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
                                            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+55 11 99999-9999" className={inputClasses} />
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
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

export default LoginPage;
