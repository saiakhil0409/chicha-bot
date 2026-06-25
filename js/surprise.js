// ── SURPRISE ──────────────────────────────────────────────────────────────────
const Surprise = (() => {
  const KEY = 'chicha_surprise_seen';

  function getMessage() {
    const state = State.get();
    const firstDate = new Date(state.firstOpenDate || Date.now());
    const today = new Date();
    const daysSinceFirst = Math.floor((today - firstDate) / 86400000);
    const streak = state.streak || 0;
    const xp = state.xp || 0;

    // Day 0 — very first open ever
    if (daysSinceFirst === 0 && !localStorage.getItem('chicha_d0')) {
      localStorage.setItem('chicha_d0', '1');
      return {
        show: true,
        msg: `Hey Neo. 👋\n\nChicha is live.\n\nYou spent hours building a tool to make yourself smarter. That's already smarter than most people.\n\nNow let's actually use it.\n\nPick a topic. Ask anything. Don't be polite — I can take it.\n\n— Chicha ✦`
      };
    }

    // Day 1 — THE surprise (tomorrow morning)
    if (daysSinceFirst === 1 && !localStorage.getItem('chicha_d1')) {
      localStorage.setItem('chicha_d1', '1');
      return {
        show: true,
        msg: `Good morning, Neo. ☕\n\nWhile you were sleeping, I was thinking.\n\nYou built me to teach you. Most people build tools and forget them by Tuesday.\n\nBut you came back.\n\nThat's the only difference between people who learn and people who don't.\n\nNow stop reading this and let's get to work. 🚀\n\n— Chicha`
      };
    }

    // Streak milestones
    if (streak === 3 && !localStorage.getItem('chicha_s3')) {
      localStorage.setItem('chicha_s3', '1');
      return { show: true, msg: `3 days straight.\n\nI wasn't sure you'd make it past day 2, honestly.\n\nProve me wrong again tomorrow. 🔥\n\n— Chicha` };
    }

    if (streak === 7 && !localStorage.getItem('chicha_s7')) {
      localStorage.setItem('chicha_s7', '1');
      return { show: true, msg: `One full week, Neo.\n\nMost people quit on day 2. You're on day 7.\n\nYou're not "trying to learn SQL" anymore.\n\nYou're someone who learns SQL. Different thing entirely. 🏆\n\n— Chicha` };
    }

    if (xp >= 1000 && !localStorage.getItem('chicha_xp1k')) {
      localStorage.setItem('chicha_xp1k', '1');
      return { show: true, msg: `1,000 XP.\n\nJust so you know — that number isn't gamification.\n\nEach point is a moment your brain rewired itself.\n\n1,000 of those. Not bad for someone who started from scratch. 💡\n\n— Chicha` };
    }

    return { show: false };
  }

  return {
    checkAndShow() {
      const msg = getMessage();
      if (!msg.show) return;
      document.getElementById('surpriseMsg').textContent = msg.msg;
      document.getElementById('surpriseOverlay').classList.remove('hidden');
    },

    dismiss() {
      document.getElementById('surpriseOverlay').classList.add('hidden');
      setTimeout(() => Face.greeting(), 300);
    },
  };
})();
