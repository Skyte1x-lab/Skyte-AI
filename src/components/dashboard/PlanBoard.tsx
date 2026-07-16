import { useMemo, useState, type FormEvent } from 'react';
import { matchesSearch } from '../../lib/search';
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
  const searchQuery = useAppStore((s) => s.searchQuery);
  const addPlan = useAppStore((s) => s.addPlan);
  const updatePlanStatus = useAppStore((s) => s.updatePlanStatus);
  const unarchivePlan = useAppStore((s) => s.unarchivePlan);
  const deletePlan = useAppStore((s) => s.deletePlan);

  const [newPlan, setNewPlan] = useState('');
  const [newPriority, setNewPriority] = useState<PlanPriority>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTags, setNewTags] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const visiblePlans = useMemo(
    () =>
      plans.filter(
        (p) => !p.archived && matchesSearch(searchQuery, `${p.title} ${p.description ?? ''}`, p.tags),
      ),
    [plans, searchQuery],
  );
  const archivedPlans = useMemo(() => plans.filter((p) => p.archived), [plans]);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newPlan.trim()) return;
    addPlan(newPlan, undefined, {
      priority: newPriority,
      dueDate: newDueDate ? new Date(`${newDueDate}T00:00:00`).getTime() : undefined,
      tags: newTags.split(',').map((tag) => tag.trim()).filter(Boolean),
    });
    setNewPlan('');
    setNewPriority('medium');
    setNewDueDate('');
    setNewTags('');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkComplete = () => {
    selectedIds.forEach((id) => updatePlanStatus(id, 'done'));
    setSelectedIds(new Set());
  };

  const bulkDelete = () => {
    selectedIds.forEach((id) => deletePlan(id));
    setSelectedIds(new Set());
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
          <input
            className="settings-input"
            value={newTags}
            placeholder={t('dashboard.tagsPlaceholder')}
            onChange={(e) => setNewTags(e.target.value)}
          />
        </div>
        <button type="submit">{t('dashboard.addPlan')}</button>
      </form>

      {selectedIds.size > 0 && (
        <div className="bulk-bar">
          <span>{t('dashboard.selectedCount').replace('{n}', String(selectedIds.size))}</span>
          <button className="card-btn" onClick={bulkComplete}>
            {t('dashboard.bulkComplete')}
          </button>
          <button className="card-btn danger" onClick={bulkDelete}>
            {t('dashboard.bulkDelete')}
          </button>
          <button className="card-btn" onClick={() => setSelectedIds(new Set())}>
            {t('dashboard.bulkCancel')}
          </button>
        </div>
      )}

      <div className="plan-board">
        {columns.map(({ status, key }) => {
          const items = visiblePlans.filter((p) => p.status === status);
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
                  items.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      selected={selectedIds.has(plan.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {archivedPlans.length > 0 && (
        <details className="archive-disclosure">
          <summary>
            {t('dashboard.archiveTitle')} ({archivedPlans.length})
          </summary>
          <ul className="goal-list">
            {archivedPlans.map((plan) => (
              <li key={plan.id} className="goal-item archived">
                <span className="goal-text">{plan.title}</span>
                <button className="card-btn" onClick={() => unarchivePlan(plan.id)}>
                  {t('dashboard.restore')}
                </button>
                <button className="card-btn danger" onClick={() => deletePlan(plan.id)}>
                  {t('dashboard.delete')}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
