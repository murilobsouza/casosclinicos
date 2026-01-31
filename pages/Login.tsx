
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { DB } from '../db';
import { validateApiKey } from '../gemini';
import { LogIn, UserPlus, Eye, EyeOff, Loader2, Sparkles, CheckCircle2, XCircle, RefreshCw, Key, AlertTriangle } from 'lucide-react';

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
  
  const [aiStatus, setAiStatus] = useState<'testing' | 'ok' | 'fail' | 'idle'>('idle');
  const [aiMessage, setAiMessage] = useState('');
  const [needsKeySelection, setNeedsKeySelection] = useState(false);

  useEffect(() => {
    checkIA();
  }, []);

  const checkIA = async () => {
    setAiStatus('testing');
    setNeedsKeySelection(false);
    
    const aistudio = (window as any).aistudio;
    const result = await validateApiKey();
    
    if (result.success) {
      setAiStatus('ok');
    } else {
      setAiStatus('fail');
      setAiMessage(result.message);
      // Se for inválida (400), forçamos a seleção manual
      if (result.code === 'INVALID' || result.code === 'MISSING') {
        setNeedsKeySelection(true);
      }
    }
  };

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      setAiStatus('testing');
      // Tenta validar novamente após a seleção
      setTimeout(() => checkIA(), 1500);
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
      {/* Alerta de Chave Inválida (Apenas se houver erro 400) */}
      {needsKeySelection && (
        <div className="mb-6 w-full max-w-md animate-in slide-in-from-top-4 duration-500">
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-5 shadow-xl shadow-red-100 flex flex-col items-center text-center gap-4">
            <div className="bg-red-100 p-3 rounded-full text-red-600">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="font-black text-red-800 text-lg uppercase tracking-tight">Chave Inválida Detectada</h3>
              <p className="text-red-600 text-sm mt-1 leading-relaxed">
                O erro 400 indica que sua chave não é válida. Clique abaixo para selecionar uma chave funcional de um projeto faturado.
              </p>
            </div>
            <button 
              onClick={handleSelectKey}
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg animate-pulse"
            >
              <Key size={18} /> SELECIONAR CHAVE VÁLIDA AGORA
            </button>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[10px] text-red-400 underline font-bold">
              Como configurar o faturamento no Google Cloud?
            </a>
          </div>
        </div>
      )}

      {/* Indicador de Status Discreto se estiver tudo OK ou testando */}
      {!needsKeySelection && (
        <div className="mb-6 animate-in fade-in duration-700 w-full max-w-md">
          <div className={`flex items-center justify-between gap-2 px-4 py-2 rounded-2xl border shadow-sm transition-all ${
            aiStatus === 'testing' ? 'bg-white text-slate-400 border-slate-200' :
            aiStatus === 'ok' ? 'bg-green-50 text-green-600 border-green-100' :
            'bg-red-50 text-red-600 border-red-100'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold">
              {aiStatus === 'testing' ? <Loader2 size={14} className="animate-spin" /> : 
               aiStatus === 'ok' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span>{aiStatus === 'testing' ? 'Validando IA...' : aiStatus === 'ok' ? 'Conexão IA Ativa' : 'IA Indisponível'}</span>
            </div>
            {aiStatus === 'fail' && (
              <button onClick={checkIA} className="text-red-400 hover:text-red-600">
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 opacity-20"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Tutor Oftalmo</h1>
          <p className="text-slate-500 mt-2">Educação Médica Inteligente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">E-mail</label>
            <input 
              type="email"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
              <XCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            {loading ? 'Aguarde...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button onClick={onSwitchToRegister} className="text-indigo-600 font-bold hover:text-indigo-700 flex items-center justify-center gap-1 mx-auto">
            <UserPlus size={18} /> Criar nova conta
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
