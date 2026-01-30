
import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { Session, ClinicalCase, User, UserRole } from '../types';
import { 
  Users, BookOpen, BarChart3, Search, LayoutDashboard, Settings, 
  Trash2, Key, AlertCircle, CheckSquare, Square, School, Target, Loader2
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

  const handleOpenKeyDialog = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    } catch (e) {}
  };

  const handleDeleteSelected = async () => {
    if (selectedStudents.length === 0) return;
    if (window.confirm(`Excluir ${selectedStudents.length} aluno(s)?`)) {
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

  const toggleStudentSelection = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
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

  const students = users.filter(u => u.role === UserRole.STUDENT && 
    (u.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
     u.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
     (u.classGroup || '').toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const groupedStudents: Record<string, User[]> = students.reduce((acc, student) => {
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
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-amber-600" size={24} />
          <p className="text-sm text-amber-800">Painel de Controle Multi-usuário (Supabase)</p>
        </div>
        <button onClick={handleOpenKeyDialog} className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
          <Key size={16} /> Configurar Chave API
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button onClick={() => setActiveTab('stats')} className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'stats' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Estatísticas</button>
        <button onClick={() => setActiveTab('students')} className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'students' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Alunos ({users.filter(u => u.role === UserRole.STUDENT).length})</button>
      </div>

      {activeTab === 'stats' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100"><p className="text-sm text-slate-500">Alunos</p><h3 className="text-2xl font-bold">{users.filter(u => u.role === UserRole.STUDENT).length}</h3></div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100"><p className="text-sm text-slate-500">Casos</p><h3 className="text-2xl font-bold">{cases.length}</h3></div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100"><p className="text-sm text-slate-500">Média</p><h3 className="text-2xl font-bold">{avgScore}</h3></div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100"><p className="text-sm text-slate-500">Sessões</p><h3 className="text-2xl font-bold">{sessions.length}</h3></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceByCase}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis domain={[0, 15]} />
                <Tooltip />
                <Bar dataKey="media" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-6 border-b flex justify-between gap-4 items-center">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border w-full max-w-md">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="Buscar aluno..." className="bg-transparent text-sm outline-none w-full" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
            </div>
            {selectedStudents.length > 0 && <button onClick={handleDeleteSelected} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Trash2 size={16} /> Excluir</button>}
          </div>
          <div className="overflow-x-auto">
            {(Object.entries(groupedStudents) as [string, User[]][]).map(([groupName, groupStudents]) => (
              <div key={groupName}>
                <div className="bg-slate-50 px-6 py-2 text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><School size={14} /> {groupName}</div>
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-100">
                    {groupStudents.map(student => {
                      const grade = getStudentGrade(student.id);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 w-12"><button onClick={() => toggleStudentSelection(student.id)} className={selectedStudents.includes(student.id) ? 'text-indigo-600' : 'text-slate-300'}>{selectedStudents.includes(student.id) ? <CheckSquare size={18} /> : <Square size={18} />}</button></td>
                          <td className="px-6 py-4 font-semibold">{student.name}</td>
                          <td className="px-6 py-4 text-slate-500">{student.email}</td>
                          <td className="px-6 py-4 text-center">{grade !== null ? <span className={`px-3 py-1 rounded-full border text-xs font-black ${getGradeColor(grade)}`}>{grade.toFixed(1)}</span> : <span className="text-slate-300 italic text-xs">Sem nota</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
