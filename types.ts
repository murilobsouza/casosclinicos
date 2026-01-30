
export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  classGroup?: string; // Novo campo para identificar a Turma
}

export interface CaseStage {
  id: number;
  title: string;
  content: string;
  question: string;
}

export interface ClinicalCase {
  id: string;
  title: string;
  theme: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  tags: string[];
  stages: CaseStage[];
  createdAt: number;
}

export interface SessionStageRecord {
  stageIndex: number;
  studentResponse: string;
  aiFeedback: string;
  score: number;
  timestamp: number;
}

export interface Session {
  id: string;
  studentId: string;
  caseId: string;
  status: 'active' | 'finished';
  currentStageIndex: number;
  totalScore: number;
  records: SessionStageRecord[];
  createdAt: number;
  finishedAt?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
