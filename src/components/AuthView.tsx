/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User as UserIcon, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { FirebaseService } from '../utils/firebaseService';
import { User } from '../types';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showRecoveryMsg, setShowRecoveryMsg] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowRecoveryMsg(false);
    setIsLoading(true);

    const validateEmail = (emailStr: string) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(emailStr.trim());
    };

    try {
      if (isLogin) {
        if (!email || !password) {
          setError('Preencha todos os campos.');
          setIsLoading(false);
          return;
        }
        if (!validateEmail(email)) {
          setError('E-mail inválido. Por favor, forneça um endereço de e-mail válido.');
          setIsLoading(false);
          return;
        }
        const user = await FirebaseService.loginUser(email, password);
        onLoginSuccess(user);
      } else {
        if (!name || !email || !password || !confirmPassword) {
          setError('Preencha todos os campos.');
          setIsLoading(false);
          return;
        }
        if (!validateEmail(email)) {
          setError('E-mail inválido. Por favor, forneça um endereço de e-mail válido.');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('As senhas não coincidem.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('A senha deve conter no mínimo 6 caracteres.');
          setIsLoading(false);
          return;
        }
        const user = await FirebaseService.registerUser(name, email, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (type: 'demo1' | 'demo2') => {
    setError('');
    setShowRecoveryMsg(false);
    setIsLoading(true);
    try {
      const email = type === 'demo1' ? 'contato@petsitter.com' : 'marcela.walker@petsitter.com';
      const name = type === 'demo1' ? 'Carlos Designer' : 'Marcela Walkers';
      const password = '123456';
      
      let user;
      try {
        user = await FirebaseService.loginUser(email, password);
      } catch (loginErr) {
        // If login failed, try registration
        user = await FirebaseService.registerUser(name, email, password);
      }
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados demonstrativos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setShowRecoveryMsg(false);
    setIsLoading(true);
    try {
      const user = await FirebaseService.loginWithGoogle();
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro no login do Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-screen bg-[#F9F8F3] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-[#E9EDC9] text-[#5A5A40] rounded-3xl flex items-center justify-center border border-[#CCD5AE]/40 shadow-xs">
            {/* Beautiful Custom SVG Dog & Cat inline */}
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 21a9 9 0 110-18 9 9 0 010 18z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 10a1 1 0 100-2 1 1 0 000 2zM15 10a1 1 0 100-2 1 1 0 000 2zM12 13v1" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 16s1 1.5 2 1.5 2-1.5 2-1.5" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-serif italic text-[#424231] tracking-tight">
          PetSitter Manager
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-[#8C8C73]">
          Organização profissional para cuidadores de pets e dog walkers.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          layout
          className="bg-white py-8 px-4 border border-[#E9E9D8] rounded-3xl sm:px-10"
        >
          <div className="mb-6 flex justify-center border-b border-[#F5F5ED] pb-2">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 text-center py-2 text-sm font-semibold transition-colors cursor-pointer ${isLogin ? 'text-[#5A5A40] border-b-2 border-[#5A5A40]' : 'text-[#8C8C73] hover:text-[#5A5A40]'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 text-center py-2 text-sm font-semibold transition-colors cursor-pointer ${!isLogin ? 'text-[#5A5A40] border-b-2 border-[#5A5A40]' : 'text-[#8C8C73] hover:text-[#5A5A40]'}`}
            >
              Criar conta
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-[#8C8C73]" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-[#F9F8F3] border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] focus:bg-white transition-all placeholder:text-[#8C8C73]/60"
                    placeholder="Seu nome profissional"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-[#8C8C73] uppercase tracking-wider mb-1.5">
                E-mail profissional
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[#8C8C73]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#F9F8F3] border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] focus:bg-white transition-all placeholder:text-[#8C8C73]/60"
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#8C8C73] uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[#8C8C73]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#F9F8F3] border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] focus:bg-white transition-all placeholder:text-[#8C8C73]/60"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-[10px] font-bold text-[#8C8C73] uppercase tracking-wider mb-1.5">
                  Confirmar Senha
                </label>
                <div className="relative rounded-md shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-[#8C8C73]" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-[#F9F8F3] border border-[#E9E9D8] rounded-xl text-[#424231] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] focus:bg-white transition-all placeholder:text-[#8C8C73]/60"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-700 text-xs py-2 px-3 bg-red-50 border border-red-100 rounded-xl font-medium">
                {error}
              </div>
            )}

            {showRecoveryMsg && (
              <div className="text-[#5A5A40] text-xs py-2 px-3 bg-[#E9EDC9]/30 border border-[#CCD5AE]/50 rounded-xl font-medium">
                Um link de redefinição de senha foi enviado para o seu e-mail cadastrado (Simulação).
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!email) {
                      setError('Por favor, informe seu e-mail para recuperar a senha.');
                    } else {
                      setError('');
                      setShowRecoveryMsg(true);
                    }
                  }}
                  className="text-xs font-bold text-[#D4A373] hover:text-[#5A5A40] transition-colors cursor-pointer"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 rounded-full text-sm font-semibold text-white bg-[#5A5A40] hover:bg-[#6B6B4F] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoading ? (
                <span>Carregando...</span>
              ) : isLogin ? (
                <>
                  <LogIn className="h-4.5 w-4.5" /> Entrar no Sistema
                </>
              ) : (
                <>
                  <UserPlus className="h-4.5 w-4.5" /> Criar minha Conta
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-[#F5F5ED]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2.5 text-[10px] font-bold text-[#8C8C73] uppercase tracking-wider">ou continue com</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full flex justify-center items-center gap-3 py-2.5 px-4 rounded-full border border-[#E9E9D8] bg-white hover:bg-[#F9F8F3] text-sm font-semibold text-[#5A5A40] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>Entrar com o Google</span>
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 border-t border-[#F5F5ED] pt-5">
            <h4 className="text-center text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5 font-sans">
              <Sparkles className="h-3.5 w-3.5 text-[#D4A373]" /> Modo Demonstrativo (Rápido)
            </h4>
            <div className="grid grid-cols-1 gap-2.5 font-sans">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('demo1')}
                className="w-full py-2.5 px-3 border border-[#E9E9D8] rounded-xl bg-[#F9F8F3] hover:bg-[#FEFAE0]/85 text-[#424231] text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer disabled:opacity-50"
              >
                <span>Tutor Modelo: Carlos Designer (Ana)</span>
                <span className="text-[#5A5A40] font-bold flex items-center gap-0.5">Testar &rarr;</span>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('demo2')}
                className="w-full py-2.5 px-3 border border-[#E9E9D8] rounded-xl bg-[#F9F8F3] hover:bg-[#FEFAE0]/85 text-[#424231] text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer disabled:opacity-50"
              >
                <span>Tutor Modelo: Marcela (Spitz & Persa)</span>
                <span className="text-[#5A5A40] font-bold flex items-center gap-0.5">Testar &rarr;</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
