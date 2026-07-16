export type PlanStatus = 'planned' | 'in_progress' | 'done';
export type PlanPriority = 'low' | 'medium' | 'high';

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface PlanItem {
  id: string;
  title: string;
  description?: string;
  status: PlanStatus;
  priority: PlanPriority;
  dueDate?: number; // epoch ms, Datumsgranularität (lokale Mitternacht)
  tags?: string[];
  subtasks?: Subtask[];
  archived?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Goal {
  id: string;
  text: string;
  achieved: boolean;
  achievedAt?: number;
  archived?: boolean;
  createdAt: number;
}

export interface Note {
  id: string;
  text: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export type ReminderRecurrence = 'none' | 'daily' | 'weekly';

export interface Reminder {
  id: string;
  text: string;
  dueAt: number; // epoch ms inkl. Uhrzeit
  done: boolean;
  recurrence?: ReminderRecurrence;
  notified?: boolean;
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

export interface ToastItem {
  id: string;
  icon: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
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
  accentColor?: string; // hex, overrides the default terracotta accent
  notificationsEnabled: boolean;
}

export type DeletedEntity = 'goal' | 'plan' | 'note' | 'reminder';

export interface LastDeleted {
  entity: DeletedEntity;
  item: Goal | PlanItem | Note | Reminder;
}
