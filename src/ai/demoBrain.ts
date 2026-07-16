import type { Goal, Language, Note, PlanItem, PlanPriority, Reminder } from '../types';

export type DemoAction =
  | { type: 'addGoal'; text: string }
  | { type: 'addPlan'; title: string; priority?: PlanPriority; dueDate?: number }
  | { type: 'completePlan'; planId: string }
  | { type: 'addNote'; text: string }
  | { type: 'addReminder'; text: string; dueAt: number }
  | { type: 'startTimer'; minutes: number }
  | { type: 'stopTimer' };

export interface DemoContext {
  language: Language;
  plans: PlanItem[];
  goals: Goal[];
  notes: Note[];
  reminders: Reminder[];
  focusTimerRunning: boolean;
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
    createNote: /^(?:notiere(?: dir)?|merke dir)\s*:?\s+(.+)/i,
    createReminder:
      /erinnere mich(?: daran)?,?\s+an\s+(.+?)\s+(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|morgen|übermorgen)(?:\s+um\s+(\d{1,2})(?::(\d{2}))?)?\s*\.?$/i,
    startTimer: /^starte?\s+(?:einen\s+)?timer(?:\s+für)?\s+(\d{1,3})\s*(?:minuten|min)\.?$/i,
    stopTimer: /^stoppe?\s+den\s+timer\.?$/i,
    dailyBriefing: /tagesbriefing|was steht heute an|briefing/i,
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
    createNote: /^(?:note|remember that)\s*:?\s+(.+)/i,
    createReminder:
      /remind me to\s+(.+?)\s+(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|day after tomorrow)(?:\s+at\s+(\d{1,2})(?::(\d{2}))?)?\s*\.?$/i,
    startTimer: /^start\s+(?:a\s+)?timer\s+for\s+(\d{1,3})\s*(?:minutes|min)\.?$/i,
    stopTimer: /^stop\s+the\s+timer\.?$/i,
    dailyBriefing: /daily briefing|what'?s on (?:today|my plate today)|briefing/i,
    listPlans: /what(?:'s| is) (?:planned|on my list)|show (?:my )?plans/i,
    listGoals: /(?:my|what|show.*)\s*goals/i,
    greeting: /^(?:hello|hi|hey|good (?:morning|afternoon|evening))\b/i,
    identity: /who are you|what are you/i,
    timeDate: /what time|what day|what(?:'s| is) the date/i,
    help: /what can you do|^help/i,
  },
};

const PRIORITY_DE = /\b(hohe|mittlere|niedrige)\s+priorit(?:ä|ae)t\b/i;
const PRIORITY_EN = /\b(high|medium|low)\s+priority\b/i;
const DUE_DE =
  /\bbis\s+(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|morgen|übermorgen)\b/i;
const DUE_EN =
  /\bby\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|day after tomorrow)\b/i;

const WEEKDAYS_DE: Record<string, number> = {
  sonntag: 0,
  montag: 1,
  dienstag: 2,
  mittwoch: 3,
  donnerstag: 4,
  freitag: 5,
  samstag: 6,
};
const WEEKDAYS_EN: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Resolves a bounded set of DE/EN date keywords (weekday names, "morgen"/"tomorrow",
 * "übermorgen"/"day after tomorrow") to a Date at local midnight. Weekday names always
 * resolve to the *next* occurrence (today rolls to next week), never "today". */
function resolveDateKeyword(keyword: string, lang: Language): Date {
  const k = keyword.toLowerCase();
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (k === 'morgen' || k === 'tomorrow') {
    base.setDate(base.getDate() + 1);
    return base;
  }
  if (k === 'übermorgen' || k === 'day after tomorrow') {
    base.setDate(base.getDate() + 2);
    return base;
  }
  const map = lang === 'de' ? WEEKDAYS_DE : WEEKDAYS_EN;
  const target = map[k];
  if (target !== undefined) {
    let diff = (target - base.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    base.setDate(base.getDate() + diff);
  }
  return base;
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,.\s]+|[,.\s]+$/g, '')
    .trim();
}

/** Best-effort, keyword-based extraction of a trailing priority/due-date phrase out of a
 * plan title (e.g. "Zahnarzttermin, hohe priorität, bis montag"). Not a general NLP date
 * parser — a bounded, documented convenience for demo mode. */
function parsePlanExtras(
  rawTitle: string,
  lang: Language,
): { title: string; priority?: PlanPriority; dueDate?: number } {
  let title = rawTitle;
  let priority: PlanPriority | undefined;
  let dueDate: number | undefined;

  const priorityRe = lang === 'de' ? PRIORITY_DE : PRIORITY_EN;
  const dueRe = lang === 'de' ? DUE_DE : DUE_EN;

  const pm = title.match(priorityRe);
  if (pm) {
    const word = pm[1].toLowerCase();
    priority =
      lang === 'de'
        ? ({ hohe: 'high', mittlere: 'medium', niedrige: 'low' } as const)[word]
        : (word as PlanPriority);
    title = title.replace(priorityRe, '');
  }

  const dm = title.match(dueRe);
  if (dm) {
    dueDate = resolveDateKeyword(dm[1], lang).getTime();
    title = title.replace(dueRe, '');
  }

  return { title: cleanTitle(title), priority, dueDate };
}

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

function priorityIcon(priority: PlanPriority): string {
  return priority === 'high' ? '🔴' : priority === 'low' ? '🟢' : '🟡';
}

function planLine(p: PlanItem, lang: Language): string {
  let line = `• ${priorityIcon(p.priority)} ${p.title}`;
  if (p.dueDate) {
    const d = new Date(p.dueDate).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US');
    line += lang === 'de' ? ` (fällig ${d})` : ` (due ${d})`;
  }
  return line;
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
      for (const p of items) lines.push(planLine(p, lang));
    }
  }
  return lines.join('\n');
}

function isToday(ms: number): boolean {
  const d = new Date(ms);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatBriefing(ctx: DemoContext, lang: Language): string {
  const now = Date.now();
  const overduePlans = ctx.plans.filter(
    (p) => p.status !== 'done' && !p.archived && p.dueDate !== undefined && p.dueDate < now && !isToday(p.dueDate),
  );
  const todaysPlans = ctx.plans.filter(
    (p) => p.status !== 'done' && !p.archived && p.dueDate !== undefined && isToday(p.dueDate),
  );
  const overdueReminders = ctx.reminders.filter((r) => !r.done && r.dueAt < now && !isToday(r.dueAt));
  const todaysReminders = ctx.reminders.filter((r) => !r.done && isToday(r.dueAt));
  const openGoals = ctx.goals.filter((g) => !g.achieved && !g.archived);

  const nothing =
    overduePlans.length === 0 &&
    todaysPlans.length === 0 &&
    overdueReminders.length === 0 &&
    todaysReminders.length === 0;

  if (nothing) {
    return lang === 'de'
      ? '🌅 Für heute steht nichts Dringendes an. Guter Zeitpunkt, ein neues Ziel oder einen Plan anzulegen!'
      : "🌅 Nothing urgent for today. A good moment to add a new goal or plan!";
  }

  const lines: string[] = [lang === 'de' ? '🌅 Dein Tagesbriefing:' : "🌅 Your daily briefing:"];

  if (overduePlans.length > 0 || overdueReminders.length > 0) {
    lines.push(lang === 'de' ? '\n⚠️ Überfällig:' : '\n⚠️ Overdue:');
    overduePlans.forEach((p) => lines.push(planLine(p, lang)));
    overdueReminders.forEach((r) => lines.push(`• ${r.text}`));
  }
  if (todaysPlans.length > 0 || todaysReminders.length > 0) {
    lines.push(lang === 'de' ? '\n📌 Heute:' : '\n📌 Today:');
    todaysPlans.forEach((p) => lines.push(planLine(p, lang)));
    todaysReminders.forEach((r) => {
      const time = new Date(r.dueAt).toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      lines.push(`• ${time} — ${r.text}`);
    });
  }
  if (openGoals.length > 0) {
    lines.push(
      lang === 'de'
        ? `\n🎯 Offene Ziele: ${openGoals.length}`
        : `\n🎯 Open goals: ${openGoals.length}`,
    );
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
    'Das habe ich im Demo-Modus leider nicht verstanden. Ich kann Ziele, Pläne, Notizen, Erinnerungen und einen Fokus-Timer verwalten — sag „Hilfe" für Beispiele.',
    'Im Demo-Modus bin ich noch etwas einfach gestrickt. Mit einem Anthropic API-Key in den Einstellungen kann ich frei auf alles antworten!',
    'Hm, dazu fällt mir im Demo-Modus nichts ein. Sag „Hilfe" für eine Liste meiner Befehle — oder trag einen API-Key in den Einstellungen ein.',
  ],
  en: [
    'I did not quite catch that in demo mode. I can manage goals, plans, notes, reminders and a focus timer — say "help" for examples.',
    'In demo mode I am still fairly simple. Add an Anthropic API key in the settings and I can answer anything!',
    'Hmm, demo mode has no answer for that. Say "help" for a list of my commands — or add an API key in the settings.',
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
    const { title, priority, dueDate } = parsePlanExtras(
      m[1].trim().replace(/[.!]+$/, ''),
      lang,
    );
    const extras: string[] = [];
    if (priority) {
      extras.push(
        lang === 'de'
          ? `Priorität ${priority === 'high' ? 'hoch' : priority === 'low' ? 'niedrig' : 'mittel'}`
          : `${priority} priority`,
      );
    }
    if (dueDate) {
      const d = new Date(dueDate).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US');
      extras.push(lang === 'de' ? `fällig ${d}` : `due ${d}`);
    }
    const suffix = extras.length > 0 ? ` (${extras.join(', ')})` : '';
    return {
      text:
        lang === 'de'
          ? `Notiert! „${title}"${suffix} steht jetzt im Dashboard unter „Geplant".`
          : `Noted! "${title}"${suffix} is now in the dashboard under "Planned".`,
      action: { type: 'addPlan', title, priority, dueDate },
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

  m = text.match(r.createNote);
  if (m) {
    const note = m[1].trim().replace(/[.!]+$/, '');
    return {
      text:
        lang === 'de'
          ? `Notiert — ich habe es unter „Notizen" gespeichert. 📝`
          : `Noted — I saved it under "Notes". 📝`,
      action: { type: 'addNote', text: note },
    };
  }

  m = text.match(r.createReminder);
  if (m) {
    const reminderText = m[1].trim().replace(/[.!]+$/, '');
    const date = resolveDateKeyword(m[2], lang);
    const hour = m[3] ? parseInt(m[3], 10) : 9;
    const minute = m[4] ? parseInt(m[4], 10) : 0;
    date.setHours(hour, minute, 0, 0);
    const whenStr = date.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return {
      text:
        lang === 'de'
          ? `Erledigt — ich erinnere dich am ${whenStr} an „${reminderText}". ⏰`
          : `Done — I'll remind you on ${whenStr} about "${reminderText}". ⏰`,
      action: { type: 'addReminder', text: reminderText, dueAt: date.getTime() },
    };
  }

  m = text.match(r.startTimer);
  if (m) {
    const minutes = parseInt(m[1], 10);
    return {
      text:
        lang === 'de'
          ? `Timer über ${minutes} Minuten gestartet. Viel Erfolg! ⏱️`
          : `Timer started for ${minutes} minutes. Good luck! ⏱️`,
      action: { type: 'startTimer', minutes },
    };
  }

  if (r.stopTimer.test(text)) {
    return {
      text: ctx.focusTimerRunning
        ? lang === 'de'
          ? 'Timer gestoppt.'
          : 'Timer stopped.'
        : lang === 'de'
          ? 'Es läuft gerade kein Timer.'
          : 'No timer is currently running.',
      action: { type: 'stopTimer' },
    };
  }

  if (r.dailyBriefing.test(text)) return { text: formatBriefing(ctx, lang) };
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
          ? 'Ich bin Skyte AI — dein persönlicher Assistent, inspiriert von Jarvis. Ich verwalte deine Ziele, Pläne, Notizen, Erinnerungen und einen Fokus-Timer. Sag „Hilfe" für Beispiele.'
          : 'I am Skyte AI — your personal assistant, inspired by Jarvis. I manage your goals, plans, notes, reminders and a focus timer. Say "help" for examples.',
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
          ? 'Das kann ich (Demo-Modus):\n• „Mein Ziel ist …" — Ziel anlegen\n• „Plane …, hohe/mittlere/niedrige Priorität, bis Montag" — Plan anlegen\n• „… ist fertig" — Plan abschließen\n• „Notiere: …" — Notiz anlegen\n• „Erinnere mich an … morgen um 15:00" — Erinnerung anlegen\n• „Starte einen Timer für 25 Minuten" / „Stoppe den Timer" — Fokus-Timer\n• „Tagesbriefing" — Zusammenfassung für heute\n• „Was ist geplant?" / „Meine Ziele" — Übersicht anzeigen\n\nMit einem Anthropic API-Key (Einstellungen) antworte ich frei auf alles.'
          : 'What I can do (demo mode):\n• "My goal is …" — create a goal\n• "Plan …, high/medium/low priority, by tomorrow" — create a plan\n• "… is done" — complete a plan\n• "Note: …" — create a note\n• "Remind me to … tomorrow at 15:00" — create a reminder\n• "Start a timer for 25 minutes" / "Stop the timer" — focus timer\n• "Daily briefing" — a summary for today\n• "What is planned?" / "My goals" — show an overview\n\nWith an Anthropic API key (settings) I can answer anything.',
    };
  }

  const list = fallbacks[lang];
  const reply = list[fallbackIndex % list.length];
  fallbackIndex += 1;
  return { text: reply };
}
