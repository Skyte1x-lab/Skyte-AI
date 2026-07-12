export type PlanStatus = 'planned' | 'in_progress' | 'done';

export interface PlanItem {
  id: string;
  title: string;
  description?: string;
  status: PlanStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Goal {
  id: string;
  text: string;
  achieved: boolean;
  createdAt: number;
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

export interface Settings {
  language: Language;
  voiceOutput: boolean;
  apiKey: string;
  model: string;
}
