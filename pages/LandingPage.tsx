
import React from 'react';
import { RocketLaunchIcon } from '../components/icons/RocketLaunchIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { DashboardIcon } from '../components/icons/DashboardIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { Plan } from '../types';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: (plan: Plan) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
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
                onClick={() => onRegister('FREE')}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold text-xs md:text-sm hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Começar Grátis
              </button>
            </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[80px] -z-10 opacity-60"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-indigo-50 rounded-full blur-[80px] -z-10 opacity-60"></div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-8 hover:bg-blue-100 transition-colors cursor-default">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                Novo Dashboard 2.0
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                Assuma o controle total <br />
                do seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">futuro financeiro.</span>
            </h1>

            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-500 mb-10 leading-relaxed">
                Abandone as planilhas complicadas. Controle gastos, planeje metas e acompanhe investimentos em um painel limpo, rápido e intuitivo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                <button 
                    onClick={() => onRegister('FREE')}
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

            {/* --- MOCKUP DO SISTEMA (Visual do App Real) --- */}
            <div className="relative mx-auto max-w-6xl group perspective-1000">
                {/* Shadow behind */}
                <div className="absolute -inset-4 bg-gradient-to-b from-blue-100/50 to-white rounded-[2rem] -z-10 blur-xl"></div>
                
                <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden aspect-[16/9] md:aspect-[16/9] flex flex-col ring-1 ring-slate-900/5">
                    {/* Fake Browser Toolbar */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                        </div>
                        <div className="flex-1 flex justify-center">
                            <div className="px-3 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-400 font-mono flex items-center gap-1 w-64 justify-center shadow-sm">
                                🔒 app.findash.com
                            </div>
                        </div>
                    </div>

                    {/* INTERFACE DO SISTEMA */}
                    <div className="flex-1 flex bg-[#f8fafc] overflow-hidden">
                        {/* Sidebar */}
                        <div className="hidden md:flex w-56 bg-slate-900 flex-col p-4 border-r border-slate-800">
                             <div className="flex items-center gap-2 mb-8 px-2">
                                <div className="bg-blue-600 p-1 rounded-md">
                                  <div className="w-3 h-3 bg-white rounded-full opacity-50"></div>
                                </div>
                                <span className="text-white font-bold text-lg">FinDash</span>
                             </div>
                             
                             <div className="space-y-1">
                                 <div className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-medium gap-3 shadow-lg shadow-blue-900/20">
                                     <div className="w-4 h-4 bg-white/20 rounded"></div>
                                     Dashboard
                                 </div>
                                 <div className="flex items-center px-3 py-2 text-slate-400 rounded-md text-xs font-medium gap-3">
                                     <div className="w-4 h-4 border border-slate-700 rounded"></div>
                                     Transações
                                 </div>
                                 <div className="flex items-center px-3 py-2 text-slate-400 rounded-md text-xs font-medium gap-3">
                                     <div className="w-4 h-4 border border-slate-700 rounded"></div>
                                     Agenda
                                 </div>
                             </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
                            {/* Header do App */}
                            <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
                                <div className="w-48 h-8 bg-slate-100 rounded-full flex items-center px-3">
                                    <div className="w-3 h-3 bg-slate-300 rounded-full mr-2"></div>
                                    <div className="h-2 w-20 bg-slate-200 rounded"></div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100"></div>
                                </div>
                            </div>

                            {/* Dashboard Content */}
                            <div className="p-6 overflow-hidden">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-800">Dashboard</h3>
                                    <div className="w-32 h-8 bg-white border border-slate-200 rounded-md shadow-sm"></div>
                                </div>

                                {/* Cards */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-50 rounded-lg">
                                                <div className="w-4 h-4 bg-blue-500 rounded-full opacity-50"></div>
                                            </div>
                                            <div className="text-xs font-bold text-slate-400 uppercase">Saldo Total</div>
                                        </div>
                                        <div className="text-xl font-bold text-slate-900">R$ 12.450,00</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-green-50 rounded-lg">
                                                <div className="w-4 h-4 bg-green-500 rounded-full opacity-50"></div>
                                            </div>
                                            <div className="text-xs font-bold text-slate-400 uppercase">Receitas</div>
                                        </div>
                                        <div className="text-xl font-bold text-slate-900">R$ 8.240,00</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-red-50 rounded-lg">
                                                <div className="w-4 h-4 bg-red-500 rounded-full opacity-50"></div>
                                            </div>
                                            <div className="text-xs font-bold text-slate-400 uppercase">Despesas</div>
                                        </div>
                                        <div className="text-xl font-bold text-slate-900">R$ 3.100,00</div>
                                    </div>
                                </div>

                                {/* Chart & List */}
                                <div className="grid grid-cols-3 gap-4 h-full">
                                    {/* Chart Area */}
                                    <div className="col-span-2 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                                        <div className="flex justify-between mb-4">
                                            <div className="h-4 w-32 bg-slate-100 rounded"></div>
                                            <div className="h-4 w-16 bg-slate-100 rounded"></div>
                                        </div>
                                        <div className="flex items-end justify-between h-32 px-2 gap-3 mt-4 border-b border-l border-slate-100">
                                            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                                <div key={i} className="w-full flex gap-1 h-full items-end justify-center">
                                                     <div style={{height: `${h}%`}} className="w-3 bg-blue-500 rounded-t-sm"></div>
                                                     <div style={{height: `${h * 0.6}%`}} className="w-3 bg-red-400 rounded-t-sm"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Transactions List */}
                                    <div className="col-span-1 bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
                                        <div className="h-4 w-24 bg-slate-200 rounded mb-2"></div>
                                        {[1,2,3,4].map(i => (
                                            <div key={i} className="flex items-center gap-2 py-1 border-b border-slate-50 last:border-0">
                                                <div className="w-8 h-8 rounded bg-slate-100 flex-shrink-0"></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="h-2 w-16 bg-slate-200 rounded mb-1"></div>
                                                    <div className="h-1.5 w-10 bg-slate-100 rounded"></div>
                                                </div>
                                                <div className="h-2 w-12 bg-slate-200 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- LOGOS SECTION --- */}
      <section className="py-12 border-y border-slate-100 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <p className="text-xs font-bold tracking-widest text-slate-400 mb-8 uppercase">Compatível com seus bancos favoritos</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                  {['Nubank', 'Inter', 'XP Investimentos', 'BTG Pactual', 'Binance'].map((bank) => (
                      <span key={bank} className="text-xl md:text-2xl font-bold text-slate-800 cursor-default">
                          {bank}
                      </span>
                  ))}
              </div>
          </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Tudo o que você precisa</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto text-lg">Funcionalidades poderosas para simplificar sua rotina financeira.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                      { icon: <DashboardIcon className="w-6 h-6 text-blue-600" />, title: 'Painel de Controle', desc: 'Visualize para onde vai seu dinheiro mês a mês com gráficos claros.' },
                      { icon: <CheckCircleIcon className="w-6 h-6 text-blue-600" />, title: 'Tronco de Transações', desc: 'Registre e acompanhe todas as suas receitas e despesas em um só lugar.' },
                      { icon: <UsersIcon className="w-6 h-6 text-blue-600" />, title: 'Relatórios Avançados', desc: 'Análises detalhadas por categoria e evolução mensal (Plano PRO).' },
                      { icon: <TrendingUpIcon className="w-6 h-6 text-blue-600" />, title: 'Gestão de Investimentos', desc: 'Acompanhe a evolução do seu patrimônio (Plano PRO).' },
                      { icon: <CheckCircleIcon className="w-6 h-6 text-blue-600" />, title: 'Agenda Financeira', desc: 'Nunca mais pague juros por atraso. Receba notificações de contas (Plano PRO).' },
                      { icon: <RocketLaunchIcon className="w-6 h-6 text-blue-600" />, title: 'Suporte Prioritário', desc: 'Atendimento exclusivo e direto para membros VIP.' },
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
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Planos que cabem no seu bolso</h2>
                  <p className="text-slate-500">Escolha o melhor plano para o seu momento financeiro.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-end">
                  {/* INICIANTE */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                      <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">INICIANTE</div>
                      <h3 className="text-3xl font-bold text-slate-900 mb-4">Grátis</h3>
                      <p className="text-slate-500 text-sm mb-6">Para quem está começando a se organizar.</p>
                      <ul className="space-y-3 mb-8 text-sm text-slate-600">
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Painel de Controle</li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Tronco de Transações</li>
                          <li className="flex items-center gap-2 text-slate-400"><CheckCircleIcon className="w-4 h-4" /> Sem Investimentos</li>
                          <li className="flex items-center gap-2 text-slate-400"><CheckCircleIcon className="w-4 h-4" /> Sem Relatórios Avançados</li>
                      </ul>
                      <button 
                        onClick={() => onRegister('FREE')}
                        className="w-full py-3 border-2 border-slate-200 text-slate-700 rounded-lg font-bold text-sm hover:border-slate-900 hover:text-slate-900 transition-colors"
                      >
                          Começar Grátis
                      </button>
                  </div>

                  {/* PRO Plan */}
                  <div className="bg-white border-2 border-blue-600 rounded-2xl p-8 relative transform md:-translate-y-4 shadow-2xl shadow-blue-100">
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
                      <div className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">PRO</div>
                      <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-4xl font-bold text-slate-900">R$ 29,90</span>
                          <span className="text-slate-500">/mês</span>
                      </div>
                      <p className="text-slate-500 text-sm mb-6">Para quem quer controle total.</p>
                      <ul className="space-y-3 mb-8 text-sm text-slate-600">
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-blue-600" /> <strong>Tudo do plano Grátis</strong></li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-blue-600" /> Gestão de Investimentos</li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-blue-600" /> Agenda Financeira</li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-blue-600" /> Relatórios Avançados</li>
                      </ul>
                      <button 
                        onClick={() => onRegister('PRO')}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                      >
                          Assinar Pro
                      </button>
                  </div>

                  {/* VIP Plan */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-purple-200 hover:shadow-xl transition-all duration-300">
                      <div className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-2">VIP</div>
                      <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-4xl font-bold text-slate-900">R$ 500</span>
                          <span className="text-slate-500">/único</span>
                      </div>
                      <p className="text-slate-500 text-sm mb-6">Pague uma vez, use para sempre.</p>
                      <ul className="space-y-3 mb-8 text-sm text-slate-600">
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600" /> <strong>Acesso VITALÍCIO ao PRO</strong></li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600" /> Prioritário VIP</li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600" /> Acesso antecipado a betas</li>
                          <li className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-purple-600" /> Sem mensalidade nunca</li>
                      </ul>
                      <button 
                        onClick={() => onRegister('VIP')}
                        className="w-full py-3 border-2 border-purple-100 text-purple-600 hover:bg-purple-50 hover:border-purple-200 rounded-lg font-bold text-sm transition-colors"
                      >
                          Comprar Lifetime
                      </button>
                  </div>
              </div>
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-16">
          <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                  
                  {/* Brand Column */}
                  <div className="col-span-1 md:col-span-1">
                      <div className="flex items-center gap-2 mb-4">
                          <div className="bg-blue-600 p-1.5 rounded-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                          </div>
                          <span className="text-xl font-bold text-white">FinDash</span>
                      </div>
                      <p className="text-sm leading-relaxed mb-6">
                          O sistema de gestão financeira pessoal feito para brasileiros. Organize, economize e invista com inteligência.
                      </p>
                  </div>

                  {/* Links Column 1 */}
                  <div>
                      <h4 className="text-white font-bold mb-4">Produto</h4>
                      <ul className="space-y-3 text-sm">
                          <li><a href="#features" className="hover:text-blue-400 transition-colors">Funcionalidades</a></li>
                          <li><a href="#planos" className="hover:text-blue-400 transition-colors">Preços</a></li>
                          <li><a href="#" className="hover:text-blue-400 transition-colors">Atualizações</a></li>
                      </ul>
                  </div>

                  {/* Links Column 2 */}
                  <div>
                      <h4 className="text-white font-bold mb-4">Empresa</h4>
                      <ul className="space-y-3 text-sm">
                          <li><a href="#" className="hover:text-blue-400 transition-colors">Sobre nós</a></li>
                          <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
                          <li><a href="#" className="hover:text-blue-400 transition-colors">Carreiras</a></li>
                      </ul>
                  </div>

                  {/* Links Column 3 */}
                  <div>
                      <h4 className="text-white font-bold mb-4">Legal</h4>
                      <ul className="space-y-3 text-sm">
                          <li><a href="#" className="hover:text-blue-400 transition-colors">Termos de Uso</a></li>
                          <li><a href="#" className="hover:text-blue-400 transition-colors">Privacidade</a></li>
                          <li><a href="#" className="hover:text-blue-400 transition-colors">Contato</a></li>
                      </ul>
                  </div>
              </div>

              <div className="border-t border-slate-800 pt-8 text-center text-sm">
                  <p>© 2025 FinDash Tecnologia Ltda. Todos os direitos reservados.</p>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;
