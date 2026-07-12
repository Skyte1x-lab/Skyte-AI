import { useTranslation } from '../../i18n/useTranslation';
import GoalsList from './GoalsList';
import PlanBoard from './PlanBoard';

export default function DashboardView() {
  const { t } = useTranslation();

  return (
    <div className="dashboard-view">
      <section className="dashboard-section">
        <h2>🎯 {t('dashboard.goals')}</h2>
        <GoalsList />
      </section>
      <section className="dashboard-section">
        <h2>🗂️ {t('dashboard.plans')}</h2>
        <PlanBoard />
      </section>
    </div>
  );
}
