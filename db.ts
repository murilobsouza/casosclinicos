
import { User, ClinicalCase, Session } from './types';
import { supabase } from './supabase';

export const DB = {
  // --- USUÁRIOS ---
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data.map(u => ({ ...u, classGroup: u.class_group }));
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
    const { data, error } = await supabase.from('clinical_cases').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(c => ({
      ...c,
      createdAt: new Date(c.created_at).getTime()
    }));
  },

  saveCase: async (c: Partial<ClinicalCase>) => {
    const payload = {
      title: c.title,
      theme: c.theme,
      difficulty: c.difficulty,
      tags: c.tags,
      stages: c.stages
    };

    if (c.id) {
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
    const { data, error } = await supabase.from('sessions').select('*');
    if (error) throw error;
    return data.map(s => ({
      ...s,
      studentId: s.student_id,
      caseId: s.case_id,
      currentStageIndex: s.current_stage_index,
      totalScore: s.total_score,
      createdAt: new Date(s.created_at).getTime(),
      finishedAt: s.finished_at ? new Date(s.finished_at).getTime() : undefined
    }));
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

    const { error } = await supabase.from('sessions').upsert({
      id: session.id.includes('.') ? undefined : session.id, // Handle UUID vs temporary IDs
      ...payload
    }, { onConflict: 'id' });
    
    if (error) {
      // If ID is not a UUID (temp ID from frontend), let Supabase generate one
      const { error: insertError } = await supabase.from('sessions').insert([payload]);
      if (insertError) throw insertError;
    }
  },

  getUserSessions: async (userId: string): Promise<Session[]> => {
    const { data, error } = await supabase.from('sessions')
      .select('*')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(s => ({
      ...s,
      studentId: s.student_id,
      caseId: s.case_id,
      currentStageIndex: s.current_stage_index,
      totalScore: s.total_score,
      createdAt: new Date(s.created_at).getTime(),
      finishedAt: s.finished_at ? new Date(s.finished_at).getTime() : undefined
    }));
  }
};
