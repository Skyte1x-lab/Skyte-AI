import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ChatMessage,
  FocusTimerState,
  Goal,
  Note,
  PlanItem,
  PlanPriority,
  PlanStatus,
  Reminder,
  Settings,
  ToastItem,
  View,
} from '../types';

const MAX_CHAT_MESSAGES = 50;

const defaultSettings: Settings = {
  language: 'de',
  voiceOutput: false,
  apiKey: '',
  model: 'claude-sonnet-5',
  theme: 'light',
};

const defaultFocusTimer: FocusTimerState = {
  targetEndAt: null,
  label: '',
  durationSeconds: 0,
};

interface AppState {
  goals: Goal[];
  plans: PlanItem[];
  notes: Note[];
  reminders: Reminder[];
  focusTimer: FocusTimerState;
  chatHistory: ChatMessage[];
  settings: Settings;
  activeView: View;
  isThinking: boolean;
  toasts: ToastItem[];

  addGoal: (text: string) => Goal;
  updateGoal: (id: string, patch: Partial<Pick<Goal, 'text' | 'achieved'>>) => void;
  deleteGoal: (id: string) => void;

  addPlan: (
    title: string,
    description?: string,
    opts?: { priority?: PlanPriority; dueDate?: number },
  ) => PlanItem;
  updatePlan: (
    id: string,
    patch: Partial<Pick<PlanItem, 'title' | 'description' | 'priority' | 'dueDate'>>,
  ) => void;
  updatePlanStatus: (id: string, status: PlanStatus) => boolean;
  deletePlan: (id: string) => void;

  addNote: (text: string) => Note;
  updateNote: (id: string, patch: Partial<Pick<Note, 'text'>>) => void;
  deleteNote: (id: string) => void;

  addReminder: (text: string, dueAt: number) => Reminder;
  updateReminder: (id: string, patch: Partial<Pick<Reminder, 'text' | 'dueAt'>>) => void;
  setReminderDone: (id: string, done: boolean) => void;
  deleteReminder: (id: string) => void;

  startFocusTimer: (durationSeconds: number, label?: string) => void;
  stopFocusTimer: () => void;

  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage;
  clearChat: () => void;

  setSettings: (patch: Partial<Settings>) => void;
  setActiveView: (view: View) => void;
  setThinking: (thinking: boolean) => void;
  pushToast: (icon: string, text: string) => void;
  dismissToast: (id: string) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      goals: [],
      plans: [],
      notes: [],
      reminders: [],
      focusTimer: defaultFocusTimer,
      chatHistory: [],
      settings: defaultSettings,
      activeView: 'chat',
      isThinking: false,
      toasts: [],

      addGoal: (text) => {
        const goal: Goal = {
          id: crypto.randomUUID(),
          text: text.trim(),
          achieved: false,
          createdAt: Date.now(),
        };
        set((s) => ({ goals: [...s.goals, goal] }));
        return goal;
      },

      updateGoal: (id, patch) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),

      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      addPlan: (title, description, opts) => {
        const plan: PlanItem = {
          id: crypto.randomUUID(),
          title: title.trim(),
          description: description?.trim() || undefined,
          status: 'planned',
          priority: opts?.priority ?? 'medium',
          dueDate: opts?.dueDate,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ plans: [...s.plans, plan] }));
        return plan;
      },

      updatePlan: (id, patch) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
          ),
        })),

      updatePlanStatus: (id, status) => {
        let found = false;
        set((s) => ({
          plans: s.plans.map((p) => {
            if (p.id !== id) return p;
            found = true;
            return { ...p, status, updatedAt: Date.now() };
          }),
        }));
        return found;
      },

      deletePlan: (id) =>
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),

      addNote: (text) => {
        const note: Note = {
          id: crypto.randomUUID(),
          text: text.trim(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ notes: [...s.notes, note] }));
        return note;
      },

      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
          ),
        })),

      deleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      addReminder: (text, dueAt) => {
        const reminder: Reminder = {
          id: crypto.randomUUID(),
          text: text.trim(),
          dueAt,
          done: false,
          createdAt: Date.now(),
        };
        set((s) => ({ reminders: [...s.reminders, reminder] }));
        return reminder;
      },

      updateReminder: (id, patch) =>
        set((s) => ({
          reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      setReminderDone: (id, done) =>
        set((s) => ({
          reminders: s.reminders.map((r) => (r.id === id ? { ...r, done } : r)),
        })),

      deleteReminder: (id) =>
        set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),

      startFocusTimer: (durationSeconds, label) =>
        set({
          focusTimer: {
            targetEndAt: Date.now() + durationSeconds * 1000,
            label: label?.trim() || '',
            durationSeconds,
          },
        }),

      stopFocusTimer: () => set({ focusTimer: { ...defaultFocusTimer } }),

      addChatMessage: (msg) => {
        const message: ChatMessage = {
          ...msg,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        set((s) => ({
          chatHistory: [...s.chatHistory, message].slice(-MAX_CHAT_MESSAGES),
        }));
        return message;
      },

      clearChat: () => set({ chatHistory: [] }),

      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setActiveView: (view) => set({ activeView: view }),
      setThinking: (thinking) => set({ isThinking: thinking }),

      pushToast: (icon, text) => {
        const id = crypto.randomUUID();
        set((s) => ({ toasts: [...s.toasts, { id, icon, text }] }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 3400);
      },
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      resetAll: () =>
        set({
          goals: [],
          plans: [],
          notes: [],
          reminders: [],
          focusTimer: defaultFocusTimer,
          chatHistory: [],
          settings: defaultSettings,
        }),
    }),
    {
      name: 'skyte-ai-storage',
      version: 2,
      partialize: (s) => ({
        goals: s.goals,
        plans: s.plans,
        notes: s.notes,
        reminders: s.reminders,
        focusTimer: s.focusTimer,
        chatHistory: s.chatHistory,
        settings: s.settings,
      }),
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<AppState> & { settings?: Partial<Settings> };
        if (version < 2) {
          return {
            goals: s.goals ?? [],
            plans: (s.plans ?? []).map((p) => ({
              ...p,
              priority: (p as Partial<PlanItem>).priority ?? 'medium',
              dueDate: (p as Partial<PlanItem>).dueDate,
            })) as PlanItem[],
            notes: s.notes ?? [],
            reminders: s.reminders ?? [],
            focusTimer: s.focusTimer ?? defaultFocusTimer,
            chatHistory: s.chatHistory ?? [],
            settings: {
              ...defaultSettings,
              ...s.settings,
              theme: s.settings?.theme ?? 'light',
            },
          } as AppState;
        }
        return s as AppState;
      },
    },
  ),
);
