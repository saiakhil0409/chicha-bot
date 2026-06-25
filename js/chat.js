// ── CHAT ─────────────────────────────────────────────────────────────────────
const Chat = (() => {
  const HIST_KEY = 'chicha_chat_history';
  const MSG_KEY  = 'chicha_chat_msgs';

  let _history       = [];
  let _currentSpark  = null;
  let _wrongAttempts = 0;
  let _correctStreak = 0;
  let _mode          = 'chat'; // 'chat' | 'spark'

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

  // ── System prompt ────────────────────────────────────────────────────────
  function systemPrompt() {
    const s       = State.get();
    const mood    = Mood.getTone();
    const topic   = App.currentTopic();
    const mastered = s.masteredConcepts.slice(-5).join(', ') || 'none yet';

    return `You are Chicha — a sharp, warm, slightly dry AI tutor specialising in ${topic}.

PERSONALITY: You're like a brilliant friend who knows everything about data. You use vivid analogies, never textbook definitions. You find the student's confusion funny but never make them feel stupid. Never say "Great question!" or "Certainly!". Be direct.

CURRENT MOOD TONE: ${mood}

TEACHING STYLE:
- Analogy first, syntax second — always
- Use F1, cricket, Bollywood, IPL, or everyday Indian life analogies
- Annotate every line of code you show
- When student is right, celebrate briefly then ask a HARDER follow-up question on the SAME concept
- When wrong, diagnose WHY before explaining
- Keep responses under 220 words unless showing code

STUDENT CONTEXT:
- Recently mastered: ${mastered}
- XP: ${s.xp} | Streak: ${s.streak} days | Topic: ${topic}

PRACTICE FLOW — CRITICAL:
When student says "yes", "sure", "ok", "ready", "let's go" after being asked "Ready to try one yourself?":
- Give ONE practice question on the CURRENT concept being taught
- Do NOT move to a new concept
- Do NOT say [CORRECT] yet
- Wait for their actual answer

DETECT AHA MOMENTS: phrases like "ohh", "I get it", "that makes sense", "so basically" → respond with warmth, then say exactly: [AHA]

DETECT CORRECT ANSWER: ONLY when student writes actual SQL code or gives a specific technical answer that is correct → say exactly: [CORRECT] then celebrate briefly. Simple "yes/sure/ok/ready" is NOT a correct answer.

DETECT WRONG ANSWER: If the student writes SQL code or a technical answer that is incorrect → say exactly: [WRONG] then diagnose why without giving the full answer.

MASTERY RULE: Only mark [CORRECT] after the student successfully answers at least ONE practice question with actual SQL or a clear technical explanation. NOT before.

CRITICAL — "I DON'T KNOW" RULE:
If student says "I don't know", "idk", "no idea", "not sure", "I don't think so", "I give up", ":(", "🤷":
1. ONE sentence of empathy
2. Ask ONE diagnostic question to find WHERE they're stuck
3. STOP — do not explain further until they answer
4. NEVER give the full answer

NEVER give the answer when they're struggling. Nudge, don't solve.
FORMAT: Inline code with backticks. SQL blocks with triple backticks.`;
  }

  // ── UI helpers ───────────────────────────────────────────────────────────
  function appendMsg(role, text) {
    const msgs = document.getElementById('messages');
    const div  = document.createElement('div');
    div.className = `msg msg-${role}`;
    const av   = role === 'chicha' ? '✦' : 'S';
    const meta = role === 'chicha' ? 'Chicha' : 'You';
    // Strip signal tokens from display
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
    text = text.replace(/```(?:sql)?\n?([\s\S]*?)```/g, (_, code) =>
      `<div class="code-block">${highlightSQL(code.trim())}</div>`);
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\n/g, '<br>');
    return text;
  }

  function highlightSQL(code) {
    const kws  = ['SELECT','FROM','WHERE','JOIN','INNER','LEFT','RIGHT','OUTER','ON','GROUP','BY','ORDER','HAVING','LIMIT','DISTINCT','AS','AND','OR','NOT','IN','IS','NULL','LIKE','BETWEEN','WITH','CASE','WHEN','THEN','ELSE','END','UNION','INSERT','UPDATE','DELETE','CREATE','TABLE','INDEX'];
    const fns  = ['COUNT','SUM','AVG','MIN','MAX','COALESCE','ISNULL','ROW_NUMBER','RANK','DENSE_RANK','LAG','LEAD','OVER','PARTITION','STRFTIME','UPPER','LOWER','LENGTH','TRIM','ROUND','CAST'];
    let r = code;
    r = r.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    r = r.replace(/(--[^\n]*)/g, '<span class="cm">$1</span>');
    r = r.replace(/'([^']*)'/g, "<span class='str'>'$1'</span>");
    kws.forEach(k => { r = r.replace(new RegExp(`\\b${k}\\b`,'g'), `<span class="kw">${k}</span>`); });
    fns.forEach(f => { r = r.replace(new RegExp(`\\b${f}\\b`,'g'), `<span class="fn">${f}</span>`); });
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

  // ── Groq API ─────────────────────────────────────────────────────────────
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

  // ── Signal detection — parse [CORRECT] [WRONG] [AHA] from reply ──────────
  function processSignals(reply) {
    if (reply.includes('[CORRECT]')) {
      _correctStreak++;
      _wrongAttempts = 0;
      Mood.update(true);
      Face.correct(_correctStreak);
      State.addXP(20 + Math.min(_correctStreak * 5, 30));
      if (_currentSpark?.concept) State.masterConcept(_currentSpark.concept);
      State.logSession({ topic: App.currentTopic(), concept: _currentSpark?.concept, correct: true });
      updateProgressUI();
    } else if (reply.includes('[WRONG]')) {
      _correctStreak = 0;
      _wrongAttempts++;
      Mood.update(false);
      Face.wrong(_wrongAttempts);
      State.logSession({ topic: App.currentTopic(), concept: _currentSpark?.concept, correct: false });
    } else if (reply.includes('[AHA]')) {
      if (_currentSpark) State.logAha(_currentSpark.concept || 'concept', reply.slice(0,80));
      Face.aha();
    }
  }

  function updateProgressUI() {
    const s = State.get();
    const xpEl = document.getElementById('psXp');
    const stEl = document.getElementById('psStreak');
    const fill = document.getElementById('psFill');
    if (xpEl) xpEl.textContent = `${s.xp} XP`;
    if (stEl) stEl.textContent = s.streak > 0 ? `🔥 ${s.streak}` : '';
    if (fill) {
      const topic    = App.currentTopic();
      const sections = CURRICULUM[topic] || [];
      const total    = sections.flatMap(sc => sc.concepts).length;
      if (total > 0) {
        const done = s.masteredConcepts.filter(c => sections.flatMap(sc => sc.concepts).includes(c)).length;
        fill.style.width = `${Math.round((done / total) * 100)}%`;
      }
    }
    App.syncSidebar();
  }

  // ── Public API ───────────────────────────────────────────────────────────
  return {
    init() {
      _history       = loadHistory();
      _currentSpark  = null;
      _wrongAttempts = 0;
      _correctStreak = 0;
      _mode          = 'chat';
      updateProgressUI();
      const restored = restoreMsgs();
      // Spark card always hidden on init
      const sparkCard = document.getElementById('sparkCard');
      if (sparkCard) sparkCard.style.display = 'none';
      if (!restored) {
        // Fresh start — show welcome
        const welcome = document.getElementById('welcomeState');
        if (welcome) welcome.style.display = 'flex';
      }
    },

    // ── TODAY'S SPARK flow ─────────────────────────────────────────────────
    showSpark() {
      // Show the spark card, hide welcome
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
      _mode = 'spark';
      document.getElementById('sparkCard').style.display   = 'none';
      document.getElementById('messages').innerHTML        = '';
      document.getElementById('welcomeState').style.display = 'none';
      document.getElementById('backToSparkBar').style.visibility = 'visible';
      document.getElementById('userInput').placeholder = 'Reply to Chicha…';
      App.collapseSpark();

      // Strict 3-step teach prompt — locked to exact concept
      const concept = spark.concept || spark.title;
      const msg = `You are teaching ONLY this one concept: "${concept}"

STRICT RULES:
- Do NOT teach any other concept, even if related
- Do NOT show syntax for concepts not yet covered
- Stay 100% focused on "${concept}" only

Follow this EXACT 3-step structure:

**Step 1 — Analogy:**
Explain "${concept}" using one vivid analogy from cricket, IPL, Bollywood, or Indian daily life. Zero code. Maximum 3 sentences.

**Step 2 — Syntax:**
Show ONLY the syntax for "${concept}" in a single SQL code block. After the block, explain each line in one short sentence. Do not show examples of other concepts.

**Step 3 — Visual:**
Show a simple ASCII table visual demonstrating what "${concept}" does to data. Use a small 3-4 row table with Indian names/data. Show BEFORE and AFTER the operation clearly like this format:
BEFORE → [operation] → AFTER

End with exactly: "Ready to try one yourself? Just say yes."
Do NOT quiz. Do NOT ask questions. Teach only.`;

      showTyping();
      try {
        const reply = await callAI(msg);
        removeTyping();
        appendMsg('chicha', reply);
        // Inject visual if available for this concept
        Visualizer.tryInject(concept);
        saveHistory(); saveMsgs();
      } catch(e) {
        removeTyping();
        appendMsg('chicha', `Can't reach my brain right now: ${e.message}`);
      }
    },

    surpriseSpark() {
      const topic   = App.currentTopic();
      _currentSpark = getSparkForTopic(topic, true); // random from unmastered
      document.getElementById('sparkTitle').textContent   = _currentSpark.title;
      document.getElementById('sparkBody').textContent    = _currentSpark.analogy;
      document.getElementById('sparkConcept').textContent = _currentSpark.concept || '';
      const topicEl = document.getElementById('psTopic');
      if (topicEl) topicEl.textContent = `${topic} · ${_currentSpark.concept || ''}`;
      Chat.showSpark();
    },

    // ── FREE CHAT flow ─────────────────────────────────────────────────────
    openChat() {
      _mode = 'chat';
      const sparkCard = document.getElementById('sparkCard');
      const welcome   = document.getElementById('welcomeState');
      const backBar   = document.getElementById('backToSparkBar');
      if (sparkCard) sparkCard.style.display = 'none';
      if (welcome)   welcome.style.display   = 'none';
      if (backBar)   backBar.style.visibility = 'hidden';
      document.getElementById('userInput').placeholder = 'Ask Chicha anything…';
      // If no messages yet, show chat-ready state
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

      // Hide all placeholder states
      document.getElementById('welcomeState').style.display  = 'none';
      const chatReady = document.getElementById('chatReadyState');
      if (chatReady) chatReady.style.display = 'none';

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
        appendMsg('chicha', `Something went wrong: ${e.message}. Check your API key.`);
      }
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
      _history = [];
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
