// ── CHAT ─────────────────────────────────────────────────────────────────────
const Chat = (() => {
  const HIST_KEY = 'chicha_chat_history';
  const MSG_KEY  = 'chicha_chat_msgs';

  let _history             = [];
  let _currentSpark        = null;
  let _wrongAttempts       = 0;
  let _correctStreak       = 0;
  let _mode                = 'chat';       // 'chat' | 'spark'
  let _gear                = 'lesson';     // 'lesson' | 'friend' — two gears
  let _practiceAsked       = false;
  let _masteredThisSession = false;
  let _correctThisConcept  = 0;
  let _currentDifficulty   = 'easy';
  let _sessionStartTime    = null;
  let _lastActivity        = Date.now();
  let _monologueFired      = { boost:false, pivot:false }; // per concept

  // ── Concept complexity tiers ──────────────────────────────────────────────
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

  function getMasteryPlan(concept) {
    if (!concept) return { easy:2, intermediate:2, hard:1, total:5, type:'medium' };
    if (THEORY_CONCEPTS.some(t => concept.toLowerCase().includes(t.toLowerCase())))
      return { easy:2, intermediate:2, hard:1, total:5, type:'theory' };
    if (SIMPLE_SQL.some(t => concept.toLowerCase().includes(t.toLowerCase())))
      return { easy:1, intermediate:1, hard:1, total:3, type:'simple' };
    if (COMPLEX_SQL.some(t => concept.toLowerCase().includes(t.toLowerCase())))
      return { easy:2, intermediate:2, hard:2, total:6, type:'complex' };
    return { easy:2, intermediate:2, hard:1, total:5, type:'medium' };
  }

  function isTheory(concept) {
    return THEORY_CONCEPTS.some(t => concept.toLowerCase().includes(t.toLowerCase()));
  }

  function getDifficultyTarget() {
    const plan = getMasteryPlan(_currentSpark?.concept || '');
    if (_correctThisConcept < plan.easy)
      return { level:'easy', target:plan.easy, done:_correctThisConcept };
    if (_correctThisConcept < plan.easy + plan.intermediate)
      return { level:'intermediate', target:plan.intermediate, done:_correctThisConcept - plan.easy };
    return { level:'hard', target:plan.hard, done:_correctThisConcept - plan.easy - plan.intermediate };
  }

  // ── Message classifier ────────────────────────────────────────────────────
  // Returns: 'answer' | 'meta' | 'tangent' | 'stuck' | 'clarify' | 'ready'
  function classifyMessage(text) {
    const t = text.toLowerCase().trim();

    // Ready to practice
    if (/^(yes|sure|ok|okay|ready|let'?s go|yep|yeah|go|proceed)$/i.test(t))
      return 'ready';

    // Single letter or option — MCQ answer
    if (/^[a-d]$/i.test(t)) return 'answer';

    // SQL code
    if (/select|insert|update|delete|create|drop|alter|from|where/i.test(t))
      return 'answer';

    // Stuck signals
    if (/don'?t (know|get|understand)|no idea|idk|confused|lost|stuck|give up|not sure|😭|🤷|:\(/.test(t))
      return 'stuck';

    // Meta — asking about the learning path
    if (/why (are we|this topic|did you|switch)|what('?s| is) next|what topic|which concept|can we go back|skip this|change topic|curriculum|roadmap/.test(t))
      return 'meta';

    // Clarification — asking about current concept
    if (/what (does|is|do)|how does|why does|can you explain|what'?s the diff|again|example|show me/.test(t))
      return 'clarify';

    // Tangent — off-topic curiosity
    if (/do companies|job|salary|career|better than|vs |difference between|recommend|should i|which is best|in real|actually use/.test(t))
      return 'tangent';

    return 'answer'; // default — treat as answer
  }

  // ── Inner Monologue ───────────────────────────────────────────────────────
  function checkMonologue() {
    // Only fire when crossing difficulty level — not just streak count
    const diff = getDifficultyTarget();

    // Confidence boost — fired ONCE when entering intermediate tier
    if (diff.level === 'intermediate' && diff.done === 0 && !_monologueFired.boost) {
      _monologueFired.boost = true;
      injectMonologue(`Easy tier done. Now I'm going to make it slightly harder — same concept, different angle. Don't overthink it. 👀`, 'boost');
      return;
    }

    // Pivot — fired ONCE when wrong twice on same difficulty
    if (_wrongAttempts === 2 && !_monologueFired.pivot) {
      _monologueFired.pivot = true;
      injectMonologue(`My last angle clearly wasn't landing. Let me try a completely different approach — same concept, different way in.`, 'pivot');
      return;
    }

    // Idle — 3 mins of no activity
    if (Date.now() - _lastActivity > 180000 && _mode === 'spark') {
      injectMonologue(`Still there? Take your time. This stuff takes a moment to click. Ready when you are.`, 'idle');
    }
  }

  function injectMonologue(text, type) {
    const msgs = document.getElementById('messages');
    if (!msgs) return;
    const c = {
      boost: { bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.2)', icon:'⚡' },
      pivot: { bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.2)',  icon:'🔄' },
      idle:  { bg:'rgba(52,211,153,0.06)',  border:'rgba(52,211,153,0.15)', icon:'💭' },
      info:  { bg:'rgba(139,92,246,0.06)',  border:'rgba(139,92,246,0.15)', icon:'✦' },
      friend:{ bg:'rgba(52,211,153,0.06)',  border:'rgba(52,211,153,0.2)',  icon:'💬' },
    }[type] || { bg:'rgba(139,92,246,0.06)', border:'rgba(139,92,246,0.15)', icon:'✦' };
    const div = document.createElement('div');
    div.className = 'msg msg-chicha monologue-msg';
    div.innerHTML = `
      <div class="msg-av" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9)">${c.icon}</div>
      <div><div class="msg-bubble" style="background:${c.bg};border-color:${c.border};font-style:italic;color:#b0a0d0">
        ${escapeAndFormat(text)}
      </div></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ── Comeback detection ────────────────────────────────────────────────────
  function checkComeback() {
    const s = State.get();
    if (!s.lastActiveDate) return;
    const msAgo = Date.now() - new Date(s.lastActiveDate).getTime();
    const hours = msAgo / 3600000;
    const days  = Math.floor(msAgo / 86400000);
    if (hours < 4) return;

    // Find MOST RECENTLY mastered concept in curriculum order
    const topic    = App.currentTopic();
    const sections = CURRICULUM[topic] || [];
    const all      = sections.flatMap(sc => sc.concepts);
    const mastered = s.masteredConcepts || [];
    // Pick the last one in curriculum order that's been mastered
    const masteredInOrder = all.filter(c => mastered.includes(c));
    const lastMastered = masteredInOrder[masteredInOrder.length - 1];
    if (!lastMastered) return;

    setTimeout(async () => {
      const msgs = document.getElementById('messages');
      if (!msgs) return;

      injectMonologue(
        `Welcome back${days >= 1 ? ` — ${days} day${days>1?'s':''} away` : ` — ${Math.round(hours)} hours away`}. Quick warmup before we continue — one question on "${lastMastered}".`,
        'info'
      );

      const key = Auth.getKey();
      if (!key) return;

      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${key}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 200,
            messages: [{
              role: 'system',
              content: `You are Chicha. Ask ONE easy MCQ about "${lastMastered}" for a warmup recap.
RULES:
- Question must be ONLY about "${lastMastered}" — nothing else
- Keep it easy — this is warmup not a test
- IMPORTANT: Place the correct answer randomly — NOT always at (c). Use position: ${['a','b','c','d'][Math.floor(Math.random()*4)]}
- Format EXACTLY like this, nothing before or after:
Quick check: [question]
(a) [option]
(b) [option]
(c) [option]
(d) [option]
- Do NOT say anything else. Just the question and options.`
            }, {
              role: 'user',
              content: `recap question on "${lastMastered}"`
            }]
          }),
        });
        const data  = await res.json();
        const reply = data.choices[0]?.message?.content;
        if (!reply) return;

        // Add to message UI
        const div = document.createElement('div');
        div.className = 'msg msg-chicha';
        div.innerHTML = `<div class="msg-av">✦</div><div><div class="msg-bubble">${escapeAndFormat(reply)}</div><div class="msg-meta">Chicha · recap</div></div>`;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;

        // CRITICAL: Add recap Q&A to _history so send() can evaluate answer
        _history.push({
          role: 'assistant',
          content: `[RECAP] ${reply}\n\nWhen student answers (a/b/c/d): evaluate their answer against "${lastMastered}". If correct say [CORRECT] + "Good, you still have it. Ready to continue?". If wrong say [WRONG] + briefly explain the right answer. Then stop — do NOT ask another question.`
        });

      } catch(e) {
        // Silently fail
      }
    }, 1000);
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

  // ── System prompts ─────────────────────────────────────────────────────────

  // LESSON GEAR — structured teaching + practice
  function lessonPrompt() {
    const s        = State.get();
    const mood     = Mood.getTone();
    const topic    = App.currentTopic();
    const concept  = _currentSpark?.concept || '';
    const theory   = isTheory(concept);
    const plan     = getMasteryPlan(concept);
    const diff     = getDifficultyTarget();
    const sections = CURRICULUM[topic] || [];
    const all      = sections.flatMap(sc => sc.concepts);
    const idx      = all.indexOf(concept);
    const taught   = idx > 0 ? all.slice(0, idx).join(', ') : 'nothing yet';
    const upcoming = idx < all.length - 1 ? all.slice(idx+1, idx+4).join(', ') : 'none';

    return `You are Chicha — sharp, warm, slightly dry tutor for ${topic}.
Never say "Great question!" or "Certainly!". Max 220 words unless code.
MOOD: ${mood} | XP: ${s.xp} | Streak: ${s.streak}

CURRICULUM POSITION:
Taught so far: ${taught}
NOW teaching: "${concept}" (${idx+1}/${all.length})
Not yet taught: ${upcoming}

CONCEPT BOUNDARY — STRICT:
Only ask about "${concept}". Never reference items from "not yet taught".
${theory
  ? `ALLOWED: what "${concept}" means, why it exists, real-world examples of it.
FORBIDDEN: SQL syntax, relationships, keys, normalization, any SQL commands.`
  : `ALLOWED: writing "${concept}" syntax, correct/incorrect usage, query output.
FORBIDDEN: anything outside "${concept}" scope.`}

DIFFICULTY NOW: ${diff.level.toUpperCase()} (${_correctThisConcept}/${plan.total} toward mastery)
${_correctThisConcept === plan.total - 1 ? `⚠ THIS IS THE FINAL QUESTION. If student answers correctly, say [CORRECT] + one short celebration sentence. DO NOT ask another question. The system will handle what comes next.` : ''}

PRACTICE:
When student says yes/sure/ready/ok:
${theory
  ? `ONE MCQ strictly about "${concept}" at ${diff.level} level.
IMPORTANT: Place the correct answer randomly at (a), (b), (c) or (d) — do NOT always put it at (c).
Use this position for the correct answer today: ${['a','b','c','d'][Math.floor(Math.random()*4)]}
Format:
Question: [question about "${concept}" ONLY]
(a) [option]
(b) [option]
(c) [option]
(d) [option]
Do NOT say [CORRECT] yet.`
  : `ONE SQL task about "${concept}" at ${diff.level} level with Indian data.
Do NOT say [CORRECT] yet.`}

WRONG on easy: say [WRONG] + re-explain the specific mistake + ask same level again.
WRONG on other: say [WRONG] + diagnose WHY + ask similar.

SIGNALS:
[AHA]     = student says ohh/I get it/that makes sense/clicked
[CORRECT] = ONLY for actual correct answer — not yes/sure/ok
[WRONG]   = wrong answer given

STUCK ("idk/not sure/give up/:("):
One empathy sentence → one diagnostic question → stop.

MESSAGE TYPES — respond accordingly:
- Single letter (a/b/c/d) or SQL → evaluate as answer
- "why this topic / what's next / can we skip" → explain curriculum path warmly, no MCQ
- "what does X mean / explain again" → clarify that specific thing, stay on concept
- Anything else off-topic → answer briefly as friend, then offer to return

FORMAT: backticks inline, triple backticks for SQL.`;
  }

  // FRIEND GEAR — free conversation, no lesson structure
  function friendPrompt() {
    const s     = State.get();
    const topic = App.currentTopic();
    const concept = _currentSpark?.concept || '';
    return `You are Chicha — a sharp, warm, slightly dry friend who knows everything about data, SQL, Power BI and Tableau.

The student stepped outside the lesson for a moment. Be a real friend.
- Answer naturally — no MCQ format, no signals, no [CORRECT]/[WRONG]
- If they ask about jobs/career/tools — answer from real knowledge, be specific
- If the question needs current info you don't have — say so honestly
- Give your actual opinion when asked ("which is better — X or Y?")
- Keep it conversational — 2-3 sentences unless they need more
- After answering, end with ONE natural offer to return: "Want to get back to ${concept}?" — but only once, never pushy

Current context: teaching ${topic} | concept: "${concept}" | XP: ${s.xp}

Never break character. Never use bullet points unless listing options. Just talk.`;
  }

  // ── API call ───────────────────────────────────────────────────────────────
  async function callAI(userMsg, gear = 'lesson') {
    const key = Auth.getKey();
    if (!key) throw new Error('No API key. Please log in again.');
    _history.push({ role:'user', content: userMsg });
    const prompt = gear === 'friend' ? friendPrompt() : lessonPrompt();
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 700,
        messages: [
          { role:'system', content: prompt },
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
      State.logSession({ topic:App.currentTopic(), concept:_currentSpark?.concept, correct:true });
      updateProgressUI();
      showProgressDots(plan);
      checkMonologue();

      if (_correctThisConcept >= plan.total) {
        // MASTERED — block input, show summary
        _masteredThisSession = true;
        State.addXP(50);
        if (_currentSpark?.concept) State.masterConcept(_currentSpark.concept);
        updateProgressUI();
        Roadmap.refresh();
        // Block input bar so user can't keep chatting — must click Continue
        const inputBar = document.getElementById('userInput');
        if (inputBar) {
          inputBar.disabled = true;
          inputBar.placeholder = 'Click "Continue" above to proceed →';
        }
        setTimeout(() => showSessionSummary(plan), 800);
      }
    } else if (reply.includes('[WRONG]')) {
      _wrongAttempts++;
      _correctStreak = 0;
      Mood.update(false);
      Face.wrong(_wrongAttempts);
      State.logSession({ topic:App.currentTopic(), concept:_currentSpark?.concept, correct:false });
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
    updateConceptHeader(); // refresh dots in header too
    const msgs = document.getElementById('messages');
    if (!msgs) return;
    const sections = [
      { label:'Easy', count:plan.easy, color:'#34d399' },
      { label:'Mid',  count:plan.intermediate, color:'#f59e0b' },
      { label:'Hard', count:plan.hard, color:'#e8002d' },
    ];
    let filled = _correctThisConcept;
    const dots = sections.map(sec => {
      const d = Array.from({length:sec.count}).map(() => {
        const on = filled > 0; if(on) filled--;
        return `<div style="width:10px;height:10px;border-radius:50%;background:${on?sec.color:'#1a1a2e'};box-shadow:${on?`0 0 6px ${sec.color}`:'none'};margin:0 2px"></div>`;
      }).join('');
      return `<div style="display:flex;align-items:center">${d}</div><span style="font-size:9px;color:#555;font-family:'JetBrains Mono',monospace;margin:0 4px">${sec.label}</span>`;
    }).join('<span style="color:#2a2a4a;margin:0 3px">|</span>');
    const div = document.createElement('div');
    div.id = 'masteryToast';
    div.style.cssText = 'display:flex;justify-content:center;padding:6px 0';
    div.innerHTML = `<div style="display:flex;align-items:center;gap:4px;background:#0d0d1c;border:1px solid rgba(139,92,246,0.2);border-radius:20px;padding:7px 16px">${dots}<span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#8b5cf6;margin-left:8px">${_correctThisConcept}/${plan.total}</span></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ── Session summary ────────────────────────────────────────────────────────
  function showSessionSummary(plan) {
    const msgs   = document.getElementById('messages');
    if (!msgs) return;
    const concept = _currentSpark?.concept || 'concept';
    const topic   = App.currentTopic();
    const all     = (CURRICULUM[topic]||[]).flatMap(s=>s.concepts);
    const next    = all.find(c => !State.get().masteredConcepts.includes(c));
    const elapsed = _sessionStartTime ? Math.round((Date.now()-_sessionStartTime)/60000) : 0;
    const xp      = plan.total*10+50;
    const msg = {
      theory:  'You just built the foundation. Everything else in SQL sits on top of what you learned here.',
      simple:  'Clean and quick. Exactly how it should go.',
      medium:  `That wasn\'t trivial. ${plan.total} questions, all done.`,
      complex: `That was ${concept}. Most people spend days on that. You\'re not most people.`,
    }[plan.type] || 'Solid work.';
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
              <div style="font-size:18px;font-weight:700;color:#8b5cf6">+${xp}</div>
              <div style="font-size:10px;color:#555;font-family:'JetBrains Mono',monospace">XP earned</div>
            </div>
            <div style="background:#0a0a14;border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:18px;font-weight:700;color:#34d399">${elapsed||'<1'}m</div>
              <div style="font-size:10px;color:#555;font-family:'JetBrains Mono',monospace">time taken</div>
            </div>
          </div>
          <div style="font-size:13px;color:#9999bb;line-height:1.6;margin-bottom:14px;font-style:italic">"${msg}"</div>
          ${next
            ? `<button onclick="Chat.advanceToNext()" style="width:100%;background:#34d399;color:#0a0a0a;border:none;padding:10px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">Continue → ${next}</button>`
            : `<div style="text-align:center;font-size:13px;color:#f59e0b;font-weight:600">🏆 You've mastered all ${topic} concepts!</div>`
          }
        </div>
      </div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ── Concept header ─────────────────────────────────────────────────────────
  function updateConceptHeader() {
    const concept = _currentSpark?.concept || '';
    const topic   = App.currentTopic();
    const plan    = getMasteryPlan(concept);
    const header  = document.getElementById('conceptHeader');
    const nameEl  = document.getElementById('conceptHeaderName');
    const topicEl = document.getElementById('conceptHeaderTopic');
    const progEl  = document.getElementById('conceptHeaderProgress');
    if (!header || !nameEl || !concept) return;
    header.style.display = 'flex';
    nameEl.textContent   = concept;
    if (topicEl) topicEl.textContent = topic.toUpperCase();
    // Mini progress dots
    if (progEl) {
      const colors = ['#34d399','#f59e0b','#e8002d'];
      const counts = [plan.easy, plan.intermediate, plan.hard];
      let filled = _correctThisConcept;
      progEl.innerHTML = counts.map((count, ci) =>
        Array.from({length: count}).map(() => {
          const on = filled > 0; if (on) filled--;
          return `<div style="width:8px;height:8px;border-radius:50%;background:${on?colors[ci]:'#1a1a2e'};transition:background 0.3s"></div>`;
        }).join('')
      ).join('<div style="width:4px"></div>');
    }
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
      const total    = sections.flatMap(sc=>sc.concepts).length;
      if (total > 0) {
        const done = s.masteredConcepts.filter(c=>sections.flatMap(sc=>sc.concepts).includes(c)).length;
        fill.style.width = `${Math.round((done/total)*100)}%`;
      }
    }
    App.syncSidebar();
  }

  // ── Escape + format ────────────────────────────────────────────────────────
  function escapeAndFormat(text) {
    text = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    text = text.replace(/```(?:sql)?\n?([\s\S]*?)```/g,(_,code)=>`<div class="code-block">${highlightSQL(code.trim())}</div>`);
    text = text.replace(/`([^`]+)`/g,'<code>$1</code>');
    text = text.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    text = text.replace(/\n/g,'<br>');
    return text;
  }

  function highlightSQL(code) {
    const kws=['SELECT','FROM','WHERE','JOIN','INNER','LEFT','RIGHT','OUTER','ON','GROUP','BY','ORDER','HAVING','LIMIT','DISTINCT','AS','AND','OR','NOT','IN','IS','NULL','LIKE','BETWEEN','WITH','CASE','WHEN','THEN','ELSE','END','UNION','INSERT','UPDATE','DELETE','CREATE','TABLE','DATABASE','INDEX','DROP','ALTER','INTO','VALUES','SET','PRIMARY','KEY','VARCHAR','INT','DATE','DECIMAL'];
    const fns=['COUNT','SUM','AVG','MIN','MAX','COALESCE','ROW_NUMBER','RANK','DENSE_RANK','LAG','LEAD','OVER','PARTITION','STRFTIME','UPPER','LOWER','LENGTH','TRIM','ROUND','CAST'];
    let r=code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    r=r.replace(/(--[^\n]*)/g,'<span class="cm">$1</span>');
    r=r.replace(/'([^']*)'/g,"<span class='str'>'$1'</span>");
    kws.forEach(k=>{r=r.replace(new RegExp(`\\b${k}\\b`,'g'),`<span class="kw">${k}</span>`);});
    fns.forEach(f=>{r=r.replace(new RegExp(`\\b${f}\\b`,'g'),`<span class="fn">${f}</span>`);});
    return r;
  }

  function appendMsg(role, text) {
    const msgs=document.getElementById('messages');
    const div=document.createElement('div');
    div.className=`msg msg-${role}`;
    const display=text.replace(/\[(AHA|CORRECT|WRONG)\]/g,'').trim();
    div.innerHTML=`<div class="msg-av">${role==='chicha'?'✦':'S'}</div><div><div class="msg-bubble">${escapeAndFormat(display)}</div><div class="msg-meta">${role==='chicha'?'Chicha':'You'} · just now</div></div>`;
    msgs.appendChild(div);
    msgs.scrollTop=msgs.scrollHeight;
    return div;
  }

  function showTyping() {
    const msgs=document.getElementById('messages');
    const div=document.createElement('div');
    div.id='typingIndicator';
    div.className='msg msg-chicha';
    div.innerHTML=`<div class="msg-av">✦</div><div><div class="msg-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>`;
    msgs.appendChild(div);
    msgs.scrollTop=msgs.scrollHeight;
  }
  function removeTyping(){document.getElementById('typingIndicator')?.remove();}

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    init() {
      _history={};_history=[];
      _currentSpark=null;_wrongAttempts=0;_correctStreak=0;
      _practiceAsked=false;_masteredThisSession=false;_correctThisConcept=0;
      _currentDifficulty='easy';_mode='chat';_gear='lesson';
      _monologueFired={boost:false,pivot:false};
      _lastActivity=Date.now();
      updateProgressUI();
      const restored=restoreMsgs();
      const sc=document.getElementById('sparkCard');
      if(sc) sc.style.display='none';
      if(!restored){
        const w=document.getElementById('welcomeState');
        if(w) w.style.display='flex';
      }
      checkComeback();
    },

    showSpark() {
      const sc=document.getElementById('sparkCard');
      const w=document.getElementById('welcomeState');
      if(sc) sc.style.display='';
      if(w)  w.style.display='none';
      App.showPanel('chat');
      const p=document.getElementById('chatPanel');
      if(p) p.scrollTop=0;
    },

    async startSpark() {
      const spark=_currentSpark;
      if(!spark) return;
      _mode='spark';_gear='lesson';
      _practiceAsked=false;_masteredThisSession=false;
      _correctThisConcept=0;_wrongAttempts=0;
      _currentDifficulty='easy';_sessionStartTime=Date.now();
      _lastActivity=Date.now();
      _monologueFired={boost:false,pivot:false};

      document.getElementById('sparkCard').style.display='none';
      document.getElementById('messages').innerHTML='';
      document.getElementById('welcomeState').style.display='none';
      document.getElementById('backToSparkBar').style.visibility='visible';
      document.getElementById('userInput').placeholder='Reply to Chicha…';
      App.collapseSpark();
      updateConceptHeader();

      const concept=spark.concept||spark.title;
      const theory=isTheory(concept);
      const plan=getMasteryPlan(concept);

      const msg=theory
        ?`Teach ONLY: "${concept}" — THEORY, no SQL code.
**Step 1 — What is it?** One cricket/IPL/Bollywood analogy. Max 3 sentences.
**Step 2 — Why does it matter?** 2 sentences. Why must a beginner know this before SQL?
**Step 3 — Real world:** One Indian app example (Swiggy/IRCTC/Zomato/IPL). No code.
End with exactly: "Ready to try one yourself? Just say yes."
STRICT: No SQL. No code. No concepts not yet introduced.`
        :`Teach ONLY: "${concept}" — SQL command. Type: ${plan.type}.
**Step 1 — Analogy:** Cricket/IPL/Bollywood analogy. Zero code. Max 3 sentences.
**Step 2 — Syntax:** ONE code block for "${concept}" ONLY. Explain each line.
**Step 3 — Example:** ONE example with Indian data (3-4 lines max).
End with exactly: "Ready to try one yourself? Just say yes."
STRICT: Only "${concept}" syntax. No other SQL concepts.`;

      showTyping();
      try {
        const reply=await callAI(msg,'lesson');
        removeTyping();
        appendMsg('chicha',reply);
        _practiceAsked=false;
        Visualizer.tryInject(concept);
        saveHistory();saveMsgs();
      } catch(e) {
        removeTyping();
        appendMsg('chicha',`Can't reach Chicha right now: ${e.message}`);
      }
    },

    surpriseSpark() {
      const topic=App.currentTopic();
      _currentSpark=getSparkForTopic(topic,true);
      ['sparkTitle','sparkBody','sparkConcept'].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.textContent=id==='sparkTitle'?_currentSpark.title:id==='sparkBody'?_currentSpark.analogy:(_currentSpark.concept||'');
      });
      const t=document.getElementById('psTopic');
      if(t) t.textContent=`${topic} · ${_currentSpark.concept||''}`;
      Chat.showSpark();
    },

    openChat() {
      _mode='chat';_gear='lesson';
      ['sparkCard','welcomeState'].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.style.display='none';
      });
      const bb=document.getElementById('backToSparkBar');
      if(bb) bb.style.visibility='hidden';
      // Hide concept header in free chat mode
      const ch=document.getElementById('conceptHeader');
      if(ch) ch.style.display='none';
      document.getElementById('userInput').placeholder='Ask Chicha anything…';
      const msgs=document.getElementById('messages');
      if(msgs&&msgs.children.length===0){
        const cr=document.getElementById('chatReadyState');
        if(cr) cr.style.display='flex';
      }
      App.showPanel('chat');
    },

    async send() {
      const input=document.getElementById('userInput');
      const text=input.value.trim();
      if(!text) return;
      input.value='';input.style.height='auto';
      _lastActivity=Date.now();

      document.getElementById('welcomeState').style.display='none';
      const cr=document.getElementById('chatReadyState');
      if(cr) cr.style.display='none';

      // Classify message — determines which gear to use
      const msgType=classifyMessage(text);

      // Tangent or meta in lesson mode → switch to friend gear
      if(_mode==='spark' && (msgType==='tangent'||msgType==='meta')) {
        _gear='friend';
      } else if(msgType==='ready'||msgType==='answer'||msgType==='stuck'||msgType==='clarify') {
        _gear='lesson';
        if(msgType==='ready') _practiceAsked=true;
      }

      appendMsg('user',text);
      showTyping();

      try {
        const reply=await callAI(text,_gear);
        removeTyping();
        appendMsg('chicha',reply);

        // Only process signals in lesson gear
        if(_gear==='lesson') processSignals(reply);

        // Return to lesson gear after friend response
        if(_gear==='friend') _gear='lesson';

        saveHistory();saveMsgs();
      } catch(e) {
        removeTyping();
        appendMsg('chicha',`Something went wrong: ${e.message}`);
      }
    },

    advanceToNext() {
      const topic=App.currentTopic();
      const all=(CURRICULUM[topic]||[]).flatMap(s=>s.concepts);
      const next=all.find(c=>!State.get().masteredConcepts.includes(c));
      if(!next) return;
      document.getElementById('advanceBtn')?.remove();
      document.getElementById('masteryToast')?.remove();
      // Re-enable input bar
      const inputBar = document.getElementById('userInput');
      if (inputBar) {
        inputBar.disabled = false;
        inputBar.placeholder = 'Reply to Chicha…';
      }
      _history=[];
      _currentSpark=getSparkForTopic(topic);
      _masteredThisSession=false;_practiceAsked=false;
      _correctThisConcept=0;_wrongAttempts=0;
      _currentDifficulty='easy';_sessionStartTime=Date.now();
      _monologueFired={boost:false,pivot:false};
      ['sparkTitle','sparkBody','sparkConcept'].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.textContent=id==='sparkTitle'?_currentSpark.title:id==='sparkBody'?_currentSpark.analogy:(_currentSpark.concept||'');
      });
      const t=document.getElementById('psTopic');
      if(t) t.textContent=`${topic} · ${_currentSpark.concept||''}`;
      Chat.startSpark();
    },

    loadSpark(topic) {
      _currentSpark=getSparkForTopic(topic);
      ['sparkTitle','sparkBody','sparkConcept'].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.textContent=id==='sparkTitle'?_currentSpark.title:id==='sparkBody'?_currentSpark.analogy:(_currentSpark.concept||'');
      });
      const t=document.getElementById('psTopic');
      if(t) t.textContent=`${topic} · ${_currentSpark.concept||''}`;
    },

    backToSpark() {
      _history=[];_masteredThisSession=false;_practiceAsked=false;
      _correctThisConcept=0;_wrongAttempts=0;_currentDifficulty='easy';
      _monologueFired={boost:false,pivot:false};
      sessionStorage.removeItem(HIST_KEY);sessionStorage.removeItem(MSG_KEY);
      document.getElementById('messages').innerHTML='';
      document.getElementById('welcomeState').style.display='none';
      document.getElementById('backToSparkBar').style.visibility='hidden';
      const cr=document.getElementById('chatReadyState');
      if(cr) cr.style.display='none';
      // Hide concept header
      const ch=document.getElementById('conceptHeader');
      if(ch) ch.style.display='none';
      Chat.showSpark();
    },
  };
})();
