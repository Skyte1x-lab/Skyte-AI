import { useState, type FormEvent } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';

export default function NotesList() {
  const { t } = useTranslation();
  const notes = useAppStore((s) => s.notes);
  const addNote = useAppStore((s) => s.addNote);
  const updateNote = useAppStore((s) => s.updateNote);
  const deleteNote = useAppStore((s) => s.deleteNote);

  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNote(newNote);
    setNewNote('');
  };

  const saveEdit = (id: string) => {
    if (editText.trim()) updateNote(id, { text: editText.trim() });
    setEditingId(null);
  };

  return (
    <>
      <form className="add-form" onSubmit={handleAdd}>
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={t('dashboard.notes.placeholder')}
        />
        <button type="submit">{t('dashboard.notes.add')}</button>
      </form>

      {notes.length === 0 ? (
        <p className="empty-hint">{t('dashboard.notes.empty')}</p>
      ) : (
        <ul className="goal-list">
          {notes.map((note) => (
            <li key={note.id} className="goal-item">
              {editingId === note.id ? (
                <input
                  className="edit-input"
                  value={editText}
                  autoFocus
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(note.id)}
                  onBlur={() => saveEdit(note.id)}
                />
              ) : (
                <span className="goal-text">{note.text}</span>
              )}
              <button
                className="card-btn"
                onClick={() => {
                  setEditingId(note.id);
                  setEditText(note.text);
                }}
              >
                {t('dashboard.edit')}
              </button>
              <button className="card-btn danger" onClick={() => deleteNote(note.id)}>
                {t('dashboard.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
