import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import type { PlanItem, PlanStatus } from '../../types';

const order: PlanStatus[] = ['planned', 'in_progress', 'done'];

export default function PlanCard({ plan }: { plan: PlanItem }) {
  const { t } = useTranslation();
  const updatePlan = useAppStore((s) => s.updatePlan);
  const updatePlanStatus = useAppStore((s) => s.updatePlanStatus);
  const deletePlan = useAppStore((s) => s.deletePlan);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(plan.title);

  const idx = order.indexOf(plan.status);

  const saveEdit = () => {
    if (editTitle.trim()) updatePlan(plan.id, { title: editTitle.trim() });
    setEditing(false);
  };

  return (
    <div className="plan-card">
      {editing ? (
        <input
          className="edit-input"
          value={editTitle}
          autoFocus
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          onBlur={saveEdit}
        />
      ) : (
        <div className="plan-card-title">{plan.title}</div>
      )}
      {plan.description && (
        <div className="plan-card-desc">{plan.description}</div>
      )}
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
        <button
          className="card-btn"
          onClick={() => {
            setEditTitle(plan.title);
            setEditing(true);
          }}
        >
          {t('dashboard.edit')}
        </button>
        <button className="card-btn danger" onClick={() => deletePlan(plan.id)}>
          ✕
        </button>
      </div>
    </div>
  );
}
