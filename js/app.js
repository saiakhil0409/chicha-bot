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

      // Init systems
      Mood.init();
      Chat.init();
      Voice.init();

      // Load last topic
      _topic = State.get().topic || 'SQL';
      App.setTopic(_topic, true);

      // Mood decay every 2 min
      _moodInterval = setInterval(() => Mood.decay(), 120000);

      // Surprise check (after short delay so app is fully visible)
      setTimeout(() => Surprise.checkAndShow(), 800);

      // Auto-resize textarea
      const ta = document.getElementById('userInput');
      ta.addEventListener('input', () => {
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
      });
    },

    setTopic(topic, silent = false) {
      _topic = topic;
      State.set({ topic });

      // Update pills
      document.querySelectorAll('.tpill').forEach(p => {
        p.classList.toggle('active', p.textContent.replace(' ','') === topic.replace(' ','') || p.textContent === topic);
      });

      // Load new spark
      Chat.loadSpark(topic);

      // Render curriculum
      App.renderCurriculum();

      if (!silent) App.showPanel('chat');
    },

    showPanel(name) {
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.getElementById(name + 'Panel')?.classList.add('active');

      // Bottom nav active state
      document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
      document.getElementById('bnav-' + (name === 'chat' ? 'chat' : name))?.classList.add('active');

      if (name === 'notes') Notes.render();
    },

    toggleMenu() {
      _menuOpen = !_menuOpen;
      document.getElementById('sideDrawer').classList.toggle('hidden', !_menuOpen);
      document.getElementById('drawerBackdrop').classList.toggle('hidden', !_menuOpen);
      document.getElementById('menuBtn').textContent = _menuOpen ? '✕' : '≡';
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
  // Focus password input
  const pw = document.getElementById('pwInput');
  if (pw && !Auth.isLoggedIn()) pw.focus();
});
