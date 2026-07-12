import { useTranslation } from '../../i18n/useTranslation';
import FocusTimer from './FocusTimer';
import GoalsList from './GoalsList';
import NotesList from './NotesList';
import PlanBoard from './PlanBoard';
import RemindersList from './RemindersList';
import StatsOverview from './StatsOverview';

export default function DashboardView() {
  const { t } = useTranslation();

  return (
    <div className="dashboard-view">
      <StatsOverview />

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <h2>🎯 {t('dashboard.goals')}</h2>
          <GoalsList />
        </section>
        <section className="dashboard-card">
          <h2>📝 {t('dashboard.notes.title')}</h2>
          <NotesList />
        </section>
        <section className="dashboard-card">
          <h2>⏰ {t('dashboard.reminders.title')}</h2>
          <RemindersList />
        </section>
        <section className="dashboard-card">
          <h2>⏱️ {t('dashboard.timer.title')}</h2>
          <FocusTimer />
        </section>
      </div>

      <section className="dashboard-section">
        <h2>🗂️ {t('dashboard.plans')}</h2>
        <PlanBoard />
      </section>
    </div>
  );
}
