import { useMemo } from 'react';
import { useNowTick } from '../../hooks/useNowTick';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';

export default function StatsOverview() {
  const { t } = useTranslation();
  const goals = useAppStore((s) => s.goals);
  const plans = useAppStore((s) => s.plans);
  const notes = useAppStore((s) => s.notes);
  const reminders = useAppStore((s) => s.reminders);
  const focusTimer = useAppStore((s) => s.focusTimer);

  useNowTick(30000);

  const stats = useMemo(() => {
    const now = Date.now();
    const goalsAchieved = goals.filter((g) => g.achieved).length;
    const plansDone = plans.filter((p) => p.status === 'done').length;
    const remindersUpcoming = reminders.filter((r) => !r.done && r.dueAt >= now).length;
    const remindersOverdue = reminders.filter((r) => !r.done && r.dueAt < now).length;
    const timerRunning = focusTimer.targetEndAt !== null && focusTimer.targetEndAt > now;
    return {
      goalsAchieved,
      goalsTotal: goals.length,
      plansDone,
      plansTotal: plans.length,
      notesTotal: notes.length,
      remindersUpcoming,
      remindersOverdue,
      timerRunning,
    };
  }, [goals, plans, notes, reminders, focusTimer]);

  return (
    <section className="dashboard-section">
      <h2>🧠 {t('dashboard.stats.title')}</h2>
      <div className="stats-row">
        <div className="stat-tile">
          <span className="stat-tile-value">
            {stats.goalsAchieved}/{stats.goalsTotal}
          </span>
          <span className="stat-tile-label">🎯 {t('dashboard.stats.goals')}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-value">
            {stats.plansDone}/{stats.plansTotal}
          </span>
          <span className="stat-tile-label">🗂️ {t('dashboard.stats.plans')}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-value">{stats.notesTotal}</span>
          <span className="stat-tile-label">📝 {t('dashboard.stats.notes')}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-value">{stats.remindersUpcoming}</span>
          <span className="stat-tile-label">⏰ {t('dashboard.stats.remindersUpcoming')}</span>
        </div>
        <div className={`stat-tile${stats.remindersOverdue > 0 ? ' warn' : ''}`}>
          <span className="stat-tile-value">{stats.remindersOverdue}</span>
          <span className="stat-tile-label">⚠️ {t('dashboard.stats.remindersOverdue')}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-value">{stats.timerRunning ? '⏱️' : '—'}</span>
          <span className="stat-tile-label">
            {stats.timerRunning ? t('dashboard.stats.timerRunning') : t('dashboard.stats.timerIdle')}
          </span>
        </div>
      </div>
    </section>
  );
}
