import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, Goal, PlanItem, PlanStatus, Settings, View } from '../types';

const MAX_CHAT_MESSAGES = 50;

const defaultSettings: Settings = {
  language: 'de',
  voiceOutput: false,
  apiKey: '',
  model: 'claude-sonnet-5',
};

interface AppState {
  goals: Goal[];
  plans: PlanItem[];
  chatHistory: ChatMessage[];
  settings: Settings;
  activeView: View;
  isThinking: boolean;

  addGoal: (text: string) => Goal;
  updateGoal: (id: string, patch: Partial<Pick<Goal, 'text' | 'achieved'>>) => void;
  deleteGoal: (id: string) => void;

  addPlan: (title: string, description?: string) => PlanItem;
  updatePlan: (id: string, patch: Partial<Pick<PlanItem, 'title' | 'description'>>) => void;
  updatePlanStatus: (id: string, status: PlanStatus) => boolean;
  deletePlan: (id: string) => void;

  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage;
  clearChat: () => void;

  setSettings: (patch: Partial<Settings>) => void;
  setActiveView: (view: View) => void;
  setThinking: (thinking: boolean) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      goals: [],
      plans: [],
      chatHistory: [],
      settings: defaultSettings,
      activeView: 'chat',
      isThinking: false,

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

      addPlan: (title, description) => {
        const plan: PlanItem = {
          id: crypto.randomUUID(),
          title: title.trim(),
          description: description?.trim() || undefined,
          status: 'planned',
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

      resetAll: () =>
        set({
          goals: [],
          plans: [],
          chatHistory: [],
          settings: defaultSettings,
        }),
    }),
    {
      name: 'skyte-ai-storage',
      version: 1,
      partialize: (s) => ({
        goals: s.goals,
        plans: s.plans,
        chatHistory: s.chatHistory,
        settings: s.settings,
      }),
      migrate: (persisted) => persisted as AppState,
    },
  ),
);
