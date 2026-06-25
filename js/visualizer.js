// ── SQL VISUALIZER ────────────────────────────────────────────────────────────
// Shows animated table visualizations for SQL concepts
const Visualizer = (() => {

  // Sample F1/Cricket/IPL dataset
  const SAMPLE_DATA = [
    { id:1, name:'Rohit Sharma',  team:'Mumbai Indians', runs:45,  age:36 },
    { id:2, name:'Virat Kohli',   team:'RCB',            runs:82,  age:35 },
    { id:3, name:'MS Dhoni',      team:'CSK',            runs:33,  age:42 },
    { id:4, name:'Jasprit Bumrah',team:'Mumbai Indians', runs:8,   age:30 },
    { id:5, name:'Hardik Pandya', team:'Mumbai Indians', runs:67,  age:30 },
    { id:6, name:'KL Rahul',      team:'LSG',            runs:55,  age:32 },
  ];

  const CONCEPTS = {
    'SELECT basics': {
      title: 'SELECT * — fetch everything',
      steps: [
        { label: 'Full table', rows: SAMPLE_DATA, highlight: [] },
        { label: 'SELECT * returns all rows & columns', rows: SAMPLE_DATA, highlight: [0,1,2,3,4,5] },
      ],
      sql: 'SELECT * FROM players;',
    },
    'SELECT columns': {
      title: 'SELECT columns — pick what you need',
      steps: [
        { label: 'Full table (all columns)', rows: SAMPLE_DATA, cols: ['id','name','team','runs','age'], highlight: [] },
        { label: 'SELECT name, runs — only these columns', rows: SAMPLE_DATA, cols: ['name','runs'], highlight: [0,1,2,3,4,5] },
      ],
      sql: 'SELECT name, runs FROM players;',
    },
    'WHERE filtering': {
      title: 'WHERE — the bouncer',
      steps: [
        { label: 'All rows enter', rows: SAMPLE_DATA, highlight: [] },
        { label: "WHERE team = 'Mumbai Indians'", rows: SAMPLE_DATA, highlight: [0,3,4], reject: [1,2,5] },
        { label: 'Only matching rows pass', rows: SAMPLE_DATA.filter(r => r.team === 'Mumbai Indians'), highlight: [0,1,2] },
      ],
      sql: "SELECT * FROM players WHERE team = 'Mumbai Indians';",
    },
    'ORDER BY': {
      title: 'ORDER BY — sort the results',
      steps: [
        { label: 'Original order', rows: SAMPLE_DATA, highlight: [] },
        { label: 'ORDER BY runs DESC — highest first', rows: [...SAMPLE_DATA].sort((a,b) => b.runs - a.runs), highlight: [0,1,2,3,4,5] },
      ],
      sql: 'SELECT name, runs FROM players ORDER BY runs DESC;',
    },
    'LIMIT': {
      title: 'LIMIT — take only the top N',
      steps: [
        { label: 'All rows', rows: SAMPLE_DATA, highlight: [] },
        { label: 'LIMIT 3 — first 3 only', rows: SAMPLE_DATA.slice(0,3), highlight: [0,1,2] },
      ],
      sql: 'SELECT * FROM players LIMIT 3;',
    },
    'CREATE TABLE': {
      title: 'CREATE TABLE — design the structure',
      steps: [
        { label: 'No table exists yet', rows: [], cols: [], empty: true },
        { label: 'CREATE TABLE defines columns & types', rows: [], cols: ['id INT','name VARCHAR','team VARCHAR','runs INT'], structure: true },
        { label: 'Empty table ready for data', rows: [], cols: ['id','name','team','runs'], empty: true },
      ],
      sql: 'CREATE TABLE players (\n  id INT PRIMARY KEY,\n  name VARCHAR(100),\n  team VARCHAR(50),\n  runs INT\n);',
    },
    'INSERT INTO': {
      title: 'INSERT INTO — add one row',
      steps: [
        { label: 'Empty table', rows: [], cols: ['id','name','team','runs'], empty: true },
        { label: 'INSERT INTO adds one row', rows: [SAMPLE_DATA[0]], cols: ['id','name','team','runs'], highlight: [0] },
      ],
      sql: "INSERT INTO players VALUES (1, 'Rohit Sharma', 'Mumbai Indians', 45);",
    },
    'UPDATE records': {
      title: 'UPDATE — change existing data',
      steps: [
        { label: 'Before UPDATE', rows: SAMPLE_DATA.slice(0,3), highlight: [] },
        { label: "UPDATE WHERE id=1 SET runs=99", rows: [{...SAMPLE_DATA[0], runs:99}, ...SAMPLE_DATA.slice(1,3)], highlight: [0] },
      ],
      sql: "UPDATE players SET runs = 99 WHERE id = 1;",
    },
    'DELETE records': {
      title: 'DELETE — remove rows (careful!)',
      steps: [
        { label: 'Before DELETE', rows: SAMPLE_DATA.slice(0,4), highlight: [] },
        { label: "DELETE WHERE team = 'LSG'", rows: SAMPLE_DATA.slice(0,4), highlight: [], reject: [3] },
        { label: 'Row removed', rows: SAMPLE_DATA.slice(0,3), highlight: [] },
      ],
      sql: "DELETE FROM players WHERE team = 'LSG';",
    },
    'INNER JOIN': {
      title: 'INNER JOIN — match rows from two tables',
      steps: [
        { label: 'Table A: players', rows: SAMPLE_DATA.slice(0,3), cols: ['id','name'], highlight: [] },
        { label: 'Table B: scores (same id)', rows: [{id:1,score:120},{id:2,score:95},{id:3,score:88}], cols: ['id','score'], highlight: [] },
        { label: 'JOIN ON id — matched rows combined', rows: [{name:'Rohit Sharma',score:120},{name:'Virat Kohli',score:95},{name:'MS Dhoni',score:88}], cols: ['name','score'], highlight: [0,1,2] },
      ],
      sql: 'SELECT p.name, s.score\nFROM players p\nJOIN scores s ON p.id = s.id;',
    },
  };

  function getCols(rows) {
    if (!rows.length) return [];
    return Object.keys(rows[0]);
  }

  function buildHTML(concept) {
    const config = CONCEPTS[concept];
    if (!config) return null;

    const id = `viz-${Date.now()}`;
    return `
      <div class="viz-card" id="${id}">
        <div class="viz-header">
          <span class="viz-badge">⚡ VISUAL</span>
          <span class="viz-title">${config.title}</span>
        </div>
        <div class="viz-sql"><code>${config.sql.replace(/\n/g,'<br>')}</code></div>
        <div class="viz-steps" id="${id}-steps">
          ${buildStep(config.steps[0], 0, config.steps.length)}
        </div>
        <div class="viz-controls">
          <button class="viz-btn" id="${id}-prev" onclick="Visualizer.prev('${id}')" disabled>← Prev</button>
          <span class="viz-counter" id="${id}-counter">Step 1 / ${config.steps.length}</span>
          <button class="viz-btn viz-btn-next" id="${id}-next" onclick="Visualizer.next('${id}')">Next →</button>
        </div>
        <div style="display:none" id="${id}-data" data-concept="${concept}" data-step="0"></div>
      </div>`;
  }

  function buildStep(step, idx, total) {
    const cols = step.cols || (step.rows.length ? Object.keys(step.rows[0]) : []);

    if (step.structure) {
      // CREATE TABLE view
      return `
        <div class="viz-step">
          <div class="viz-step-label">${step.label}</div>
          <div class="viz-table-wrap">
            <table class="viz-table">
              <thead><tr>${step.cols.map(c => `<th class="viz-th">${c}</th>`).join('')}</tr></thead>
              <tbody><tr>${step.cols.map(() => `<td class="viz-td" style="color:#3a3a5c;font-style:italic">empty</td>`).join('')}</tr></tbody>
            </table>
          </div>
        </div>`;
    }

    if (step.empty || !step.rows.length) {
      return `
        <div class="viz-step">
          <div class="viz-step-label">${step.label}</div>
          <div class="viz-table-wrap">
            <table class="viz-table">
              ${cols.length ? `<thead><tr>${cols.map(c => `<th class="viz-th">${c}</th>`).join('')}</tr></thead>` : ''}
              <tbody><tr><td colspan="${cols.length || 3}" style="text-align:center;color:#3a3a5c;padding:16px;font-family:'JetBrains Mono',monospace;font-size:11px;">— empty table —</td></tr></tbody>
            </table>
          </div>
        </div>`;
    }

    return `
      <div class="viz-step">
        <div class="viz-step-label">${step.label}</div>
        <div class="viz-table-wrap">
          <table class="viz-table">
            <thead><tr>${cols.map(c => `<th class="viz-th">${c}</th>`).join('')}</tr></thead>
            <tbody>
              ${step.rows.map((row, i) => {
                const isHighlight = step.highlight?.includes(i);
                const isReject    = step.reject?.includes(i);
                const rowStyle = isHighlight ? 'background:rgba(52,211,153,0.1);border-left:2px solid #34d399;'
                               : isReject    ? 'background:rgba(248,113,113,0.08);opacity:0.4;text-decoration:line-through;'
                               : '';
                return `<tr style="${rowStyle}">
                  ${cols.map(c => `<td class="viz-td">${row[c] ?? ''}</td>`).join('')}
                  ${isHighlight ? '<td style="color:#34d399;font-size:12px;padding:0 8px;">✓</td>' : ''}
                  ${isReject    ? '<td style="color:#f87171;font-size:12px;padding:0 8px;">✗</td>' : ''}
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  return {
    inject(concept) {
      const config = CONCEPTS[concept];
      if (!config) return null;
      return buildHTML(concept);
    },

    next(id) {
      const dataEl  = document.getElementById(`${id}-data`);
      const concept = dataEl.dataset.concept;
      const config  = CONCEPTS[concept];
      let step      = parseInt(dataEl.dataset.step);
      if (step >= config.steps.length - 1) return;
      step++;
      dataEl.dataset.step = step;
      document.getElementById(`${id}-steps`).innerHTML = buildStep(config.steps[step], step, config.steps.length);
      document.getElementById(`${id}-counter`).textContent = `Step ${step+1} / ${config.steps.length}`;
      document.getElementById(`${id}-prev`).disabled = false;
      document.getElementById(`${id}-next`).disabled = step >= config.steps.length - 1;
    },

    prev(id) {
      const dataEl  = document.getElementById(`${id}-data`);
      const concept = dataEl.dataset.concept;
      const config  = CONCEPTS[concept];
      let step      = parseInt(dataEl.dataset.step);
      if (step <= 0) return;
      step--;
      dataEl.dataset.step = step;
      document.getElementById(`${id}-steps`).innerHTML = buildStep(config.steps[step], step, config.steps.length);
      document.getElementById(`${id}-counter`).textContent = `Step ${step+1} / ${config.steps.length}`;
      document.getElementById(`${id}-prev`).disabled = step === 0;
      document.getElementById(`${id}-next`).disabled = false;
    },

    // Called from Chat after Chicha's explanation — auto-inject if concept has visual
    tryInject(concept) {
      if (!concept) return;
      // Try exact match first, then fuzzy match
      let config = CONCEPTS[concept];
      if (!config) {
        // Fuzzy: find a key that the concept string contains or vice versa
        const key = Object.keys(CONCEPTS).find(k =>
          concept.toLowerCase().includes(k.toLowerCase()) ||
          k.toLowerCase().includes(concept.toLowerCase())
        );
        if (key) config = CONCEPTS[key];
      }
      if (!config) return; // No visual for this concept — that's fine

      const html = buildHTML(concept in CONCEPTS ? concept :
        Object.keys(CONCEPTS).find(k =>
          concept.toLowerCase().includes(k.toLowerCase()) ||
          k.toLowerCase().includes(concept.toLowerCase())
        )
      );
      if (!html) return;
      const msgs = document.getElementById('messages');
      if (!msgs) return;
      const div = document.createElement('div');
      div.className = 'msg msg-chicha';
      div.innerHTML = `<div class="msg-av">✦</div><div style="width:100%">${html}</div>`;
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    },
  };
})();
