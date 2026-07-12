import { useState, type FormEvent } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import type { PlanPriority, PlanStatus } from '../../types';
import PlanCard from './PlanCard';

const columns: { status: PlanStatus; key: 'dashboard.colPlanned' | 'dashboard.colInProgress' | 'dashboard.colDone' }[] = [
  { status: 'planned', key: 'dashboard.colPlanned' },
  { status: 'in_progress', key: 'dashboard.colInProgress' },
  { status: 'done', key: 'dashboard.colDone' },
];

export default function PlanBoard() {
  const { t } = useTranslation();
  const plans = useAppStore((s) => s.plans);
  const addPlan = useAppStore((s) => s.addPlan);
  const [newPlan, setNewPlan] = useState('');
  const [newPriority, setNewPriority] = useState<PlanPriority>('medium');
  const [newDueDate, setNewDueDate] = useState('');

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newPlan.trim()) return;
    addPlan(newPlan, undefined, {
      priority: newPriority,
      dueDate: newDueDate ? new Date(`${newDueDate}T00:00:00`).getTime() : undefined,
    });
    setNewPlan('');
    setNewPriority('medium');
    setNewDueDate('');
  };

  return (
    <>
      <form className="add-form" onSubmit={handleAdd}>
        <input
          value={newPlan}
          onChange={(e) => setNewPlan(e.target.value)}
          placeholder={t('dashboard.planPlaceholder')}
        />
        <div className="plan-form-row">
          <select
            className="settings-select"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as PlanPriority)}
          >
            <option value="low">{t('dashboard.priorityLow')}</option>
            <option value="medium">{t('dashboard.priorityMedium')}</option>
            <option value="high">{t('dashboard.priorityHigh')}</option>
          </select>
          <input
            type="date"
            className="settings-input"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
        </div>
        <button type="submit">{t('dashboard.addPlan')}</button>
      </form>

      <div className="plan-board">
        {columns.map(({ status, key }) => {
          const items = plans.filter((p) => p.status === status);
          return (
            <div key={status} className={`plan-column${status === 'done' ? ' done' : ''}`}>
              <h3>
                {t(key)}
                <span className="column-count">{items.length}</span>
              </h3>
              <div className="plan-cards">
                {items.length === 0 ? (
                  <p className="empty-hint">{t('dashboard.noPlans')}</p>
                ) : (
                  items.map((plan) => <PlanCard key={plan.id} plan={plan} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
