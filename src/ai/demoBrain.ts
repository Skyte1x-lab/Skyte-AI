import type { Goal, Language, PlanItem } from '../types';

export type DemoAction =
  | { type: 'addGoal'; text: string }
  | { type: 'addPlan'; title: string }
  | { type: 'completePlan'; planId: string };

export interface DemoContext {
  language: Language;
  plans: PlanItem[];
  goals: Goal[];
}

export interface DemoResult {
  text: string;
  action?: DemoAction;
}

const R = {
  de: {
    createGoal: /(?:mein ziel ist(?: es)?,?|ich möchte|ich will)\s+(.+)/i,
    createPlan: /(?:^plane?\s*:?\s+|erstelle (?:einen plan|eine aufgabe)(?: für)?:?\s*)(.+)/i,
    completePlan: /(.+?)\s+ist\s+(?:fertig|erledigt|abgeschlossen)/i,
    listPlans: /was (?:ist|steht).*(?:geplant|an)|zeig.*(?:pläne|plan|aufgaben)/i,
    listGoals: /(?:meine|welche|zeig.*)\s*ziele/i,
    greeting: /^(?:hallo|hi|hey|servus|moin|guten (?:morgen|tag|abend))\b/i,
    identity: /wer bist du|was bist du/i,
    timeDate: /wie spät|wie viel uhr|welcher tag|welches datum|datum/i,
    help: /was kannst du|hilfe|^help/i,
  },
  en: {
    createGoal: /(?:my goal is(?: to)?|i want to|i would like to)\s+(.+)/i,
    createPlan: /(?:^plan\s*:?\s+|add (?:a )?(?:task|plan)(?: for)?:?\s*)(.+)/i,
    completePlan: /(?:mark\s+(.+?)\s+(?:as\s+)?done|(.+?)\s+is\s+(?:done|finished|complete))/i,
    listPlans: /what(?:'s| is) (?:planned|on my list)|show (?:my )?plans/i,
    listGoals: /(?:my|what|show.*)\s*goals/i,
    greeting: /^(?:hello|hi|hey|good (?:morning|afternoon|evening))\b/i,
    identity: /who are you|what are you/i,
    timeDate: /what time|what day|what(?:'s| is) the date/i,
    help: /what can you do|^help/i,
  },
};

function timeGreeting(lang: Language): string {
  const h = new Date().getHours();
  if (lang === 'de') {
    if (h < 11) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
  }
  if (h < 11) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatPlans(plans: PlanItem[], lang: Language): string {
  if (plans.length === 0) {
    return lang === 'de'
      ? 'Aktuell ist nichts geplant. Sag mir z. B. „Plane Einkaufen am Samstag" und ich lege es im Dashboard an.'
      : 'Nothing is planned right now. Tell me e.g. "Plan grocery shopping on Saturday" and I will add it to the dashboard.';
  }
  const labels =
    lang === 'de'
      ? { planned: 'Geplant', in_progress: 'In Arbeit', done: 'Fertig' }
      : { planned: 'Planned', in_progress: 'In progress', done: 'Done' };
  const lines: string[] = [
    lang === 'de' ? 'Hier ist dein aktueller Stand:' : 'Here is your current status:',
  ];
  for (const status of ['planned', 'in_progress', 'done'] as const) {
    const items = plans.filter((p) => p.status === status);
    if (items.length > 0) {
      lines.push(`\n${labels[status]}:`);
      for (const p of items) lines.push(`• ${p.title}`);
    }
  }
  return lines.join('\n');
}

function formatGoals(goals: Goal[], lang: Language): string {
  if (goals.length === 0) {
    return lang === 'de'
      ? 'Du hast noch keine Ziele festgelegt. Sag mir einfach: „Mein Ziel ist …"'
      : 'You have not set any goals yet. Just tell me: "My goal is …"';
  }
  const header = lang === 'de' ? 'Deine Ziele:' : 'Your goals:';
  return [
    header,
    ...goals.map((g) => `${g.achieved ? '✅' : '🎯'} ${g.text}`),
  ].join('\n');
}

const fallbacks = {
  de: [
    'Das habe ich im Demo-Modus leider nicht verstanden. Ich kann Ziele und Pläne verwalten — versuch z. B. „Mein Ziel ist …" oder „Plane …".',
    'Im Demo-Modus bin ich noch etwas einfach gestrickt. Mit einem Anthropic API-Key in den Einstellungen kann ich frei auf alles antworten!',
    'Hm, dazu fällt mir im Demo-Modus nichts ein. Frag mich nach deinen Plänen oder Zielen — oder trag einen API-Key in den Einstellungen ein.',
  ],
  en: [
    'I did not quite catch that in demo mode. I can manage goals and plans — try "My goal is …" or "Plan …".',
    'In demo mode I am still fairly simple. Add an Anthropic API key in the settings and I can answer anything!',
    'Hmm, demo mode has no answer for that. Ask me about your plans or goals — or add an API key in the settings.',
  ],
};

let fallbackIndex = 0;

export function runDemoBrain(input: string, ctx: DemoContext): DemoResult {
  const lang = ctx.language;
  const r = R[lang];
  const text = input.trim();

  let m = text.match(r.createGoal);
  if (m) {
    const goal = m[1].trim().replace(/[.!]+$/, '');
    return {
      text:
        lang === 'de'
          ? `Alles klar — ich habe „${goal}" zu deinen Zielen hinzugefügt. Du findest es im Dashboard. 🎯`
          : `Got it — I added "${goal}" to your goals. You can see it in the dashboard. 🎯`,
      action: { type: 'addGoal', text: goal },
    };
  }

  m = text.match(r.createPlan);
  if (m) {
    const title = m[1].trim().replace(/[.!]+$/, '');
    return {
      text:
        lang === 'de'
          ? `Notiert! „${title}" steht jetzt im Dashboard unter „Geplant".`
          : `Noted! "${title}" is now in the dashboard under "Planned".`,
      action: { type: 'addPlan', title },
    };
  }

  m = text.match(r.completePlan);
  if (m) {
    const needle = (m[1] ?? m[2] ?? '').trim().toLowerCase();
    const plan = ctx.plans.find(
      (p) =>
        p.status !== 'done' &&
        (p.title.toLowerCase().includes(needle) ||
          needle.includes(p.title.toLowerCase())),
    );
    if (plan) {
      return {
        text:
          lang === 'de'
            ? `Stark! Ich habe „${plan.title}" auf „Fertig" gesetzt. ✅`
            : `Nice! I marked "${plan.title}" as done. ✅`,
        action: { type: 'completePlan', planId: plan.id },
      };
    }
    return {
      text:
        lang === 'de'
          ? `Ich habe keinen offenen Plan gefunden, der zu „${needle}" passt. Schau im Dashboard nach dem genauen Titel.`
          : `I could not find an open plan matching "${needle}". Check the dashboard for the exact title.`,
    };
  }

  if (r.listPlans.test(text)) return { text: formatPlans(ctx.plans, lang) };
  if (r.listGoals.test(text)) return { text: formatGoals(ctx.goals, lang) };

  if (r.greeting.test(text)) {
    return {
      text:
        lang === 'de'
          ? `${timeGreeting(lang)}! Ich bin Skyte AI, dein persönlicher Assistent. Wie kann ich helfen?`
          : `${timeGreeting(lang)}! I am Skyte AI, your personal assistant. How can I help?`,
    };
  }

  if (r.identity.test(text)) {
    return {
      text:
        lang === 'de'
          ? 'Ich bin Skyte AI — dein persönlicher Assistent, inspiriert von Jarvis. Ich verwalte deine Ziele und Pläne, höre dir zu und antworte per Sprache. Sag z. B. „Mein Ziel ist …" oder „Plane …".'
          : 'I am Skyte AI — your personal assistant, inspired by Jarvis. I manage your goals and plans, listen to you and reply by voice. Try "My goal is …" or "Plan …".',
    };
  }

  if (r.timeDate.test(text)) {
    const now = new Date().toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
    return {
      text: lang === 'de' ? `Es ist gerade: ${now}` : `It is currently: ${now}`,
    };
  }

  if (r.help.test(text)) {
    return {
      text:
        lang === 'de'
          ? 'Das kann ich (Demo-Modus):\n• „Mein Ziel ist …" — Ziel anlegen\n• „Plane …" — Plan anlegen\n• „… ist fertig" — Plan abschließen\n• „Was ist geplant?" — Pläne anzeigen\n• „Meine Ziele" — Ziele anzeigen\n\nMit einem Anthropic API-Key (Einstellungen) antworte ich frei auf alles.'
          : 'What I can do (demo mode):\n• "My goal is …" — create a goal\n• "Plan …" — create a plan\n• "… is done" — complete a plan\n• "What is planned?" — show plans\n• "My goals" — show goals\n\nWith an Anthropic API key (settings) I can answer anything.',
    };
  }

  const list = fallbacks[lang];
  const reply = list[fallbackIndex % list.length];
  fallbackIndex += 1;
  return { text: reply };
}
