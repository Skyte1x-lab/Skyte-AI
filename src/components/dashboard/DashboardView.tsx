import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import AchievementsPanel from './AchievementsPanel';
import DailyQuote from './DailyQuote';
import FocusTimer from './FocusTimer';
import GoalsList from './GoalsList';
import NotesList from './NotesList';
import PlanBoard from './PlanBoard';
import RemindersList from './RemindersList';
import StatsOverview from './StatsOverview';
import TrendChart from './TrendChart';

export default function DashboardView() {
  const { t } = useTranslation();
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);

  return (
    <div className="dashboard-view">
      <DailyQuote />

      <input
        className="dashboard-search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('dashboard.searchPlaceholder')}
      />

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
        <section className="dashboard-card">
          <h2>📊 {t('dashboard.trendTitle')}</h2>
          <TrendChart />
        </section>
        <section className="dashboard-card">
          <h2>🏆 {t('dashboard.achievementsTitle')}</h2>
          <AchievementsPanel />
        </section>
      </div>

      <section className="dashboard-section">
        <h2>🗂️ {t('dashboard.plans')}</h2>
        <PlanBoard />
      </section>
    </div>
  );
}
