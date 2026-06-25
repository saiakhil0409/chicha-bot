// ── NOTES ─────────────────────────────────────────────────────────────────────
const Notes = (() => {
  const KEY = 'chicha_notes';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
  function save(notes) { localStorage.setItem(KEY, JSON.stringify(notes)); }

  function render() {
    const notes = load();
    const el = document.getElementById('notesContent');
    if (!el) return;
    if (!notes.length) {
      el.innerHTML = '<div class="note-empty">No notes yet. Jot things down while learning!</div>';
      return;
    }
    el.innerHTML = notes.map((n, i) => `
      <div class="note-card">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <div class="note-card-title">${n.title}</div>
          <button onclick="Notes.delete(${i})" style="background:none;border:none;color:var(--muted2);cursor:pointer;font-size:14px;">✕</button>
        </div>
        <div class="note-card-body">${n.body}</div>
        <div class="note-card-meta">${new Date(n.date).toLocaleDateString()} · ${n.topic}</div>
      </div>
    `).join('');
  }

  return {
    add() {
      const title = prompt('Note title:');
      if (!title) return;
      const body = prompt('Note content:');
      if (!body) return;
      const notes = load();
      notes.unshift({ title, body, date: new Date().toISOString(), topic: App.currentTopic() });
      save(notes);
      render();
    },
    delete(i) {
      if (!confirm('Delete this note?')) return;
      const notes = load();
      notes.splice(i, 1);
      save(notes);
      render();
    },
    render,
  };
})();
