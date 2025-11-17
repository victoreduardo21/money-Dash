import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const usersJson = localStorage.getItem('fin-dash-users');
    if (!usersJson || JSON.parse(usersJson).length === 0) {
        const defaultUser: User = {
            name: 'Usuário Padrão',
            email: 'usuario@email.com',
            password: 'password123',
        };
        localStorage.setItem('fin-dash-users', JSON.stringify([defaultUser]));
        alert('Nenhum usuário encontrado. Um usuário padrão foi criado.\nEmail: usuario@email.com\nSenha: password123');
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      const usersJson = localStorage.getItem('fin-dash-users');
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];
      
      const foundUser = users.find(user => user.email === email && user.password === password);

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('Email ou senha inválidos.');
        setIsLoading(false);
      }
    }, 500);
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Meu<span className="text-blue-500">Fin</span>
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Acesse sua conta para gerenciar suas finanças
            </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleLoginSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-gray-200 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="seuemail@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-gray-200 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
              <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600 rounded bg-slate-700" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Lembrar-me</label>
              </div>
              <div className="text-sm">
              <a href="#" className="font-medium text-blue-500 hover:text-blue-400">Esqueceu sua senha?</a>
              </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          
          <button type="submit" disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800 disabled:bg-blue-500 disabled:cursor-not-allowed">
            {isLoading ? 'Aguarde...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;