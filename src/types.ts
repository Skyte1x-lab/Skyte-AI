export type PlanStatus = 'planned' | 'in_progress' | 'done';
export type PlanPriority = 'low' | 'medium' | 'high';

export interface PlanItem {
  id: string;
  title: string;
  description?: string;
  status: PlanStatus;
  priority: PlanPriority;
  dueDate?: number; // epoch ms, Datumsgranularität (lokale Mitternacht)
  createdAt: number;
  updatedAt: number;
}

export interface Goal {
  id: string;
  text: string;
  achieved: boolean;
  createdAt: number;
}

export interface Note {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface Reminder {
  id: string;
  text: string;
  dueAt: number; // epoch ms inkl. Uhrzeit
  done: boolean;
  createdAt: number;
}

export interface FocusTimerState {
  targetEndAt: number | null;
  label: string;
  durationSeconds: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  via?: 'text' | 'voice';
  source?: 'demo' | 'claude';
}

export type Language = 'de' | 'en';

export type View = 'chat' | 'dashboard' | 'settings';

export type Theme = 'light' | 'dark';

export interface Settings {
  language: Language;
  voiceOutput: boolean;
  apiKey: string;
  model: string;
  theme: Theme;
}
