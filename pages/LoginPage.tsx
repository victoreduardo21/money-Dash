
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
import { 
    CheckCircleIcon, 
    ShieldCheck, 
    Mail, 
    Phone, 
    Copy, 
    Check, 
    RefreshCw, 
    KeyRound, 
    ArrowLeft,
    Sparkles,
    AlertCircle
} from 'lucide-react';

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

  // Onboarding states
  const [onboardingObjective, setOnboardingObjective] = useState('');
  const [onboardingReason, setOnboardingReason] = useState('');
  const [regStep, setRegStep] = useState(1);
  
  // Verification states
  const [showVerification, setShowVerification] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  useEffect(() => { 
    setIsLoginMode(initialMode === 'login'); 
    setRegStep(1);
    setOnboardingObjective('');
    setOnboardingReason('');
    setShowVerification(false);
    setError('');
  }, [initialMode]);

  // Countdown effect for resending verification code
  useEffect(() => {
    let timer: any;
    if (showVerification && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showVerification, countdown]);

  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length === 0) return '';
    if (raw.length <= 2) return `(${raw}`;
    if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    if (raw.length <= 10) return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
  };

  const formatCPF = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
    if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`;
  };

  const isValidEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str.trim());
  };

  const isValidPhone = (str: string) => {
    const raw = str.replace(/\D/g, '');
    return raw.length >= 10 && raw.length <= 13;
  };

  const generateNewVerificationCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setCountdown(60);
    setCopiedCode(false);
    return code;
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleAutoFillCode = () => {
    if (generatedCode) {
      setOtp(generatedCode);
      setError('');
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

  const handleVerifyCodeAndRegister = async () => {
    const cleanOtp = otp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      return setError("Por favor, digite os 6 dígitos do código de confirmação.");
    }

    if (cleanOtp !== generatedCode) {
      return setError("Código incorreto. Digite o código de 6 dígitos gerado para o seu e-mail e celular.");
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Create account in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;
      setRegisteredUserId(user.uid);
      
      await updateProfile(user, { displayName: name });
      
      // 2. Build full user object with validated status
      const newUser: User = {
          name,
          email: email.trim().toLowerCase(),
          phone,
          cpf,
          onboardingObjective,
          onboardingReason,
          plan: selectedPlan as Plan,
          billingCycle: selectedBillingCycle as BillingCycle,
          subscriptionStatus: 'ACTIVE',
          role: 'user',
          phoneVerified: true,
          emailVerified: true,
          createdAt: new Date().toISOString()
      };
      
      // 3. Save user to Firestore
      const createRes = await api.createUser(newUser, user.uid);
      if (createRes && createRes.error) {
          setError(createRes.message || 'Erro ao salvar perfil.');
          setIsLoading(false);
          return;
      }

      // 4. Log in immediately
      onLogin(newUser, user.uid);
    } catch (e: any) {
      console.error("Auth Error:", e);
      let msg = 'Ocorreu um erro ao processar sua solicitação.';
      
      if (e.code === 'auth/email-already-in-use') {
          msg = 'Este e-mail já está cadastrado. Faça login para continuar.';
      } else if (e.code === 'auth/weak-password') {
          msg = 'A senha deve ter no mínimo 6 caracteres e ser mais forte.';
      } else if (e.code === 'auth/invalid-email') {
          msg = 'O formato do e-mail é inválido.';
      } else if (e.message?.includes('auth/email-already-in-use')) {
          msg = 'Este e-mail já está sendo utilizado por outra conta.';
      }
      
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
        if (isLoginMode) {
            setIsLoading(true);
            const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            const user = userCredential.user;
            const userData = await api.getMe(user.uid);
            
            if (userData) {
                if (userData.subscriptionStatus === 'PENDING') {
                    setIsPendingApproval(true);
                    return;
                }
                onLogin(userData, user.uid);
            } else {
                setError('Perfil não encontrado no banco de dados.');
            }
        } else {
            // STEP 1 VALIDATIONS: Basic info, Email & Phone
            if (regStep === 1) {
                if (!name.trim()) {
                    return setError("Nome completo é obrigatório.");
                }

                if (!isValidPhone(phone)) {
                    return setError("Número de celular inválido. Digite o DDD + número (ex: (11) 99999-9999).");
                }

                if (!cpf.trim() || cpf.replace(/\D/g, '').length < 11) {
                    return setError("CPF incompleto. Digite os 11 dígitos do CPF.");
                }

                if (!isValidEmail(email)) {
                    return setError("E-mail com formato inválido. Use um e-mail real como nome@exemplo.com.");
                }

                if (password.length < 6) {
                    return setError("A senha deve ter no mínimo 6 caracteres.");
                }

                // Advance to Step 2
                setRegStep(2);
                return;
            }

            // STEP 2 VALIDATIONS: Onboarding & Goals
            if (!onboardingObjective) {
                return setError("Por favor, selecione qual o seu principal objetivo.");
            }

            if (!onboardingReason.trim()) {
                return setError("Por favor, relate o que você busca no sistema.");
            }

            // Generate 6-digit security code and transition to verification screen
            generateNewVerificationCode();
            setOtp('');
            setShowVerification(true);
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
        }
        
        setError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-gray-300 !bg-white !text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm font-medium text-sm";

  return (
    <div className="flex min-h-screen bg-white font-sans overflow-hidden">
        {/* LEFT COLUMN - BRANDING */}
        <div className="hidden md:flex md:w-1/2 bg-[#020617] flex-col justify-center px-24 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px]"></div>
            <button onClick={onBack} className="absolute top-8 left-8 flex items-center text-gray-400 hover:text-white transition-colors z-20">
                <ArrowLeftIcon className="h-5 w-5 mr-2" /> Voltar para o site
            </button>
            <div className="relative z-10 text-white">
                <div className="mb-8 flex items-center gap-3">
                    <img src="/icon-192.png" alt="Money Dashs" className="w-12 h-12 rounded-2xl object-cover shadow-xl ring-2 ring-blue-500/30" />
                    <span className="text-2xl font-bold">Money Dashs</span>
                </div>
                <h1 className="text-5xl font-bold leading-tight mb-6">Controle Financeiro <br /><span className="text-blue-500">Sem Complicação.</span></h1>
                <p className="text-gray-400 text-lg max-w-md">Gerencie suas contas, metas, investimentos e planeje seu futuro em um só lugar.</p>
                
                {/* Security bullet points */}
                <div className="mt-10 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Validação de segurança em 2 etapas para sua conta</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircleIcon className="w-5 h-5 text-blue-400" />
                    <span>Controle de metas com cronograma automático de economia</span>
                  </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN - FORM */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white text-gray-800 relative overflow-y-auto">
            <div className="w-full max-w-md space-y-6 animate-fade-in-up">
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
                    /* SECURITY VERIFICATION STEP WITH GENERATED CODE */
                    <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                            <ShieldCheck className="w-7 h-7" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                              Validação de Segurança
                            </span>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Confirme seus Dados</h2>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                          Para garantir a autenticidade e segurança da sua conta, validamos as informações de contato fornecidas:
                        </p>

                        {/* Contacts Summary Card */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail className="w-4 h-4 text-blue-600" />
                              <span className="font-bold">E-mail:</span>
                              <span className="font-medium text-slate-900 truncate max-w-[180px]">{email}</span>
                            </div>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                              Validado ✓
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-4 h-4 text-emerald-600" />
                              <span className="font-bold">Celular:</span>
                              <span className="font-medium text-slate-900">{phone}</span>
                            </div>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                              Validado ✓
                            </span>
                          </div>
                        </div>

                        {/* GENERATED CODE NOTIFICATION BANNER */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-100">
                                <KeyRound className="w-4 h-4 text-amber-300" />
                                <span>Código de Validação Gerado</span>
                              </div>
                              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-black">
                                Ativo
                              </span>
                            </div>

                            <p className="text-[11px] text-blue-100 mb-3">
                              Use este código para concluir a abertura da sua conta:
                            </p>

                            <div className="bg-black/25 backdrop-blur-sm rounded-xl py-3 px-4 flex items-center justify-center tracking-[0.4em] font-mono text-3xl font-black text-amber-300 mb-3 border border-white/10">
                              {generatedCode}
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleAutoFillCode}
                                className="flex-1 py-2 px-3 rounded-lg bg-white text-blue-900 font-black text-xs hover:bg-blue-50 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                <span>Preencher Código</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleCopyCode}
                                className="py-2 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedCode ? 'Copiado!' : 'Copiar'}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* INPUT CODE FORM */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                              Digite o código de 6 dígitos abaixo:
                            </label>
                            <input 
                              type="text" 
                              maxLength={6}
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="000000"
                              autoFocus
                              className="w-full px-4 py-3.5 rounded-xl border-2 border-blue-400/80 text-center tracking-[0.6em] font-mono font-black text-2xl !bg-white !text-gray-900 outline-none focus:ring-4 focus:ring-blue-100 shadow-sm"
                            />
                            <div className="flex justify-between text-[11px] text-gray-400 mt-1 px-1">
                              <span>{otp.length}/6 dígitos digitados</span>
                              {otp.length === 6 && (
                                <span className="text-emerald-600 font-bold">Pronto para confirmar!</span>
                              )}
                            </div>
                          </div>

                          {error && (
                            <div className="p-3.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 text-center flex items-center justify-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{error}</span>
                            </div>
                          )}

                          <button 
                            type="button"
                            onClick={handleVerifyCodeAndRegister} 
                            disabled={isLoading} 
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                          >
                            {isLoading ? (
                              <span>CRIANDO SUA CONTA...</span>
                            ) : (
                              <>
                                <CheckCircleIcon className="w-5 h-5" />
                                <span>CONFIRMAR E CONCLUIR CADASTRO</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center justify-between pt-2">
                            <button 
                              type="button"
                              onClick={() => {
                                setShowVerification(false);
                                setRegStep(1);
                                setError('');
                              }}
                              className="text-xs text-gray-500 hover:text-gray-800 font-bold flex items-center gap-1"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Corrigir dados</span>
                            </button>

                            <button 
                              type="button"
                              disabled={countdown > 0}
                              onClick={generateNewVerificationCode}
                              className={`text-xs font-bold flex items-center gap-1 ${
                                countdown > 0 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-blue-600 hover:text-blue-700 cursor-pointer'
                              }`}
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${countdown > 0 ? '' : 'animate-spin'}`} />
                              <span>{countdown > 0 ? `Reenviar código (${countdown}s)` : 'Reenviar novo código'}</span>
                            </button>
                          </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-left">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{isLoginMode ? t('login') : t('register')}</h2>
                            <p className="mt-2 text-sm text-gray-500 font-medium">{isLoginMode ? 'Acesse sua conta para continuar.' : 'Comece a organizar suas finanças hoje.'}</p>
                        </div>

                        <div className="md:hidden flex gap-2 p-1 bg-gray-100 rounded-xl mt-4">
                            <button 
                                onClick={() => setIsLoginMode(true)}
                                className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isLoginMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                            >
                                {t('login')}
                            </button>
                            <button 
                                onClick={() => setIsLoginMode(false)}
                                className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${!isLoginMode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                            >
                                {t('register')}
                            </button>
                        </div>

                        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                            <div className="md:hidden text-center mb-4">
                                <div className="flex items-center justify-center gap-2.5 mb-2">
                                    <img src="/icon-192.png" alt="Money Dashs" className="w-10 h-10 rounded-xl object-cover shadow-md" />
                                    <h1 className="text-2xl font-extrabold text-[#020617]">
                                        Money <span className="text-blue-600">Dashs</span>
                                    </h1>
                                </div>
                            </div>

                            {/* REGISTRATION STEP 1: Basic Info with validation */}
                            {!isLoginMode && regStep === 1 && (
                                <div className="space-y-3.5">
                                    <div className="flex items-center justify-between text-blue-600 font-bold text-xs bg-blue-50/80 p-2.5 rounded-xl border border-blue-100">
                                        <span>Passo 1 de 2: Dados de Acesso</span>
                                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">50%</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nome Completo</label>
                                        <input 
                                          type="text" 
                                          value={name} 
                                          onChange={e => setName(e.target.value)} 
                                          required 
                                          placeholder="Ex: João da Silva" 
                                          className={inputClasses} 
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between mb-1 ml-1">
                                              <label className="block text-xs font-bold text-gray-500 uppercase">Celular / WhatsApp</label>
                                              {isValidPhone(phone) && (
                                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                                  ✓ Válido
                                                </span>
                                              )}
                                            </div>
                                            <input 
                                              type="text" 
                                              value={phone} 
                                              onChange={e => setPhone(formatPhone(e.target.value))} 
                                              required 
                                              placeholder="(11) 99999-9999" 
                                              maxLength={15}
                                              className={`${inputClasses} ${isValidPhone(phone) ? 'border-emerald-400' : ''}`} 
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between mb-1 ml-1">
                                              <label className="block text-xs font-bold text-gray-500 uppercase">CPF</label>
                                              {cpf.replace(/\D/g, '').length === 11 && (
                                                <span className="text-[10px] text-emerald-600 font-bold">✓ Válido</span>
                                              )}
                                            </div>
                                            <input 
                                              type="text" 
                                              value={cpf} 
                                              onChange={e => setCpf(formatCPF(e.target.value))} 
                                              required 
                                              placeholder="000.000.000-00" 
                                              maxLength={14}
                                              className={inputClasses} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {(isLoginMode || (!isLoginMode && regStep === 1)) && (
                                <>
                                    <div>
                                        <div className="flex items-center justify-between mb-1 ml-1">
                                          <label className="block text-xs font-bold text-gray-500 uppercase">E-mail</label>
                                          {!isLoginMode && isValidEmail(email) && (
                                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                              ✓ E-mail válido
                                            </span>
                                          )}
                                        </div>
                                        <input 
                                            type="email" 
                                            value={email} 
                                            onChange={e => setEmail(e.target.value)} 
                                            required 
                                            placeholder="exemplo@email.com" 
                                            className={`${inputClasses} ${!isLoginMode && isValidEmail(email) ? 'border-emerald-400' : ''}`} 
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Senha</label>
                                        <input 
                                            type="password" 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            required 
                                            placeholder="Mínimo 6 caracteres" 
                                            className={inputClasses} 
                                        />
                                    </div>
                                </>
                            )}

                            {/* REGISTRATION STEP 2: Questionnaire */}
                            {!isLoginMode && regStep === 2 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex items-center justify-between text-blue-600 font-bold text-xs bg-blue-50 p-3 rounded-xl border border-blue-100 mb-2">
                                        <span>Passo 2 de 2: Seus Objetivos</span>
                                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px]">100%</span>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Qual o seu principal objetivo com o Money Dashs?</label>
                                        <select 
                                            value={onboardingObjective} 
                                            onChange={(e) => setOnboardingObjective(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium text-sm"
                                        >
                                            <option value="">Selecione o objetivo</option>
                                            <option value="juntar_dinheiro_metas">Juntar dinheiro e bater metas financeiras</option>
                                            <option value="organizar_Financas">Organizar minhas finanças diárias com clareza</option>
                                            <option value="controlar_Gastos">Controlar gastos excessivos e economizar todo mês</option>
                                            <option value="planejar_Futuro">Planejar investimentos de longo prazo e aposentadoria</option>
                                            <option value="gerenciar_Empresa">Gerenciar finanças pessoais e empresariais juntas</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">O que você busca em nosso sistema no seu dia-a-dia?</label>
                                        <textarea 
                                            rows={3}
                                            value={onboardingReason}
                                            onChange={(e) => setOnboardingReason(e.target.value)}
                                            required
                                            placeholder="Ex: Juntar R$ 5.000 em 6 meses, acompanhar metas mensais e cortar gastos supérfluos..."
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium text-sm resize-none"
                                        />
                                    </div>

                                    <button 
                                        type="button" 
                                        onClick={() => setRegStep(1)} 
                                        className="text-xs text-blue-600 font-bold hover:underline py-1 flex items-center gap-1"
                                    >
                                        <ArrowLeft className="w-3 h-3" /> Voltar para dados básicos
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="p-3.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 text-center animate-shake flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button 
                              type="submit" 
                              disabled={isLoading} 
                              className="w-full py-4 bg-[#020617] hover:bg-black text-white rounded-xl font-black text-sm transition-all shadow-xl disabled:opacity-50 transform active:scale-95 cursor-pointer"
                            >
                                {isLoading 
                                  ? 'CARREGANDO...' 
                                  : (isLoginMode 
                                      ? 'ENTRAR NA CONTA' 
                                      : (regStep === 1 ? 'SEGUINTE: DEFINIR OBJETIVOS' : 'GERAR CÓDIGO DE VALIDAÇÃO'))}
                            </button>

                            {isLoginMode && (
                                <div className="text-center">
                                    <button type="button" onClick={handleForgotPassword} disabled={isResetting} className="text-xs text-blue-600 font-bold hover:underline">
                                        Esqueceu sua senha?
                                    </button>
                                </div>
                            )}

                            <p className="text-center text-sm font-semibold text-gray-500 pt-2">
                                {isLoginMode ? 'Não tem uma conta?' : 'Já possui conta?'} 
                                <button type="button" onClick={() => { setIsLoginMode(!isLoginMode); setRegStep(1); setShowVerification(false); setError(''); }} className="ml-1 text-blue-600 font-bold hover:underline">
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
