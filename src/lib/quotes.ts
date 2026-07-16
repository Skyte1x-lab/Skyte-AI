import type { Language } from '../types';

const QUOTES: Record<Language, string[]> = {
  de: [
    'Der Weg entsteht beim Gehen.',
    'Kleine Schritte, große Wirkung.',
    'Fokus schlägt Perfektion.',
    'Was gemessen wird, wird verbessert.',
    'Heute zählt mehr als "irgendwann".',
    'Disziplin ist die Brücke zwischen Zielen und Erfolg.',
    'Ein Ziel ohne Plan ist nur ein Wunsch.',
    'Erledige die wichtigste Aufgabe zuerst.',
    'Fortschritt, nicht Perfektion.',
    'Jeder Tag ist eine neue Chance.',
    'Konsequenz schlägt Motivation.',
    'Klein anfangen, groß werden.',
  ],
  en: [
    'The path is made by walking.',
    'Small steps, big impact.',
    'Focus beats perfection.',
    'What gets measured gets improved.',
    'Today matters more than "someday".',
    'Discipline is the bridge between goals and success.',
    'A goal without a plan is just a wish.',
    'Do the most important task first.',
    'Progress, not perfection.',
    'Every day is a fresh chance.',
    'Consistency beats motivation.',
    'Start small, grow big.',
  ],
};

/** Picks a stable quote for today's calendar date (same quote all day, changes daily). */
export function getQuoteOfTheDay(language: Language): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const list = QUOTES[language];
  return list[dayOfYear % list.length];
}
