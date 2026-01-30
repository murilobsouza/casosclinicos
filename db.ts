
import { User, ClinicalCase, Session, UserRole } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

// Chaves para o LocalStorage
const LS_KEYS = {
  USERS: 'tutoroftalmo_users',
  CASES: 'tutoroftalmo_cases',
  SESSIONS: 'tutoroftalmo_sessions'
};

// Dados Iniciais (Seed) para o modo Offline
const INITIAL_CASES: Partial<ClinicalCase>[] = [
  {
    id: 'case-glaucoma-agudo',
    title: 'Glaucoma Agudo de Ângulo Fechado',
    theme: 'Emergência / Glaucoma',
    difficulty: 'Difícil',
    tags: ['Emergência', 'Glaucoma'],
    stages: [
      { id: 0, title: 'Apresentação', content: 'M.S.A., 65 anos, feminina. Dor ocular intensa em OD há 4 horas, náuseas e halos coloridos após cinema.', question: 'Qual sua principal hipótese diagnóstica e conduta imediata?' },
      { id: 1, title: 'Exame Físico', content: 'Hipermetropia (+4.00). OD com hiperemia intensa e midríase média arreativa.', question: 'Quais manobras do exame físico são cruciais agora?' },
      { id: 2, title: 'Diagnóstico', content: 'Tonometria: OD 52 mmHg. Câmara anterior rasa.', question: 'Qual o diagnóstico provável?' },
      { id: 3, title: 'Tratamento', content: 'Necessário reduzir a PIO rapidamente.', question: 'Quais medicações administrar imediatamente?' },
      { id: 4, title: 'Prevenção', content: 'PIO controlada. Paciente precisa de tratamento definitivo.', question: 'Qual procedimento a laser indicado para evitar novas crises?' }
    ]
  }
];

// Funções auxiliares para LocalStorage
const ls = {
  get: <T>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]'),
  set: <T>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data))
};

export const DB = {
  // --- USUÁRIOS ---
  getUsers: async (): Promise<User[]> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error) return (data || []).map(u => ({ ...u, classGroup: u.class_group }));
      } catch (e) {}
    }
    return ls.get<User>(LS_KEYS.USERS);
  },
  
  saveUser: async (user: Partial<User>): Promise<User> => {
    const newUser = {
      ...user,
      id: user.id || Math.random().toString(36).substr(2, 9),
    } as User;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('users').insert([{
          email: user.email,
          name: user.name,
          role: user.role,
          password: user.password,
          class_group: user.classGroup
        }]).select();
        if (!error && data) return { ...data[0], classGroup: data[0].class_group };
      } catch (e) {}
    }

    // Fallback Local
    const users = ls.get<User>(LS_KEYS.USERS);
    users.push(newUser);
    ls.set(LS_KEYS.USERS, users);
    return newUser;
  },

  deleteUser: async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('users').delete().eq('id', id);
      } catch (e) {}
    }
    const users = ls.get<User>(LS_KEYS.USERS).filter(u => u.id !== id);
    ls.set(LS_KEYS.USERS, users);
  },

  // --- CASOS CLÍNICOS ---
  getCases: async (): Promise<ClinicalCase[]> => {
    let cases: ClinicalCase[] = [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('clinical_cases').select('*').order('created_at', { ascending: false });
        if (!error && data) cases = data.map(c => ({ ...c, createdAt: new Date(c.created_at).getTime() }));
      } catch (e) {}
    }
    
    if (cases.length === 0) {
      cases = ls.get<ClinicalCase>(LS_KEYS.CASES);
      // Seed inicial se estiver vazio
      if (cases.length === 0) {
        const seed = INITIAL_CASES.map(c => ({ ...c, id: c.id!, createdAt: Date.now() })) as ClinicalCase[];
        ls.set(LS_KEYS.CASES, seed);
        return seed;
      }
    }
    return cases;
  },

  saveCase: async (c: Partial<ClinicalCase>) => {
    if (isSupabaseConfigured) {
      try {
        const payload = { title: c.title, theme: c.theme, difficulty: c.difficulty, tags: c.tags, stages: c.stages };
        if (c.id && c.id.length > 20) {
          await supabase.from('clinical_cases').update(payload).eq('id', c.id);
        } else {
          await supabase.from('clinical_cases').insert([payload]);
        }
      } catch (e) {}
    }
    
    const cases = ls.get<ClinicalCase>(LS_KEYS.CASES);
    const index = cases.findIndex(x => x.id === c.id);
    if (index >= 0) {
      cases[index] = { ...cases[index], ...c };
    } else {
      cases.push({ ...c, id: c.id || Math.random().toString(36).substr(2, 9), createdAt: Date.now() } as ClinicalCase);
    }
    ls.set(LS_KEYS.CASES, cases);
  },

  deleteCase: async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('clinical_cases').delete().eq('id', id);
      } catch (e) {}
    }
    const cases = ls.get<ClinicalCase>(LS_KEYS.CASES).filter(c => c.id !== id);
    ls.set(LS_KEYS.CASES, cases);
  },

  // --- SESSÕES ---
  getSessions: async (): Promise<Session[]> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('sessions').select('*');
        if (!error && data) return data.map(s => ({
          ...s,
          studentId: s.student_id,
          caseId: s.case_id,
          currentStageIndex: s.current_stage_index,
          totalScore: s.total_score,
          createdAt: new Date(s.created_at).getTime(),
          finishedAt: s.finished_at ? new Date(s.finished_at).getTime() : undefined
        }));
      } catch (e) {}
    }
    return ls.get<Session>(LS_KEYS.SESSIONS);
  },
  
  saveSession: async (session: Session) => {
    if (isSupabaseConfigured) {
      try {
        const payload = {
          student_id: session.studentId,
          case_id: session.caseId,
          status: session.status,
          current_stage_index: session.currentStageIndex,
          total_score: session.totalScore,
          records: session.records,
          finished_at: session.finishedAt ? new Date(session.finishedAt).toISOString() : null
        };
        const isRealUUID = session.id.includes('-') && session.id.length > 30;
        if (isRealUUID) {
          await supabase.from('sessions').update(payload).eq('id', session.id);
        } else {
          await supabase.from('sessions').insert([payload]);
        }
      } catch (e) {}
    }

    const sessions = ls.get<Session>(LS_KEYS.SESSIONS);
    const index = sessions.findIndex(x => x.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    ls.set(LS_KEYS.SESSIONS, sessions);
  },

  getUserSessions: async (userId: string): Promise<Session[]> => {
    if (!userId) return [];
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('sessions').select('*').eq('student_id', userId).order('created_at', { ascending: false });
        if (!error && data) return data.map(s => ({
          ...s,
          studentId: s.student_id,
          caseId: s.case_id,
          currentStageIndex: s.current_stage_index,
          totalScore: s.total_score,
          createdAt: new Date(s.created_at).getTime(),
          finishedAt: s.finished_at ? new Date(s.finished_at).getTime() : undefined
        }));
      } catch (e) {}
    }
    return ls.get<Session>(LS_KEYS.SESSIONS).filter(s => s.studentId === userId);
  }
};
