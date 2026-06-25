// ── ROADMAP ───────────────────────────────────────────────────────────────────
const Roadmap = (() => {

  function build() {
    const topic    = App.currentTopic();
    const sections = CURRICULUM[topic] || [];
    const mastered = State.get().masteredConcepts;
    const current  = document.getElementById('sparkConcept')?.textContent || '';
    const all      = sections.flatMap(s => s.concepts);
    const el       = document.getElementById('roadmapPanel');
    if (!el) return;

    el.innerHTML = sections.map(section => {
      const sectionMastered = section.concepts.filter(c => mastered.includes(c)).length;
      const allDone = sectionMastered === section.concepts.length;

      return `
        <div class="rm-section">
          <div class="rm-section-header" onclick="this.nextElementSibling.classList.toggle('rm-collapsed')">
            <span class="rm-section-title">${section.section}</span>
            <span class="rm-section-count" style="color:${allDone?'#34d399':'#555'}">${sectionMastered}/${section.concepts.length}</span>
          </div>
          <div class="rm-concepts">
            ${section.concepts.map(concept => {
              const done    = mastered.includes(concept);
              const isCurr  = concept === current;
              const idx     = all.indexOf(concept);
              const prevDone= idx === 0 || mastered.includes(all[idx-1]);
              const locked  = !done && !isCurr && !prevDone;

              return `
                <div class="rm-item ${done?'rm-done':''} ${isCurr?'rm-current':''} ${locked?'rm-locked':''}"
                  onclick="${!locked ? `Roadmap.selectConcept('${concept.replace(/'/g,"\\'")}')` : 'Roadmap.showLocked(this)'}">
                  <span class="rm-icon">${done ? '✅' : isCurr ? '▶' : locked ? '🔒' : '○'}</span>
                  <span class="rm-label">${concept}</span>
                  ${done ? '<span class="rm-xp">✓</span>' : ''}
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');
  }

  return {
    init() {
      build();
    },

    refresh() {
      build();
    },

    selectConcept(concept) {
      const mastered = State.get().masteredConcepts;
      // Already mastered — can freely revisit
      if (mastered.includes(concept)) {
        // Load spark for this concept directly
        const topic = App.currentTopic();
        const spark = getSparkForTopic(topic);
        // Find the specific spark
        const found = SPARKS[concept] || {
          title: `Let's revisit: ${concept}`,
          analogy: `You've already mastered this. Let's do a quick review.`,
          concept: concept,
        };
        // Inject directly
        const sc = document.getElementById('sparkCard');
        const st = document.getElementById('sparkTitle');
        const sb = document.getElementById('sparkBody');
        const scon = document.getElementById('sparkConcept');
        if (st) st.textContent = found.title;
        if (sb) sb.textContent = found.analogy;
        if (scon) scon.textContent = found.concept || concept;
        Chat._currentSparkOverride = found;
        Chat.showSpark();
        return;
      }

      // Current concept — already being taught
      const current = document.getElementById('sparkConcept')?.textContent;
      if (concept === current) {
        App.showPanel('chat');
        return;
      }

      // Next unlocked concept
      App.showPanel('chat');
    },

    showLocked(el) {
      // Brief shake animation + tooltip
      el.style.animation = 'shake 0.3s ease';
      setTimeout(() => el.style.animation = '', 300);
      injectTooltip(el, 'Complete the previous concept first');
    },
  };
})();

function injectTooltip(el, msg) {
  const existing = document.getElementById('rmTooltip');
  if (existing) existing.remove();
  const tip = document.createElement('div');
  tip.id = 'rmTooltip';
  tip.style.cssText = `position:fixed;background:#1a1a2e;border:1px solid rgba(139,92,246,0.3);color:#a78bfa;font-size:11px;padding:6px 12px;border-radius:8px;font-family:'JetBrains Mono',monospace;z-index:999;pointer-events:none;`;
  const rect = el.getBoundingClientRect();
  tip.style.top  = (rect.top - 36) + 'px';
  tip.style.left = rect.left + 'px';
  tip.textContent = msg;
  document.body.appendChild(tip);
  setTimeout(() => tip.remove(), 2000);
}
