// ── CHAT ─────────────────────────────────────────────────────────────────────
const Chat = (() => {
  const HIST_KEY = 'chicha_chat_history';
  const MSG_KEY  = 'chicha_chat_msgs';

  let _history             = [];
  let _currentSpark        = null;
  let _wrongAttempts       = 0;   // wrong answers this difficulty level
  let _correctStreak       = 0;   // global correct streak
  let _mode                = 'chat';
  let _practiceAsked       = false;
  let _masteredThisSession = false;
  let _correctThisConcept  = 0;   // correct answers toward mastery
  let _currentDifficulty   = 'easy'; // easy → intermediate → hard
  let _sessionStartTime    = null; // for session summary timing
  let _lastActivity        = Date.now(); // for idle detection

  // ── Concept complexity tiers ──────────────────────────────────────────────
  // Theory: 5 total (2 easy MCQ, 2 intermediate MCQ, 1 explain-back)
  // Simple SQL: 3 total (1 easy, 1 intermediate, 1 hard)
  // Medium SQL: 5 total (2 easy, 2 intermediate, 1 hard)
  // Complex SQL: 6 total (2 easy, 2 intermediate, 2 hard)

  const THEORY_CONCEPTS = [
    'What is a Database','What is a Table','Data types',
    'What is Power BI','Connecting data sources','Basic visuals',
    'Connecting data','Dimensions vs Measures','Basic chart types',
  ];
  const SIMPLE_SQL = [
    'CREATE DATABASE','DROP DATABASE','LIMIT','DISTINCT','Column aliases',
  ];
  const COMPLEX_SQL = [
    'INNER JOIN','LEFT JOIN','RIGHT JOIN','FULL OUTER JOIN','Self JOIN',
    'Multi-table JOIN','Subqueries','CTEs (WITH clause)',
    'Window functions','RANK & DENSE_RANK','LAG & LEAD','Running totals',
  ];

  // Returns { easy, intermediate, hard, total } for a concept
  function getMasteryPlan(concept) {
    if (THEORY_CONCEPTS.some(t => concept.toLowerCase().includes(t.toLowerCase()))) {
      return { easy:2, intermediate:2, hard:1, total:5, type:'theory' };
    }
    if (SIMPLE_SQL.some(t => concept.toLowerCase().includes(t.toLowerCase()))) {
      return { easy:1, intermediate:1, hard:1, total:3, type:'simple' };
    }
    if (COMPLEX_SQL.some(t => concept.toLowerCase().includes(t.toLowerCase()))) {
      return { easy:2, intermediate:2, hard:2, total:6, type:'complex' };
    }
    return { easy:2, intermediate:2, hard:1, total:5, type:'medium' }; // default
  }

  function isTheory(concept) {
    return THEORY_CONCEPTS.some(t => concept.toLowerCase().includes(t.toLowerCase()));
  }

  // Returns current difficulty and target count for it
  function getDifficultyTarget() {
    const plan = getMasteryPlan(_currentSpark?.concept || '');
    const easy_done = Math.min(_correctThisConcept, plan.easy);
    const inter_done = Math.min(Math.max(_correctThisConcept - plan.easy, 0), plan.intermediate);
    const hard_done  = Math.max(_correctThisConcept - plan.easy - plan.intermediate, 0);
    if (_correctThisConcept < plan.easy) return { level:'easy', target: plan.easy, done: easy_done };
    if (_correctThisConcept < plan.easy + plan.intermediate) return { level:'intermediate', target: plan.intermediate, done: inter_done };
    return { level:'hard', target: plan.hard, done: hard_done };
  }

  // ── Inner Monologue triggers ──────────────────────────────────────────────
  function checkMonologue() {
    const s = State.get();
    const msgs = document.getElementById('messages');
    if (!msgs) return;

    // 3 correct in a row — confidence booster
    if (_correctStreak === 3) {
      injectMonologue(`Okay I'm actually impressed. I gave you harder questions on purpose and you didn't flinch. Let's see how you handle what's coming next… 👀`, 'boost');
      return;
    }

    // Struggling on same difficulty — pivot
    if (_wrongAttempts === 2) {
      injectMonologue(`Alright, clearly my previous angle isn't landing. Let me try this from a completely different direction — same concept, different approach.`, 'pivot');
      return;
    }

    // Idle for 3+ minutes mid-session
    const idleMs = Date.now() - _lastActivity;
    if (idleMs > 180000 && _mode === 'spark') {
      injectMonologue(`Still there? No judgment. Take your time — this stuff actually takes a moment to click. When you're ready, just reply.`, 'idle');
      return;
    }
  }

  function injectMonologue(text, type) {
    const msgs = document.getElementById('messages');
    if (!msgs) return;
    const colors = {
      boost: { bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.2)', icon:'⚡' },
      pivot: { bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.2)',  icon:'🔄' },
      idle:  { bg:'rgba(52,211,153,0.06)',  border:'rgba(52,211,153,0.15)', icon:'💭' },
      info:  { bg:'rgba(139,92,246,0.06)',  border:'rgba(139,92,246,0.15)', icon:'✦' },
    };
    const c = colors[type] || colors.info;
    const div = document.createElement('div');
    div.className = 'msg msg-chicha monologue-msg';
    div.innerHTML = `
      <div class="msg-av" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9)">${c.icon}</div>
      <div>
        <div class="msg-bubble" style="background:${c.bg};border-color:${c.border};font-style:italic;color:#b0a0d0">
          ${escapeAndFormat(text)}
        </div>
      </div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ── Comeback detection ────────────────────────────────────────────────────
  function checkComeback() {
    const s = State.get();
    if (!s.lastActiveDate) return;
    const lastDate = new Date(s.lastActiveDate);
    const today    = new Date();
    const daysDiff = Math.floor((today - lastDate) / 86400000);
    if (daysDiff >= 2) {
      setTimeout(() => {
        injectMonologue(`You're back after ${daysDiff} day${daysDiff>1?'s':''}. No judgment. But let's do a quick 60-second recap before we continue — just to make sure the last session didn't evaporate overnight. 🧠`, 'info');
      }, 1500);
    }
  }

  // ── Persistence ───────────────────────────────────────────────────────────
  function saveHistory() {
    try { sessionStorage.setItem(HIST_KEY, JSON.stringify(_history.slice(-24))); } catch(e) {}
  }
  function loadHistory() {
    try { return JSON.parse(sessionStorage.getItem(HIST_KEY) || '[]'); } catch { return []; }
  }
  function saveMsgs() {
    try {
      const msgs = document.getElementById('messages');
      if (msgs) sessionStorage.setItem(MSG_KEY, msgs.innerHTML);
    } catch(e) {}
  }
  function restoreMsgs() {
    try {
      const saved = sessionStorage.getItem(MSG_KEY);
      const msgs  = document.getElementById('messages');
      if (saved && msgs && saved.length > 10) {
        msgs.innerHTML = saved;
        msgs.scrollTop = msgs.scrollHeight;
        document.getElementById('sparkCard').style.display = 'none';
        document.getElementById('welcomeState').style.display = 'none';
        document.getElementById('backToSparkBar').style.visibility = 'visible';
        return true;
      }
    } catch(e) {}
    return false;
  }

  // ── System prompt ─────────────────────────────────────────────────────────
  function systemPrompt() {
    const s        = State.get();
    const mood     = Mood.getTone();
    const topic    = App.currentTopic();
    const mastered = s.masteredConcepts.slice(-5).join(', ') || 'none yet';
    const concept  = _currentSpark?.concept || '';
    const theory   = isTheory(concept);
    const plan     = getMasteryPlan(concept);
    const diff     = getDifficultyTarget();

    return `You are Chicha — a sharp, warm, slightly dry AI tutor for ${topic}.

PERSONALITY: Brilliant friend who knows data. Vivid analogies. Direct. Dry humour. Never "Great question!" Never "Certainly!". Max 220 words unless showing code.

MOOD: ${mood}
STUDENT: XP=${s.xp} | Streak=${s.streak} | Recently mastered: ${mastered}
CONCEPT: "${concept}" | Type: ${plan.type} | Difficulty now: ${diff.level.toUpperCase()}

━━━ CONCEPT BOUNDARY — CRITICAL ━━━
You are ONLY allowed to ask questions about "${concept}".
FORBIDDEN topics (do NOT ask about these even if related):
- Any concept not yet introduced in the curriculum
- Relationships between tables (that's a JOIN concept)
- Normalization (advanced concept)
- Primary keys (that's CREATE TABLE concept)
- Any SQL syntax unless concept IS a SQL command

ALLOWED for "${concept}":
${theory
  ? `- What "${concept}" means
- Why it exists
- Real-world examples of "${concept}"
- How to recognise "${concept}" in a scenario`
  : `- Writing the syntax for "${concept}"
- Identifying correct/incorrect usage of "${concept}"
- Predicting the output of a "${concept}" query`}

━━━ DIFFICULTY GUIDE ━━━
Easy: Basic recall about "${concept}" only
Intermediate: Slightly varied scenario, still only "${concept}"
Hard: ${theory ? `Ask student to explain "${concept}" in their own words` : `Edge case or tricky scenario, still only "${concept}"`}

━━━ PRACTICE FLOW ━━━
When student says yes/sure/ready/ok/let's go:
${theory
  ? `Give ONE MCQ at ${diff.level} difficulty STRICTLY about "${concept}":
Question: [question about "${concept}" ONLY]
(a) [option]
(b) [option]
(c) [option]
(d) [option]
Do NOT say [CORRECT] yet.`
  : `Give ONE SQL task at ${diff.level} difficulty about "${concept}" using Indian data.
Do NOT say [CORRECT] yet.`}

━━━ WRONG ANSWER HANDLING ━━━
${diff.level === 'easy'
  ? `Easy wrong → say [WRONG], re-explain specifically what they got wrong about "${concept}". Ask same difficulty again.`
  : `Wrong → say [WRONG], diagnose WHY without giving the answer. Ask similar question.`}

━━━ SIGNALS ━━━
[AHA]     → "ohh/I get it/that makes sense/so basically/clicked"
[CORRECT] → ONLY on actual correct answer. NOT for "yes/sure/ok".
[WRONG]   → Wrong answer. Diagnose, don't solve.

━━━ DONT KNOW ━━━
"idk/not sure/give up/:(":
1. One empathy sentence
2. One diagnostic question
3. Stop. Wait.

FORMAT: Backticks inline, triple backticks for SQL.`;
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────
  function appendMsg(role, text) {
    const msgs = document.getElementById('messages');
    const div  = document.createElement('div');
    div.className = `msg msg-${role}`;
    const av   = role === 'chicha' ? '✦' : 'S';
    const meta = role === 'chicha' ? 'Chicha' : 'You';
    const display = text.replace(/\[(AHA|CORRECT|WRONG)\]/g, '').trim();
    div.innerHTML = `
      <div class="msg-av">${av}</div>
      <div>
        <div class="msg-bubble">${escapeAndFormat(display)}</div>
        <div class="msg-meta">${meta} · just now</div>
      </div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function escapeAndFormat(text) {
    text = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    text = text.replace(/```(?:sql)?\n?([\s\S]*?)```/g, (_,code) =>
      `<div class="code-block">${highlightSQL(code.trim())}</div>`);
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\n/g, '<br>');
    return text;
  }

  function highlightSQL(code) {
    const kws = ['SELECT','FROM','WHERE','JOIN','INNER','LEFT','RIGHT','OUTER','ON','GROUP','BY','ORDER','HAVING','LIMIT','DISTINCT','AS','AND','OR','NOT','IN','IS','NULL','LIKE','BETWEEN','WITH','CASE','WHEN','THEN','ELSE','END','UNION','INSERT','UPDATE','DELETE','CREATE','TABLE','DATABASE','INDEX','DROP','ALTER','INTO','VALUES','SET','PRIMARY','KEY','VARCHAR','INT','DATE','DECIMAL'];
    const fns = ['COUNT','SUM','AVG','MIN','MAX','COALESCE','ISNULL','ROW_NUMBER','RANK','DENSE_RANK','LAG','LEAD','OVER','PARTITION','STRFTIME','UPPER','LOWER','LENGTH','TRIM','ROUND','CAST'];
    let r = code;
    r = r.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    r = r.replace(/(--[^\n]*)/g,'<span class="cm">$1</span>');
    r = r.replace(/'([^']*)'/g,"<span class='str'>'$1'</span>");
    kws.forEach(k => { r = r.replace(new RegExp(`\\b${k}\\b`,'g'),`<span class="kw">${k}</span>`); });
    fns.forEach(f => { r = r.replace(new RegExp(`\\b${f}\\b`,'g'),`<span class="fn">${f}</span>`); });
    return r;
  }

  function showTyping() {
    const msgs = document.getElementById('messages');
    const div  = document.createElement('div');
    div.id = 'typingIndicator';
    div.className = 'msg msg-chicha';
    div.innerHTML = `<div class="msg-av">✦</div><div><div class="msg-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function removeTyping() { document.getElementById('typingIndicator')?.remove(); }

  // ── API call ───────────────────────────────────────────────────────────────
  async function callAI(userMsg) {
    const key = Auth.getKey();
    if (!key) throw new Error('No API key. Please log in again.');
    _history.push({ role: 'user', content: userMsg });
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 700,
        messages: [
          { role:'system', content: systemPrompt() },
          ..._history.slice(-12),
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${res.status}`);
    }
    const data  = await res.json();
    const reply = data.choices[0].message.content;
    _history.push({ role:'assistant', content: reply });
    if (_history.length > 24) _history = _history.slice(-24);
    return reply;
  }

  // ── Signal processing ──────────────────────────────────────────────────────
  function processSignals(reply) {
    const plan = getMasteryPlan(_currentSpark?.concept || '');

    if (reply.includes('[CORRECT]') && !_masteredThisSession) {
      _correctThisConcept++;
      _correctStreak++;
      _wrongAttempts = 0;
      Mood.update(true);
      Face.correct(_correctStreak);
      State.addXP(10 + Math.min(_correctStreak * 3, 20));
      State.logSession({ topic: App.currentTopic(), concept: _currentSpark?.concept, correct: true });
      updateProgressUI();
      showProgressDots(plan);
      checkMonologue();

      if (_correctThisConcept >= plan.total) {
        // FULLY MASTERED
        _masteredThisSession = true;
        State.addXP(50); // mastery bonus
        if (_currentSpark?.concept) State.masterConcept(_currentSpark.concept);
        updateProgressUI();
        setTimeout(() => showSessionSummary(plan), 800);
      }

    } else if (reply.includes('[WRONG]')) {
      _wrongAttempts++;
      _correctStreak = 0;
      Mood.update(false);
      Face.wrong(_wrongAttempts);
      State.logSession({ topic: App.currentTopic(), concept: _currentSpark?.concept, correct: false });
      if (_currentSpark?.concept) State.logStruggle(_currentSpark.concept, reply.slice(0,80));
      checkMonologue();

    } else if (reply.includes('[AHA]')) {
      if (_currentSpark?.concept) State.logAha(_currentSpark.concept, reply.slice(0,80));
      Face.aha();
    }
  }

  // ── Progress dots ──────────────────────────────────────────────────────────
  function showProgressDots(plan) {
    document.getElementById('masteryToast')?.remove();
    const msgs = document.getElementById('messages');
    if (!msgs) return;

    const done  = _correctThisConcept;
    const total = plan.total;
    const diff  = getDifficultyTarget();

    // Build segmented dots: easy | intermediate | hard
    const sections = [
      { label:'Easy', count: plan.easy, color:'#34d399' },
      { label:'Mid',  count: plan.intermediate, color:'#f59e0b' },
      { label:'Hard', count: plan.hard, color:'#e8002d' },
    ];

    let filled = done;
    const dots = sections.map(sec => {
      const secDots = Array.from({length: sec.count}).map(() => {
        const on = filled > 0;
        if (on) filled--;
        return `<div style="width:10px;height:10px;border-radius:50%;background:${on ? sec.color : '#1a1a2e'};box-shadow:${on ? `0 0 6px ${sec.color}` : 'none'};transition:all .3s;margin:0 2px"></div>`;
      }).join('');
      return `<div style="display:flex;align-items:center;gap:2px">${secDots}</div>
              <div style="font-size:9px;color:#555;font-family:'JetBrains Mono',monospace;margin:0 4px">${sec.label}</div>`;
    }).join('<div style="color:#2a2a4a;margin:0 4px">|</div>');

    const div = document.createElement('div');
    div.id = 'masteryToast';
    div.style.cssText = 'display:flex;justify-content:center;padding:6px 0;';
    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:4px;background:#0d0d1c;border:1px solid rgba(139,92,246,0.2);border-radius:20px;padding:7px 16px;">
        ${dots}
        <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#8b5cf6;margin-left:8px;">${done}/${total}</span>
      </div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ── Session summary card ───────────────────────────────────────────────────
  function showSessionSummary(plan) {
    const msgs = document.getElementById('messages');
    if (!msgs) return;
    const concept  = _currentSpark?.concept || 'concept';
    const topic    = App.currentTopic();
    const sections = CURRICULUM[topic] || [];
    const all      = sections.flatMap(s => s.concepts);
    const mastered = State.get().masteredConcepts;
    const next     = all.find(c => !mastered.includes(c));
    const elapsed  = _sessionStartTime ? Math.round((Date.now() - _sessionStartTime) / 60000) : 0;
    const xpEarned = plan.total * 10 + 50;

    // Celebratory message based on concept difficulty
    const celebrations = {
      theory:  `You just built the foundation. Everything else in SQL sits on top of what you learned here.`,
      simple:  `Clean and quick. Exactly how it should go.`,
      medium:  `That wasn't trivial. ${plan.total} questions, you got through all of them.`,
      complex: `That was a ${concept} question. Most people spend days on that. You're not most people.`,
    };
    const celebrate = celebrations[plan.type] || celebrations.medium;

    const div = document.createElement('div');
    div.id = 'advanceBtn';
    div.className = 'msg msg-chicha';
    div.innerHTML = `
      <div class="msg-av">✦</div>
      <div style="width:100%">
        <div class="msg-bubble" style="background:rgba(52,211,153,0.06);border:1px solid rgba(52,211,153,0.25);padding:18px 20px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <span style="font-size:28px">✅</span>
            <div>
              <div style="font-weight:700;font-size:16px;color:#34d399">Concept Mastered</div>
              <div style="font-size:12px;color:#6b6b8a;font-family:'JetBrains Mono',monospace">${concept}</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
            <div style="background:#0a0a14;border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:18px;font-weight:700;color:#f59e0b">${plan.total}/${plan.total}</div>
              <div style="font-size:10px;color:#555;font-family:'JetBrains Mono',monospace">correct</div>
            </div>
            <div style="background:#0a0a14;border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:18px;font-weight:700;color:#8b5cf6">+${xpEarned}</div>
              <div style="font-size:10px;color:#555;font-family:'JetBrains Mono',monospace">XP earned</div>
            </div>
            <div style="background:#0a0a14;border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:18px;font-weight:700;color:#34d399">${elapsed || '<1'}m</div>
              <div style="font-size:10px;color:#555;font-family:'JetBrains Mono',monospace">time taken</div>
            </div>
          </div>
          <div style="font-size:13px;color:#9999bb;line-height:1.6;margin-bottom:14px;font-style:italic">"${celebrate}"</div>
          ${next
            ? `<button onclick="Chat.advanceToNext()" style="width:100%;background:#34d399;color:#0a0a0a;border:none;padding:10px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:0.3px">Continue → ${next}</button>`
            : `<div style="text-align:center;font-size:13px;color:#f59e0b;font-weight:600">🏆 You've mastered all concepts in ${topic}!</div>`
          }
        </div>
      </div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ── Progress UI ────────────────────────────────────────────────────────────
  function updateProgressUI() {
    const s     = State.get();
    const topic = App.currentTopic();
    const xpEl  = document.getElementById('psXp');
    const stEl  = document.getElementById('psStreak');
    const fill  = document.getElementById('psFill');
    if (xpEl) xpEl.textContent = `${s.xp} XP`;
    if (stEl) stEl.textContent = s.streak > 0 ? `🔥 ${s.streak}` : '';
    if (fill) {
      const sections = CURRICULUM[topic] || [];
      const total    = sections.flatMap(sc => sc.concepts).length;
      if (total > 0) {
        const done = s.masteredConcepts.filter(c =>
          sections.flatMap(sc => sc.concepts).includes(c)).length;
        fill.style.width = `${Math.round((done/total)*100)}%`;
      }
    }
    App.syncSidebar();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init() {
      _history             = loadHistory();
      _currentSpark        = null;
      _wrongAttempts       = 0;
      _correctStreak       = 0;
      _practiceAsked       = false;
      _masteredThisSession = false;
      _correctThisConcept  = 0;
      _currentDifficulty   = 'easy';
      _mode                = 'chat';
      _lastActivity        = Date.now();
      updateProgressUI();
      const restored = restoreMsgs();
      const sparkCard = document.getElementById('sparkCard');
      if (sparkCard) sparkCard.style.display = 'none';
      if (!restored) {
        const welcome = document.getElementById('welcomeState');
        if (welcome) welcome.style.display = 'flex';
      }
      checkComeback();
    },

    showSpark() {
      const sparkCard = document.getElementById('sparkCard');
      const welcome   = document.getElementById('welcomeState');
      if (sparkCard) sparkCard.style.display = '';
      if (welcome)   welcome.style.display   = 'none';
      App.showPanel('chat');
      const panel = document.getElementById('chatPanel');
      if (panel) panel.scrollTop = 0;
    },

    async startSpark() {
      const spark = _currentSpark;
      if (!spark) return;
      _mode                = 'spark';
      _practiceAsked       = false;
      _masteredThisSession = false;
      _correctThisConcept  = 0;
      _wrongAttempts       = 0;
      _currentDifficulty   = 'easy';
      _sessionStartTime    = Date.now();
      _lastActivity        = Date.now();

      document.getElementById('sparkCard').style.display    = 'none';
      document.getElementById('messages').innerHTML         = '';
      document.getElementById('welcomeState').style.display = 'none';
      document.getElementById('backToSparkBar').style.visibility = 'visible';
      document.getElementById('userInput').placeholder = 'Reply to Chicha…';
      App.collapseSpark();

      const concept = spark.concept || spark.title;
      const theory  = isTheory(concept);
      const plan    = getMasteryPlan(concept);

      const msg = theory
        ? `Teach ONLY: "${concept}" — THEORY, no SQL code.

**Step 1 — What is it?**
One cricket/IPL/Bollywood analogy. Max 3 sentences.

**Step 2 — Why does it matter?**
2 sentences. Why must a beginner know this before SQL?

**Step 3 — Real world:**
One Indian app example (Swiggy/IRCTC/Zomato/IPL). No code.

End with exactly: "Ready to try one yourself? Just say yes."
STRICT: No SQL. No code. Theory only.`

        : `Teach ONLY: "${concept}" — SQL command. Complexity: ${plan.type}.

**Step 1 — Analogy:**
Cricket/IPL/Bollywood analogy. Zero code. Max 3 sentences.

**Step 2 — Syntax:**
ONE code block for "${concept}" ONLY. Explain each line in one sentence.

**Step 3 — Example:**
ONE example with Indian data (3-4 lines max).

End with exactly: "Ready to try one yourself? Just say yes."
STRICT: Only "${concept}" syntax. Nothing else.`;

      showTyping();
      try {
        const reply = await callAI(msg);
        removeTyping();
        appendMsg('chicha', reply);
        _practiceAsked = false;
        Visualizer.tryInject(concept);
        saveHistory(); saveMsgs();
      } catch(e) {
        removeTyping();
        appendMsg('chicha', `Can't reach Chicha right now: ${e.message}`);
      }
    },

    surpriseSpark() {
      const topic   = App.currentTopic();
      _currentSpark = getSparkForTopic(topic, true);
      const el = {
        title:   document.getElementById('sparkTitle'),
        body:    document.getElementById('sparkBody'),
        concept: document.getElementById('sparkConcept'),
        topic:   document.getElementById('psTopic'),
      };
      if (el.title)   el.title.textContent   = _currentSpark.title;
      if (el.body)    el.body.textContent     = _currentSpark.analogy;
      if (el.concept) el.concept.textContent  = _currentSpark.concept || '';
      if (el.topic)   el.topic.textContent    = `${topic} · ${_currentSpark.concept || ''}`;
      Chat.showSpark();
    },

    openChat() {
      _mode = 'chat';
      const sparkCard = document.getElementById('sparkCard');
      const welcome   = document.getElementById('welcomeState');
      const backBar   = document.getElementById('backToSparkBar');
      if (sparkCard) sparkCard.style.display  = 'none';
      if (welcome)   welcome.style.display    = 'none';
      if (backBar)   backBar.style.visibility = 'hidden';
      document.getElementById('userInput').placeholder = 'Ask Chicha anything…';
      const msgs = document.getElementById('messages');
      if (msgs && msgs.children.length === 0) {
        const chatReady = document.getElementById('chatReadyState');
        if (chatReady) chatReady.style.display = 'flex';
      }
      App.showPanel('chat');
    },

    async send() {
      const input = document.getElementById('userInput');
      const text  = input.value.trim();
      if (!text) return;
      input.value = '';
      input.style.height = 'auto';
      _lastActivity = Date.now();

      document.getElementById('welcomeState').style.display = 'none';
      const chatReady = document.getElementById('chatReadyState');
      if (chatReady) chatReady.style.display = 'none';

      if (!_practiceAsked && /^(yes|sure|ok|okay|ready|let'?s go|yep|yeah|go)$/i.test(text.trim())) {
        _practiceAsked = true;
      }

      appendMsg('user', text);
      showTyping();

      try {
        const reply = await callAI(text);
        removeTyping();
        appendMsg('chicha', reply);
        processSignals(reply);
        saveHistory(); saveMsgs();
      } catch(e) {
        removeTyping();
        appendMsg('chicha', `Something went wrong: ${e.message}`);
      }
    },

    advanceToNext() {
      const topic    = App.currentTopic();
      const sections = CURRICULUM[topic] || [];
      const all      = sections.flatMap(s => s.concepts);
      const mastered = State.get().masteredConcepts;
      const next     = all.find(c => !mastered.includes(c));
      if (!next) return;

      document.getElementById('advanceBtn')?.remove();
      document.getElementById('masteryToast')?.remove();

      // Clear history so AI starts fresh on new concept — no context bleed
      _history             = [];
      _currentSpark        = getSparkForTopic(topic);
      _masteredThisSession = false;
      _practiceAsked       = false;
      _correctThisConcept  = 0;
      _wrongAttempts       = 0;
      _currentDifficulty   = 'easy';
      _sessionStartTime    = Date.now();

      const el = {
        title:   document.getElementById('sparkTitle'),
        body:    document.getElementById('sparkBody'),
        concept: document.getElementById('sparkConcept'),
        topic:   document.getElementById('psTopic'),
      };
      if (el.title)   el.title.textContent   = _currentSpark.title;
      if (el.body)    el.body.textContent     = _currentSpark.analogy;
      if (el.concept) el.concept.textContent  = _currentSpark.concept || '';
      if (el.topic)   el.topic.textContent    = `${topic} · ${_currentSpark.concept || ''}`;

      Chat.startSpark();
    },

    loadSpark(topic) {
      _currentSpark = getSparkForTopic(topic);
      const el = {
        title:   document.getElementById('sparkTitle'),
        body:    document.getElementById('sparkBody'),
        concept: document.getElementById('sparkConcept'),
        topic:   document.getElementById('psTopic'),
      };
      if (el.title)   el.title.textContent   = _currentSpark.title;
      if (el.body)    el.body.textContent     = _currentSpark.analogy;
      if (el.concept) el.concept.textContent  = _currentSpark.concept || '';
      if (el.topic)   el.topic.textContent    = `${topic} · ${_currentSpark.concept || ''}`;
    },

    backToSpark() {
      _history             = [];
      _masteredThisSession = false;
      _practiceAsked       = false;
      _correctThisConcept  = 0;
      _wrongAttempts       = 0;
      _currentDifficulty   = 'easy';
      sessionStorage.removeItem(HIST_KEY);
      sessionStorage.removeItem(MSG_KEY);
      document.getElementById('messages').innerHTML = '';
      document.getElementById('welcomeState').style.display = 'none';
      document.getElementById('backToSparkBar').style.visibility = 'hidden';
      const chatReady = document.getElementById('chatReadyState');
      if (chatReady) chatReady.style.display = 'none';
      Chat.showSpark();
    },
  };
})();
