
import { User, ClinicalCase, Session } from './types';
import { supabase } from './supabase';

export const DB = {
  // --- USUÁRIOS ---
  getUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.warn("Supabase: Erro ou chaves não configuradas.", error.message);
        return [];
      }
      return (data || []).map(u => ({ ...u, classGroup: u.class_group }));
    } catch (e) {
      console.error("DB: Erro fatal ao buscar usuários", e);
      return [];
    }
  },
  
  saveUser: async (user: Partial<User>) => {
    const { data, error } = await supabase.from('users').insert([{
      email: user.email,
      name: user.name,
      role: user.role,
      password: user.password,
      class_group: user.classGroup
    }]).select();
    if (error) throw error;
    return data[0];
  },

  deleteUser: async (id: string) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CASOS CLÍNICOS ---
  getCases: async (): Promise<ClinicalCase[]> => {
    try {
      const { data, error } = await supabase.from('clinical_cases').select('*').order('created_at', { ascending: false });
      if (error) {
        console.warn("Supabase: Erro ou chaves não configuradas ao buscar casos.");
        return [];
      }
      return (data || []).map(c => ({
        ...c,
        createdAt: new Date(c.created_at).getTime()
      }));
    } catch (e) {
      console.error("DB: Erro ao buscar casos", e);
      return [];
    }
  },

  saveCase: async (c: Partial<ClinicalCase>) => {
    const payload = {
      title: c.title,
      theme: c.theme,
      difficulty: c.difficulty,
      tags: c.tags,
      stages: c.stages
    };

    if (c.id && c.id.length > 20) {
      const { error } = await supabase.from('clinical_cases').update(payload).eq('id', c.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('clinical_cases').insert([payload]);
      if (error) throw error;
    }
  },

  deleteCase: async (id: string) => {
    const { error } = await supabase.from('clinical_cases').delete().eq('id', id);
    if (error) throw error;
  },

  // --- SESSÕES ---
  getSessions: async (): Promise<Session[]> => {
    try {
      const { data, error } = await supabase.from('sessions').select('*');
      if (error) return [];
      return (data || []).map(s => ({
        ...s,
        studentId: s.student_id,
        caseId: s.case_id,
        currentStageIndex: s.current_stage_index,
        totalScore: s.total_score,
        createdAt: new Date(s.created_at).getTime(),
        finishedAt: s.finished_at ? new Date(s.finished_at).getTime() : undefined
      }));
    } catch (e) {
      return [];
    }
  },
  
  saveSession: async (session: Session) => {
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
      const { error } = await supabase.from('sessions').update(payload).eq('id', session.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('sessions').insert([payload]);
      if (error) throw error;
    }
  },

  getUserSessions: async (userId: string): Promise<Session[]> => {
    if (!userId) return [];
    try {
      const { data, error } = await supabase.from('sessions')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map(s => ({
        ...s,
        studentId: s.student_id,
        caseId: s.case_id,
        currentStageIndex: s.current_stage_index,
        totalScore: s.total_score,
        createdAt: new Date(s.created_at).getTime(),
        finishedAt: s.finished_at ? new Date(s.finished_at).getTime() : undefined
      }));
    } catch (e) {
      return [];
    }
  }
};
