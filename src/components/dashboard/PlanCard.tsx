import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import type { PlanItem, PlanPriority, PlanStatus } from '../../types';

const order: PlanStatus[] = ['planned', 'in_progress', 'done'];

function toDateInputValue(ms?: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function PlanCard({ plan }: { plan: PlanItem }) {
  const { t, language } = useTranslation();
  const updatePlan = useAppStore((s) => s.updatePlan);
  const updatePlanStatus = useAppStore((s) => s.updatePlanStatus);
  const deletePlan = useAppStore((s) => s.deletePlan);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(plan.title);
  const [editDue, setEditDue] = useState(toDateInputValue(plan.dueDate));

  const idx = order.indexOf(plan.status);
  const isOverdue =
    plan.dueDate !== undefined && plan.dueDate < Date.now() && plan.status !== 'done';

  const saveEdit = () => {
    updatePlan(plan.id, {
      title: editTitle.trim() || plan.title,
      dueDate: editDue ? new Date(`${editDue}T00:00:00`).getTime() : undefined,
    });
    setEditing(false);
  };

  const startEdit = () => {
    setEditTitle(plan.title);
    setEditDue(toDateInputValue(plan.dueDate));
    setEditing(true);
  };

  return (
    <div className="plan-card">
      <div className="plan-card-top">
        {editing ? (
          <input
            className="edit-input"
            value={editTitle}
            autoFocus
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          />
        ) : (
          <div className="plan-card-title">{plan.title}</div>
        )}
        <select
          className={`priority-badge ${plan.priority}`}
          value={plan.priority}
          onChange={(e) =>
            updatePlan(plan.id, { priority: e.target.value as PlanPriority })
          }
        >
          <option value="low">{t('dashboard.priorityLow')}</option>
          <option value="medium">{t('dashboard.priorityMedium')}</option>
          <option value="high">{t('dashboard.priorityHigh')}</option>
        </select>
      </div>

      {plan.description && <div className="plan-card-desc">{plan.description}</div>}

      {editing ? (
        <input
          type="date"
          className="edit-input"
          value={editDue}
          onChange={(e) => setEditDue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
        />
      ) : plan.dueDate ? (
        <div className={`plan-card-due${isOverdue ? ' overdue' : ''}`}>
          📅 {t('dashboard.dueDateLabel')}:{' '}
          {new Date(plan.dueDate).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
          {isOverdue ? ` · ${t('dashboard.reminders.overdue')}` : ''}
        </div>
      ) : null}

      <div className="plan-card-actions">
        <button
          className="card-btn"
          disabled={idx === 0}
          onClick={() => updatePlanStatus(plan.id, order[idx - 1])}
        >
          ←
        </button>
        <button
          className="card-btn"
          disabled={idx === order.length - 1}
          onClick={() => updatePlanStatus(plan.id, order[idx + 1])}
        >
          →
        </button>
        <button className="card-btn" onClick={editing ? saveEdit : startEdit}>
          {editing ? t('dashboard.save') : t('dashboard.edit')}
        </button>
        <button className="card-btn danger" onClick={() => deletePlan(plan.id)}>
          ✕
        </button>
      </div>
    </div>
  );
}
