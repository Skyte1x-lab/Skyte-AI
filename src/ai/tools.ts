import type Anthropic from '@anthropic-ai/sdk';
import { useAppStore } from '../store/useAppStore';
import type { PlanItem, PlanPriority, PlanStatus } from '../types';

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: 'create_goal',
    description: "Add a new goal to the user's dashboard.",
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The goal text.' },
      },
      required: ['text'],
    },
  },
  {
    name: 'create_plan',
    description:
      "Add a new plan item to the user's dashboard (starts with status 'planned').",
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short title of the plan.' },
        description: { type: 'string', description: 'Optional longer description.' },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Optional priority, defaults to medium.',
        },
        due_date: {
          type: 'string',
          description: 'Optional due date as an ISO 8601 date/datetime string.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_plan',
    description:
      "Change any subset of an existing plan item's status/priority/due date. Use get_overview first to get the plan's id.",
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The id of the plan item.' },
        status: { type: 'string', enum: ['planned', 'in_progress', 'done'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        due_date: { type: 'string', description: 'ISO 8601 date/datetime string.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_note',
    description: "Add a free-text note to the user's dashboard.",
    input_schema: {
      type: 'object',
      properties: { text: { type: 'string', description: 'The note text.' } },
      required: ['text'],
    },
  },
  {
    name: 'create_reminder',
    description: 'Create a time-based reminder for the user.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'What to remind the user of.' },
        due_at: {
          type: 'string',
          description: 'When to remind them, as an ISO 8601 datetime string.',
        },
      },
      required: ['text', 'due_at'],
    },
  },
  {
    name: 'start_timer',
    description: 'Start the focus/countdown timer for a number of minutes.',
    input_schema: {
      type: 'object',
      properties: {
        minutes: { type: 'number', description: 'Duration in minutes (1-180).' },
        label: { type: 'string', description: 'Optional label for the timer.' },
      },
      required: ['minutes'],
    },
  },
  {
    name: 'stop_timer',
    description: 'Stop the currently running focus/countdown timer, if any.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_overview',
    description:
      "Get all of the user's current plans, goals, notes, reminders and focus timer state as JSON, including ids. Call this before creating or updating anything you're not sure already exists.",
    input_schema: { type: 'object', properties: {} },
  },
];

export function executeTool(name: string, input: unknown): string {
  const store = useAppStore.getState();
  const args = (input ?? {}) as Record<string, unknown>;
  const lang = store.settings.language;

  switch (name) {
    case 'create_goal': {
      const text = String(args.text ?? '').trim();
      if (!text) return 'Error: goal text is empty.';
      const goal = store.addGoal(text);
      store.pushToast('🎯', lang === 'de' ? 'Ziel gespeichert' : 'Goal saved');
      return JSON.stringify({ ok: true, goal });
    }
    case 'create_plan': {
      const title = String(args.title ?? '').trim();
      if (!title) return 'Error: plan title is empty.';
      const opts: { priority?: PlanPriority; dueDate?: number } = {};
      if (args.priority) opts.priority = String(args.priority) as PlanPriority;
      if (args.due_date) {
        const ms = Date.parse(String(args.due_date));
        if (Number.isNaN(ms)) return `Error: invalid due_date "${args.due_date}".`;
        opts.dueDate = ms;
      }
      const plan = store.addPlan(
        title,
        args.description ? String(args.description) : undefined,
        opts,
      );
      store.pushToast('🗂️', lang === 'de' ? 'Plan gespeichert' : 'Plan saved');
      return JSON.stringify({ ok: true, plan });
    }
    case 'update_plan': {
      const id = String(args.id ?? '');
      const plan = store.plans.find((p) => p.id === id);
      if (!plan) return `Error: no plan with id "${id}". Use get_overview to find valid ids.`;

      if (args.status !== undefined) {
        const status = String(args.status) as PlanStatus;
        if (!['planned', 'in_progress', 'done'].includes(status)) {
          return `Error: invalid status "${status}".`;
        }
        store.updatePlanStatus(id, status);
      }

      const patch: Partial<Pick<PlanItem, 'priority' | 'dueDate'>> = {};
      if (args.priority !== undefined) patch.priority = String(args.priority) as PlanPriority;
      if (args.due_date !== undefined) {
        const ms = Date.parse(String(args.due_date));
        if (Number.isNaN(ms)) return `Error: invalid due_date "${args.due_date}".`;
        patch.dueDate = ms;
      }
      if (Object.keys(patch).length > 0) store.updatePlan(id, patch);

      if (args.status === 'done') {
        store.pushToast('✅', lang === 'de' ? 'Plan erledigt' : 'Plan completed');
      } else {
        store.pushToast('🔄', lang === 'de' ? 'Plan aktualisiert' : 'Plan updated');
      }
      return JSON.stringify({ ok: true, id });
    }
    case 'create_note': {
      const text = String(args.text ?? '').trim();
      if (!text) return 'Error: note text is empty.';
      const note = store.addNote(text);
      store.pushToast('📝', lang === 'de' ? 'Notiz gespeichert' : 'Note saved');
      return JSON.stringify({ ok: true, note });
    }
    case 'create_reminder': {
      const text = String(args.text ?? '').trim();
      if (!text) return 'Error: reminder text is empty.';
      const ms = Date.parse(String(args.due_at ?? ''));
      if (Number.isNaN(ms)) {
        return `Error: invalid due_at "${args.due_at}". Use ISO 8601, e.g. 2026-07-13T15:00:00.`;
      }
      const reminder = store.addReminder(text, ms);
      store.pushToast('⏰', lang === 'de' ? 'Erinnerung gespeichert' : 'Reminder saved');
      return JSON.stringify({ ok: true, reminder });
    }
    case 'start_timer': {
      const minutes = Number(args.minutes);
      if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 180) {
        return 'Error: minutes must be a number between 1 and 180.';
      }
      const label = args.label ? String(args.label) : undefined;
      store.startFocusTimer(Math.round(minutes * 60), label);
      store.pushToast('⏱️', lang === 'de' ? 'Timer gestartet' : 'Timer started');
      return JSON.stringify({ ok: true, minutes, label: label ?? null });
    }
    case 'stop_timer': {
      store.stopFocusTimer();
      store.pushToast('⏹️', lang === 'de' ? 'Timer gestoppt' : 'Timer stopped');
      return JSON.stringify({ ok: true });
    }
    case 'get_overview': {
      return JSON.stringify({
        plans: store.plans,
        goals: store.goals,
        notes: store.notes,
        reminders: store.reminders,
        focusTimer: store.focusTimer,
        now: Date.now(),
      });
    }
    default:
      return `Error: unknown tool "${name}".`;
  }
}
