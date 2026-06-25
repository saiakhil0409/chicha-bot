// ── APP ───────────────────────────────────────────────────────────────────────
const App = (() => {
  let _topic     = 'SQL';
  let _menuOpen  = false;

  return {
    currentTopic() { return _topic; },

    launch() {
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('mainApp').classList.remove('hidden');
      document.body.classList.add('app-open');

      Mood.init();
      Chat.init();

      _topic = State.get().topic || 'SQL';
      App.setTopic(_topic, true);
      App.syncSidebar();

      setInterval(() => Mood.decay(), 120000);
      setTimeout(() => Surprise.checkAndShow(), 800);

      // Auto-resize textarea
      const ta = document.getElementById('userInput');
      if (ta) {
        ta.addEventListener('input', () => {
          ta.style.height = 'auto';
          ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
        });
      }
    },

    setTopic(topic, silent = false) {
      _topic = topic;
      State.set({ topic });

      document.querySelectorAll('.tpill').forEach(p => {
        const match = p.textContent.trim().replace(' ','') === topic.replace(' ','') || p.textContent.trim() === topic;
        p.classList.toggle('active', match);
      });

      Chat.loadSpark(topic);
      App.renderCurriculum();
      App.syncSidebar();

      if (!silent) App.showPanel('chat');
    },

    showPanel(name) {
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.getElementById(name + 'Panel')?.classList.add('active');

      // Bottom nav active state — only chat/brain/replay/more exist
      document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
      if (name === 'chat') document.getElementById('bnav-chat')?.classList.add('active');

      // Sidebar active state
      document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
      if (name === 'chat') document.getElementById('sbChat')?.classList.add('active');
      if (name === 'curriculum') document.getElementById('sbCurriculum')?.classList.add('active');
      if (name === 'notes') {
        document.getElementById('sbNotes')?.classList.add('active');
        Notes.render();
      }
    },

    // Today's Spark badge clicked
    scrollToSpark() {
      const msgs = document.getElementById('messages');
      if (msgs && msgs.children.length > 0) {
        // Mid-conversation — go back to spark
        Chat.backToSpark();
      } else {
        Chat.showSpark();
      }
    },

    // Chat nav item clicked
    openChat() {
      Chat.openChat();
    },

    collapseSpark() { /* intentional no-op */ },

    backToSpark() { Chat.backToSpark(); },

    resetProgress() {
      const confirmed = window.confirm(
        'Reset all progress?\n\nThis clears your XP, streak, mastered concepts and chat history. Your API key and password are kept.\n\nThis cannot be undone.'
      );
      if (!confirmed) return;
      // Clear state
      localStorage.removeItem('chicha_v2_state');
      // Clear chat session
      sessionStorage.removeItem('chicha_chat_history');
      sessionStorage.removeItem('chicha_chat_msgs');
      // Clear surprise flags so they show again
      localStorage.removeItem('chicha_d0');
      localStorage.removeItem('chicha_d1');
      localStorage.removeItem('chicha_s3');
      localStorage.removeItem('chicha_s7');
      localStorage.removeItem('chicha_xp1k');
      localStorage.removeItem('chicha_surprise_seen');
      // Reload the app fresh
      window.location.reload();
    },

    toggleMenu() {
      _menuOpen = !_menuOpen;
      document.getElementById('sideDrawer').classList.toggle('hidden', !_menuOpen);
      document.getElementById('drawerBackdrop').classList.toggle('hidden', !_menuOpen);
      const btn = document.getElementById('menuBtn');
      if (btn) btn.textContent = _menuOpen ? '✕' : '≡';
    },

    syncSidebar() {
      const s       = State.get();
      const mastered = s.masteredConcepts || [];

      const xpEl = document.getElementById('sbXp');
      const stEl = document.getElementById('sbStreak');
      const maEl = document.getElementById('sbMastered');
      if (xpEl) xpEl.textContent = `${s.xp || 0}`;
      if (stEl) stEl.textContent = `🔥 ${s.streak || 0}`;
      if (maEl) maEl.textContent = `${mastered.length} concepts`;

      const topicMap = [
        { key:'SQL',     id:'Sql', color:'#8b5cf6' },
        { key:'PowerBI', id:'Pbi', color:'#f59e0b' },
        { key:'Tableau', id:'Tab', color:'#34d399' },
      ];
      topicMap.forEach(({ key, id, color }) => {
        const sections = CURRICULUM[key] || [];
        const total    = sections.flatMap(sc => sc.concepts).length;
        const done     = mastered.filter(c => sections.flatMap(sc => sc.concepts).includes(c)).length;
        const pct      = total > 0 ? Math.round((done / total) * 100) : 0;
        const barEl    = document.getElementById(`sb${id}Bar`);
        const pctEl    = document.getElementById(`sb${id}Pct`);
        if (barEl) { barEl.style.width = pct + '%'; barEl.style.background = color; }
        if (pctEl) pctEl.textContent = pct + '%';
      });
    },

    renderCurriculum() {
      const sections = CURRICULUM[_topic] || [];
      const mastered = State.get().masteredConcepts;
      const el       = document.getElementById('curriculumContent');
      if (!el) return;
      el.innerHTML = sections.map(s => `
        <div class="curr-section">
          <div class="curr-section-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
            <span class="curr-section-title">${s.section}</span>
            <span class="curr-section-meta">${s.concepts.filter(c => mastered.includes(c)).length}/${s.concepts.length}</span>
          </div>
          <div class="curr-topics hidden">
            ${s.concepts.map(c => `
              <div class="curr-topic ${mastered.includes(c) ? 'mastered' : ''}">
                <div class="curr-topic-dot"></div>${c}
              </div>`).join('')}
          </div>
        </div>`).join('');
    },
  };
})();

// ── BOOT ──────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  if (Auth.isLoggedIn()) App.launch();
  const pw = document.getElementById('pwInput');
  if (pw && !Auth.isLoggedIn()) pw.focus();
});
