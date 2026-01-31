
import React, { useState, useEffect } from 'react';
import { User, UserRole, AuthState } from './types.ts';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import StudentDashboard from './pages/StudentDashboard.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import CaseTutor from './pages/CaseTutor.tsx';
import CaseManagement from './pages/CaseManagement.tsx';
import { DB } from './db.ts';
import { LogOut, BookOpen, Loader2, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [view, setView] = useState<'home' | 'login' | 'register' | 'dashboard' | 'tutor' | 'cases'>('login');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        const savedUser = localStorage.getItem('tutoroftalmo_current_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setAuth({ user: parsedUser, isAuthenticated: true });
          setView('dashboard');
        } else {
          setView('login');
        }
      } catch (e) {
        console.error("Erro ao inicializar app:", e);
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, []);

  const handleLogin = (user: User) => {
    setAuth({ user, isAuthenticated: true });
    localStorage.setItem('tutoroftalmo_current_user', JSON.stringify(user));
    setView('dashboard');
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('tutoroftalmo_current_user');
    setView('login');
  };

  const startCase = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setView('tutor');
  };

  const finishCase = () => {
    setActiveSessionId(null);
    setView('dashboard');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
          <p className="text-slate-500 font-medium">Carregando Tutor Oftalmo...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!auth.isAuthenticated) {
      if (view === 'register') return <Register onLogin={handleLogin} onSwitchToLogin={() => setView('login')} />;
      return <Login onLogin={handleLogin} onSwitchToRegister={() => setView('register')} />;
    }

    switch (view) {
      case 'dashboard':
        return auth.user?.role === UserRole.ADMIN 
          ? <AdminDashboard onManageCases={() => setView('cases')} /> 
          : <StudentDashboard onStartCase={startCase} />;
      case 'tutor':
        return activeSessionId ? <CaseTutor sessionId={activeSessionId} onFinish={finishCase} /> : <div className="p-8 text-center">Nenhuma sessão ativa.</div>;
      case 'cases':
        return auth.user?.role === UserRole.ADMIN ? <CaseManagement onBack={() => setView('dashboard')} /> : <div>Acesso negado.</div>;
      default:
        return <StudentDashboard onStartCase={startCase} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => auth.isAuthenticated && setView('dashboard')}>
              <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm">
                <BookOpen size={20} />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">Tutor Oftalmo</span>
            </div>
            
            {auth.isAuthenticated && (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end text-sm">
                  <span className="font-bold text-slate-700">{auth.user?.name}</span>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{auth.user?.role === UserRole.ADMIN ? 'Professor' : 'Estudante'}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline font-semibold text-sm">Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col bg-slate-50">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-xs">
            © 2024 Tutor de Casos Clínicos – Oftalmologia.
          </p>
          <p className="text-amber-600 text-[10px] font-bold mt-2 uppercase tracking-widest">
            AVISO: Uso exclusivo educacional. Não substitui supervisão médica.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
