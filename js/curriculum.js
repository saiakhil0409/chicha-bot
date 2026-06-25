// ── CURRICULUM ───────────────────────────────────────────────────────────────
const CURRICULUM = {
  SQL: [
    { section: 'Foundations', concepts: ['SELECT basics','WHERE filtering','ORDER BY','LIMIT','DISTINCT','Column aliases'] },
    { section: 'Filtering & Logic', concepts: ['AND / OR / NOT','BETWEEN','LIKE & wildcards','IN operator','IS NULL / IS NOT NULL','CASE WHEN'] },
    { section: 'Aggregations', concepts: ['COUNT','SUM & AVG','MIN & MAX','GROUP BY','HAVING','Nested aggregations'] },
    { section: 'Joins', concepts: ['INNER JOIN','LEFT JOIN','RIGHT JOIN','FULL OUTER JOIN','Self JOIN','Multi-table JOIN'] },
    { section: 'Advanced SQL', concepts: ['Subqueries','CTEs (WITH clause)','Window functions','RANK & DENSE_RANK','LAG & LEAD','Running totals'] },
    { section: 'Optimization', concepts: ['EXPLAIN basics','Index concepts','Query efficiency','Common mistakes'] },
  ],
  PowerBI: [
    { section: 'Basics', concepts: ['What is Power BI','Connecting data sources','Data types','Basic visuals'] },
    { section: 'Data Modeling', concepts: ['Relationships','Star schema','Calculated columns','Measures'] },
    { section: 'DAX', concepts: ['DAX syntax','CALCULATE','FILTER','Time intelligence','SUMX patterns'] },
    { section: 'Visuals & Reports', concepts: ['Chart types','Slicers & filters','Drill-through','Bookmarks','Mobile layout'] },
    { section: 'Publishing', concepts: ['Power BI Service','Row-level security','Scheduled refresh','Sharing reports'] },
  ],
  Tableau: [
    { section: 'Basics', concepts: ['Connecting data','Dimensions vs Measures','Basic chart types','Filters'] },
    { section: 'Calculations', concepts: ['Calculated fields','LOD expressions','Table calculations','Parameters'] },
    { section: 'Advanced Visuals', concepts: ['Dual axis charts','Maps','Dashboard actions','Story points'] },
    { section: 'Performance', concepts: ['Data extracts','Context filters','Published data sources','Best practices'] },
  ],
};

// Spark scenarios — curated per concept (analogy + scenario)
const SPARKS = {
  'SELECT basics': {
    title: 'The waiter who brings everything',
    analogy: 'SELECT * is like telling a waiter "bring me everything on the menu." SELECT name, age is like saying "just the pasta and the wine."',
    concept: 'SELECT',
  },
  'WHERE filtering': {
    title: 'The bouncer at the door',
    analogy: 'WHERE is the bouncer. Every row knocks on the door, and only the ones that match the condition get in. Strict but fair.',
    concept: 'WHERE',
  },
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
    title: 'The sorting hat',
    analogy: 'GROUP BY grabs all your rows and sorts them into buckets. Everyone in the same bucket gets aggregated together. SUM, COUNT, AVG — all work inside those buckets.',
    concept: 'GROUP BY',
  },
  'CTEs (WITH clause)': {
    title: 'Name your mess before using it',
    analogy: 'A CTE is a named temporary result. Instead of nesting queries until no one can read them, you give the inner query a name and reference it cleanly. It disappears after the query runs.',
    concept: 'CTE',
  },
  'Window functions': {
    title: 'Watching without touching',
    analogy: 'Window functions look at other rows without collapsing them. RANK() sees the whole group and gives each row a position. Unlike GROUP BY, your rows survive intact.',
    concept: 'WINDOW FUNCTION',
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
    concept: 'LAG / LEAD',
  },
};

// Get a spark for the current topic — either curated or random
function getSparkForTopic(topic) {
  const sections = CURRICULUM[topic] || CURRICULUM.SQL;
  const allConcepts = sections.flatMap(s => s.concepts);
  const mastered = State.get().masteredConcepts;
  // Prefer unmastered
  const unmastered = allConcepts.filter(c => !mastered.includes(c));
  const pool = unmastered.length > 0 ? unmastered : allConcepts;
  const concept = pool[Math.floor(Math.random() * pool.length)];
  return SPARKS[concept] || {
    title: `Let's explore: ${concept}`,
    analogy: `Today Chicha is going to walk you through ${concept}. Ask anything — no question is too basic.`,
    concept: concept,
  };
}
