import { useMemo, useState, type FormEvent } from 'react';
import { matchesSearch } from '../../lib/search';
import { useNowTick } from '../../hooks/useNowTick';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';
import type { ReminderRecurrence } from '../../types';

function toDateTimeInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function RemindersList() {
  const { t, language } = useTranslation();
  const reminders = useAppStore((s) => s.reminders);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const addReminder = useAppStore((s) => s.addReminder);
  const updateReminder = useAppStore((s) => s.updateReminder);
  const setReminderDone = useAppStore((s) => s.setReminderDone);
  const deleteReminder = useAppStore((s) => s.deleteReminder);

  useNowTick(30000);

  const [newText, setNewText] = useState('');
  const [newWhen, setNewWhen] = useState('');
  const [newRecurrence, setNewRecurrence] = useState<ReminderRecurrence>('none');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editWhen, setEditWhen] = useState('');

  const sorted = useMemo(
    () =>
      [...reminders]
        .filter((r) => matchesSearch(searchQuery, r.text))
        .sort((a, b) => a.dueAt - b.dueAt),
    [reminders, searchQuery],
  );

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !newWhen) return;
    addReminder(newText, new Date(newWhen).getTime(), newRecurrence);
    setNewText('');
    setNewWhen('');
    setNewRecurrence('none');
  };

  const saveEdit = (id: string) => {
    if (editText.trim() && editWhen) {
      updateReminder(id, { text: editText.trim(), dueAt: new Date(editWhen).getTime() });
    }
    setEditingId(null);
  };

  const recurrenceLabel = (r: ReminderRecurrence | undefined) => {
    if (r === 'daily') return t('dashboard.reminders.daily');
    if (r === 'weekly') return t('dashboard.reminders.weekly');
    return null;
  };

  return (
    <>
      <form className="add-form" onSubmit={handleAdd}>
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder={t('dashboard.reminders.textPlaceholder')}
        />
        <input
          type="datetime-local"
          className="settings-input"
          value={newWhen}
          onChange={(e) => setNewWhen(e.target.value)}
        />
        <select
          className="settings-select"
          value={newRecurrence}
          onChange={(e) => setNewRecurrence(e.target.value as ReminderRecurrence)}
        >
          <option value="none">{t('dashboard.reminders.noRecurrence')}</option>
          <option value="daily">{t('dashboard.reminders.daily')}</option>
          <option value="weekly">{t('dashboard.reminders.weekly')}</option>
        </select>
        <button type="submit">{t('dashboard.reminders.add')}</button>
      </form>

      {sorted.length === 0 ? (
        <p className="empty-hint">{t('dashboard.reminders.empty')}</p>
      ) : (
        <ul className="reminder-list">
          {sorted.map((reminder) => {
            const isOverdue = !reminder.done && reminder.dueAt < Date.now();
            return (
              <li
                key={reminder.id}
                className={`reminder-item${isOverdue ? ' overdue' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={reminder.done}
                  onChange={() => setReminderDone(reminder.id, !reminder.done)}
                />
                {editingId === reminder.id ? (
                  <>
                    <input
                      className="edit-input"
                      value={editText}
                      autoFocus
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <input
                      type="datetime-local"
                      className="edit-input"
                      value={editWhen}
                      onChange={(e) => setEditWhen(e.target.value)}
                    />
                  </>
                ) : (
                  <span className={`goal-text${reminder.done ? ' achieved' : ''}`}>
                    {reminder.text}
                    <span className="reminder-time">
                      {' — '}
                      {new Date(reminder.dueAt).toLocaleString(
                        language === 'de' ? 'de-DE' : 'en-US',
                        { dateStyle: 'medium', timeStyle: 'short' },
                      )}
                      {isOverdue ? ` · ${t('dashboard.reminders.overdue')}` : ''}
                      {recurrenceLabel(reminder.recurrence) && ` · 🔁 ${recurrenceLabel(reminder.recurrence)}`}
                    </span>
                  </span>
                )}
                <button
                  className="card-btn"
                  onClick={() => {
                    if (editingId === reminder.id) {
                      saveEdit(reminder.id);
                    } else {
                      setEditingId(reminder.id);
                      setEditText(reminder.text);
                      setEditWhen(toDateTimeInputValue(reminder.dueAt));
                    }
                  }}
                >
                  {editingId === reminder.id ? t('dashboard.save') : t('dashboard.edit')}
                </button>
                <button
                  className="card-btn danger"
                  onClick={() => deleteReminder(reminder.id)}
                >
                  {t('dashboard.delete')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
