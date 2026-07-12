import { useAppStore } from '../store/useAppStore';
import {
  askClaude,
  ClaudeAuthError,
  ClaudeRateLimitError,
} from './claudeClient';
import { runDemoBrain, type DemoAction } from './demoBrain';

function applyDemoAction(action: DemoAction) {
  const store = useAppStore.getState();
  switch (action.type) {
    case 'addGoal':
      store.addGoal(action.text);
      break;
    case 'addPlan':
      store.addPlan(action.title);
      break;
    case 'completePlan':
      store.updatePlanStatus(action.planId, 'done');
      break;
  }
}

function demoReply(userText: string): string {
  const { settings, plans, goals } = useAppStore.getState();
  const result = runDemoBrain(userText, {
    language: settings.language,
    plans,
    goals,
  });
  if (result.action) applyDemoAction(result.action);
  return result.text;
}

/**
 * Single entry point for the chat: sends the user's text to the active brain
 * (Claude if an API key is set, demo brain otherwise) and appends the
 * assistant's reply to the chat history.
 */
export async function getAssistantReply(userText: string): Promise<void> {
  const store = useAppStore.getState();
  const { settings } = store;
  store.setThinking(true);

  try {
    if (settings.apiKey) {
      try {
        const history = useAppStore.getState().chatHistory;
        const text = await askClaude(
          settings.apiKey,
          settings.model,
          settings.language,
          history,
        );
        useAppStore.getState().addChatMessage({
          role: 'assistant',
          content: text || '…',
          source: 'claude',
        });
        return;
      } catch (err) {
        const lang = settings.language;
        let note: string;
        if (err instanceof ClaudeAuthError) {
          note =
            lang === 'de'
              ? '⚠️ Dein API-Key scheint ungültig zu sein — bitte prüfe ihn in den Einstellungen.'
              : '⚠️ Your API key seems to be invalid — please check it in the settings.';
        } else if (err instanceof ClaudeRateLimitError) {
          note =
            lang === 'de'
              ? '⚠️ Die Claude API ist gerade ausgelastet (Rate-Limit). Bitte warte einen Moment und versuch es erneut.'
              : '⚠️ The Claude API is rate-limited right now. Please wait a moment and try again.';
        } else {
          const demo = demoReply(userText);
          note =
            (lang === 'de'
              ? '⚠️ Die Claude API war nicht erreichbar — hier meine Demo-Antwort:\n\n'
              : '⚠️ The Claude API was unreachable — here is my demo answer:\n\n') +
            demo;
        }
        useAppStore.getState().addChatMessage({
          role: 'assistant',
          content: note,
          source: 'claude',
        });
        return;
      }
    }

    const text = demoReply(userText);
    useAppStore.getState().addChatMessage({
      role: 'assistant',
      content: text,
      source: 'demo',
    });
  } finally {
    useAppStore.getState().setThinking(false);
  }
}
