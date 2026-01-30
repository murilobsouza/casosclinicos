
import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { Session, ClinicalCase, User, UserRole } from '../types';
import { 
  Users, BookOpen, BarChart3, Search, LayoutDashboard, Settings, 
  Trash2, Key, AlertCircle, CheckSquare, Square, School, Target, Loader2,
  UserX
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface AdminDashboardProps {
  onManageCases: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onManageCases }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'students'>('stats');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [allSessions, allCases, allUsers] = await Promise.all([
        DB.getSessions(),
        DB.getCases(),
        DB.getUsers()
      ]);
      setSessions(allSessions);
      setCases(allCases);
      setUsers(allUsers);
      setSelectedStudents([]);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const studentsList = users.filter(u => u.role === UserRole.STUDENT && 
    (u.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
     u.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
     (u.classGroup || '').toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const handleDeleteIndividual = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o aluno ${name}? Todas as sessões dele também serão apagadas.`)) {
      setLoading(true);
      try {
        await DB.deleteUser(id);
        await refreshData();
      } catch (err) {
        alert("Erro ao excluir aluno.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedStudents.length === 0) return;
    if (window.confirm(`Deseja excluir definitivamente os ${selectedStudents.length} aluno(s) selecionado(s)?`)) {
      setLoading(true);
      try {
        await Promise.all(selectedStudents.map(id => DB.deleteUser(id)));
        await refreshData();
      } catch (err) {
        alert("Erro ao excluir.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("⚠️ AÇÃO CRÍTICA: Deseja apagar TODOS os alunos cadastrados no sistema? Esta ação não pode ser desfeita.")) {
      const confirmation = window.prompt("Para confirmar, digite 'EXCLUIR TODOS' abaixo:");
      if (confirmation === 'EXCLUIR TODOS') {
        setLoading(true);
        try {
          await DB.deleteAllStudents();
          await refreshData();
        } catch (err) {
          alert("Erro ao limpar base de alunos.");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === studentsList.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(studentsList.map(s => s.id));
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  const totalPoints = sessions.reduce((acc, s) => acc + s.totalScore, 0);
  const avgScore = sessions.length > 0 ? (totalPoints / sessions.length).toFixed(1) : '0.0';

  const performanceByCase = cases.map(c => {
    const sessionsForCase = sessions.filter(s => s.caseId === c.id);
    const avg = sessionsForCase.length > 0 
      ? sessionsForCase.reduce((acc, s) => acc + s.totalScore, 0) / sessionsForCase.length 
      : 0;
    return { name: c.title.substring(0, 15) + '...', media: parseFloat(avg.toFixed(1)) };
  });

  const groupedStudents: Record<string, User[]> = studentsList.reduce((acc, student) => {
    const group = student.classGroup || 'Sem Turma Definida';
    if (!acc[group]) acc[group] = [];
    acc[group].push(student);
    return acc;
  }, {} as Record<string, User[]>);

  const getStudentGrade = (studentId: string) => {
    const studentSessions = sessions.filter(s => s.studentId === studentId && s.status === 'finished');
    if (studentSessions.length === 0) return null;
    const avg = studentSessions.reduce((acc, s) => acc + s.totalScore, 0) / studentSessions.length;
    return (avg / 15) * 10;
  };

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-slate-300';
    if (grade >= 7) return 'text-green-600 bg-green-50 border-green-100';
    if (grade >= 5) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Painel de Gestão</h2>
          <p className="text-slate-500 text-sm">Monitore o desempenho e gerencie usuários.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
            onClick={onManageCases}
            className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <BookOpen size={18} />
            Gerenciar Casos
          </button>
          <button 
            onClick={refreshData}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 rounded-xl shadow-sm disabled:opacity-50"
          >
            <Loader2 className={loading ? "animate-spin" : ""} size={20} />
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button onClick={() => setActiveTab('stats')} className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'stats' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Estatísticas Gerais</button>
        <button onClick={() => setActiveTab('students')} className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'students' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Alunos ({users.filter(u => u.role === UserRole.STUDENT).length})</button>
      </div>

      {activeTab === 'stats' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Alunos Ativos</p><h3 className="text-3xl font-black text-slate-800">{users.filter(u => u.role === UserRole.STUDENT).length}</h3></div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Casos Disponíveis</p><h3 className="text-3xl font-black text-slate-800">{cases.length}</h3></div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Média Acerto</p><h3 className="text-3xl font-black text-indigo-600">{avgScore}</h3></div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Total Sessões</p><h3 className="text-3xl font-black text-slate-800">{sessions.length}</h3></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-80">
            <h4 className="text-sm font-bold text-slate-700 mb-4">Média de Pontuação por Caso</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceByCase}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 15]} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="media" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4 items-center bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 w-full max-w-md focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nome, e-mail ou turma..." 
                className="bg-transparent text-sm outline-none w-full text-slate-700" 
                value={studentSearch} 
                onChange={(e) => setStudentSearch(e.target.value)} 
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {selectedStudents.length > 0 ? (
                <button 
                  onClick={handleDeleteSelected} 
                  className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-md shadow-red-100 animate-in zoom-in-95"
                >
                  <Trash2 size={16} /> Excluir Selecionados ({selectedStudents.length})
                </button>
              ) : (
                <button 
                  onClick={handleDeleteAll}
                  className="w-full sm:w-auto text-slate-400 hover:text-red-600 px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                >
                  <UserX size={16} /> Limpar Base de Alunos
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-3 w-12">
                    <button 
                      onClick={toggleSelectAll} 
                      className={`transition-colors ${selectedStudents.length === studentsList.length && studentsList.length > 0 ? 'text-indigo-600' : 'text-slate-300'}`}
                      title="Selecionar Todos"
                    >
                      {selectedStudents.length === studentsList.length && studentsList.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Aluno</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Turma</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Nota (Média)</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Object.entries(groupedStudents) as [string, User[]][]).map(([groupName, groupStudents]) => (
                  <React.Fragment key={groupName}>
                    <tr className="bg-slate-50/30">
                      <td colSpan={6} className="px-6 py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest border-y border-slate-100">
                        <div className="flex items-center gap-2"><School size={12} /> {groupName}</div>
                      </td>
                    </tr>
                    {groupStudents.map(student => {
                      const grade = getStudentGrade(student.id);
                      const isSelected = selectedStudents.includes(student.id);
                      return (
                        <tr key={student.id} className={`hover:bg-indigo-50/30 transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => toggleStudentSelection(student.id)} 
                              className={`transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}
                            >
                              {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                            </button>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">{student.name}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{student.email}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{student.classGroup || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            {grade !== null ? (
                              <span className={`px-3 py-1 rounded-full border text-xs font-black shadow-sm ${getGradeColor(grade)}`}>
                                {grade.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic text-xs">Sem nota</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDeleteIndividual(student.id, student.name)}
                              className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Excluir Aluno"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
                {studentsList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      Nenhum aluno encontrado para os critérios de busca.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
