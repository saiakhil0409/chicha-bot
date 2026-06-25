// ── STATE ────────────────────────────────────────────────────────────────────
const State = (() => {
  const KEY = 'chicha_v2_state';
  const defaults = {
    topic: 'SQL',
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    masteredConcepts: [],
    sessionHistory: [],   // [{date,topic,concept,correct,msg}]
    ahamoments: [],       // [{date,concept,msg}]
    struggleMoments: [],
    totalCorrect: 0,
    totalWrong: 0,
    moodScore: 50,        // 0-100
    lastReplayDate: null,
    firstOpenDate: null,
  };

  function load() {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
    catch { return { ...defaults }; }
  }

  function save(s) {
    localStorage.setItem(KEY, JSON.stringify(s));
  }

  let _state = load();

  // Mark first open
  if (!_state.firstOpenDate) {
    _state.firstOpenDate = new Date().toISOString();
    save(_state);
  }

  return {
    get: () => _state,
    set: (patch) => { _state = { ..._state, ...patch }; save(_state); },
    addXP: (n) => {
      _state.xp += n;
      // streak logic
      const today = new Date().toDateString();
      if (_state.lastActiveDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        _state.streak = _state.lastActiveDate === yesterday ? _state.streak + 1 : 1;
        _state.lastActiveDate = today;
      }
      save(_state);
    },
    masterConcept: (concept) => {
      if (!_state.masteredConcepts.includes(concept)) {
        _state.masteredConcepts.push(concept);
        save(_state);
      }
    },
    logSession: (entry) => {
      _state.sessionHistory.push({ date: new Date().toISOString(), ...entry });
      if (_state.sessionHistory.length > 200) _state.sessionHistory.shift();
      if (entry.correct) _state.totalCorrect++; else _state.totalWrong++;
      save(_state);
    },
    logAha: (concept, msg) => {
      _state.ahamoments.push({ date: new Date().toISOString(), concept, msg });
      save(_state);
    },
    logStruggle: (concept, msg) => {
      _state.struggleMoments.push({ date: new Date().toISOString(), concept, msg });
      if (_state.struggleMoments.length > 50) _state.struggleMoments.shift();
      save(_state);
    },
  };
})();
