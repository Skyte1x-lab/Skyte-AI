import type Anthropic from '@anthropic-ai/sdk';
import { useAppStore } from '../store/useAppStore';
import type { PlanStatus } from '../types';

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
        description: {
          type: 'string',
          description: 'Optional longer description.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_plan_status',
    description:
      "Change the status of an existing plan item. Use list_plans first to get the plan's id.",
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'The id of the plan item.' },
        status: {
          type: 'string',
          enum: ['planned', 'in_progress', 'done'],
          description: 'The new status.',
        },
      },
      required: ['id', 'status'],
    },
  },
  {
    name: 'list_plans',
    description:
      "Get all of the user's current plans and goals as JSON, including ids.",
    input_schema: { type: 'object', properties: {} },
  },
];

export function executeTool(name: string, input: unknown): string {
  const store = useAppStore.getState();
  const args = (input ?? {}) as Record<string, unknown>;

  switch (name) {
    case 'create_goal': {
      const text = String(args.text ?? '').trim();
      if (!text) return 'Error: goal text is empty.';
      const goal = store.addGoal(text);
      return JSON.stringify({ ok: true, goal });
    }
    case 'create_plan': {
      const title = String(args.title ?? '').trim();
      if (!title) return 'Error: plan title is empty.';
      const plan = store.addPlan(
        title,
        args.description ? String(args.description) : undefined,
      );
      return JSON.stringify({ ok: true, plan });
    }
    case 'update_plan_status': {
      const id = String(args.id ?? '');
      const status = String(args.status ?? '') as PlanStatus;
      if (!['planned', 'in_progress', 'done'].includes(status)) {
        return `Error: invalid status "${status}".`;
      }
      const found = store.updatePlanStatus(id, status);
      return found
        ? JSON.stringify({ ok: true, id, status })
        : `Error: no plan with id "${id}". Use list_plans to get valid ids.`;
    }
    case 'list_plans': {
      return JSON.stringify({ plans: store.plans, goals: store.goals });
    }
    default:
      return `Error: unknown tool "${name}".`;
  }
}
