// ── CHAT ─────────────────────────────────────────────────────────────────────
const Chat = (() => {
  const HIST_KEY = 'chicha_chat_history';
  const MSG_KEY  = 'chicha_chat_msgs';

  let _history = [];
  let _currentSpark = null;
  let _wrongAttempts = 0;
  let _lastTopic = null;
  let _correctStreak = 0;

  function saveHistory() {
    try {
      sessionStorage.setItem(HIST_KEY, JSON.stringify(_history.slice(-24)));
    } catch(e) {}
  }

  function loadHistory() {
    try {
      return JSON.parse(sessionStorage.getItem(HIST_KEY) || '[]');
    } catch { return []; }
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
        const backBar = document.getElementById('backToSparkBar');
        if (backBar) backBar.style.visibility = 'visible';
        return true;
      }
    } catch(e) {}
    return false;
  }

  // ── Build system prompt ──────────────────────────────────────────────────
  function systemPrompt() {
    const s = State.get();
    const mood = Mood.getTone();
    const topic = App.currentTopic();
    const mastered = s.masteredConcepts.slice(-5).join(', ') || 'none yet';

    return `You are Chicha — a sharp, warm, slightly dry AI tutor specialising in ${topic}.

PERSONALITY: You're like a brilliant friend who happens to know everything about data. You use vivid analogies, never textbook definitions. You find the student's confusion funny but never make them feel stupid. You never say "Great question!" or "Certainly!". You're direct.

CURRENT MOOD TONE: ${mood}

TEACHING STYLE:
- Analogy first, syntax second — always
- Use F1, cricket, Bollywood, IPL, or everyday Indian life analogies when relevant  
- When explaining code, annotate it line by line
- When the student gets it right, celebrate briefly then push harder
- When wrong, don't just say "incorrect" — diagnose WHY they went wrong
- After 3 wrong attempts on same concept, try a completely different angle
- Drop in a practice question naturally mid-explanation (don't announce it as "here's a practice question")
- Keep responses under 200 words unless showing code

STUDENT CONTEXT:
- Recently mastered: ${mastered}
- XP: ${s.xp} | Streak: ${s.streak} days
- Topic: ${topic}

DETECT AHA MOMENTS: If the student's message suggests they just understood something (phrases like "ohh", "I get it now", "that makes sense", "so basically"), respond with extra warmth and log it mentally.

DETECT STRUGGLE: If student says "I don't get it", "I'm confused", "what?", or repeats the same wrong answer — switch approach, don't repeat yourself.

CRITICAL — "I DON'T KNOW" RULE:
If the student's message contains ANY of these signals:
- "I don't know", "idk", "no idea", "not sure", "I don't think so", "I give up", "no clue", "beats me", "I'm lost", "I have no idea", "can't figure", "don't understand"
- A single word like "no", "nope", "nothing", "blank"
- Any sad/stuck emoji like :(  😕  🤷  😭  used alone or after a short phrase

Then you MUST follow this exact pattern:
1. ONE sentence of empathy — short, warm, not patronising
2. Ask ONE diagnostic question to find out WHERE exactly they're stuck
   - "Is it the concept itself or the syntax?"
   - "Which part lost you — the GROUP BY or the HAVING?"
   - "What did you think it would do vs what it actually does?"
3. STOP. Do not explain anything further until they answer.
4. NEVER give the full answer or a working code snippet at this stage.

The goal is to find out what's broken before fixing it. A doctor diagnoses before prescribing.

NEVER: give the answer directly when they're struggling. Nudge, don't solve.
FORMAT: Use inline code with backticks. For SQL blocks use triple backticks with sql tag.`;
  }

  // ── Append message to UI ─────────────────────────────────────────────────
  function appendMsg(role, html, isHTML = false) {
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `msg msg-${role}`;
    const av = role === 'chicha' ? '✦' : 'S';
    const meta = role === 'chicha' ? 'Chicha' : 'You';
    div.innerHTML = `
      <div class="msg-av">${av}</div>
      <div>
        <div class="msg-bubble">${isHTML ? html : escapeAndFormat(html)}</div>
        <div class="msg-meta">${meta} · just now</div>
      </div>
    `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function escapeAndFormat(text) {
    // Escape HTML
    text = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    // Code blocks
    text = text.replace(/```(?:sql)?\n?([\s\S]*?)```/g, (_, code) =>
      `<div class="code-block">${highlightSQL(code.trim())}</div>`
    );
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Newlines
    text = text.replace(/\n/g, '<br>');
    return text;
  }

  function highlightSQL(code) {
    const keywords = ['SELECT','FROM','WHERE','JOIN','INNER','LEFT','RIGHT','OUTER','ON','GROUP','BY','ORDER','HAVING','LIMIT','DISTINCT','AS','AND','OR','NOT','IN','IS','NULL','LIKE','BETWEEN','WITH','CASE','WHEN','THEN','ELSE','END','UNION','INSERT','UPDATE','DELETE','CREATE','TABLE','INDEX'];
    const fns = ['COUNT','SUM','AVG','MIN','MAX','COALESCE','ISNULL','ROW_NUMBER','RANK','DENSE_RANK','LAG','LEAD','OVER','PARTITION','STRFTIME','UPPER','LOWER','LENGTH','TRIM','ROUND','CAST'];
    let result = code.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
    result = result.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    // Comments
    result = result.replace(/(--[^\n]*)/g, '<span class="cm">$1</span>');
    // Strings
    result = result.replace(/'([^']*)'/g, '<span class="str">\'$1\'</span>');
    // Keywords
    keywords.forEach(kw => {
      result = result.replace(new RegExp(`\\b${kw}\\b`, 'gi'), `<span class="kw">${kw}</span>`);
    });
    // Functions
    fns.forEach(fn => {
      result = result.replace(new RegExp(`\\b${fn}\\b`, 'gi'), `<span class="fn">${fn}</span>`);
    });
    return result;
  }

  function showTyping() {
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.id = 'typingIndicator';
    div.className = 'msg msg-chicha';
    div.innerHTML = `<div class="msg-av">✦</div><div><div class="msg-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    document.getElementById('typingIndicator')?.remove();
  }

  // ── Call Groq API ────────────────────────────────────────────────────────
  async function callAI(userMsg) {
    const key = Auth.getKey();
    if (!key) throw new Error('No API key. Please log in again.');

    _history.push({ role: 'user', content: userMsg });

    const body = {
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      messages: [
        { role: 'system', content: systemPrompt() },
        ..._history.slice(-12),
      ],
    };

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    const reply = data.choices[0].message.content;
    _history.push({ role: 'assistant', content: reply });
    if (_history.length > 24) _history = _history.slice(-24);
    return reply;
  }

  // ── Detect aha/struggle in user message ─────────────────────────────────
  function detectMoment(userMsg, correct) {
    const ahaSignals = ['ohh','oh i see','i get it','that makes sense','so basically','got it','makes sense now','clicked','understood'];
    const struggleSignals = ["don't get","don't understand","confused","what?","huh","lost","i'm stuck","still don't"];
    const lower = userMsg.toLowerCase();
    const isAha = ahaSignals.some(s => lower.includes(s));
    const isStruggle = struggleSignals.some(s => lower.includes(s));

    if (isAha && _currentSpark) {
      State.logAha(_currentSpark.concept || 'concept', userMsg.slice(0, 80));
      Face.aha();
    } else if (correct !== undefined) {
      Mood.update(correct);
      if (correct) {
        _correctStreak++;
        _wrongAttempts = 0;
        Face.correct(_correctStreak);
        State.addXP(20 + Math.min(_correctStreak * 5, 30));
        State.logSession({ topic: App.currentTopic(), concept: _currentSpark?.concept, correct: true, msg: userMsg.slice(0,80) });
        if (_currentSpark?.concept) State.masterConcept(_currentSpark.concept);
        updateUI();
      } else {
        _correctStreak = 0;
        _wrongAttempts++;
        Face.wrong(_wrongAttempts);
        if (_currentSpark) State.logStruggle(_currentSpark.concept || 'concept', userMsg.slice(0, 80));
        State.logSession({ topic: App.currentTopic(), concept: _currentSpark?.concept, correct: false, msg: userMsg.slice(0,80) });
      }
    }
  }

  function updateUI() {
    const s = State.get();
    const streakEl = document.getElementById('psStreak');
    if (streakEl) streakEl.textContent = s.streak > 1 ? `🔥 ${s.streak}` : '';
    const xpEl = document.getElementById('psXp');
    if (xpEl) xpEl.textContent = `${s.xp} XP`;
    const fill = document.getElementById('psFill');
    if (fill) {
      const topic = App.currentTopic();
      const sections = CURRICULUM[topic] || [];
      const total = sections.flatMap(s=>s.concepts).length;
      const done = s.masteredConcepts.filter(c => sections.flatMap(s=>s.concepts).includes(c)).length;
      fill.style.width = `${Math.round((done/total)*100)}%`;
    }
  }

  return {
    init() {
      _history = loadHistory();
      _currentSpark = null;
      _wrongAttempts = 0;
      _correctStreak = 0;
      updateUI();
      // Restore previous conversation if exists
      const restored = restoreMsgs();
      if (restored) {
        // Hide welcome state when session restored
        const welcome = document.getElementById('welcomeState');
        if (welcome) welcome.style.display = 'none';
      }
      // Spark card always hidden on init — only shown via sidebar badge click
      const sparkCard = document.getElementById('sparkCard');
      if (sparkCard) sparkCard.style.display = 'none';
    },

    async startSpark() {
      const spark = _currentSpark;
      if (!spark) return;
      document.getElementById('sparkCard').style.display = 'none';
      document.getElementById('messages').innerHTML = '';
      // Hide welcome state
      const welcome = document.getElementById('welcomeState');
      if (welcome) welcome.style.display = 'none';
      // Show back button
      const backBar = document.getElementById('backToSparkBar');
      if (backBar) backBar.style.visibility = 'visible';
      // Collapse sidebar spark
      App.collapseSpark();
      const msg = `Teach me about "${spark.concept || spark.title}" using this exact 3-step structure:

STEP 1 — ANALOGY: Explain the concept using a vivid real-world analogy (cricket, Bollywood, street food, F1, or everyday Indian life). No code yet. Just make the concept click intuitively.

STEP 2 — SYNTAX: Now show the actual SQL syntax with a short annotated code block. Explain each line in one sentence.

STEP 3 — REAL EXAMPLE: Show one practical example query using the concept. Keep it concrete.

End with: "Ready to try one yourself?" — nothing else. Do NOT ask a question yet. Do NOT quiz me yet. Just teach first.`;
      showTyping();
      try {
        const reply = await callAI(msg);
        removeTyping();
        appendMsg('chicha', reply);
        saveHistory();
        saveMsgs();
      } catch(e) {
        removeTyping();
        appendMsg('chicha', `Hmm, can't reach my brain right now: ${e.message}`);
      }
    },

    surpriseSpark() {
      const topic = App.currentTopic();
      _currentSpark = getSparkForTopic(topic);
      document.getElementById('sparkTitle').textContent = _currentSpark.title;
      document.getElementById('sparkBody').textContent = _currentSpark.analogy;
      document.getElementById('sparkConcept').textContent = _currentSpark.concept || '';
    },

    setSpark(spark) {
      _currentSpark = spark;
      document.getElementById('sparkTitle').textContent = spark.title;
      document.getElementById('sparkBody').textContent = spark.analogy;
      document.getElementById('sparkConcept').textContent = spark.concept || '';
      document.getElementById('sparkCard').style.display = '';
      document.getElementById('messages').innerHTML = '';
    },

    async send() {
      const input = document.getElementById('userInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      input.style.height = 'auto';

      appendMsg('user', text);
      // Hide welcome state and spark card on first message
      const welcome = document.getElementById('welcomeState');
      if (welcome) welcome.style.display = 'none';
      showTyping();

      try {
        const reply = await callAI(text);
        removeTyping();
        appendMsg('chicha', reply);
        saveHistory();
        saveMsgs();
        // Detect signals
        detectMoment(text, undefined);
      } catch(e) {
        removeTyping();
        appendMsg('chicha', `Something went wrong: ${e.message}. Check your API key in settings.`);
      }
    },

    loadSpark(topic) {
      _currentSpark = getSparkForTopic(topic);
      document.getElementById('sparkTitle').textContent = _currentSpark.title;
      document.getElementById('sparkBody').textContent = _currentSpark.analogy;
      document.getElementById('sparkConcept').textContent = _currentSpark.concept || '';
      const topicEl = document.getElementById('psTopic');
      if (topicEl) topicEl.textContent = `${topic} · ${_currentSpark.concept || ''}`;
    },
  };
})();
