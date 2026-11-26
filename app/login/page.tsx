'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Zap, Lock, Mail, ArrowRight, User, Eye, EyeOff, KeyRound, ChevronLeft } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset' | 'verify'>('signin');
  
  // Visibilidade de senhas
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verification = params.get('verify');
    const reset = params.get('token');
    if (verification) {
      setVerificationToken(verification);
      setMode('verify');
      window.history.replaceState({}, '', '/login');
    } else if (reset) {
      setResetToken(reset);
      setMode('reset');
      window.history.replaceState({}, '', '/login');
    } else if (params.get('verified') === '1') {
      setSuccessMsg('E-mail confirmado. Agora você já pode entrar.');
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signup') {
        // Criar conta via endpoint de registro
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao registrar usuário');
        }

        setSuccessMsg(data.message || 'Confira seu e-mail para confirmar a conta.');
        setPassword('');
        setMode('signin');
      } else if (mode === 'signin') {
        const loginRes = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (loginRes?.error) {
          throw new Error('E-mail ou senha incorretos.');
        }

        router.push('/dashboard');
        router.refresh();
      } else if (mode === 'forgot') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'request', email }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao solicitar recuperação de senha');
        }

        setSuccessMsg(data.message || 'Se houver uma conta para esse e-mail, enviaremos um link.');
      } else if (mode === 'reset') {
        if (newPassword !== confirmPassword) throw new Error('As senhas não coincidem.');
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'complete', token: resetToken, newPassword }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao redefinir senha');

        setSuccessMsg(data.message || 'Senha alterada. Entre novamente.');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
        setMode('signin');
      } else if (mode === 'verify') {
        if (newPassword !== confirmPassword) throw new Error('As senhas não coincidem.');
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: verificationToken, password: newPassword }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao confirmar o e-mail');

        setSuccessMsg(data.message || 'E-mail confirmado. Faça login.');
        setVerificationToken('');
        setNewPassword('');
        setConfirmPassword('');
        setMode('signin');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro durante a operação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center items-center px-4 bg-grid-pattern relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500/40 transition">
              <Zap size={22} className="fill-cyan-400" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              nexus<span className="text-cyan-400">flow</span>
            </span>
          </Link>
          <p className="text-sm text-slate-400 font-light">
            {mode === 'signup' && 'Crie sua conta no NexusFlow'}
            {mode === 'signin' && 'Entre para gerenciar suas automações'}
            {mode === 'forgot' && 'Receba um link para redefinir sua senha'}
            {mode === 'reset' && 'Escolha uma nova senha de acesso'}
            {mode === 'verify' && 'Confirme seu e-mail e escolha uma senha'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl border-white/10">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-mono">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono">Nome completo</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 pl-9 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                  <User size={16} className="absolute left-3 top-3 text-slate-500" />
                </div>
              </div>
            )}

            {mode !== 'reset' && mode !== 'verify' && <div>
              <label className="block text-xs text-slate-400 mb-1 font-mono">E-mail corporativo ou pessoal</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 pl-9 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                />
                <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
              </div>
            </div>}

            {mode === 'signin' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400 font-mono">Senha</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 pl-9 pr-10 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                  <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {(mode === 'reset' || mode === 'verify') && (
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo de 12 caracteres"
                    value={newPassword}
                    minLength={12}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 pl-9 pr-10 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                  <KeyRound size={16} className="absolute left-3 top-3 text-slate-500" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition"
                    title={showNewPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {(mode === 'reset' || mode === 'verify') && (
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono">Confirme a nova senha</label>
                <input
                  type="password"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="Digite a mesma senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50 font-mono"
            >
              {loading ? (
                'Processando...'
              ) : mode === 'signup' ? (
                <>Criar Conta <ArrowRight size={16} /></>
              ) : mode === 'signin' ? (
                <>Acessar Painel <ArrowRight size={16} /></>
              ) : mode === 'forgot' ? (
                <>Enviar link de redefinição <Mail size={16} /></>
              ) : mode === 'verify' ? (
                <>Confirmar e criar conta <Mail size={16} /></>
              ) : (
                <>Confirmar Nova Senha <KeyRound size={16} /></>
              )}
            </button>
          </form>

          {/* Toggle entre modos */}
          <div className="mt-6 pt-6 border-t border-white/[0.08] text-center text-xs text-slate-400 font-mono">
            {mode === 'forgot' || mode === 'reset' || mode === 'verify' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                <ChevronLeft size={14} /> Voltar para o login
              </button>
            ) : mode === 'signup' ? (
              <p>
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-cyan-400 hover:underline font-medium"
                >
                  Entrar
                </button>
              </p>
            ) : (
              <p>
                Não tem uma conta ainda?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-cyan-400 hover:underline font-medium"
                >
                  Criar conta grátis
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Retorno e Links Legais */}
        <div className="mt-6 text-center space-y-2">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-400 transition font-mono block"
          >
            ← Voltar para a página inicial
          </Link>
          <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-600">
            <Link href="/terms" className="hover:text-slate-400 transition">
              Termos de Uso
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-slate-400 transition">
              Privacidade (LGPD)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
