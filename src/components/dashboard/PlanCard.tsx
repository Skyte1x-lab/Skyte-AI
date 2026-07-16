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

interface Props {
  plan: PlanItem;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export default function PlanCard({ plan, selected = false, onToggleSelect }: Props) {
  const { t, language } = useTranslation();
  const updatePlan = useAppStore((s) => s.updatePlan);
  const updatePlanStatus = useAppStore((s) => s.updatePlanStatus);
  const archivePlan = useAppStore((s) => s.archivePlan);
  const deletePlan = useAppStore((s) => s.deletePlan);
  const addSubtask = useAppStore((s) => s.addSubtask);
  const toggleSubtask = useAppStore((s) => s.toggleSubtask);
  const deleteSubtask = useAppStore((s) => s.deleteSubtask);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(plan.title);
  const [editDue, setEditDue] = useState(toDateInputValue(plan.dueDate));
  const [editTags, setEditTags] = useState((plan.tags ?? []).join(', '));
  const [newSubtask, setNewSubtask] = useState('');

  const idx = order.indexOf(plan.status);
  const isOverdue =
    plan.dueDate !== undefined && plan.dueDate < Date.now() && plan.status !== 'done';
  const subtasks = plan.subtasks ?? [];

  const saveEdit = () => {
    updatePlan(plan.id, {
      title: editTitle.trim() || plan.title,
      dueDate: editDue ? new Date(`${editDue}T00:00:00`).getTime() : undefined,
      tags: editTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    setEditing(false);
  };

  const startEdit = () => {
    setEditTitle(plan.title);
    setEditDue(toDateInputValue(plan.dueDate));
    setEditTags((plan.tags ?? []).join(', '));
    setEditing(true);
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    addSubtask(plan.id, newSubtask);
    setNewSubtask('');
  };

  return (
    <div className={`plan-card${selected ? ' selected' : ''}`}>
      <div className="plan-card-top">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(plan.id)}
            title={t('dashboard.select')}
          />
        )}
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
        <>
          <input
            type="date"
            className="edit-input"
            value={editDue}
            onChange={(e) => setEditDue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          />
          <input
            className="edit-input"
            value={editTags}
            placeholder={t('dashboard.tagsPlaceholder')}
            onChange={(e) => setEditTags(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
          />
        </>
      ) : (
        <>
          {plan.dueDate && (
            <div className={`plan-card-due${isOverdue ? ' overdue' : ''}`}>
              📅 {t('dashboard.dueDateLabel')}:{' '}
              {new Date(plan.dueDate).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
              {isOverdue ? ` · ${t('dashboard.reminders.overdue')}` : ''}
            </div>
          )}
          {plan.tags && plan.tags.length > 0 && (
            <div className="tag-list">
              {plan.tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {subtasks.length > 0 && (
        <ul className="subtask-list">
          {subtasks.map((st) => (
            <li key={st.id} className="subtask-item">
              <input
                type="checkbox"
                checked={st.done}
                onChange={() => toggleSubtask(plan.id, st.id)}
              />
              <span className={st.done ? 'subtask-done' : ''}>{st.text}</span>
              <button className="subtask-delete" onClick={() => deleteSubtask(plan.id, st.id)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="subtask-add">
        <input
          className="edit-input"
          value={newSubtask}
          placeholder={t('dashboard.subtaskPlaceholder')}
          onChange={(e) => setNewSubtask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
        />
        <button className="card-btn" onClick={handleAddSubtask}>
          +
        </button>
      </div>

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
        <button className="card-btn" title={t('dashboard.archive')} onClick={() => archivePlan(plan.id)}>
          📦
        </button>
        <button className="card-btn danger" onClick={() => deletePlan(plan.id)}>
          ✕
        </button>
      </div>
    </div>
  );
}
