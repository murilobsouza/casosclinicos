
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { DB } from '../db';
import { UserPlus, ArrowLeft, KeyRound, AlertCircle, School, Loader2 } from 'lucide-react';

interface RegisterProps {
  onLogin: (user: User) => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.STUDENT,
    registrationCode: '',
    classGroup: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Códigos de inscrição configurados
    const studentCode = '2026';
    const adminCode = '2317';

    if (formData.role === UserRole.STUDENT && formData.registrationCode !== studentCode) {
      setError('Código de inscrição inválido para Aluno (Dica: 2026).');
      setLoading(false);
      return;
    }

    if (formData.role === UserRole.ADMIN && formData.registrationCode !== adminCode) {
      setError('Código de inscrição inválido para Professor.');
      setLoading(false);
      return;
    }

    if (formData.role === UserRole.STUDENT && !formData.classGroup.trim()) {
      setError('Por favor, informe a sua Turma.');
      setLoading(false);
      return;
    }

    try {
      const existing = await DB.getUsers();
      if (existing.find(u => u.email === formData.email)) {
        setError('Este e-mail já está cadastrado.');
        setLoading(false);
        return;
      }

      const newUser = await DB.saveUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        classGroup: formData.role === UserRole.STUDENT ? formData.classGroup : undefined
      });

      onLogin(newUser);
    } catch (err) {
      setError('Falha ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <button onClick={onSwitchToLogin} className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft size={16} /> Voltar para login
        </button>

        <h1 className="text-2xl font-bold text-slate-800 mb-6">Criar nova conta</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input 
              type="text"
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50"
              placeholder="Ex: Dr. João Silva"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail Institucional</label>
            <input 
              type="email"
              required
              disabled={loading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50"
              placeholder="aluno@universidade.edu"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input 
              type="password"
              required
              minLength={6}
              disabled={loading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Perfil</label>
            <select 
              disabled={loading}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer disabled:bg-slate-50"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
            >
              <option value={UserRole.STUDENT}>Aluno (Estudante de Medicina)</option>
              <option value={UserRole.ADMIN}>Professor / Administrador</option>
            </select>
          </div>

          {formData.role === UserRole.STUDENT && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <School size={14} className="text-slate-400" />
                Turma / Semestre
              </label>
              <input 
                type="text"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50"
                placeholder="Ex: Medicina 2024.1"
                value={formData.classGroup}
                onChange={(e) => setFormData({...formData, classGroup: e.target.value})}
              />
            </div>
          )}

          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <label className="block text-xs font-bold text-indigo-700 mb-2 uppercase flex items-center gap-1.5">
              <KeyRound size={12} />
              Código de Inscrição
            </label>
            <input 
              type="text"
              required
              disabled={loading}
              className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-center font-mono tracking-widest text-lg disabled:bg-slate-100"
              placeholder="••••"
              value={formData.registrationCode}
              onChange={(e) => setFormData({...formData, registrationCode: e.target.value})}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-indigo-100 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
            {loading ? 'Processando...' : 'Finalizar Cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
