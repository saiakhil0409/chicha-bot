// ── NOTES ─────────────────────────────────────────────────────────────────────
const Notes = (() => {
  const KEY = 'chicha_notes';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }
  function save(notes) { localStorage.setItem(KEY, JSON.stringify(notes)); }

  function render() {
    const notes = load();
    const el    = document.getElementById('notesContent');
    if (!el) return;
    if (!notes.length) {
      el.innerHTML = '<div class="note-empty">No notes yet. Hit + New to add one.</div>';
      return;
    }
    el.innerHTML = notes.map((n, i) => `
      <div class="note-card">
        <div style="display:flex;justify-content:space-between;align-items:start">
          <div class="note-card-title">${n.title}</div>
          <button onclick="Notes.delete(${i})" style="background:none;border:none;color:#3a3a5c;cursor:pointer;font-size:14px;padding:0 4px;">✕</button>
        </div>
        <div class="note-card-body">${n.body}</div>
        <div class="note-card-meta">${new Date(n.date).toLocaleDateString()} · ${n.topic}</div>
      </div>`).join('');
  }

  return {
    openAdd() {
      const form = document.getElementById('noteAddForm');
      if (form) {
        form.style.display = 'block';
        document.getElementById('noteTitleInput')?.focus();
      }
    },
    cancelAdd() {
      const form = document.getElementById('noteAddForm');
      if (form) form.style.display = 'none';
      const ti = document.getElementById('noteTitleInput');
      const bi = document.getElementById('noteBodyInput');
      if (ti) ti.value = '';
      if (bi) bi.value = '';
    },
    saveAdd() {
      const title = document.getElementById('noteTitleInput')?.value.trim();
      const body  = document.getElementById('noteBodyInput')?.value.trim();
      if (!title || !body) return;
      const notes = load();
      notes.unshift({ title, body, date: new Date().toISOString(), topic: App.currentTopic() });
      save(notes);
      Notes.cancelAdd();
      render();
    },
    delete(i) {
      const notes = load();
      notes.splice(i, 1);
      save(notes);
      render();
    },
    render,
  };
})();
