import { useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';

function toDayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface Badge {
  id: string;
  icon: string;
  labelDe: string;
  labelEn: string;
  unlocked: boolean;
}

export default function AchievementsPanel() {
  const { t, language } = useTranslation();
  const goals = useAppStore((s) => s.goals);
  const plans = useAppStore((s) => s.plans);

  const badges = useMemo<Badge[]>(() => {
    const goalsAchieved = goals.filter((g) => g.achieved).length;
    const plansDone = plans.filter((p) => p.status === 'done').length;

    const activeDays = new Set<string>();
    goals.forEach((g) => {
      if (g.achievedAt) activeDays.add(toDayKey(g.achievedAt));
    });
    plans.forEach((p) => {
      if (p.status === 'done') activeDays.add(toDayKey(p.updatedAt));
    });
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (activeDays.has(toDayKey(cursor.getTime()))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return [
      { id: 'goal1', icon: '🎯', labelDe: 'Erster Schritt', labelEn: 'First Step', unlocked: goalsAchieved >= 1 },
      { id: 'goal5', icon: '🏅', labelDe: 'Zielstrebig (5)', labelEn: 'Goal-Getter (5)', unlocked: goalsAchieved >= 5 },
      { id: 'goal10', icon: '🏆', labelDe: 'Zielsammler (10)', labelEn: 'Goal Collector (10)', unlocked: goalsAchieved >= 10 },
      { id: 'plan1', icon: '✅', labelDe: 'Erledigt!', labelEn: 'Done!', unlocked: plansDone >= 1 },
      { id: 'plan10', icon: '💪', labelDe: 'Produktiv (10)', labelEn: 'Productive (10)', unlocked: plansDone >= 10 },
      { id: 'plan25', icon: '👑', labelDe: 'Meister (25)', labelEn: 'Master (25)', unlocked: plansDone >= 25 },
      { id: 'streak3', icon: '🔥', labelDe: '3-Tage-Serie', labelEn: '3-Day Streak', unlocked: streak >= 3 },
      { id: 'streak7', icon: '🔥🔥', labelDe: 'Wochen-Serie', labelEn: 'Week Streak', unlocked: streak >= 7 },
    ];
  }, [goals, plans]);

  return (
    <div className="achievements-panel">
      <p className="achievements-hint">{t('dashboard.achievementsHint')}</p>
      <div className="badge-row">
        {badges.map((badge) => (
          <span
            key={badge.id}
            className={`badge-chip${badge.unlocked ? ' unlocked' : ' locked'}`}
            title={language === 'de' ? badge.labelDe : badge.labelEn}
          >
            <span className="badge-icon">{badge.icon}</span>
            {language === 'de' ? badge.labelDe : badge.labelEn}
          </span>
        ))}
      </div>
    </div>
  );
}
