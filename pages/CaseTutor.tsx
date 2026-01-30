
import React, { useState, useEffect, useRef } from 'react';
import { DB } from '../db';
import { Session, ClinicalCase, SessionStageRecord } from '../types';
import { getClinicalFeedback } from '../gemini';
import { Send, CheckCircle, AlertTriangle, Loader2, Sparkles, Trophy, RefreshCw } from 'lucide-react';

interface CaseTutorProps {
  sessionId: string;
  onFinish: () => void;
}

const CaseTutor: React.FC<CaseTutorProps> = ({ sessionId, onFinish }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const allSessions = await DB.getSessions();
      const s = allSessions.find(x => x.id === sessionId);
      if (s) {
        setSession(s);
        const allCases = await DB.getCases();
        const c = allCases.find(x => x.id === s.caseId);
        if (c) setCurrentCase(c);
      }
    };
    fetchData();
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.records, apiError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim() || !session || !currentCase || loading) return;

    setLoading(true);
    setApiError(null);
    
    try {
      const feedback = await getClinicalFeedback(currentCase, session.currentStageIndex, response);
      
      const newRecord: SessionStageRecord = {
        stageIndex: session.currentStageIndex,
        studentResponse: response,
        aiFeedback: feedback.feedback,
        score: feedback.score,
        timestamp: Date.now()
      };

      const isLastStage = session.currentStageIndex === currentCase.stages.length - 1;
      const updatedSession: Session = {
        ...session,
        currentStageIndex: isLastStage ? session.currentStageIndex : session.currentStageIndex + 1,
        totalScore: session.totalScore + feedback.score,
        records: [...session.records, newRecord],
        status: isLastStage ? 'finished' : 'active',
        finishedAt: isLastStage ? Date.now() : undefined
      };

      await DB.saveSession(updatedSession);
      setSession(updatedSession);
      setResponse('');
    } catch (err: any) {
      setApiError(err.message || "Ocorreu um erro com o Tutor de IA.");
    } finally {
      setLoading(false);
    }
  };

  if (!session || !currentCase) return (
    <div className="flex-grow flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  const currentStage = currentCase.stages[session.currentStageIndex];
  const progress = ((session.currentStageIndex) / currentCase.stages.length) * 100;

  return (
    <div className="flex-grow flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      <div className="max-w-4xl w-full mx-auto flex flex-col h-full bg-white shadow-xl relative">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-slate-800">
              {session.status === 'finished' ? currentCase.title : 'Discussão de Caso'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-bold">Etapa {session.currentStageIndex + 1}/{currentCase.stages.length}</span>
              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
          <button onClick={onFinish} className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">Encerrar</button>
        </div>

        <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-6 bg-slate-50/30">
          {session.records.map((record, i) => (
            <div key={i} className="space-y-4 animate-in fade-in duration-500">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 ml-8 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Sua Resposta</p>
                <p className="text-slate-700 leading-relaxed text-sm">{record.studentResponse}</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mr-8 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Feedback do Tutor</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-indigo-200 shadow-sm">
                    <Trophy size={12} className="text-amber-500" />
                    <span className="text-xs font-black text-slate-700">{record.score}/3</span>
                  </div>
                </div>
                <div className="text-slate-800 leading-relaxed prose prose-sm max-w-none">
                  {record.aiFeedback}
                </div>
              </div>
            </div>
          ))}

          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mr-8 animate-in slide-in-from-left-4">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertTriangle size={18} />
                <span className="font-bold">Erro</span>
              </div>
              <p className="text-sm text-red-600 mb-4">{apiError}</p>
              <button onClick={handleSubmit} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold"><RefreshCw size={14} /> Tentar novamente</button>
            </div>
          )}

          {session.status === 'active' && !apiError ? (
            <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-slate-800 mb-4">{currentStage.title}</h3>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                <p className="text-slate-700 leading-relaxed text-sm">{currentStage.content}</p>
              </div>
              <div className="flex items-start gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-50">
                <div className="bg-indigo-600 p-1.5 rounded-lg text-white mt-1 shrink-0 shadow-sm">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className="text-indigo-900 font-bold mb-1 text-sm">O que você faria agora?</p>
                  <p className="text-indigo-700 text-sm leading-relaxed italic">{currentStage.question}</p>
                </div>
              </div>
            </div>
          ) : session.status === 'finished' && (
            <div className="text-center py-12 bg-white rounded-3xl shadow-sm border border-slate-200">
              <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Discussão Finalizada!</h3>
              <div className="max-w-xs mx-auto bg-slate-50 rounded-2xl p-6 my-8 border border-slate-100 shadow-inner">
                <span className="text-xs text-slate-400 block mb-1 uppercase font-bold tracking-widest">Score Final</span>
                <span className="text-5xl font-black text-indigo-600 tracking-tight">{session.totalScore}</span>
                <span className="text-slate-400 font-bold"> / 15</span>
              </div>
              <button onClick={onFinish} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">Voltar ao Painel</button>
            </div>
          )}
        </div>

        {session.status === 'active' && !apiError && (
          <div className="p-4 border-t border-slate-100 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <textarea 
                rows={2}
                disabled={loading}
                className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all disabled:opacity-50 text-sm"
                placeholder="Descreva suas hipóteses e condutas aqui..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
              <button 
                type="submit"
                disabled={loading || !response.trim()}
                className="bg-indigo-600 text-white w-14 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseTutor;
