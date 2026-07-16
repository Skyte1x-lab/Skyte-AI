import { useMemo, useState, type FormEvent } from 'react';
import { matchesSearch } from '../../lib/search';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';

export default function GoalsList() {
  const { t } = useTranslation();
  const goals = useAppStore((s) => s.goals);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const addGoal = useAppStore((s) => s.addGoal);
  const updateGoal = useAppStore((s) => s.updateGoal);
  const archiveGoal = useAppStore((s) => s.archiveGoal);
  const unarchiveGoal = useAppStore((s) => s.unarchiveGoal);
  const deleteGoal = useAppStore((s) => s.deleteGoal);

  const [newGoal, setNewGoal] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const activeGoals = useMemo(
    () => goals.filter((g) => !g.archived && matchesSearch(searchQuery, g.text)),
    [goals, searchQuery],
  );
  const archivedGoals = useMemo(() => goals.filter((g) => g.archived), [goals]);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    addGoal(newGoal);
    setNewGoal('');
  };

  const saveEdit = (id: string) => {
    if (editText.trim()) updateGoal(id, { text: editText.trim() });
    setEditingId(null);
  };

  return (
    <>
      <form className="add-form" onSubmit={handleAdd}>
        <input
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          placeholder={t('dashboard.goalPlaceholder')}
        />
        <button type="submit">{t('dashboard.addGoal')}</button>
      </form>

      {activeGoals.length === 0 ? (
        <p className="empty-hint">{t('dashboard.noGoals')}</p>
      ) : (
        <ul className="goal-list">
          {activeGoals.map((goal) => (
            <li key={goal.id} className="goal-item">
              <input
                type="checkbox"
                checked={goal.achieved}
                onChange={() => updateGoal(goal.id, { achieved: !goal.achieved })}
              />
              {editingId === goal.id ? (
                <input
                  className="edit-input"
                  value={editText}
                  autoFocus
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(goal.id)}
                  onBlur={() => saveEdit(goal.id)}
                />
              ) : (
                <span className={`goal-text${goal.achieved ? ' achieved' : ''}`}>
                  {goal.text}
                </span>
              )}
              <button
                className="card-btn"
                onClick={() => {
                  setEditingId(goal.id);
                  setEditText(goal.text);
                }}
              >
                {t('dashboard.edit')}
              </button>
              <button
                className="card-btn"
                title={t('dashboard.archive')}
                onClick={() => archiveGoal(goal.id)}
              >
                📦
              </button>
              <button
                className="card-btn danger"
                onClick={() => deleteGoal(goal.id)}
              >
                {t('dashboard.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}

      {archivedGoals.length > 0 && (
        <details className="archive-disclosure">
          <summary>
            {t('dashboard.archiveTitle')} ({archivedGoals.length})
          </summary>
          <ul className="goal-list">
            {archivedGoals.map((goal) => (
              <li key={goal.id} className="goal-item archived">
                <span className="goal-text">{goal.text}</span>
                <button className="card-btn" onClick={() => unarchiveGoal(goal.id)}>
                  {t('dashboard.restore')}
                </button>
                <button className="card-btn danger" onClick={() => deleteGoal(goal.id)}>
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
