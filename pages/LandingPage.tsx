
import React, { useState } from 'react';
import { RocketLaunchIcon } from '../components/icons/RocketLaunchIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { DashboardIcon } from '../components/icons/DashboardIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { Plan, BillingCycle } from '../types';
import { SwitchHorizontalIcon } from '../components/icons/SwitchHorizontalIcon';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: (plan: Plan, cycle: BillingCycle) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');

  // Lógica de Preços
  const prices = {
      PRO: billingCycle === 'MONTHLY' ? '39,90' : '399,90',
      VIP: billingCycle === 'MONTHLY' ? '79,90' : '799,90'
  };

  const periodLabel = billingCycle === 'MONTHLY' ? '/mês' : '/ano';

  return (
    <div className="font-sans text-slate-600 bg-white overflow-x-hidden selection:bg-blue-100 selection:text-blue-900 scroll-smooth">
      <style>{`
        html { scroll-behavior: smooth; }
      `}</style>

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-200">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                 </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Fin<span className="text-blue-600">Dash</span></span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                <a href="#features" className="hover:text-blue-600 transition-colors cursor-pointer">Funcionalidades</a>
                <a href="#beneficios" className="hover:text-blue-600 transition-colors cursor-pointer">Benefícios</a>
                <a href="#planos" className="hover:text-blue-600 transition-colors cursor-pointer">Planos</a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <button 
                onClick={onLogin}
                className="hidden md:block text-slate-600 hover:text-blue-600 font-bold text-sm transition-colors"
              >
                Entrar
              </button>
              <button 
                onClick={() => onRegister('FREE', 'MONTHLY')}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold text-xs md:text-sm hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Começar Grátis
              </button>
            </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[80px] -z-10 opacity-60"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-indigo-50 rounded-full blur-[80px] -z-10 opacity-60"></div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-8 hover:bg-blue-100 transition-colors cursor-default">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                Suporte Multi-moedas (BRL/USD) Liberado
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                Gestão Financeira <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Sem Fronteiras.</span>
            </h1>

            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500 mb-10 leading-relaxed">
                Controle seu patrimônio no Brasil e no exterior em um único lugar. Separe custo de vida de aportes e veja sua riqueza crescer de forma inteligente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                <button 
                    onClick={() => onRegister('FREE', 'MONTHLY')}
                    className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-sm md:text-base hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2"
                >
                    Criar Conta Gratuita <span className="text-blue-200">-></span>
                </button>
                <button 
                    onClick={onLogin} 
                    className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-sm md:text-base hover:bg-slate-50 transition-colors shadow-sm hover:shadow-md"
                >
                    Acessar Sistema
                </button>
            </div>

            {/* --- MOCKUP DO SISTEMA --- */}
            <div className="relative mx-auto max-w-6xl group perspective-1000">
                <div className="absolute -inset-4 bg-gradient-to-b from-blue-100/50 to-white rounded-[2rem] -z-10 blur-xl"></div>
                <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden aspect-[16/9] flex flex-col ring-1 ring-slate-900/5">
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                        </div>
                        <div className="flex-1 flex justify-center">
                            <div className="px-3 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-400 font-mono flex items-center gap-1 w-64 justify-center shadow-sm">
                                🔒 app.findash.com/dashboard/brl-usd
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex bg-[#f8fafc] overflow-hidden">
                        <div className="hidden md:flex w-56 bg-slate-900 flex-col p-4 border-r border-slate-800">
                             <div className="flex items-center gap-2 mb-8 px-2">
                                <div className="bg-blue-600 p-1 rounded-md">
                                  <div className="w-3 h-3 bg-white rounded-full opacity-50"></div>
                                </div>
                                <span className="text-white font-bold text-lg">FinDash</span>
                             </div>
                             <div className="space-y-1 opacity-40">
                                 <div className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium gap-3">
                                     <div className="w-4 h-4 bg-white/20 rounded"></div> Dashboard
                                 </div>
                                 <div className="flex items-center px-3 py-2 text-slate-400 rounded-md text-xs font-medium gap-3">
                                     <div className="w-4 h-4 border border-slate-700 rounded"></div> Transações
                                 </div>
                             </div>
                        </div>

                        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
                            <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
                                <div className="flex gap-2">
                                     <div className="w-12 h-6 bg-slate-900 rounded text-[8px] flex items-center justify-center text-white font-bold">BRL</div>
                                     <div className="w-12 h-6 bg-slate-100 rounded text-[8px] flex items-center justify-center text-slate-400 font-bold">USD</div>
                                </div>
                                <div className="w-24 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] text-white font-bold">Câmbio</div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-4 gap-4 mb-6">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="w-8 h-2 bg-slate-100 rounded mb-2"></div>
                                            <div className="w-16 h-4 bg-slate-200 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-48 flex items-end justify-between gap-2 px-10">
                                     {[60, 40, 80, 50, 90, 30, 70, 45, 85].map((h, i) => (
                                         <div key={i} className="flex gap-1 items-end w-full">
                                            <div style={{height: `${h}%`}} className="w-full bg-blue-500 rounded-t-sm"></div>
                                            <div style={{height: `${h*0.4}%`}} className="w-full bg-red-400 rounded-t-sm"></div>
                                         </div>
                                     ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">A inteligência que seu dinheiro merece</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto text-lg">Desenvolvemos as ferramentas certas para quem busca liberdade financeira real.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                      { icon: <SwitchHorizontalIcon className="w-6 h-6 text-blue-600" />, title: 'Gestão Multimoedas', desc: 'Acompanhe saldos e investimentos em BRL e USD com conversão integrada.' },
                      { icon: <DashboardIcon className="w-6 h-6 text-blue-600" />, title: 'Patrimônio vs Custo', desc: 'Saiba exatamente quanto do seu dinheiro é gasto e quanto é investido.' },
                      { icon: <UsersIcon className="w-6 h-6 text-blue-600" />, title: 'Relatórios Geográficos', desc: 'Análise profunda de despesas reais vs aportes financeiros internacionais.' },
                      { icon: <TrendingUpIcon className="w-6 h-6 text-blue-600" />, title: 'Evolução Anual', desc: 'Gráficos de área que mostram o crescimento real do seu patrimônio no tempo.' },
                      { icon: <CheckCircleIcon className="w-6 h-6 text-blue-600" />, title: 'Agenda Inteligente', desc: 'Lembretes de pagamentos e aportes agendados para não perder oportunidades.' },
                      { icon: <RocketLaunchIcon className="w-6 h-6 text-blue-600" />, title: 'Assistente VIP WhatsApp', desc: 'Mande um áudio e registre seus gastos. A nossa IA cuida de tudo para você.' },
                  ].map((feature, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 p-8 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-100 transition-all duration-300 group">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                              {feature.icon}
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                          <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="planos" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-10">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Planos que acompanham seu crescimento</h2>
                  
                  {/* Seletor Mensal / Anual */}
                  <div className="flex justify-center mt-8">
                        <div className="bg-slate-200 p-1.5 rounded-full flex relative inline-flex">
                            <button 
                                onClick={() => setBillingCycle('MONTHLY')}
                                className={`px-6 py-2 text-sm font-bold rounded-full transition-all duration-300 ${billingCycle === 'MONTHLY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Mensal
                            </button>
                            <button 
                                onClick={() => setBillingCycle('ANNUAL')}
                                className={`px-6 py-2 text-sm font-bold rounded-full transition-all duration-300 flex items-center ${billingCycle === 'ANNUAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Anual
                                <span className="ml-2 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    -16% OFF
                                </span>
                            </button>
                        </div>
                  </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-end">
                  {/* FREE */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                      <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">FREE</div>
                      <h3 className="text-3xl font-bold text-slate-900 mb-4">Grátis</h3>
                      <p className="text-slate-500 text-sm mb-6">Organização básica em Real.</p>
                      <ul className="space-y-3 mb-8 text-sm text-slate-600">
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Fluxo de Caixa (BRL)</li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Cadastro de Transações</li>
                          <li className="flex items-center gap-2 text-slate-400"><CheckCircleIcon className="w-4 h-4" /> Sem Suporte USD</li>
                          <li className="flex items-center gap-2 text-slate-400"><CheckCircleIcon className="w-4 h-4" /> Sem Relatórios de Patrimônio</li>
                      </ul>
                      <button onClick={() => onRegister('FREE', 'MONTHLY')} className="w-full py-3 border-2 border-slate-200 text-slate-700 rounded-lg font-bold text-sm hover:border-slate-900 hover:text-slate-900 transition-colors">
                          Começar Agora
                      </button>
                  </div>

                  {/* PRO */}
                  <div className="bg-white border-2 border-blue-600 rounded-2xl p-8 relative transform md:-translate-y-4 shadow-2xl shadow-blue-100">
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg tracking-widest">PATRIMONIAL</div>
                      <div className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">PRO</div>
                      <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-4xl font-bold text-slate-900">R$ {prices.PRO}</span>
                          <span className="text-slate-500">{periodLabel}</span>
                      </div>
                      <p className="text-slate-500 text-sm mb-6">Controle total Real & Dólar.</p>
                      <ul className="space-y-3 mb-8 text-sm text-slate-600">
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-blue-600" /> <strong>Gestão Multimoedas (BRL/USD)</strong></li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-blue-600" /> Relatórios Custo vs Aporte</li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-blue-600" /> Dashboard de Evolução Anual</li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-blue-600" /> Carteira de Investimentos</li>
                      </ul>
                      <button onClick={() => onRegister('PRO', billingCycle)} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                          Assinar PRO
                      </button>
                  </div>

                  {/* VIP */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-purple-200 hover:shadow-xl transition-all duration-300">
                      <div className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-2">VIP</div>
                      <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-4xl font-bold text-slate-900">R$ {prices.VIP}</span>
                          <span className="text-slate-500">{periodLabel}</span>
                      </div>
                      <p className="text-slate-500 text-sm mb-6">Comodidade e IA via WhatsApp.</p>
                      <ul className="space-y-3 mb-8 text-sm text-slate-600">
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600" /> <strong>Tudo do plano PRO</strong></li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600" /> <strong>Integração via WhatsApp</strong></li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600" /> Assistente Financeiro IA</li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600" /> Suporte Prioritário</li>
                      </ul>
                      <button onClick={() => onRegister('VIP', billingCycle)} className="w-full py-3 border-2 border-purple-100 text-purple-600 hover:bg-purple-50 hover:border-purple-200 rounded-lg font-bold text-sm transition-colors">
                          Assinar VIP
                      </button>
                  </div>
              </div>
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-16">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-8">
                  <div className="bg-blue-600 p-1.5 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-white">FinDash</span>
              </div>
              <p className="max-w-md mx-auto text-sm mb-8">
                  Sua central global de patrimônio. Desenvolvido para quem busca clareza financeira em Real e Dólar.
              </p>
              <div className="border-t border-slate-800 pt-8 text-xs">
                  <p>© 2025 FinDash. Powered by <span className="text-blue-500 font-bold">GTS AI</span> - Global Tech Software.</p>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;
