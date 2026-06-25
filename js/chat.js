// ── CHAT ─────────────────────────────────────────────────────────────────────
const Chat = (() => {
  const HIST_KEY = 'chicha_chat_history';
  const MSG_KEY  = 'chicha_chat_msgs';

  let _history       = [];
  let _currentSpark  = null;
  let _wrongAttempts = 0;
  let _correctStreak = 0;
  let _mode          = 'chat'; // 'chat' | 'spark'
  let _practiceAsked = false;  // true after first practice question asked
  let _masteredThisSession = false; // prevent double-mastering same concept

  // ── Theory concepts — no SQL syntax ──────────────────────────────────────
  const THEORY_CONCEPTS = [
    'What is a Database', 'What is a Table', 'Data types',
    'What is Power BI', 'Connecting data sources', 'Basic visuals',
    'Connecting data', 'Dimensions vs Measures', 'Basic chart types',
  ];
  function isTheory(concept) {
    return THEORY_CONCEPTS.some(t => concept.toLowerCase().includes(t.toLowerCase()));
  }

  // ── Persistence ──────────────────────────────────────────────────────────
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
    const s       = State.get();
    const mood    = Mood.getTone();
    const topic   = App.currentTopic();
    const mastered = s.masteredConcepts.slice(-5).join(', ') || 'none yet';
    const concept  = _currentSpark?.concept || '';
    const theory   = concept ? isTheory(concept) : false;

    return `You are Chicha — a sharp, warm, slightly dry AI tutor specialising in ${topic}.

PERSONALITY: Brilliant friend who knows data. Vivid analogies, never textbook definitions. Never say "Great question!" or "Certainly!". Be direct. Max 220 words unless showing code.

MOOD TONE: ${mood}

STUDENT: XP=${s.xp} | Streak=${s.streak} | Mastered recently: ${mastered}

CURRENT CONCEPT: "${concept}" ${theory ? '(THEORY — no SQL code)' : '(SQL command)'}

━━━ PRACTICE FLOW ━━━
When student says "yes/sure/ok/ready/let's go" after "Ready to try one yourself?":
${theory
  ? `- Give ONE multiple choice question (MCQ) about "${concept}"
- Format EXACTLY like this:
  Question: [your question here]
  (a) [option]
  (b) [option]  
  (c) [option]
  (d) [option]
- Make one option clearly correct, others plausible but wrong
- Do NOT say [CORRECT] yet — wait for their answer`
  : `- Give ONE specific SQL writing task about "${concept}"
- Example: "Write a query to [do something with Indian data]"
- Do NOT say [CORRECT] yet — wait for their actual SQL`
}

━━━ SIGNAL RULES ━━━
[AHA] → student says "ohh/I get it/that makes sense/so basically/clicked"
[CORRECT] → ONLY when:
  ${theory
    ? '- Student picks the correct MCQ option (a/b/c/d) AND it is actually correct'
    : '- Student writes SQL that correctly solves the task (not just "yes/sure")'}
[WRONG] → student gives wrong MCQ answer OR incorrect SQL — diagnose WHY, do NOT give answer

━━━ DONT KNOW RULE ━━━
If "idk/no idea/not sure/give up/😭/🤷/:(":
1. One sentence empathy
2. One diagnostic question — WHERE are they stuck?
3. STOP. Do not explain until they answer.
4. NEVER give the answer directly.

FORMAT: Backticks for inline code. Triple backticks for SQL blocks.`;
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
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

  // ── API call ──────────────────────────────────────────────────────────────
  async function callAI(userMsg) {
    const key = Auth.getKey();
    if (!key) throw new Error('No API key. Please log in again.');
    _history.push({ role: 'user', content: userMsg });
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 700,
        messages: [
          { role: 'system', content: systemPrompt() },
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
    _history.push({ role: 'assistant', content: reply });
    if (_history.length > 24) _history = _history.slice(-24);
    return reply;
  }

  // ── Signal processing ─────────────────────────────────────────────────────
  function processSignals(reply) {
    if (reply.includes('[CORRECT]') && !_masteredThisSession) {
      _masteredThisSession = true;
      _correctStreak++;
      _wrongAttempts = 0;
      Mood.update(true);
      Face.correct(_correctStreak);
      const xpEarned = 20 + Math.min(_correctStreak * 5, 30);
      State.addXP(xpEarned);
      if (_currentSpark?.concept) State.masterConcept(_currentSpark.concept);
      State.logSession({ topic: App.currentTopic(), concept: _currentSpark?.concept, correct: true });
      updateProgressUI();
      // Show advance button after short delay
      setTimeout(() => showAdvanceButton(), 1200);
    } else if (reply.includes('[WRONG]')) {
      _correctStreak = 0;
      _wrongAttempts++;
      Mood.update(false);
      Face.wrong(_wrongAttempts);
      State.logSession({ topic: App.currentTopic(), concept: _currentSpark?.concept, correct: false });
      if (_currentSpark?.concept) State.logStruggle(_currentSpark.concept, reply.slice(0,80));
    } else if (reply.includes('[AHA]')) {
      if (_currentSpark?.concept) State.logAha(_currentSpark.concept, reply.slice(0,80));
      Face.aha();
    }
  }

  // ── Show "Next concept" button after mastery ──────────────────────────────
  function showAdvanceButton() {
    const msgs = document.getElementById('messages');
    if (!msgs) return;
    const topic    = App.currentTopic();
    const sections = CURRICULUM[topic] || [];
    const all      = sections.flatMap(s => s.concepts);
    const mastered = State.get().masteredConcepts;
    const next     = all.find(c => !mastered.includes(c));

    const div = document.createElement('div');
    div.className = 'msg msg-chicha';
    div.id = 'advanceBtn';
    div.innerHTML = `
      <div class="msg-av">✦</div>
      <div>
        <div class="msg-bubble" style="background:rgba(52,211,153,0.08);border-color:rgba(52,211,153,0.25)">
          <div style="color:#34d399;font-weight:700;margin-bottom:8px">✅ Concept mastered!</div>
          ${next
            ? `<div style="font-size:13px;color:#aaa;margin-bottom:12px">Next up: <strong style="color:#e8e8f0">${next}</strong></div>
               <button onclick="Chat.advanceToNext()" style="background:#34d399;color:#0a0a0a;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">Continue → ${next}</button>`
            : `<div style="font-size:13px;color:#aaa">🏆 You've mastered all concepts in this topic!</div>`
          }
        </div>
      </div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ── Progress UI update ────────────────────────────────────────────────────
  function updateProgressUI() {
    const s = State.get();
    const xpEl  = document.getElementById('psXp');
    const stEl  = document.getElementById('psStreak');
    const fill  = document.getElementById('psFill');
    const topic = App.currentTopic();
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

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init() {
      _history             = loadHistory();
      _currentSpark        = null;
      _wrongAttempts       = 0;
      _correctStreak       = 0;
      _practiceAsked       = false;
      _masteredThisSession = false;
      _mode                = 'chat';
      updateProgressUI();
      const restored = restoreMsgs();
      const sparkCard = document.getElementById('sparkCard');
      if (sparkCard) sparkCard.style.display = 'none';
      if (!restored) {
        const welcome = document.getElementById('welcomeState');
        if (welcome) welcome.style.display = 'flex';
      }
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
      document.getElementById('sparkCard').style.display    = 'none';
      document.getElementById('messages').innerHTML         = '';
      document.getElementById('welcomeState').style.display = 'none';
      document.getElementById('backToSparkBar').style.visibility = 'visible';
      document.getElementById('userInput').placeholder = 'Reply to Chicha…';
      App.collapseSpark();

      const concept = spark.concept || spark.title;
      const theory  = isTheory(concept);

      const msg = theory
        ? `Teach ONLY: "${concept}" — THEORY, no SQL code.

Structure:
**Step 1 — What is it?**
One cricket/IPL/Bollywood analogy. Max 3 sentences.

**Step 2 — Why does it matter?**
2 sentences. Why must a beginner know this before SQL?

**Step 3 — Real world:**
One Indian app example (Swiggy/IRCTC/Zomato/IPL). No code.

End with exactly: "Ready to try one yourself? Just say yes."
Do NOT show any SQL or code.`

        : `Teach ONLY: "${concept}" — SQL command.

STRICT: Only syntax for "${concept}". Nothing else.

**Step 1 — Analogy:**
Cricket/IPL/Bollywood analogy. Zero code. Max 3 sentences.

**Step 2 — Syntax:**
ONE code block for "${concept}" only. Explain each line in one sentence.

**Step 3 — Example:**
ONE example with Indian data (3-4 lines max).

End with exactly: "Ready to try one yourself? Just say yes."`;

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

      document.getElementById('welcomeState').style.display = 'none';
      const chatReady = document.getElementById('chatReadyState');
      if (chatReady) chatReady.style.display = 'none';

      // Mark that student replied to "Ready?" — next Chicha response should give MCQ/task
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

    // Advance to next concept after mastery
    advanceToNext() {
      const topic    = App.currentTopic();
      const sections = CURRICULUM[topic] || [];
      const all      = sections.flatMap(s => s.concepts);
      const mastered = State.get().masteredConcepts;
      const next     = all.find(c => !mastered.includes(c));
      if (!next) return;

      // Remove advance button
      document.getElementById('advanceBtn')?.remove();

      // Load next spark
      _currentSpark        = getSparkForTopic(topic);
      _masteredThisSession = false;
      _practiceAsked       = false;

      // Update spark card
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

      // Start teaching next concept immediately
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
