
import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { Session, User, ClinicalCase } from '../types';
import { PlayCircle, Clock, Award, ChevronRight, FileText, CheckCircle2, BookOpen, Loader2 } from 'lucide-react';

interface StudentDashboardProps {
  onStartCase: (sessionId: string) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onStartCase }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Safe user retrieval
  const getUser = (): User | null => {
    try {
      const saved = localStorage.getItem('tutoroftalmo_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };

  const user = getUser();

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [userSessions, allCases] = await Promise.all([
          DB.getUserSessions(user.id),
          DB.getCases()
        ]);
        setSessions(userSessions);
        setCases(allCases);
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const handleStartRandomCase = async () => {
    if (!user) return;
    if (cases.length === 0) {
      alert("Nenhum caso clínico disponível no banco de dados.");
      return;
    }

    const completedCaseIds = sessions.map(s => s.caseId);
    const availableCases = cases.filter(c => !completedCaseIds.includes(c.id));
    const targetCases = availableCases.length > 0 ? availableCases : cases;
    
    const randomCase = targetCases[Math.floor(Math.random() * targetCases.length)];
    
    const newSession: Session = {
      id: `temp-${Date.now()}`, 
      studentId: user.id,
      caseId: randomCase.id,
      status: 'active',
      currentStageIndex: 0,
      totalScore: 0,
      records: [],
      createdAt: Date.now()
    };

    try {
      await DB.saveSession(newSession);
      // Após salvar, recarregamos para pegar o UUID real ou usamos o ID temporário se o CaseTutor souber lidar
      const updatedSessions = await DB.getUserSessions(user.id);
      const latestSession = updatedSessions[0];
      if (latestSession) {
        onStartCase(latestSession.id);
      }
    } catch (err) {
      console.error("Erro ao criar sessão:", err);
      alert("Erro ao iniciar sessão. Verifique sua conexão.");
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
          <p className="text-slate-500">Buscando seus dados...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getCaseDisplayTitle = (session: Session) => {
    const c = cases.find(x => x.id === session.caseId);
    if (session.status === 'active') return `Em andamento: ${c?.title || 'Caso Clínico'}`;
    return c?.title || 'Caso Clínico';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-grow space-y-8">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-700 p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold">Olá, {user.name}!</h2>
              <p className="text-indigo-100 mt-2">Pronto para treinar seu raciocínio clínico hoje?</p>
            </div>
            <button 
              onClick={handleStartRandomCase}
              className="relative z-10 flex items-center gap-2 bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              <PlayCircle size={22} />
              Iniciar Caso Aleatório
            </button>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <BookOpen size={160} />
            </div>
          </header>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Seu Histórico</h3>
              <span className="text-sm text-slate-500 font-medium px-3 py-1 bg-slate-100 rounded-full">{sessions.length} casos realizados</span>
            </div>

            {sessions.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
                <div className="mx-auto w-12 h-12 text-slate-300 mb-4">
                  <Clock size={48} />
                </div>
                <p className="text-slate-500">Você ainda não completou nenhum caso clínico.</p>
                <button 
                  onClick={handleStartRandomCase}
                  className="mt-4 text-indigo-600 font-bold hover:underline"
                >
                  Começar meu primeiro caso →
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {sessions.map(session => (
                  <div key={session.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all hover:border-indigo-100">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${session.status === 'finished' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                        {session.status === 'finished' ? <CheckCircle2 size={24} /> : <FileText size={24} />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{getCaseDisplayTitle(session)}</h4>
                        <p className="text-xs text-slate-400 mt-1 font-medium">
                          {new Date(session.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-black tracking-widest">Pontuação</span>
                        <span className="text-lg font-black text-slate-800">{session.status === 'finished' ? `${session.totalScore}/15` : 'Ativa'}</span>
                      </div>
                      <button 
                        onClick={() => onStartCase(session.id)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shadow-sm bg-slate-50"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="w-full md:w-80 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
              <Award size={18} className="text-indigo-600" />
              Seu Desempenho
            </h4>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm font-medium">Média Global</span>
                <span className="font-black text-indigo-600 text-lg">
                  {sessions.length > 0 ? (sessions.reduce((acc, s) => acc + s.totalScore, 0) / sessions.length).toFixed(1) : '0.0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm font-medium">Casos Finalizados</span>
                <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                  {sessions.filter(s => s.status === 'finished').length}
                </span>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold text-center tracking-widest">Dica do Tutor</p>
                <p className="text-xs text-slate-600 text-center italic mt-2 leading-relaxed">"O exame de fundo de olho é essencial na suspeita de glaucoma."</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
