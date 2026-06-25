// ── MOOD ─────────────────────────────────────────────────────────────────────
const Mood = (() => {
  const MOODS = [
    { min:0,  max:20,  emoji:'😴', label:'Half asleep',     tone:'slow down, use very simple language, lots of encouragement' },
    { min:20, max:40,  emoji:'🤔', label:'Thinking mode',   tone:'be methodical, patient, break things into tiny steps' },
    { min:40, max:60,  emoji:'😊', label:'Ready to teach',  tone:'friendly and clear, standard teaching style' },
    { min:60, max:80,  emoji:'⚡', label:'In the zone',     tone:'faster pace, throw in harder examples, more challenging' },
    { min:80, max:101, emoji:'🔥', label:'On fire!',        tone:'very high energy, push hard, use exciting analogies, celebrate wins loudly' },
  ];

  function getCurrent() {
    const score = State.get().moodScore || 50;
    return MOODS.find(m => score >= m.min && score < m.max) || MOODS[2];
  }

  function update(correct) {
    const s = State.get();
    let score = s.moodScore || 50;
    score = correct ? Math.min(100, score + 8) : Math.max(0, score - 5);
    State.set({ moodScore: score });
    render();
  }

  function render() {
    const mood = getCurrent();
    const el = document.getElementById('moodState');
    if (el) {
      el.textContent = `${mood.emoji} ${mood.label}`;
      el.style.color = mood.emoji === '🔥' ? 'var(--amber)' :
                       mood.emoji === '⚡' ? 'var(--violet)' :
                       mood.emoji === '😴' ? 'var(--muted2)' : 'var(--muted)';
    }
  }

  return {
    init: render,
    update,
    getTone: () => getCurrent().tone,
    getEmoji: () => getCurrent().emoji,
    decay() {
      // Slowly drift back to 50 when idle
      const s = State.get();
      const score = s.moodScore || 50;
      if (score !== 50) {
        State.set({ moodScore: score + (score > 50 ? -2 : 2) });
        render();
      }
    },
  };
})();
