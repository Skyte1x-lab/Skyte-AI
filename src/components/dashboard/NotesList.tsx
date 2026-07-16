import { useMemo, useState, type FormEvent } from 'react';
import { matchesSearch } from '../../lib/search';
import { useTranslation } from '../../i18n/useTranslation';
import { useAppStore } from '../../store/useAppStore';

export default function NotesList() {
  const { t } = useTranslation();
  const notes = useAppStore((s) => s.notes);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const addNote = useAppStore((s) => s.addNote);
  const updateNote = useAppStore((s) => s.updateNote);
  const deleteNote = useAppStore((s) => s.deleteNote);

  const [newNote, setNewNote] = useState('');
  const [newTags, setNewTags] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editTags, setEditTags] = useState('');

  const visibleNotes = useMemo(
    () => notes.filter((n) => matchesSearch(searchQuery, n.text, n.tags)),
    [notes, searchQuery],
  );

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNote(newNote, newTags.split(',').map((tag) => tag.trim()).filter(Boolean));
    setNewNote('');
    setNewTags('');
  };

  const saveEdit = (id: string) => {
    if (editText.trim()) {
      updateNote(id, {
        text: editText.trim(),
        tags: editTags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });
    }
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
        <input
          value={newTags}
          onChange={(e) => setNewTags(e.target.value)}
          placeholder={t('dashboard.tagsPlaceholder')}
        />
        <button type="submit">{t('dashboard.notes.add')}</button>
      </form>

      {visibleNotes.length === 0 ? (
        <p className="empty-hint">{t('dashboard.notes.empty')}</p>
      ) : (
        <ul className="goal-list">
          {visibleNotes.map((note) => (
            <li key={note.id} className="goal-item">
              {editingId === note.id ? (
                <>
                  <input
                    className="edit-input"
                    value={editText}
                    autoFocus
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(note.id)}
                  />
                  <input
                    className="edit-input"
                    value={editTags}
                    placeholder={t('dashboard.tagsPlaceholder')}
                    onChange={(e) => setEditTags(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(note.id)}
                  />
                </>
              ) : (
                <span className="goal-text">
                  {note.text}
                  {note.tags && note.tags.length > 0 && (
                    <span className="tag-list inline">
                      {note.tags.map((tag) => (
                        <span key={tag} className="tag-pill">
                          #{tag}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              )}
              <button
                className="card-btn"
                onClick={() => {
                  if (editingId === note.id) {
                    saveEdit(note.id);
                  } else {
                    setEditingId(note.id);
                    setEditText(note.text);
                    setEditTags((note.tags ?? []).join(', '));
                  }
                }}
              >
                {editingId === note.id ? t('dashboard.save') : t('dashboard.edit')}
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
