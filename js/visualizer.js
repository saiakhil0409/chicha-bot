// ── VISUALIZER ────────────────────────────────────────────────────────────────
// SVG concept diagrams — one per concept, auto-injected after teaching
const Visualizer = (() => {

  // ── SVG builder helpers ───────────────────────────────────────────────────
  const DEFS = `<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`;

  function svg(height, content) {
    return `<svg width="100%" viewBox="0 0 680 ${height}" role="img" style="margin-top:10px">${DEFS}${content}</svg>`;
  }

  function pill(x, y, w, text, color) {
    return `<rect x="${x}" y="${y}" width="${w}" height="28" rx="14" fill="rgba(${color},0.1)" stroke="rgba(${color},0.3)" stroke-width="0.5"/>
    <text class="ts" x="${x+w/2}" y="${y+18}" text-anchor="middle" style="fill:rgba(${color},1)">${text}</text>`;
  }

  function tableHeader(x, y, w, cols, color) {
    const cw = w / cols.length;
    return `<rect x="${x}" y="${y}" width="${w}" height="22" rx="4" fill="rgba(${color},0.2)" stroke="rgba(${color},0.4)" stroke-width="0.5"/>
    ${cols.map((c,i) => `<text class="ts" x="${x+cw*i+8}" y="${y+15}" style="fill:rgba(${color},1)">${c}</text>`).join('')}`;
  }

  function tableRow(x, y, w, cells, highlight) {
    const cw = w / cells.length;
    const bg = highlight === 'pass' ? 'rgba(52,211,153,0.1)' : highlight === 'fail' ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.03)';
    const border = highlight === 'pass' ? 'rgba(52,211,153,0.25)' : highlight === 'fail' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)';
    return `<rect x="${x}" y="${y}" width="${w}" height="22" rx="0" fill="${bg}" stroke="${border}" stroke-width="0.5"/>
    ${cells.map((c,i) => {
      const color = highlight==='pass'?'#34d399':highlight==='fail'?'#555':'inherit';
      const deco  = highlight==='fail'?'text-decoration:line-through;':'';
      return `<text class="ts" x="${x+cw*i+8}" y="${y+15}" style="fill:${color};${deco}">${c}</text>`;
    }).join('')}`;
  }

  function noteBox(x, y, w, lines) {
    const h = lines.length * 18 + 16;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="rgba(139,92,246,0.06)" stroke="rgba(139,92,246,0.2)" stroke-width="0.5"/>
    ${lines.map((l,i) => `<text class="ts" x="${x+w/2}" y="${y+22+i*18}" text-anchor="middle" style="fill:#9999bb">${l}</text>`).join('')}`;
  }

  // ── THEORY DIAGRAMS ───────────────────────────────────────────────────────
  const THEORY = {

    'What is a Database': () => svg(420, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">What is a Database?</text>
      <text class="ts" x="340" y="48" text-anchor="middle">An organised container for all your data tables</text>
      <rect x="180" y="65" width="320" height="260" rx="16" fill="rgba(139,92,246,0.08)" stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="6 3"/>
      <text class="th" x="340" y="92" text-anchor="middle" style="fill:#a78bfa">DATABASE</text>
      <rect x="198" y="104" width="130" height="80" rx="8" fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="th" x="263" y="120" text-anchor="middle" style="fill:#a78bfa">Customers</text>
      <text class="ts" x="206" y="138">id  name    city</text>
      <text class="ts" x="206" y="154">1   Rohit   Mumbai</text>
      <text class="ts" x="206" y="170">2   Priya   Delhi</text>
      <rect x="352" y="104" width="130" height="80" rx="8" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.3)" stroke-width="0.5"/>
      <text class="th" x="417" y="120" text-anchor="middle" style="fill:#f59e0b">Orders</text>
      <text class="ts" x="360" y="138">id  item    amt</text>
      <text class="ts" x="360" y="154">101 Biryani ₹180</text>
      <text class="ts" x="360" y="170">102 Dosa    ₹80</text>
      <rect x="198" y="200" width="130" height="80" rx="8" fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.25)" stroke-width="0.5"/>
      <text class="th" x="263" y="216" text-anchor="middle" style="fill:#34d399">Products</text>
      <text class="ts" x="206" y="234">id  name    price</text>
      <text class="ts" x="206" y="250">1   Biryani ₹180</text>
      <text class="ts" x="206" y="266">2   Dosa    ₹80</text>
      <rect x="352" y="200" width="130" height="80" rx="8" fill="rgba(248,113,113,0.08)" stroke="rgba(248,113,113,0.25)" stroke-width="0.5"/>
      <text class="th" x="417" y="216" text-anchor="middle" style="fill:#f87171">Delivery</text>
      <text class="ts" x="360" y="234">id  status  eta</text>
      <text class="ts" x="360" y="250">1   OnWay   5m</text>
      <text class="ts" x="360" y="266">2   Done    -</text>
      <text class="ts" x="340" y="344" text-anchor="middle" style="fill:#8b5cf6">All these tables together = one Database</text>
      ${['Swiggy App','Mobile App','Web Users','Excel/CSV'].map((s,i)=>`
        <rect x="20" y="${100+i*55}" width="110" height="30" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>
        <text class="ts" x="75" y="${119+i*55}" text-anchor="middle">${s}</text>
        <line x1="130" y1="${115+i*55}" x2="178" y2="${200}" stroke="rgba(139,92,246,0.4)" stroke-width="1" marker-end="url(#arrow)" fill="none"/>
      `).join('')}
      <text class="ts" x="154" y="215" text-anchor="middle" style="fill:#8b5cf6">DATA</text>
      ${[['Find instantly','52,211,153'],['Stay organised','139,92,246'],['Many users safe','245,158,11']].map(([t,c],i)=>pill(40+i*200,368,180,t,c)).join('')}
    `),

    'What is a Table': () => svg(380, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">What is a Table?</text>
      <text class="ts" x="340" y="48" text-anchor="middle">Like a spreadsheet — rows and columns, organised</text>
      <text class="th" x="100" y="90" text-anchor="middle" style="fill:#555;font-size:11px">COLUMNS (properties)</text>
      <line x1="100" y1="98" x2="100" y2="114" stroke="#555" stroke-width="1" marker-end="url(#arrow)" fill="none"/>
      <text class="th" x="26" y="180" text-anchor="middle" style="fill:#555;font-size:11px;writing-mode:vertical-rl">ROWS</text>
      ${tableHeader(60,115,560,['id','name','team','runs','city'],'139,92,246')}
      ${tableRow(60,137,560,['1','Rohit Sharma','Mumbai Indians','85','Mumbai'],'pass')}
      ${tableRow(60,159,560,['2','Virat Kohli','RCB','92','Bangalore'],'none')}
      ${tableRow(60,181,560,['3','MS Dhoni','CSK','33','Chennai'],'none')}
      ${tableRow(60,203,560,['4','Bumrah','Mumbai Indians','8','Mumbai'],'none')}
      ${tableRow(60,225,560,['5','KL Rahul','LSG','55','Lucknow'],'none')}
      <rect x="60" y="262" width="560" height="1" fill="rgba(255,255,255,0.08)"/>
      <text class="ts" x="340" y="290" text-anchor="middle" style="fill:#9999bb">Each <tspan style="fill:#a78bfa">row</tspan> = one player's complete record</text>
      <text class="ts" x="340" y="308" text-anchor="middle" style="fill:#9999bb">Each <tspan style="fill:#f59e0b">column</tspan> = one property (name, team, runs...)</text>
      ${noteBox(60,324,560,['One database holds many tables. Tables hold the actual data.'])}
    `),

    'Data types': () => svg(360, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">Data Types</text>
      <text class="ts" x="340" y="48" text-anchor="middle">Every column has a type — SQL needs to know what kind of data goes in</text>
      ${[
        ['INT','Whole numbers','player_id, runs, age','139,92,246',80],
        ['VARCHAR(n)','Text up to n chars','name, team, city','245,158,11',200],
        ['DECIMAL','Numbers with decimals','price, avg_score','52,211,153',320],
        ['DATE','Calendar dates','match_date, dob','248,113,113',440],
        ['BOOLEAN','True or False','is_captain, active','87,160,248',560],
      ].map(([type,desc,ex,c,x])=>`
        <rect x="${x-90}" y="72" width="110" height="80" rx="10" fill="rgba(${c},0.1)" stroke="rgba(${c},0.35)" stroke-width="0.5"/>
        <text class="th" x="${x-35}" y="94" text-anchor="middle" style="fill:rgba(${c},1);font-size:12px">${type}</text>
        <text class="ts" x="${x-35}" y="112" text-anchor="middle" style="fill:rgba(${c},0.8);font-size:10px">${desc}</text>
        <text class="ts" x="${x-35}" y="128" text-anchor="middle" style="fill:#555;font-size:10px">${ex.split(',')[0]}</text>
        <text class="ts" x="${x-35}" y="142" text-anchor="middle" style="fill:#555;font-size:10px">${ex.split(',')[1]||''}</text>
      `).join('')}
      <text class="th" x="340" y="190" text-anchor="middle" style="fill:#6b6b8a">Real example: players table</text>
      ${tableHeader(60,204,560,['Column','Data Type','Why'],'139,92,246')}
      ${tableRow(60,226,560,['player_id','INT','Whole number ID'],'none')}
      ${tableRow(60,248,560,['name','VARCHAR(100)','Text up to 100 chars'],'none')}
      ${tableRow(60,270,560,['avg_score','DECIMAL(5,2)','Like 94.50'],'none')}
      ${tableRow(60,292,560,['dob','DATE','2000-05-12'],'none')}
      ${noteBox(60,326,560,['Wrong type = errors. Storing "Rohit" in an INT column will fail.','Choose the right dabba for the right food.'])}
    `),
  };

  // ── SQL COMMAND DIAGRAMS ──────────────────────────────────────────────────
  const SQL_DIAGS = {

    'CREATE DATABASE': () => svg(340, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">CREATE DATABASE</text>
      <text class="ts" x="340" y="48" text-anchor="middle">Build the container before putting anything in it</text>
      <rect x="60" y="64" width="560" height="36" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="86" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">CREATE DATABASE Swiggy_DB;</text>
      <text class="ts" x="220" y="130" text-anchor="middle" style="fill:#555">Before</text>
      <text class="ts" x="500" y="130" text-anchor="middle" style="fill:#34d399">After</text>
      <rect x="80" y="140" width="260" height="100" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="5 3"/>
      <text class="ts" x="210" y="196" text-anchor="middle" style="fill:#333">nothing here yet</text>
      <line x1="352" y1="190" x2="388" y2="190" stroke="#8b5cf6" stroke-width="2" marker-end="url(#arrow)" fill="none"/>
      <text class="ts" x="370" y="183" text-anchor="middle" style="fill:#8b5cf6;font-size:10px">CREATE</text>
      <rect x="400" y="140" width="220" height="100" rx="12" fill="rgba(139,92,246,0.1)" stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="6 3"/>
      <text class="th" x="510" y="175" text-anchor="middle" style="fill:#a78bfa">Swiggy_DB</text>
      <text class="ts" x="510" y="196" text-anchor="middle" style="fill:#555">empty — ready for tables</text>
      <text class="ts" x="510" y="214" text-anchor="middle" style="fill:#333">no tables yet</text>
      ${noteBox(60,260,560,['Think of it like creating a new folder on your computer.','The folder exists but has nothing inside yet.'])}
    `),

    'CREATE TABLE': () => svg(380, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">CREATE TABLE</text>
      <text class="ts" x="340" y="48" text-anchor="middle">Design the structure before filling it with data</text>
      <rect x="60" y="64" width="560" height="80" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="80" y="84" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">CREATE TABLE players (</text>
      <text class="ts" x="100" y="100" style="fill:#34d399;font-family:'JetBrains Mono',monospace">  id INT PRIMARY KEY,</text>
      <text class="ts" x="100" y="116" style="fill:#34d399;font-family:'JetBrains Mono',monospace">  name VARCHAR(100),  runs INT</text>
      <text class="ts" x="80" y="134" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">);</text>
      <text class="ts" x="340" y="172" text-anchor="middle" style="fill:#555">Creates this empty structure:</text>
      ${tableHeader(60,182,560,['id (INT)','name (VARCHAR)','runs (INT)'],'139,92,246')}
      <rect x="60" y="204" width="560" height="30" rx="0" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
      <text class="ts" x="340" y="222" text-anchor="middle" style="fill:#333">— empty, waiting for INSERT —</text>
      <rect x="60" y="234" width="560" height="30" rx="0" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
      <rect x="60" y="264" width="560" height="30" rx="0" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
      ${noteBox(60,310,560,['CREATE TABLE = design the form. INSERT INTO = fill it in.','Structure first. Data second. Always.'])}
    `),

    'INSERT INTO': () => svg(360, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">INSERT INTO</text>
      <text class="ts" x="340" y="48" text-anchor="middle">Add one or more rows to an existing table</text>
      <rect x="60" y="64" width="560" height="50" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="80" y="84" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">INSERT INTO players (id, name, runs)</text>
      <text class="ts" x="80" y="103" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">VALUES (1, 'Rohit Sharma', 85);</text>
      <text class="ts" x="200" y="140" text-anchor="middle" style="fill:#555">Before</text>
      <text class="ts" x="500" y="140" text-anchor="middle" style="fill:#34d399">After</text>
      ${tableHeader(60,150,240,['id','name','runs'],'555')}
      <rect x="60" y="172" width="240" height="26" rx="0" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
      <text class="ts" x="180" y="188" text-anchor="middle" style="fill:#333">empty</text>
      <line x1="312" y1="188" x2="348" y2="188" stroke="#34d399" stroke-width="2" marker-end="url(#arrow)" fill="none"/>
      ${tableHeader(360,150,260,['id','name','runs'],'52,211,153')}
      ${tableRow(360,172,260,['1','Rohit Sharma','85'],'pass')}
      <rect x="360" y="198" width="260" height="26" rx="0" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
      <text class="ts" x="490" y="214" text-anchor="middle" style="fill:#333">waiting for more...</text>
      ${noteBox(60,244,560,['VALUES must match the column order exactly.','Run it again with different values to add more rows.'])}
    `),

    'UPDATE records': () => svg(340, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">UPDATE</text>
      <text class="ts" x="340" y="48" text-anchor="middle">Change existing data — always use WHERE or you change everything</text>
      <rect x="60" y="64" width="560" height="36" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="86" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">UPDATE players SET runs = 99 WHERE id = 1;</text>
      <text class="ts" x="200" y="125" text-anchor="middle" style="fill:#555">Before</text>
      <text class="ts" x="500" y="125" text-anchor="middle" style="fill:#34d399">After</text>
      ${tableHeader(60,135,240,['id','name','runs'],'555')}
      ${tableRow(60,157,240,['1','Rohit','85'],'none')}
      ${tableRow(60,179,240,['2','Virat','92'],'none')}
      ${tableRow(60,201,240,['3','Bumrah','8'],'none')}
      <line x1="312" y1="185" x2="348" y2="185" stroke="#34d399" stroke-width="2" marker-end="url(#arrow)" fill="none"/>
      ${tableHeader(360,135,260,['id','name','runs'],'52,211,153')}
      <rect x="360" y="157" width="260" height="22" rx="0" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)" stroke-width="0.5"/>
      <text class="ts" x="370" y="172" style="fill:#f59e0b">1</text>
      <text class="ts" x="440" y="172" style="fill:#f59e0b">Rohit</text>
      <text class="ts" x="540" y="172" style="fill:#f59e0b">99 ← changed</text>
      ${tableRow(360,179,260,['2','Virat','92'],'none')}
      ${tableRow(360,201,260,['3','Bumrah','8'],'none')}
      <rect x="60" y="240" width="560" height="30" rx="8" fill="rgba(248,113,113,0.08)" stroke="rgba(248,113,113,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="260" text-anchor="middle" style="fill:#f87171">⚠ Without WHERE — ALL rows get updated. Always filter.</text>
    `),

    'DELETE records': () => svg(320, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">DELETE</text>
      <text class="ts" x="340" y="48" text-anchor="middle">Remove rows permanently — cannot be undone</text>
      <rect x="60" y="64" width="560" height="36" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="86" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">DELETE FROM players WHERE id = 2;</text>
      ${tableHeader(60,115,240,['id','name','runs'],'555')}
      ${tableRow(60,137,240,['1','Rohit','85'],'pass')}
      ${tableRow(60,159,240,['2','Virat','92'],'fail')}
      ${tableRow(60,181,240,['3','Bumrah','8'],'pass')}
      <text class="ts" x="80" y="215" style="fill:#f87171">← row 2 deleted</text>
      <line x1="312" y1="175" x2="348" y2="175" stroke="#34d399" stroke-width="2" marker-end="url(#arrow)" fill="none"/>
      ${tableHeader(360,115,260,['id','name','runs'],'52,211,153')}
      ${tableRow(360,137,260,['1','Rohit','85'],'pass')}
      ${tableRow(360,159,260,['3','Bumrah','8'],'pass')}
      <rect x="60" y="222" width="560" height="44" rx="8" fill="rgba(248,113,113,0.08)" stroke="rgba(248,113,113,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="241" text-anchor="middle" style="fill:#f87171">⚠ DELETE without WHERE removes ALL rows from the table.</text>
      <text class="ts" x="340" y="259" text-anchor="middle" style="fill:#f87171">The table structure stays. Only data is removed.</text>
    `),

    'DROP TABLE': () => svg(300, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">DROP TABLE</text>
      <text class="ts" x="340" y="48" text-anchor="middle">Delete the table AND all its data — permanently</text>
      <rect x="60" y="64" width="560" height="36" rx="8" fill="rgba(248,113,113,0.1)" stroke="rgba(248,113,113,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="86" text-anchor="middle" style="fill:#f87171;font-family:'JetBrains Mono',monospace">DROP TABLE players;</text>
      <rect x="80" y="118" width="220" height="90" rx="12" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="th" x="190" y="140" text-anchor="middle" style="fill:#a78bfa">players table</text>
      <text class="ts" x="190" y="158" text-anchor="middle">500 rows of data</text>
      <text class="ts" x="190" y="174" text-anchor="middle">columns, indexes...</text>
      <text x="182" y="200" style="font-size:28px">🗑️</text>
      <line x1="312" y1="163" x2="368" y2="163" stroke="#f87171" stroke-width="2" marker-end="url(#arrow)" fill="none"/>
      <rect x="380" y="118" width="220" height="90" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="5 3"/>
      <text class="ts" x="490" y="163" text-anchor="middle" style="fill:#333">gone. completely.</text>
      <text class="ts" x="490" y="181" text-anchor="middle" style="fill:#333">table + data = deleted</text>
      ${noteBox(60,226,560,['Unlike DELETE (removes rows), DROP removes the entire table structure.','No undo. Always backup first.'])}
    `),

    'SELECT basics': () => svg(340, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">SELECT *</text>
      <text class="ts" x="340" y="48" text-anchor="middle">Fetch data — * means all columns</text>
      <rect x="60" y="64" width="560" height="36" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="86" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SELECT * FROM players;</text>
      ${tableHeader(60,116,560,['id','name','team','runs','city'],'139,92,246')}
      ${tableRow(60,138,560,['1','Rohit','Mumbai Indians','85','Mumbai'],'pass')}
      ${tableRow(60,160,560,['2','Virat','RCB','92','Bangalore'],'pass')}
      ${tableRow(60,182,560,['3','Dhoni','CSK','33','Chennai'],'pass')}
      ${tableRow(60,204,560,['4','Bumrah','Mumbai Indians','8','Mumbai'],'pass')}
      <text class="ts" x="340" y="244" text-anchor="middle" style="fill:#34d399">All 4 rows, all 5 columns returned</text>
      <rect x="200" y="64" width="6" height="170" rx="3" fill="none" stroke="rgba(245,158,11,0.6)" stroke-width="0"/>
      ${noteBox(60,260,560,['SELECT * = "give me everything". Use it to explore a table.','In production, name specific columns instead — faster and cleaner.'])}
    `),

    'WHERE filtering': () => svg(400, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">WHERE filtering</text>
      <rect x="60" y="42" width="560" height="28" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="60" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SELECT * FROM players WHERE team = 'Mumbai Indians'</text>
      ${tableHeader(20,82,220,['name','team'],'555')}
      ${tableRow(20,104,220,['Rohit','Mumbai Indians'],'pass')}
      ${tableRow(20,126,220,['Virat','RCB'],'fail')}
      ${tableRow(20,148,220,['Bumrah','Mumbai Indians'],'pass')}
      ${tableRow(20,170,220,['Dhoni','CSK'],'fail')}
      ${tableRow(20,192,220,['Hardik','Mumbai Indians'],'pass')}
      <rect x="270" y="110" width="140" height="80" rx="12" fill="rgba(139,92,246,0.12)" stroke="#8b5cf6" stroke-width="1.5"/>
      <text class="th" x="340" y="143" text-anchor="middle" style="fill:#a78bfa">WHERE</text>
      <text class="ts" x="340" y="161" text-anchor="middle" style="fill:#8b5cf6">team =</text>
      <text class="ts" x="340" y="177" text-anchor="middle" style="fill:#8b5cf6">'Mumbai Indians'</text>
      <line x1="240" y1="114" x2="268" y2="140" stroke="#34d399" stroke-width="1.2" marker-end="url(#arrow)" fill="none"/>
      <line x1="240" y1="159" x2="268" y2="155" stroke="#34d399" stroke-width="1.2" marker-end="url(#arrow)" fill="none"/>
      <line x1="240" y1="203" x2="268" y2="170" stroke="#34d399" stroke-width="1.2" marker-end="url(#arrow)" fill="none"/>
      <text class="ts" x="252" y="137" style="fill:#f87171">✗</text>
      <text class="ts" x="252" y="181" style="fill:#f87171">✗</text>
      <line x1="412" y1="150" x2="448" y2="150" stroke="#34d399" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      ${tableHeader(450,116,200,['name','team'],'52,211,153')}
      ${tableRow(450,138,200,['Rohit','MI'],'pass')}
      ${tableRow(450,160,200,['Bumrah','MI'],'pass')}
      ${tableRow(450,182,200,['Hardik','MI'],'pass')}
      ${noteBox(20,238,640,['WHERE is the bouncer. Every row knocks on the door.','Only rows matching the condition get through. Rest ignored.'])}
    `),

    'ORDER BY': () => svg(340, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">ORDER BY</text>
      <rect x="60" y="42" width="560" height="28" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="60" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SELECT name, runs FROM players ORDER BY runs DESC</text>
      ${tableHeader(60,82,240,['name','runs'],'555')}
      ${tableRow(60,104,240,['Rohit','85'],'none')}
      ${tableRow(60,126,240,['Virat','92'],'none')}
      ${tableRow(60,148,240,['Dhoni','33'],'none')}
      ${tableRow(60,170,240,['Bumrah','8'],'none')}
      <text class="ts" x="180" y="206" text-anchor="middle" style="fill:#555">original order</text>
      <rect x="295" y="120" width="90" height="50" rx="10" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" stroke-width="1.2"/>
      <text class="th" x="340" y="142" text-anchor="middle" style="fill:#f59e0b">SORT</text>
      <text class="ts" x="340" y="160" text-anchor="middle" style="fill:#f59e0b">runs DESC</text>
      <line x1="300" y1="145" x2="295" y2="145" stroke="#f59e0b" stroke-width="1.2" fill="none"/>
      <line x1="386" y1="145" x2="420" y2="145" stroke="#34d399" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      ${tableHeader(422,82,200,['name','runs'],'52,211,153')}
      <rect x="422" y="104" width="200" height="22" rx="0" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.3)" stroke-width="0.5"/>
      <text class="ts" x="432" y="119" style="fill:#34d399">Virat</text><text class="ts" x="532" y="119" style="fill:#34d399">92 ← highest</text>
      ${tableRow(422,126,200,['Rohit','85'],'pass')}
      ${tableRow(422,148,200,['Dhoni','33'],'none')}
      ${tableRow(422,170,200,['Bumrah','8'],'none')}
      <text class="ts" x="522" y="206" text-anchor="middle" style="fill:#34d399">sorted DESC</text>
      ${noteBox(60,218,560,['ASC = smallest first (A→Z, 1→9). DESC = largest first (Z→A, 9→1).','Data does not change — only the display order changes.'])}
    `),

    'GROUP BY': () => svg(380, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">GROUP BY</text>
      <rect x="60" y="42" width="560" height="28" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="60" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SELECT team, COUNT(*) as players FROM players GROUP BY team</text>
      <text class="ts" x="130" y="90" text-anchor="middle" style="fill:#555">All rows mixed</text>
      ${tableHeader(20,98,220,['name','team'],'555')}
      ${['Rohit|MI','Virat|RCB','Bumrah|MI','Dhoni|CSK','Hardik|MI','KL|LSG'].map((r,i)=>{
        const [n,t]=r.split('|');
        const colors={'MI':'pass','RCB':'none','CSK':'none','LSG':'none'};
        return tableRow(20,120+i*22,220,[n,t],colors[t]||'none');
      }).join('')}
      <rect x="258" y="110" width="80" height="160" rx="10" fill="rgba(139,92,246,0.08)" stroke="#8b5cf6" stroke-width="1.2" stroke-dasharray="4 2"/>
      <text class="th" x="298" y="130" text-anchor="middle" style="fill:#8b5cf6;font-size:11px">GROUP</text>
      <text class="th" x="298" y="148" text-anchor="middle" style="fill:#8b5cf6;font-size:11px">BY</text>
      <text class="th" x="298" y="166" text-anchor="middle" style="fill:#8b5cf6;font-size:11px">team</text>
      <line x1="340" y1="190" x2="376" y2="160" stroke="#34d399" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      ${tableHeader(380,100,260,['team','players'],'52,211,153')}
      <rect x="380" y="122" width="260" height="22" rx="0" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.3)" stroke-width="0.5"/>
      <text class="ts" x="390" y="137" style="fill:#34d399">Mumbai Indians</text><text class="ts" x="580" y="137" style="fill:#34d399">3</text>
      ${tableRow(380,144,260,['RCB','1'],'none')}
      ${tableRow(380,166,260,['CSK','1'],'none')}
      ${tableRow(380,188,260,['LSG','1'],'none')}
      ${noteBox(20,288,640,['GROUP BY collapses many rows into summary rows.','Always pair with COUNT, SUM, AVG, MIN, or MAX.'])}
    `),

    'INNER JOIN': () => svg(400, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">INNER JOIN</text>
      <rect x="60" y="42" width="560" height="28" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="60" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SELECT p.name, s.score FROM players p JOIN scores s ON p.id = s.id</text>
      ${tableHeader(20,82,190,['id','name'],'139,92,246')}
      ${tableRow(20,104,190,['1','Rohit'],'pass')}
      ${tableRow(20,126,190,['2','Virat'],'pass')}
      ${tableRow(20,148,190,['3','Bumrah'],'pass')}
      ${tableRow(20,170,190,['4','Hardik'],'fail')}
      <rect x="250" y="110" width="90" height="80" rx="10" fill="rgba(52,211,153,0.1)" stroke="#34d399" stroke-width="1.5"/>
      <text class="th" x="295" y="138" text-anchor="middle" style="fill:#34d399">ON</text>
      <text class="ts" x="295" y="156" text-anchor="middle" style="fill:#34d399">p.id</text>
      <text class="ts" x="295" y="172" text-anchor="middle" style="fill:#34d399">= s.id</text>
      ${tableHeader(352,82,190,['id','score'],'245,158,11')}
      ${tableRow(352,104,190,['1','85'],'pass')}
      ${tableRow(352,126,190,['2','92'],'pass')}
      ${tableRow(352,148,190,['3','78'],'pass')}
      ${tableRow(352,170,190,['5','61'],'fail')}
      <text class="ts" x="30" y="195" style="fill:#f87171">id=4, no match</text>
      <text class="ts" x="354" y="195" style="fill:#f87171">id=5, no match</text>
      <line x1="295" y1="192" x2="295" y2="228" stroke="#34d399" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      ${tableHeader(120,236,400,['name','score'],'52,211,153')}
      ${tableRow(120,258,400,['Rohit','85'],'pass')}
      ${tableRow(120,280,400,['Virat','92'],'pass')}
      ${tableRow(120,302,400,['Bumrah','78'],'pass')}
      ${noteBox(20,330,640,['INNER JOIN = the handshake. Only rows where BOTH sides agree on the id.','Hardik (id=4) has no score. Score id=5 has no player. Both dropped.'])}
    `),

    'LEFT JOIN': () => svg(380, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">LEFT JOIN</text>
      <rect x="60" y="42" width="560" height="28" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="60" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SELECT p.name, s.score FROM players p LEFT JOIN scores s ON p.id = s.id</text>
      ${tableHeader(20,82,190,['id','name'],'139,92,246')}
      ${tableRow(20,104,190,['1','Rohit'],'pass')}
      ${tableRow(20,126,190,['2','Virat'],'pass')}
      ${tableRow(20,148,190,['3','Bumrah'],'pass')}
      ${tableRow(20,170,190,['4','Hardik'],'pass')}
      <rect x="250" y="100" width="90" height="90" rx="10" fill="rgba(139,92,246,0.1)" stroke="#8b5cf6" stroke-width="1.5"/>
      <text class="th" x="295" y="126" text-anchor="middle" style="fill:#a78bfa">LEFT</text>
      <text class="th" x="295" y="144" text-anchor="middle" style="fill:#a78bfa">JOIN</text>
      <text class="ts" x="295" y="166" text-anchor="middle" style="fill:#8b5cf6">keep ALL left</text>
      <text class="ts" x="295" y="182" text-anchor="middle" style="fill:#8b5cf6">NULL if no match</text>
      ${tableHeader(352,82,190,['id','score'],'245,158,11')}
      ${tableRow(352,104,190,['1','85'],'pass')}
      ${tableRow(352,126,190,['2','92'],'pass')}
      ${tableRow(352,148,190,['3','78'],'pass')}
      <rect x="352" y="170" width="190" height="22" rx="0" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
      <text class="ts" x="362" y="185" style="fill:#333">no id=4 here</text>
      <line x1="295" y1="192" x2="295" y2="222" stroke="#8b5cf6" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      ${tableHeader(80,230,480,['name','score'],'52,211,153')}
      ${tableRow(80,252,480,['Rohit','85'],'pass')}
      ${tableRow(80,274,480,['Virat','92'],'pass')}
      ${tableRow(80,296,480,['Bumrah','78'],'pass')}
      <rect x="80" y="318" width="480" height="22" rx="0" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.3)" stroke-width="0.5"/>
      <text class="ts" x="90" y="333">Hardik</text>
      <text class="ts" x="370" y="333" style="fill:#f59e0b">NULL ← no matching score</text>
    `),

    'Subqueries': () => svg(420, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">Subquery — query inside a query</text>
      <rect x="20" y="44" width="640" height="52" rx="10" fill="rgba(13,13,28,0.8)" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
      <text class="ts" x="36" y="64" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SELECT name FROM players WHERE id IN (</text>
      <rect x="130" y="69" width="370" height="16" rx="4" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)" stroke-width="0.5"/>
      <text class="ts" x="136" y="81" style="fill:#f59e0b;font-family:'JetBrains Mono',monospace">SELECT player_id FROM scores WHERE score > 80</text>
      <text class="ts" x="504" y="64" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">)</text>
      <rect x="20" y="108" width="300" height="160" rx="12" fill="rgba(245,158,11,0.06)" stroke="rgba(245,158,11,0.4)" stroke-width="1.5" stroke-dasharray="5 3"/>
      <rect x="30" y="118" width="140" height="18" rx="4" fill="rgba(245,158,11,0.2)" stroke="rgba(245,158,11,0.3)" stroke-width="0.5"/>
      <text class="ts" x="100" y="131" text-anchor="middle" style="fill:#f59e0b">① runs first</text>
      ${tableHeader(36,142,270,['player_id','score'],'245,158,11')}
      ${tableRow(36,164,270,['1','85 ✓'],'pass')}
      ${tableRow(36,186,270,['2','72 ✗'],'fail')}
      ${tableRow(36,208,270,['3','92 ✓'],'pass')}
      <line x1="322" y1="200" x2="358" y2="200" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrow)" fill="none"/>
      <rect x="360" y="160" width="130" height="80" rx="10" fill="rgba(245,158,11,0.12)" stroke="#f59e0b" stroke-width="1.5"/>
      <text class="th" x="425" y="185" text-anchor="middle" style="fill:#f59e0b">Result</text>
      <text class="ts" x="425" y="202" text-anchor="middle" style="fill:#34d399">1</text>
      <text class="ts" x="425" y="218" text-anchor="middle" style="fill:#34d399">3</text>
      <text class="ts" x="425" y="252" text-anchor="middle" style="fill:#8b5cf6">= IN (1, 3)</text>
      <line x1="425" y1="258" x2="425" y2="282" stroke="#8b5cf6" stroke-width="2" marker-end="url(#arrow)" fill="none"/>
      <rect x="20" y="290" width="640" height="90" rx="12" fill="rgba(139,92,246,0.06)" stroke="rgba(139,92,246,0.4)" stroke-width="1.5"/>
      <rect x="30" y="300" width="140" height="18" rx="4" fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="100" y="313" text-anchor="middle" style="fill:#a78bfa">② outer query</text>
      ${tableHeader(36,322,280,['id','name'],'139,92,246')}
      ${tableRow(36,344,280,['1 ✓','Rohit'],'pass')}
      ${tableRow(36,366,280,['2 ✗','Virat'],'fail')}
      <rect x="380" y="322" width="260" height="66" rx="8" fill="rgba(52,211,153,0.1)" stroke="#34d399" stroke-width="1.2"/>
      <text class="th" x="510" y="344" text-anchor="middle" style="fill:#34d399">Final result</text>
      <text class="ts" x="510" y="362" text-anchor="middle">Rohit</text>
      <text class="ts" x="510" y="380" text-anchor="middle">Bumrah</text>
      <text class="ts" x="340" y="406" text-anchor="middle" style="fill:#6b6b8a">Inner runs first → makes a list → outer uses that list</text>
    `),

    'CTEs (WITH clause)': () => svg(380, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">CTE — WITH clause</text>
      <rect x="20" y="44" width="640" height="66" rx="10" fill="rgba(13,13,28,0.8)" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
      <rect x="30" y="50" width="360" height="16" rx="4" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.3)" stroke-width="0.5"/>
      <text class="ts" x="36" y="63" style="fill:#f59e0b;font-family:'JetBrains Mono',monospace">WITH top_scorers AS (</text>
      <text class="ts" x="36" y="79" style="fill:#f59e0b;font-family:'JetBrains Mono',monospace">  SELECT name, runs FROM players WHERE runs > 50</text>
      <text class="ts" x="36" y="95" style="fill:#f59e0b;font-family:'JetBrains Mono',monospace">)</text>
      <text class="ts" x="36" y="103" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SELECT * FROM top_scorers ORDER BY runs DESC;</text>
      <rect x="20" y="122" width="300" height="110" rx="12" fill="rgba(245,158,11,0.06)" stroke="rgba(245,158,11,0.4)" stroke-width="1.5" stroke-dasharray="5 3"/>
      <text class="th" x="110" y="144" text-anchor="middle" style="fill:#f59e0b">top_scorers</text>
      <text class="ts" x="170" y="144" style="fill:#555">(named result)</text>
      ${tableHeader(36,152,270,['name','runs'],'245,158,11')}
      ${tableRow(36,174,270,['Rohit','85'],'pass')}
      ${tableRow(36,196,270,['Virat','92'],'pass')}
      ${tableRow(36,218,270,['Hardik','67'],'pass')}
      <line x1="322" y1="190" x2="368" y2="190" stroke="#34d399" stroke-width="2" marker-end="url(#arrow)" fill="none"/>
      <rect x="370" y="122" width="290" height="110" rx="12" fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.4)" stroke-width="1.5"/>
      <text class="th" x="515" y="144" text-anchor="middle" style="fill:#a78bfa">Main query uses it</text>
      ${tableHeader(386,152,254,['name','runs'],'52,211,153')}
      ${tableRow(386,174,254,['Virat','92'],'pass')}
      ${tableRow(386,196,254,['Rohit','85'],'pass')}
      ${tableRow(386,218,254,['Hardik','67'],'pass')}
      ${noteBox(20,248,640,['CTE = give your messy inner query a clean name. Use it like a table.','Disappears after the query runs — temporary and readable.'])}
    `),

    'Window functions': () => svg(380, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">Window Functions</text>
      <rect x="60" y="42" width="560" height="28" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="60" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SELECT name, runs, RANK() OVER (ORDER BY runs DESC) as rank</text>
      <text class="ts" x="200" y="90" text-anchor="middle" style="fill:#555">Unlike GROUP BY — rows survive</text>
      ${tableHeader(20,100,280,['name','runs'],'555')}
      ${['Rohit|85','Virat|92','Dhoni|33','Bumrah|8','Hardik|67'].map((r,i)=>{
        const [n,v]=r.split('|');
        return tableRow(20,122+i*22,280,[n,v],'none');
      }).join('')}
      <text class="ts" x="160" y="240" text-anchor="middle" style="fill:#555">5 rows in → 5 rows out</text>
      <rect x="260" y="110" width="100" height="120" rx="10" fill="rgba(139,92,246,0.1)" stroke="#8b5cf6" stroke-width="1.5"/>
      <text class="th" x="310" y="132" text-anchor="middle" style="fill:#a78bfa">RANK()</text>
      <text class="ts" x="310" y="150" text-anchor="middle" style="fill:#8b5cf6">OVER</text>
      <text class="ts" x="310" y="166" text-anchor="middle" style="fill:#8b5cf6">(ORDER BY</text>
      <text class="ts" x="310" y="182" text-anchor="middle" style="fill:#8b5cf6">runs DESC)</text>
      <text class="ts" x="310" y="206" text-anchor="middle" style="fill:#555">sees all rows</text>
      <line x1="362" y1="170" x2="398" y2="160" stroke="#34d399" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      ${tableHeader(400,100,240,['name','runs','rank'],'52,211,153')}
      <rect x="400" y="122" width="240" height="22" rx="0" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.3)" stroke-width="0.5"/>
      <text class="ts" x="410" y="137">Virat</text><text class="ts" x="490" y="137">92</text><text class="ts" x="570" y="137" style="fill:#f59e0b">1</text>
      ${tableRow(400,144,240,['Rohit','85','2'],'pass')}
      ${tableRow(400,166,240,['Hardik','67','3'],'none')}
      ${tableRow(400,188,240,['Dhoni','33','4'],'none')}
      ${tableRow(400,210,240,['Bumrah','8','5'],'none')}
      ${noteBox(20,258,640,['Unlike GROUP BY, window functions ADD a new column without collapsing rows.','RANK() gives position. LAG() gives previous row. SUM() gives running total.'])}
    `),

    'RANK & DENSE_RANK': () => svg(400, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">RANK vs DENSE_RANK</text>
      <rect x="20" y="42" width="640" height="24" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="58" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">RANK() OVER (ORDER BY runs DESC) vs DENSE_RANK() OVER (ORDER BY runs DESC)</text>
      ${tableHeader(20,80,200,['name','runs'],'139,92,246')}
      ${tableRow(20,102,200,['Rohit','85'],'none')}
      ${tableRow(20,124,200,['Virat','85'],'none')}
      ${tableRow(20,146,200,['Hardik','67'],'none')}
      ${tableRow(20,168,200,['Bumrah','8'],'none')}
      <text class="ts" x="120" y="205" text-anchor="middle" style="fill:#555">same score → tie</text>
      <text class="th" x="310" y="80" text-anchor="middle" style="fill:#f59e0b">RANK()</text>
      <text class="ts" x="310" y="95" text-anchor="middle" style="fill:#555">skips after tie</text>
      ${tableHeader(240,102,140,['name','rank'],'245,158,11')}
      ${tableRow(240,124,140,['Rohit','1'],'none')}
      ${tableRow(240,146,140,['Virat','1'],'none')}
      <rect x="240" y="168" width="140" height="22" rx="0" fill="rgba(248,113,113,0.1)" stroke="rgba(248,113,113,0.2)" stroke-width="0.5"/>
      <text class="ts" x="250" y="183">Hardik</text><text class="ts" x="330" y="183" style="fill:#f87171">3 ← gap!</text>
      ${tableRow(240,190,140,['Bumrah','4'],'none')}
      <text class="th" x="530" y="80" text-anchor="middle" style="fill:#34d399">DENSE_RANK()</text>
      <text class="ts" x="530" y="95" text-anchor="middle" style="fill:#555">no gaps</text>
      ${tableHeader(460,102,160,['name','rank'],'52,211,153')}
      ${tableRow(460,124,160,['Rohit','1'],'pass')}
      ${tableRow(460,146,160,['Virat','1'],'pass')}
      <rect x="460" y="168" width="160" height="22" rx="0" fill="rgba(52,211,153,0.1)" stroke="rgba(52,211,153,0.25)" stroke-width="0.5"/>
      <text class="ts" x="470" y="183">Hardik</text><text class="ts" x="570" y="183" style="fill:#34d399">2 ✓</text>
      ${tableRow(460,190,160,['Bumrah','3'],'pass')}
      ${noteBox(20,230,640,['RANK() skips numbers after ties: 1,1,3,4 — like the podium with no "2nd place".','DENSE_RANK() never skips: 1,1,2,3 — consecutive always.'])}
      ${noteBox(20,310,640,['Memory trick: DENSE = Dense packing = no gaps.'])}
    `),

    'LAG & LEAD': () => svg(420, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">LAG() and LEAD()</text>
      <rect x="20" y="42" width="640" height="24" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="58" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">LAG(runs) OVER (ORDER BY match_id) -- previous row's value</text>
      <text class="ts" x="200" y="92" text-anchor="middle" style="fill:#555">Original table</text>
      ${tableHeader(20,100,200,['match','runs'],'139,92,246')}
      ${tableRow(20,122,200,['Match 1','45'],'none')}
      ${tableRow(20,144,200,['Match 2','82'],'none')}
      ${tableRow(20,166,200,['Match 3','31'],'none')}
      ${tableRow(20,188,200,['Match 4','67'],'none')}
      <rect x="258" y="100" width="164" height="112" rx="10" fill="rgba(139,92,246,0.1)" stroke="#8b5cf6" stroke-width="1.5"/>
      <text class="th" x="340" y="122" text-anchor="middle" style="fill:#a78bfa">LAG(runs)</text>
      <text class="ts" x="340" y="140" text-anchor="middle" style="fill:#8b5cf6">Look back 1 row</text>
      <text class="ts" x="340" y="160" text-anchor="middle" style="fill:#555">← previous</text>
      <line x1="220" y1="155" x2="256" y2="155" stroke="#8b5cf6" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      <text class="th" x="530" y="92" text-anchor="middle" style="fill:#34d399">With LAG()</text>
      ${tableHeader(424,100,230,['match','runs','prev_runs'],'52,211,153')}
      <rect x="424" y="122" width="230" height="22" rx="0" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
      <text class="ts" x="434" y="137">Match 1</text><text class="ts" x="514" y="137">45</text><text class="ts" x="584" y="137" style="fill:#555">NULL</text>
      ${tableRow(424,144,230,['Match 2','82','45'],'pass')}
      ${tableRow(424,166,230,['Match 3','31','82'],'pass')}
      ${tableRow(424,188,230,['Match 4','67','31'],'pass')}
      <text class="ts" x="340" y="238" text-anchor="middle" style="fill:#f59e0b">LEAD() is the opposite — looks FORWARD one row instead</text>
      ${noteBox(20,258,640,['LAG = rear-view mirror. LEAD = looking ahead.','First row has NULL for LAG (no previous). Last row has NULL for LEAD.'])}
      ${noteBox(20,330,640,['Use case: "How did Rohit do compared to his last match?" → LAG(runs) gives last match score.'])}
    `),

    'Running totals': () => svg(380, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">Running Total — SUM() window</text>
      <rect x="20" y="42" width="640" height="24" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="58" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SUM(runs) OVER (ORDER BY match_id) as running_total</text>
      ${tableHeader(20,80,220,['match','runs'],'139,92,246')}
      ${tableRow(20,102,220,['Match 1','45'],'none')}
      ${tableRow(20,124,220,['Match 2','82'],'none')}
      ${tableRow(20,146,220,['Match 3','31'],'none')}
      ${tableRow(20,168,220,['Match 4','67'],'none')}
      <text class="ts" x="130" y="208" text-anchor="middle" style="fill:#555">individual scores</text>
      <rect x="278" y="80" width="104" height="112" rx="10" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" stroke-width="1.5"/>
      <text class="th" x="330" y="102" text-anchor="middle" style="fill:#f59e0b">SUM()</text>
      <text class="ts" x="330" y="120" text-anchor="middle" style="fill:#f59e0b">OVER</text>
      <text class="ts" x="330" y="138" text-anchor="middle" style="fill:#f59e0b">(ORDER</text>
      <text class="ts" x="330" y="154" text-anchor="middle" style="fill:#f59e0b">BY match)</text>
      <text class="ts" x="330" y="175" text-anchor="middle" style="fill:#555">accumulates</text>
      <line x1="384" y1="136" x2="400" y2="136" stroke="#f59e0b" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      ${tableHeader(402,80,254,['match','runs','running_total'],'52,211,153')}
      ${tableRow(402,102,254,['Match 1','45','45'],'pass')}
      ${tableRow(402,124,254,['Match 2','82','127'],'pass')}
      ${tableRow(402,146,254,['Match 3','31','158'],'pass')}
      ${tableRow(402,168,254,['Match 4','67','225'],'pass')}
      <text class="ts" x="530" y="208" text-anchor="middle" style="fill:#34d399">45→127→158→225</text>
      ${noteBox(20,228,640,['Running total = cumulative sum. Each row adds to the previous total.','Like a cricket scoreboard that shows total runs after every over.'])}
    `),

    'HAVING': () => svg(400, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">HAVING — WHERE for groups</text>
      <rect x="20" y="42" width="640" height="24" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="58" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SELECT team, COUNT(*) as players FROM squad GROUP BY team HAVING COUNT(*) > 2</text>
      <text class="ts" x="120" y="92" text-anchor="middle" style="fill:#555">After GROUP BY</text>
      ${tableHeader(20,100,220,['team','players'],'139,92,246')}
      ${tableRow(20,122,220,['Mumbai Indians','4'],'pass')}
      ${tableRow(20,144,220,['RCB','3'],'pass')}
      ${tableRow(20,166,220,['CSK','2'],'fail')}
      ${tableRow(20,188,220,['LSG','1'],'fail')}
      <rect x="278" y="110" width="124" height="80" rx="10" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" stroke-width="1.5"/>
      <text class="th" x="340" y="132" text-anchor="middle" style="fill:#f59e0b">HAVING</text>
      <text class="ts" x="340" y="150" text-anchor="middle" style="fill:#f59e0b">COUNT(*) > 2</text>
      <text class="ts" x="340" y="170" text-anchor="middle" style="fill:#555">filters groups</text>
      <line x1="242" y1="160" x2="276" y2="155" stroke="#f59e0b" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      ${tableHeader(440,100,200,['team','players'],'52,211,153')}
      ${tableRow(440,122,200,['Mumbai Indians','4'],'pass')}
      ${tableRow(440,144,200,['RCB','3'],'pass')}
      <line x1="404" y1="150" x2="438" y2="150" stroke="#34d399" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      <text class="ts" x="542" y="185" text-anchor="middle" style="fill:#555">CSK, LSG removed</text>
      ${noteBox(20,228,640,['WHERE runs before grouping. HAVING runs AFTER grouping.','WHERE: filter rows. HAVING: filter groups.'])}
      ${noteBox(20,300,640,['Memory: WHERE is the entrance bouncer. HAVING is the VIP check inside.'])}
    `),

    'CASE WHEN': () => svg(400, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">CASE WHEN — SQL if-else</text>
      <rect x="20" y="42" width="640" height="24" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="58" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">CASE WHEN runs > 80 THEN 'Star' WHEN runs > 40 THEN 'Good' ELSE 'Average' END</text>
      ${tableHeader(20,80,200,['name','runs'],'139,92,246')}
      ${tableRow(20,102,200,['Virat','92'],'none')}
      ${tableRow(20,124,200,['Rohit','85'],'none')}
      ${tableRow(20,146,200,['Hardik','67'],'none')}
      ${tableRow(20,168,200,['Dhoni','33'],'none')}
      <rect x="250" y="80" width="180" height="130" rx="10" fill="rgba(245,158,11,0.08)" stroke="#f59e0b" stroke-width="1.5"/>
      <text class="th" x="340" y="102" text-anchor="middle" style="fill:#f59e0b">CASE WHEN</text>
      <text class="ts" x="260" y="122" style="fill:#34d399">runs > 80 → 'Star'</text>
      <text class="ts" x="260" y="140" style="fill:#a78bfa">runs > 40 → 'Good'</text>
      <text class="ts" x="260" y="158" style="fill:#555">ELSE → 'Average'</text>
      <text class="ts" x="340" y="195" text-anchor="middle" style="fill:#6b6b8a">evaluates each row</text>
      <line x1="222" y1="145" x2="248" y2="145" stroke="#f59e0b" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      <line x1="432" y1="145" x2="454" y2="145" stroke="#f59e0b" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      ${tableHeader(456,80,200,['name','label'],'52,211,153')}
      <rect x="456" y="102" width="200" height="22" rx="0" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.3)" stroke-width="0.5"/>
      <text class="ts" x="466" y="117">Virat</text><text class="ts" x="556" y="117" style="fill:#f59e0b">Star ⭐</text>
      <rect x="456" y="124" width="200" height="22" rx="0" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.3)" stroke-width="0.5"/>
      <text class="ts" x="466" y="139">Rohit</text><text class="ts" x="556" y="139" style="fill:#f59e0b">Star ⭐</text>
      ${tableRow(456,146,200,['Hardik','Good'],'pass')}
      ${tableRow(456,168,200,['Dhoni','Average'],'none')}
      ${noteBox(20,240,640,['CASE WHEN is SQL\'s if-else. Evaluates conditions top to bottom.','First matching condition wins. ELSE catches everything that didn\'t match.'])}
      ${noteBox(20,312,640,['Use case: categorise data, create labels, handle NULL values cleanly.'])}
    `),

    'DISTINCT': () => svg(320, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">DISTINCT — remove duplicates</text>
      <rect x="20" y="42" width="640" height="24" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="58" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SELECT DISTINCT team FROM players</text>
      <text class="ts" x="130" y="90" text-anchor="middle" style="fill:#555">Without DISTINCT</text>
      ${tableHeader(20,98,220,['team'],'248,113,113')}
      ${tableRow(20,120,220,['Mumbai Indians'],'none')}
      ${tableRow(20,142,220,['Mumbai Indians'],'fail')}
      ${tableRow(20,164,220,['RCB'],'none')}
      ${tableRow(20,186,220,['CSK'],'none')}
      ${tableRow(20,208,220,['Mumbai Indians'],'fail')}
      <text class="ts" x="130" y="248" text-anchor="middle" style="fill:#f87171">5 rows, duplicates!</text>
      <rect x="278" y="120" width="124" height="70" rx="10" fill="rgba(139,92,246,0.1)" stroke="#8b5cf6" stroke-width="1.5"/>
      <text class="th" x="340" y="144" text-anchor="middle" style="fill:#a78bfa">DISTINCT</text>
      <text class="ts" x="340" y="162" text-anchor="middle" style="fill:#8b5cf6">deduplicate</text>
      <text class="ts" x="340" y="178" text-anchor="middle" style="fill:#555">keep one each</text>
      <line x1="242" y1="165" x2="276" y2="165" stroke="#8b5cf6" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      <line x1="404" y1="165" x2="438" y2="165" stroke="#8b5cf6" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
      <text class="ts" x="550" y="90" text-anchor="middle" style="fill:#34d399">With DISTINCT</text>
      ${tableHeader(440,98,200,['team'],'52,211,153')}
      ${tableRow(440,120,200,['Mumbai Indians'],'pass')}
      ${tableRow(440,142,200,['RCB'],'pass')}
      ${tableRow(440,164,200,['CSK'],'pass')}
      <text class="ts" x="540" y="210" text-anchor="middle" style="fill:#34d399">3 rows, clean!</text>
      ${noteBox(20,258,640,['DISTINCT removes duplicate values. Like calling attendance — tick each name once only.'])}
    `),

    'BETWEEN': () => svg(320, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">BETWEEN — range filter</text>
      <rect x="20" y="42" width="640" height="24" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="58" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SELECT name FROM players WHERE runs BETWEEN 40 AND 85</text>
      ${tableHeader(20,80,200,['name','runs'],'139,92,246')}
      ${tableRow(20,102,200,['Virat','92'],'fail')}
      ${tableRow(20,124,200,['Rohit','85'],'pass')}
      ${tableRow(20,146,200,['Hardik','67'],'pass')}
      ${tableRow(20,168,200,['Dhoni','33'],'fail')}
      ${tableRow(20,190,200,['Bumrah','45'],'pass')}
      <rect x="258" y="100" width="164" height="90" rx="10" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" stroke-width="1.5"/>
      <text class="th" x="340" y="122" text-anchor="middle" style="fill:#f59e0b">BETWEEN</text>
      <text class="ts" x="340" y="142" text-anchor="middle" style="fill:#f59e0b">40 AND 85</text>
      <text class="ts" x="340" y="162" text-anchor="middle" style="fill:#555">inclusive both ends</text>
      <text class="ts" x="340" y="180" text-anchor="middle" style="fill:#555">40 ≤ runs ≤ 85</text>
      ${tableHeader(456,80,200,['name','runs'],'52,211,153')}
      ${tableRow(456,102,200,['Rohit','85'],'pass')}
      ${tableRow(456,124,200,['Hardik','67'],'pass')}
      ${tableRow(456,146,200,['Bumrah','45'],'pass')}
      <text class="ts" x="340" y="220" text-anchor="middle" style="fill:#34d399">92 too high. 33 too low.</text>
      ${noteBox(20,248,640,['BETWEEN is shorthand for: WHERE runs >= 40 AND runs <= 85.','Both boundaries are INCLUSIVE — 40 and 85 are included in the results.'])}
    `),

    'LIKE & wildcards': () => svg(360, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">LIKE — pattern matching</text>
      <rect x="20" y="42" width="640" height="24" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="58" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">SELECT name FROM players WHERE name LIKE 'R%'</text>
      <text class="ts" x="200" y="88" text-anchor="middle" style="fill:#f59e0b">% = any characters (0 or more)</text>
      <text class="ts" x="520" y="88" text-anchor="middle" style="fill:#8b5cf6">_ = exactly one character</text>
      ${tableHeader(20,100,200,['name'],'139,92,246')}
      ${tableRow(20,122,200,['Rohit'],'pass')}
      ${tableRow(20,144,200,['Virat'],'fail')}
      ${tableRow(20,166,200,['Rahul'],'pass')}
      ${tableRow(20,188,200,['Bumrah'],'fail')}
      ${tableRow(20,210,200,['Rinku'],'pass')}
      <rect x="258" y="110" width="164" height="90" rx="10" fill="rgba(139,92,246,0.1)" stroke="#8b5cf6" stroke-width="1.5"/>
      <text class="th" x="340" y="132" text-anchor="middle" style="fill:#a78bfa">LIKE 'R%'</text>
      <text class="ts" x="340" y="150" text-anchor="middle" style="fill:#8b5cf6">starts with R</text>
      <text class="ts" x="340" y="170" text-anchor="middle" style="fill:#555">then anything</text>
      <text class="ts" x="340" y="188" text-anchor="middle" style="fill:#555">after it</text>
      ${tableHeader(456,100,180,['name'],'52,211,153')}
      ${tableRow(456,122,180,['Rohit'],'pass')}
      ${tableRow(456,144,180,['Rahul'],'pass')}
      ${tableRow(456,166,180,['Rinku'],'pass')}
      ${noteBox(20,248,640,['% matches zero or more characters: "R%" = starts with R.','_ matches exactly one: "R_hit" matches "Rohit" but not "Rohiit".'])}
      ${noteBox(20,306,640,['"%Kumar%" finds anyone with Kumar anywhere in the name.'])}
    `),

    'ALTER TABLE': () => svg(360, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">ALTER TABLE — modify structure</text>
      <rect x="20" y="42" width="640" height="24" rx="8" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="ts" x="340" y="58" text-anchor="middle" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">ALTER TABLE players ADD COLUMN age INT</text>
      <text class="ts" x="170" y="90" text-anchor="middle" style="fill:#555">Before ALTER</text>
      ${tableHeader(20,98,280,['id','name','team'],'139,92,246')}
      ${tableRow(20,120,280,['1','Rohit','Mumbai Indians'],'none')}
      ${tableRow(20,142,280,['2','Virat','RCB'],'none')}
      ${tableRow(20,164,280,['3','Bumrah','Mumbai Indians'],'none')}
      <rect x="330" y="120" width="20" height="66" rx="4" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" stroke-width="1"/>
      <text class="ts" x="340" y="108" text-anchor="middle" style="fill:#f59e0b">ADD</text>
      <line x1="352" y1="153" x2="376" y2="153" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrow)" fill="none"/>
      <text class="ts" x="530" y="90" text-anchor="middle" style="fill:#34d399">After ALTER</text>
      ${tableHeader(380,98,280,['id','name','team','age'],'52,211,153')}
      ${tableRow(380,120,280,['1','Rohit','MI','NULL'],'none')}
      ${tableRow(380,142,280,['2','Virat','RCB','NULL'],'none')}
      ${tableRow(380,164,280,['3','Bumrah','MI','NULL'],'none')}
      <text class="ts" x="530" y="205" text-anchor="middle" style="fill:#555">new column, NULL by default</text>
      ${noteBox(20,226,640,['ALTER TABLE modifies structure without touching the data.','ADD COLUMN adds a new column. DROP COLUMN removes one. RENAME renames.'])}
      ${noteBox(20,290,640,['Like adding a new room to a house — family stays inside while you build.'])}
    `),

    'DROP TABLE': () => svg(320, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">DROP TABLE — delete everything</text>
      <rect x="20" y="42" width="640" height="24" rx="8" fill="rgba(248,113,113,0.1)" stroke="rgba(248,113,113,0.4)" stroke-width="0.5"/>
      <text class="ts" x="340" y="58" text-anchor="middle" style="fill:#f87171;font-family:'JetBrains Mono',monospace">DROP TABLE players  -- WARNING: permanent!</text>
      <text class="ts" x="200" y="90" text-anchor="middle" style="fill:#555">Before DROP</text>
      ${tableHeader(20,98,280,['id','name','team'],'139,92,246')}
      ${tableRow(20,120,280,['1','Rohit','Mumbai Indians'],'none')}
      ${tableRow(20,142,280,['2','Virat','RCB'],'none')}
      ${tableRow(20,164,280,['3','Bumrah','Mumbai Indians'],'none')}
      <text class="ts" x="20" y="208" style="fill:#555">Data: 3 rows</text>
      <text class="ts" x="20" y="226" style="fill:#555">Structure: 3 columns</text>
      <rect x="330" y="110" width="20" height="80" rx="4" fill="rgba(248,113,113,0.3)" stroke="#f87171" stroke-width="1"/>
      <text class="ts" x="340" y="100" text-anchor="middle" style="fill:#f87171">DROP</text>
      <line x1="352" y1="150" x2="380" y2="150" stroke="#f87171" stroke-width="2" marker-end="url(#arrow)" fill="none"/>
      <text class="ts" x="530" y="90" text-anchor="middle" style="fill:#f87171">After DROP</text>
      <rect x="390" y="98" width="260" height="110" rx="10" fill="rgba(248,113,113,0.04)" stroke="rgba(248,113,113,0.2)" stroke-width="1" stroke-dasharray="5 3"/>
      <text class="ts" x="520" y="148" text-anchor="middle" style="fill:#555">table does not exist</text>
      <text x="520" y="170" text-anchor="middle" style="font-size:28px;fill:#f87171">✗</text>
      ${noteBox(20,248,640,['DROP TABLE deletes the table AND all data inside it permanently.','Unlike DELETE which removes rows, DROP removes the entire structure too.'])}
    `),

    'Data types': () => svg(380, `
      <text class="th" x="340" y="28" text-anchor="middle" style="font-size:15px">Data Types — the right container</text>
      <text class="ts" x="340" y="48" text-anchor="middle" style="fill:#6b6b8a">Each column must declare what type of data it holds</text>
      <rect x="20" y="62" width="290" height="50" rx="10" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" stroke-width="0.5"/>
      <text class="th" x="40" y="82" style="fill:#a78bfa">INT</text>
      <text class="ts" x="40" y="100" style="fill:#9999bb">Whole numbers: 1, 42, 1000</text>
      <text class="ts" x="200" y="82" style="fill:#555">age, runs, id</text>
      <rect x="20" y="122" width="290" height="50" rx="10" fill="rgba(52,211,153,0.1)" stroke="rgba(52,211,153,0.3)" stroke-width="0.5"/>
      <text class="th" x="40" y="142" style="fill:#34d399">VARCHAR</text>
      <text class="ts" x="40" y="160" style="fill:#9999bb">Text: "Rohit", "Mumbai"</text>
      <text class="ts" x="200" y="142" style="fill:#555">name, city, team</text>
      <rect x="20" y="182" width="290" height="50" rx="10" fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.3)" stroke-width="0.5"/>
      <text class="th" x="40" y="202" style="fill:#f59e0b">DECIMAL</text>
      <text class="ts" x="40" y="220" style="fill:#9999bb">Numbers with decimals: 99.99</text>
      <text class="ts" x="200" y="202" style="fill:#555">price, salary</text>
      <rect x="20" y="242" width="290" height="50" rx="10" fill="rgba(248,113,113,0.1)" stroke="rgba(248,113,113,0.3)" stroke-width="0.5"/>
      <text class="th" x="40" y="262" style="fill:#f87171">DATE</text>
      <text class="ts" x="40" y="280" style="fill:#9999bb">Dates: 2024-01-15</text>
      <text class="ts" x="200" y="262" style="fill:#555">dob, order_date</text>
      <rect x="340" y="62" width="320" height="230" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
      <text class="th" x="500" y="84" text-anchor="middle" style="fill:#8b5cf6">CREATE TABLE example</text>
      <text class="ts" x="360" y="108" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">CREATE TABLE players (</text>
      <text class="ts" x="380" y="128" style="fill:#34d399;font-family:'JetBrains Mono',monospace">id      INT,</text>
      <text class="ts" x="380" y="148" style="fill:#34d399;font-family:'JetBrains Mono',monospace">name    VARCHAR(100),</text>
      <text class="ts" x="380" y="168" style="fill:#f59e0b;font-family:'JetBrains Mono',monospace">salary  DECIMAL(10,2),</text>
      <text class="ts" x="380" y="188" style="fill:#f87171;font-family:'JetBrains Mono',monospace">joined  DATE</text>
      <text class="ts" x="360" y="208" style="fill:#a78bfa;font-family:'JetBrains Mono',monospace">);</text>
      ${noteBox(20,320,640,['Wrong data type = wrong results. Phone numbers in INT loses leading zeros.','Always pick the most specific type: use INT not VARCHAR for numbers you calculate with.'])}
    `),
  };

  // ── Concept → diagram map ─────────────────────────────────────────────────
  const ALL = { ...THEORY, ...SQL_DIAGS };

  function findDiagram(concept) {
    if (!concept) return null;
    if (ALL[concept]) return ALL[concept];
    // Fuzzy match
    const key = Object.keys(ALL).find(k =>
      concept.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(concept.toLowerCase())
    );
    return key ? ALL[key] : null;
  }

  return {
    tryInject(concept) {
      const fn = findDiagram(concept);
      if (!fn) return;
      const msgs = document.getElementById('messages');
      if (!msgs) return;
      const div = document.createElement('div');
      div.className = 'msg msg-chicha';
      div.innerHTML = `
        <div class="msg-av" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9)">📊</div>
        <div style="width:100%">
          <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#555;letter-spacing:2px;margin-bottom:6px">VISUAL BREAKDOWN</div>
          ${fn()}
        </div>`;
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    },
  };
})();
