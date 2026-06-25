// ── APP ───────────────────────────────────────────────────────────────────────
const App = (() => {
  let _topic = 'SQL';
  let _menuOpen = false;
  let _moodInterval = null;

  return {
    currentTopic() { return _topic; },

    launch() {
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('mainApp').classList.remove('hidden');

      Mood.init();
      Chat.init();
      Voice.init();

      _topic = State.get().topic || 'SQL';
      App.setTopic(_topic, true);
      App.syncSidebar();

      _moodInterval = setInterval(() => Mood.decay(), 120000);

      setTimeout(() => Surprise.checkAndShow(), 800);

      const ta = document.getElementById('userInput');
      ta.addEventListener('input', () => {
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
      });
    },

    setTopic(topic, silent = false) {
      _topic = topic;
      State.set({ topic });

      document.querySelectorAll('.tpill').forEach(p => {
        p.classList.toggle('active', p.textContent.replace(' ','') === topic.replace(' ','') || p.textContent === topic);
      });

      Chat.loadSpark(topic);
      App.renderCurriculum();
      App.syncSidebar();

      if (!silent) App.showPanel('chat');
    },

    showPanel(name) {
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.getElementById(name + 'Panel')?.classList.add('active');

      document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
      document.getElementById('bnav-' + (name === 'chat' ? 'chat' : name))?.classList.add('active');

      // Sidebar active state
      document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
      document.getElementById('sbChat')?.classList.toggle('active', name === 'chat');

      if (name === 'notes') Notes.render();
    },

    toggleMenu() {
      _menuOpen = !_menuOpen;
      document.getElementById('sideDrawer').classList.toggle('hidden', !_menuOpen);
      document.getElementById('drawerBackdrop').classList.toggle('hidden', !_menuOpen);
      const btn = document.getElementById('menuBtn');
      if (btn) btn.textContent = _menuOpen ? '✕' : '≡';
    },

    syncSidebar() {
      const s = State.get();
      const mastered = s.masteredConcepts || [];

      // Spark card in sidebar
      const spark = document.getElementById('sbSparkTitle');
      const sparkBody = document.getElementById('sbSparkBody');
      const mainTitle = document.getElementById('sparkTitle');
      const mainBody  = document.getElementById('sparkBody');
      if (spark && mainTitle) spark.textContent = mainTitle.textContent;
      if (sparkBody && mainBody) sparkBody.textContent = mainBody.textContent;

      // XP / streak / mastered
      const xpEl = document.getElementById('sbXp');
      const stEl = document.getElementById('sbStreak');
      const maEl = document.getElementById('sbMastered');
      if (xpEl) xpEl.textContent = s.xp || 0;
      if (stEl) stEl.textContent = `🔥 ${s.streak || 0}`;
      if (maEl) maEl.textContent = `${mastered.length} concepts`;

      // Progress bars per topic
      const topics = [
        { key:'SQL',     id:'Sql', color:'var(--violet)' },
        { key:'PowerBI', id:'Pbi', color:'var(--amber)' },
        { key:'Tableau', id:'Tab', color:'var(--green)' },
      ];
      topics.forEach(({ key, id, color }) => {
        const sections = CURRICULUM[key] || [];
        const total = sections.flatMap(s => s.concepts).length;
        const done  = mastered.filter(c => sections.flatMap(s => s.concepts).includes(c)).length;
        const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
        const barEl = document.getElementById(`sb${id}Bar`);
        const pctEl = document.getElementById(`sb${id}Pct`);
        if (barEl) { barEl.style.width = pct + '%'; barEl.style.background = color; }
        if (pctEl) pctEl.textContent = pct + '%';
      });
    },

    renderCurriculum() {
      const sections = CURRICULUM[_topic] || [];
      const mastered = State.get().masteredConcepts;
      const el = document.getElementById('curriculumContent');
      if (!el) return;
      el.innerHTML = sections.map(s => `
        <div class="curr-section">
          <div class="curr-section-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
            <span class="curr-section-title">${s.section}</span>
            <span class="curr-section-meta">${s.concepts.filter(c=>mastered.includes(c)).length}/${s.concepts.length}</span>
          </div>
          <div class="curr-topics hidden">
            ${s.concepts.map(c => `
              <div class="curr-topic ${mastered.includes(c)?'mastered':''}">
                <div class="curr-topic-dot"></div>
                ${c}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    },
  };
})();

// ── BOOT ──────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  if (Auth.isLoggedIn()) {
    App.launch();
  }
  const pw = document.getElementById('pwInput');
  if (pw && !Auth.isLoggedIn()) pw.focus();
});
