// ── CURRICULUM ───────────────────────────────────────────────────────────────
const CURRICULUM = {
  SQL: [
    {
      section: 'Database Foundations',
      concepts: [
        'What is a Database',
        'What is a Table',
        'Data types',
        'CREATE DATABASE',
        'CREATE TABLE',
        'INSERT INTO',
        'INSERT multiple rows',
        'UPDATE records',
        'DELETE records',
        'DROP TABLE',
        'DROP DATABASE',
        'ALTER TABLE',
      ]
    },
    {
      section: 'Reading Data',
      concepts: [
        'SELECT basics',
        'SELECT columns',
        'WHERE filtering',
        'ORDER BY',
        'LIMIT',
        'DISTINCT',
        'Column aliases',
      ]
    },
    {
      section: 'Filtering & Logic',
      concepts: [
        'AND / OR / NOT',
        'BETWEEN',
        'LIKE & wildcards',
        'IN operator',
        'IS NULL / IS NOT NULL',
        'CASE WHEN',
      ]
    },
    {
      section: 'Aggregations',
      concepts: [
        'COUNT',
        'SUM & AVG',
        'MIN & MAX',
        'GROUP BY',
        'HAVING',
        'Nested aggregations',
      ]
    },
    {
      section: 'Joins',
      concepts: [
        'INNER JOIN',
        'LEFT JOIN',
        'RIGHT JOIN',
        'FULL OUTER JOIN',
        'Self JOIN',
        'Multi-table JOIN',
      ]
    },
    {
      section: 'Advanced SQL',
      concepts: [
        'Subqueries',
        'CTEs (WITH clause)',
        'Window functions',
        'RANK & DENSE_RANK',
        'LAG & LEAD',
        'Running totals',
      ]
    },
    {
      section: 'Optimization',
      concepts: [
        'EXPLAIN basics',
        'Index concepts',
        'Query efficiency',
        'Common mistakes',
      ]
    },
  ],
  PowerBI: [
    { section: 'Basics',           concepts: ['What is Power BI','Connecting data sources','Data types','Basic visuals'] },
    { section: 'Data Modeling',    concepts: ['Relationships','Star schema','Calculated columns','Measures'] },
    { section: 'DAX',              concepts: ['DAX syntax','CALCULATE','FILTER','Time intelligence','SUMX patterns'] },
    { section: 'Visuals & Reports',concepts: ['Chart types','Slicers & filters','Drill-through','Bookmarks','Mobile layout'] },
    { section: 'Publishing',       concepts: ['Power BI Service','Row-level security','Scheduled refresh','Sharing reports'] },
  ],
  Tableau: [
    { section: 'Basics',          concepts: ['Connecting data','Dimensions vs Measures','Basic chart types','Filters'] },
    { section: 'Calculations',    concepts: ['Calculated fields','LOD expressions','Table calculations','Parameters'] },
    { section: 'Advanced Visuals',concepts: ['Dual axis charts','Maps','Dashboard actions','Story points'] },
    { section: 'Performance',     concepts: ['Data extracts','Context filters','Published data sources','Best practices'] },
  ],
};

// ── SPARKS — curated analogy + scenario per concept ──────────────────────────
const SPARKS = {

  // ── DATABASE FOUNDATIONS ─────────────────────────────────────────────────
  'What is a Database': {
    title: 'The giant filing cabinet',
    analogy: 'A database is like a giant digital filing cabinet for an office. Instead of physical folders, you have organised data — names, numbers, dates — all stored so you can find, update, or delete anything instantly. Every app you use — Instagram, Swiggy, IRCTC — has a database behind it.',
    concept: 'What is a Database',
  },
  'What is a Table': {
    title: 'The Excel sheet you already know',
    analogy: 'A table is like an Excel sheet. It has rows (each row = one record, like one person) and columns (each column = one property, like name or age). A database is a collection of these tables. The IPL scoreboard? That\'s a table. Your contact list? Also a table.',
    concept: 'What is a Table',
  },
  'Data types': {
    title: 'Choosing the right container',
    analogy: 'Data types tell SQL what kind of data goes in each column. Putting a phone number in a text column vs a number column matters — you can\'t do maths on text. Common ones: INT (whole numbers), VARCHAR (text), DATE (dates), DECIMAL (money). Like using the right dabbas for the right food.',
    concept: 'Data types',
  },
  'CREATE DATABASE': {
    title: 'Building the filing cabinet first',
    analogy: 'Before you store anything, you need the cabinet itself. CREATE DATABASE is that first step — you\'re telling SQL "I want a new, empty space to store data." Think of it as creating a new folder on your computer before you put files in it.',
    concept: 'CREATE DATABASE',
  },
  'CREATE TABLE': {
    title: 'Designing the form before filling it',
    analogy: 'CREATE TABLE is like designing a form — you decide what fields exist (name, age, team) and what type of data goes in each box (text, number, date). Once the form is designed, people can fill it in. You\'re defining the structure before the data arrives.',
    concept: 'CREATE TABLE',
  },
  'INSERT INTO': {
    title: 'Filling in the form',
    analogy: 'INSERT INTO is the moment data actually enters the table. You built the form with CREATE TABLE — now INSERT INTO adds one row of real data. Like filling in a single registration form and submitting it.',
    concept: 'INSERT INTO',
  },
  'INSERT multiple rows': {
    title: 'Bulk registration day',
    analogy: 'Inserting one row at a time would take forever for real data. INSERT INTO with multiple VALUES lets you add many rows in one shot. Like processing an entire team\'s registrations at once instead of one by one.',
    concept: 'INSERT multiple rows',
  },
  'UPDATE records': {
    title: 'Correcting the scoreboard',
    analogy: 'UPDATE changes existing data in a table. Like a scoreboard operator correcting a wrong score mid-match. Always pair UPDATE with WHERE — otherwise you\'ll change every single row, not just the one you meant.',
    concept: 'UPDATE records',
  },
  'DELETE records': {
    title: 'Crossing names off the list',
    analogy: 'DELETE removes rows from a table. Like removing a player from a squad list. Critical rule: always use WHERE with DELETE. Without it you delete the entire table\'s contents — not just one row. One of the most dangerous SQL statements if used carelessly.',
    concept: 'DELETE records',
  },
  'DROP TABLE': {
    title: 'Throwing away the entire form',
    analogy: 'DROP TABLE deletes the table AND all its data permanently. Unlike DELETE (which removes rows), DROP removes the structure itself. Like throwing the entire registration form pad in the bin — forms, data, everything. Cannot be undone.',
    concept: 'DROP TABLE',
  },
  'DROP DATABASE': {
    title: 'Demolishing the entire building',
    analogy: 'DROP DATABASE deletes the entire database — every table, every row, everything inside it. Gone permanently. Like demolishing the entire office building, not just one room. Use with extreme caution. Always back up first.',
    concept: 'DROP DATABASE',
  },
  'ALTER TABLE': {
    title: 'Renovating without moving out',
    analogy: 'ALTER TABLE modifies an existing table\'s structure without losing the data inside it. Add a new column, rename one, change a data type, or drop a column. Like adding a new room to a house — the family doesn\'t have to leave while construction happens.',
    concept: 'ALTER TABLE',
  },

  // ── READING DATA ─────────────────────────────────────────────────────────
  'SELECT basics': {
    title: 'The waiter who brings everything',
    analogy: 'SELECT * is like telling a waiter "bring me everything on the menu." SELECT name, age is like saying "just the pasta and the wine." You tell the database exactly what you want to see.',
    concept: 'SELECT basics',
  },
  'SELECT columns': {
    title: 'Pick what you need',
    analogy: 'Instead of fetching all columns with *, you name exactly which ones you want. SELECT name, team FROM drivers — only those two columns come back. Less clutter, faster queries.',
    concept: 'SELECT columns',
  },
  'WHERE filtering': {
    title: 'The bouncer at the door',
    analogy: 'WHERE is the bouncer. Every row knocks on the door, and only the ones that match the condition get in. WHERE age > 18 means only adults pass. Strict but fair.',
    concept: 'WHERE filtering',
  },
  'ORDER BY': {
    title: 'The sorting hat',
    analogy: 'ORDER BY is like asking a librarian to arrange books. ASC means A to Z or smallest to largest. DESC flips it — biggest or latest first. The data stays the same, just the arrangement changes.',
    concept: 'ORDER BY',
  },
  'LIMIT': {
    title: 'The top 3 finishers',
    analogy: 'LIMIT is like saying "just give me the podium" — you have 20 race results but you only want the top 3. LIMIT 3 cuts the rest off. Simple, powerful.',
    concept: 'LIMIT',
  },
  'DISTINCT': {
    title: 'One per team please',
    analogy: 'DISTINCT removes duplicates. If 5 drivers are from Red Bull, SELECT DISTINCT team gives you "Red Bull" once — not five times. Like calling attendance and ticking each name only once.',
    concept: 'DISTINCT',
  },
  'Column aliases': {
    title: 'Rename on the fly',
    analogy: 'AS is a nickname. SELECT name AS driver_name gives the column a new label in your results. The data doesn\'t change — you\'re just giving it a cleaner name for the report.',
    concept: 'Column aliases',
  },

  // ── FILTERING ────────────────────────────────────────────────────────────
  'INNER JOIN': {
    title: 'Two tables walk into a pit lane…',
    analogy: 'Two spreadsheets share one thing: driver_id. An INNER JOIN is the handshake between them — only rows where both sides agree get through. Fussy bouncer.',
    concept: 'INNER JOIN',
  },
  'LEFT JOIN': {
    title: 'The generous host',
    analogy: 'LEFT JOIN keeps everyone from the left table — even if the right side has nothing to offer. Those rows just get NULLs on the right side. No one gets left behind.',
    concept: 'LEFT JOIN',
  },
  'GROUP BY': {
    title: 'Sorting into buckets',
    analogy: 'GROUP BY grabs all your rows and sorts them into buckets. Everyone in the same bucket gets aggregated together. SUM, COUNT, AVG — all work inside those buckets.',
    concept: 'GROUP BY',
  },
  'CTEs (WITH clause)': {
    title: 'Name your mess before using it',
    analogy: 'A CTE is a named temporary result. Instead of nesting queries until no one can read them, you give the inner query a name and reference it cleanly. It disappears after the query runs.',
    concept: 'CTEs (WITH clause)',
  },
  'Window functions': {
    title: 'Watching without touching',
    analogy: 'Window functions look at other rows without collapsing them. RANK() sees the whole group and gives each row a position. Unlike GROUP BY, your rows survive intact.',
    concept: 'Window functions',
  },
  'HAVING': {
    title: 'WHERE for the aftermath',
    analogy: 'HAVING is WHERE but for aggregated results. WHERE runs before grouping, HAVING runs after. You\'d use HAVING to say "only show teams with more than 3 wins."',
    concept: 'HAVING',
  },
  'CASE WHEN': {
    title: 'SQL\'s if-else in a suit',
    analogy: 'CASE WHEN is a conditional expression right inside your SELECT. Think of it as SQL asking: "if this, say that. If that, say this other thing. Otherwise, say whatever."',
    concept: 'CASE WHEN',
  },
  'LAG & LEAD': {
    title: 'Looking over your shoulder',
    analogy: 'LAG() hands you the previous row\'s value. LEAD() shows you the next one. Like checking the scoreboard from last race vs next race — all in the same row.',
    concept: 'LAG & LEAD',
  },
};

// ── SPARK SELECTOR ────────────────────────────────────────────────────────────
// getSparkForTopic: follows curriculum order by default
// surpriseMode=true: picks randomly from unmastered (for Surprise me button)
function getSparkForTopic(topic, surpriseMode = false) {
  const sections    = CURRICULUM[topic] || CURRICULUM.SQL;
  const allConcepts = sections.flatMap(s => s.concepts); // strictly ordered
  const mastered    = State.get().masteredConcepts;
  const unmastered  = allConcepts.filter(c => !mastered.includes(c));
  const pool        = unmastered.length > 0 ? unmastered : allConcepts;

  const concept = surpriseMode
    ? pool[Math.floor(Math.random() * pool.length)]
    : pool[0]; // always first unmastered in order

  return SPARKS[concept] || {
    title:   `Let's explore: ${concept}`,
    analogy: `Today Chicha is going to walk you through ${concept}. Ask anything — no question is too basic.`,
    concept: concept,
  };
}
