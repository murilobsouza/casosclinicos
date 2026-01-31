
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { DB } from '../db';
import { validateApiKey } from '../gemini';
import { LogIn, UserPlus, Eye, EyeOff, Loader2, Sparkles, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para o teste de IA
  const [aiStatus, setAiStatus] = useState<'testing' | 'ok' | 'fail' | 'idle'>('idle');
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    checkIA();
  }, []);

  const checkIA = async () => {
    setAiStatus('testing');
    const result = await validateApiKey();
    if (result.success) {
      setAiStatus('ok');
    } else {
      setAiStatus('fail');
      setAiMessage(result.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const users = await DB.getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        onLogin(user);
      } else {
        setError('E-mail ou senha incorretos.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 bg-slate-50">
      {/* Indicador de Status da IA (Variável de Sistema) */}
      <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm text-xs font-bold transition-all ${
          aiStatus === 'testing' ? 'bg-white text-slate-400 border-slate-200' :
          aiStatus === 'ok' ? 'bg-green-50 text-green-600 border-green-100' :
          'bg-red-50 text-red-600 border-red-100'
        }`}>
          {aiStatus === 'testing' ? <Loader2 size={14} className="animate-spin" /> : 
           aiStatus === 'ok' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          
          <span className="flex items-center gap-1.5">
            <Sparkles size={12} className={aiStatus === 'ok' ? 'text-amber-400' : ''} />
            {aiStatus === 'testing' ? 'Verificando Conexão IA...' : 
             aiStatus === 'ok' ? 'IA Pronta: Variável API_KEY Ativa' : 'IA Indisponível: Verifique API_KEY'}
          </span>

          {aiStatus === 'fail' && (
            <button onClick={checkIA} className="ml-2 hover:rotate-180 transition-transform duration-500">
              <RefreshCw size={12} />
            </button>
          )}
        </div>
        {aiStatus === 'fail' && (
          <p className="text-[10px] text-red-400 mt-2 text-center max-w-xs mx-auto leading-tight">
            {aiMessage}
          </p>
        )}
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 opacity-20"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Tutor Oftalmo</h1>
          <p className="text-slate-500 mt-2">Acesse sua conta para começar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">E-mail</label>
            <input 
              type="email"
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">Senha</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100 animate-in shake duration-300">
              <XCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            {loading ? 'Validando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-sm font-medium">Estudante novo?</p>
          <button 
            onClick={onSwitchToRegister}
            className="mt-2 text-indigo-600 font-bold hover:text-indigo-700 flex items-center justify-center gap-1 mx-auto group transition-all"
          >
            <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
            Criar minha conta agora
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center">
        Educação Médica Baseada em Evidências
      </p>
    </div>
  );
};

export default Login;
