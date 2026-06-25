// ── REPLAY ────────────────────────────────────────────────────────────────────
const Replay = (() => {
  function getWeekData() {
    const state = State.get();
    const weekAgo = Date.now() - 7 * 86400000;
    const recent = state.sessionHistory.filter(s => new Date(s.date).getTime() > weekAgo);
    const aha = state.ahamoments.filter(a => new Date(a.date).getTime() > weekAgo);
    const struggles = state.struggleMoments.filter(s => new Date(s.date).getTime() > weekAgo);

    const conceptCounts = {};
    recent.forEach(s => {
      conceptCounts[s.concept] = (conceptCounts[s.concept] || 0) + 1;
    });
    const topConcept = Object.entries(conceptCounts).sort((a,b)=>b[1]-a[1])[0];
    const correctRate = recent.length > 0
      ? Math.round((recent.filter(s=>s.correct).length / recent.length) * 100) : 0;

    return { recent, aha, struggles, topConcept, correctRate, state };
  }

  function buildHTML(data) {
    const { recent, aha, struggles, topConcept, correctRate, state } = data;
    const items = [];

    if (recent.length === 0) {
      return `<div style="text-align:center;padding:32px;color:var(--muted);font-size:13px;">
        No sessions this week yet. Come back after your first lesson!
      </div>`;
    }

    // XP earned this week
    items.push(`
      <div class="replay-item">
        <div class="replay-item-top">
          <span class="replay-item-icon">⚡</span>
          <span class="replay-item-title">This week in numbers</span>
        </div>
        <div class="replay-item-body">
          ${recent.length} questions answered · ${correctRate}% correct rate · ${state.xp} total XP
        </div>
        <span class="replay-item-tag tag-streak">🔥 ${state.streak} day streak</span>
      </div>
    `);

    // Top concept
    if (topConcept) {
      items.push(`
        <div class="replay-item">
          <div class="replay-item-top">
            <span class="replay-item-icon">🎯</span>
            <span class="replay-item-title">Most practiced: ${topConcept[0]}</span>
          </div>
          <div class="replay-item-body">You came back to this concept ${topConcept[1]} time${topConcept[1]>1?'s':''}. That's how mastery works — repetition without boredom.</div>
          <span class="replay-item-tag tag-streak">Top focus area</span>
        </div>
      `);
    }

    // Aha moments
    aha.forEach(a => {
      items.push(`
        <div class="replay-item">
          <div class="replay-item-top">
            <span class="replay-item-icon">💡</span>
            <span class="replay-item-title">Aha moment — ${a.concept}</span>
          </div>
          <div class="replay-item-body">"${a.msg}"</div>
          <span class="replay-item-tag tag-aha">✓ Clicked</span>
        </div>
      `);
    });

    // Struggles turned around
    const resolved = struggles.filter(s =>
      aha.some(a => a.concept === s.concept && new Date(a.date) > new Date(s.date))
    );
    resolved.forEach(s => {
      items.push(`
        <div class="replay-item">
          <div class="replay-item-top">
            <span class="replay-item-icon">💪</span>
            <span class="replay-item-title">Struggled then cracked it — ${s.concept}</span>
          </div>
          <div class="replay-item-body">You got stuck here but didn't give up. That struggle is exactly why it'll stick.</div>
          <span class="replay-item-tag tag-aha">Turned around</span>
        </div>
      `);
    });

    // Pending struggles
    const pending = struggles.filter(s => !resolved.includes(s));
    if (pending.length > 0) {
      items.push(`
        <div class="replay-item">
          <div class="replay-item-top">
            <span class="replay-item-icon">🔧</span>
            <span class="replay-item-title">Still working on it</span>
          </div>
          <div class="replay-item-body">
            ${pending.map(s=>`<code>${s.concept}</code>`).join(', ')} — come back to these. Chicha has different angles to try.
          </div>
          <span class="replay-item-tag tag-struggle">In progress</span>
        </div>
      `);
    }

    // Motivational closer
    const closers = [
      "Every confused moment this week was a neuron firing. That's what learning sounds like.",
      "You showed up. That's the whole game. Everything else is just details.",
      "The gap between where you started and where you are right now? That's yours permanently.",
      "Nobody gets good at SQL by reading about it. You're actually doing it. Respect.",
    ];
    const closer = closers[Math.floor(Math.random() * closers.length)];
    items.push(`
      <div class="replay-item" style="border-color:rgba(139,92,246,0.2);background:rgba(139,92,246,0.06)">
        <div class="replay-item-top">
          <span class="replay-item-icon">✦</span>
          <span class="replay-item-title">From Chicha</span>
        </div>
        <div class="replay-item-body" style="color:#b0a0e0;font-style:italic;">"${closer}"</div>
      </div>
    `);

    return items.join('');
  }

  return {
    open() {
      const overlay = document.getElementById('replayOverlay');
      const content = document.getElementById('replayContent');
      const data = getWeekData();
      content.innerHTML = buildHTML(data);
      overlay.classList.remove('hidden');
    },
    close() {
      document.getElementById('replayOverlay').classList.add('hidden');
      State.set({ lastReplayDate: new Date().toISOString() });
    },
  };
})();
