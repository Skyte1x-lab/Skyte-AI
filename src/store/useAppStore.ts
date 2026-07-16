import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ChatMessage,
  FocusTimerState,
  Goal,
  LastDeleted,
  Note,
  PlanItem,
  PlanPriority,
  PlanStatus,
  Reminder,
  ReminderRecurrence,
  Settings,
  Subtask,
  ToastItem,
  View,
} from '../types';

const MAX_CHAT_MESSAGES = 50;
const UNDO_WINDOW_MS = 6000;

const defaultSettings: Settings = {
  language: 'de',
  voiceOutput: false,
  apiKey: '',
  model: 'claude-sonnet-5',
  theme: 'light',
  accentColor: undefined,
  notificationsEnabled: false,
};

const defaultFocusTimer: FocusTimerState = {
  targetEndAt: null,
  label: '',
  durationSeconds: 0,
};

function addDays(ms: number, days: number): number {
  const d = new Date(ms);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

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
  lastDeleted: LastDeleted | null;
  focusModeActive: boolean;
  searchQuery: string;

  addGoal: (text: string) => Goal;
  updateGoal: (
    id: string,
    patch: Partial<Pick<Goal, 'text' | 'achieved'>>,
  ) => void;
  archiveGoal: (id: string) => void;
  unarchiveGoal: (id: string) => void;
  deleteGoal: (id: string) => void;

  addPlan: (
    title: string,
    description?: string,
    opts?: { priority?: PlanPriority; dueDate?: number; tags?: string[] },
  ) => PlanItem;
  updatePlan: (
    id: string,
    patch: Partial<Pick<PlanItem, 'title' | 'description' | 'priority' | 'dueDate' | 'tags'>>,
  ) => void;
  updatePlanStatus: (id: string, status: PlanStatus) => boolean;
  archivePlan: (id: string) => void;
  unarchivePlan: (id: string) => void;
  deletePlan: (id: string) => void;
  addSubtask: (planId: string, text: string) => void;
  toggleSubtask: (planId: string, subtaskId: string) => void;
  deleteSubtask: (planId: string, subtaskId: string) => void;

  addNote: (text: string, tags?: string[]) => Note;
  updateNote: (id: string, patch: Partial<Pick<Note, 'text' | 'tags'>>) => void;
  deleteNote: (id: string) => void;

  addReminder: (text: string, dueAt: number, recurrence?: ReminderRecurrence) => Reminder;
  updateReminder: (
    id: string,
    patch: Partial<Pick<Reminder, 'text' | 'dueAt' | 'notified'>>,
  ) => void;
  setReminderDone: (id: string, done: boolean) => void;
  deleteReminder: (id: string) => void;

  undoDelete: () => void;

  startFocusTimer: (durationSeconds: number, label?: string) => void;
  stopFocusTimer: () => void;
  setFocusMode: (active: boolean) => void;

  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage;
  clearChat: () => void;

  setSettings: (patch: Partial<Settings>) => void;
  setActiveView: (view: View) => void;
  setThinking: (thinking: boolean) => void;
  setSearchQuery: (query: string) => void;
  pushToast: (
    icon: string,
    text: string,
    action?: { label: string; onAction: () => void },
  ) => void;
  dismissToast: (id: string) => void;

  exportData: () => string;
  importData: (json: string) => boolean;
  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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
      lastDeleted: null,
      focusModeActive: false,
      searchQuery: '',

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
          goals: s.goals.map((g) => {
            if (g.id !== id) return g;
            const next = { ...g, ...patch };
            if (patch.achieved === true && !g.achieved) next.achievedAt = Date.now();
            if (patch.achieved === false) next.achievedAt = undefined;
            return next;
          }),
        })),

      archiveGoal: (id) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, archived: true } : g)) })),
      unarchiveGoal: (id) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, archived: false } : g)) })),

      deleteGoal: (id) => {
        const goal = get().goals.find((g) => g.id === id);
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
        if (goal) {
          set({ lastDeleted: { entity: 'goal', item: goal } });
          get().pushToast('🗑️', 'Ziel gelöscht', {
            label: 'Rückgängig',
            onAction: () => get().undoDelete(),
          });
        }
      },

      addPlan: (title, description, opts) => {
        const plan: PlanItem = {
          id: crypto.randomUUID(),
          title: title.trim(),
          description: description?.trim() || undefined,
          status: 'planned',
          priority: opts?.priority ?? 'medium',
          dueDate: opts?.dueDate,
          tags: opts?.tags && opts.tags.length > 0 ? opts.tags : undefined,
          subtasks: [],
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

      archivePlan: (id) =>
        set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, archived: true } : p)) })),
      unarchivePlan: (id) =>
        set((s) => ({ plans: s.plans.map((p) => (p.id === id ? { ...p, archived: false } : p)) })),

      deletePlan: (id) => {
        const plan = get().plans.find((p) => p.id === id);
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }));
        if (plan) {
          set({ lastDeleted: { entity: 'plan', item: plan } });
          get().pushToast('🗑️', 'Plan gelöscht', {
            label: 'Rückgängig',
            onAction: () => get().undoDelete(),
          });
        }
      },

      addSubtask: (planId, text) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  subtasks: [...(p.subtasks ?? []), { id: crypto.randomUUID(), text: text.trim(), done: false }],
                  updatedAt: Date.now(),
                }
              : p,
          ),
        })),

      toggleSubtask: (planId, subtaskId) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  subtasks: (p.subtasks ?? []).map((st) =>
                    st.id === subtaskId ? { ...st, done: !st.done } : st,
                  ),
                  updatedAt: Date.now(),
                }
              : p,
          ),
        })),

      deleteSubtask: (planId, subtaskId) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === planId
              ? { ...p, subtasks: (p.subtasks ?? []).filter((st) => st.id !== subtaskId), updatedAt: Date.now() }
              : p,
          ),
        })),

      addNote: (text, tags) => {
        const note: Note = {
          id: crypto.randomUUID(),
          text: text.trim(),
          tags: tags && tags.length > 0 ? tags : undefined,
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

      deleteNote: (id) => {
        const note = get().notes.find((n) => n.id === id);
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
        if (note) {
          set({ lastDeleted: { entity: 'note', item: note } });
          get().pushToast('🗑️', 'Notiz gelöscht', {
            label: 'Rückgängig',
            onAction: () => get().undoDelete(),
          });
        }
      },

      addReminder: (text, dueAt, recurrence) => {
        const reminder: Reminder = {
          id: crypto.randomUUID(),
          text: text.trim(),
          dueAt,
          done: false,
          recurrence: recurrence && recurrence !== 'none' ? recurrence : undefined,
          createdAt: Date.now(),
        };
        set((s) => ({ reminders: [...s.reminders, reminder] }));
        return reminder;
      },

      updateReminder: (id, patch) =>
        set((s) => ({
          reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      setReminderDone: (id, done) => {
        set((s) => ({
          reminders: s.reminders.map((r) => (r.id === id ? { ...r, done } : r)),
        }));
        if (done) {
          const reminder = get().reminders.find((r) => r.id === id);
          if (reminder?.recurrence) {
            const nextDueAt = addDays(reminder.dueAt, reminder.recurrence === 'daily' ? 1 : 7);
            get().addReminder(reminder.text, nextDueAt, reminder.recurrence);
          }
        }
      },

      deleteReminder: (id) => {
        const reminder = get().reminders.find((r) => r.id === id);
        set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }));
        if (reminder) {
          set({ lastDeleted: { entity: 'reminder', item: reminder } });
          get().pushToast('🗑️', 'Erinnerung gelöscht', {
            label: 'Rückgängig',
            onAction: () => get().undoDelete(),
          });
        }
      },

      undoDelete: () => {
        const deleted = get().lastDeleted;
        if (!deleted) return;
        switch (deleted.entity) {
          case 'goal':
            set((s) => ({ goals: [...s.goals, deleted.item as Goal] }));
            break;
          case 'plan':
            set((s) => ({ plans: [...s.plans, deleted.item as PlanItem] }));
            break;
          case 'note':
            set((s) => ({ notes: [...s.notes, deleted.item as Note] }));
            break;
          case 'reminder':
            set((s) => ({ reminders: [...s.reminders, deleted.item as Reminder] }));
            break;
        }
        set({ lastDeleted: null });
      },

      startFocusTimer: (durationSeconds, label) =>
        set({
          focusTimer: {
            targetEndAt: Date.now() + durationSeconds * 1000,
            label: label?.trim() || '',
            durationSeconds,
          },
        }),

      stopFocusTimer: () => set({ focusTimer: { ...defaultFocusTimer } }),
      setFocusMode: (active) => set({ focusModeActive: active }),

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
      setSearchQuery: (query) => set({ searchQuery: query }),

      pushToast: (icon, text, action) => {
        const id = crypto.randomUUID();
        set((s) => ({
          toasts: [
            ...s.toasts,
            { id, icon, text, actionLabel: action?.label, onAction: action?.onAction },
          ],
        }));
        const timeout = action ? UNDO_WINDOW_MS : 3400;
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, timeout);
      },
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      exportData: () => {
        const s = get();
        return JSON.stringify(
          {
            version: 3,
            exportedAt: Date.now(),
            goals: s.goals,
            plans: s.plans,
            notes: s.notes,
            reminders: s.reminders,
            settings: s.settings,
          },
          null,
          2,
        );
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          if (!data || typeof data !== 'object') return false;
          set({
            goals: Array.isArray(data.goals) ? data.goals : [],
            plans: Array.isArray(data.plans) ? data.plans : [],
            notes: Array.isArray(data.notes) ? data.notes : [],
            reminders: Array.isArray(data.reminders) ? data.reminders : [],
            settings: data.settings ? { ...defaultSettings, ...data.settings } : get().settings,
          });
          return true;
        } catch {
          return false;
        }
      },

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
      version: 3,
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
        if (version < 3) {
          return {
            goals: s.goals ?? [],
            plans: ((s.plans ?? []) as Partial<PlanItem>[]).map((p) => ({
              ...p,
              priority: p.priority ?? 'medium',
              dueDate: p.dueDate,
              subtasks: p.subtasks ?? [],
            })) as PlanItem[],
            notes: s.notes ?? [],
            reminders: s.reminders ?? [],
            focusTimer: s.focusTimer ?? defaultFocusTimer,
            chatHistory: s.chatHistory ?? [],
            settings: {
              ...defaultSettings,
              ...s.settings,
              theme: s.settings?.theme ?? 'light',
              notificationsEnabled: s.settings?.notificationsEnabled ?? false,
            },
          } as AppState;
        }
        return s as AppState;
      },
    },
  ),
);

export type { Subtask };
