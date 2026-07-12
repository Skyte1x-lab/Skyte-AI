import { useMemo, useState, type FormEvent } from 'react';
import { useNowTick } from '../../hooks/useNowTick';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';

function toDateTimeInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function RemindersList() {
  const { t, language } = useTranslation();
  const reminders = useAppStore((s) => s.reminders);
  const addReminder = useAppStore((s) => s.addReminder);
  const updateReminder = useAppStore((s) => s.updateReminder);
  const setReminderDone = useAppStore((s) => s.setReminderDone);
  const deleteReminder = useAppStore((s) => s.deleteReminder);

  useNowTick(30000);

  const [newText, setNewText] = useState('');
  const [newWhen, setNewWhen] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editWhen, setEditWhen] = useState('');

  const sorted = useMemo(
    () => [...reminders].sort((a, b) => a.dueAt - b.dueAt),
    [reminders],
  );

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !newWhen) return;
    addReminder(newText, new Date(newWhen).getTime());
    setNewText('');
    setNewWhen('');
  };

  const saveEdit = (id: string) => {
    if (editText.trim() && editWhen) {
      updateReminder(id, { text: editText.trim(), dueAt: new Date(editWhen).getTime() });
    }
    setEditingId(null);
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
