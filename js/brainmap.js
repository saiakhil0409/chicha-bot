// ── BRAIN MAP ─────────────────────────────────────────────────────────────────
const BrainMap = (() => {
  let _animFrame = null;
  let _nodes = [];
  let _dragging = null;
  let _offset = {x:0,y:0};

  const TOPIC_COLORS = {
    SQL:     '#8b5cf6',
    PowerBI: '#f59e0b',
    Tableau: '#34d399',
  };

  function buildGraph() {
    const mastered = State.get().masteredConcepts;
    const nodes = [];
    const edges = [];

    Object.entries(CURRICULUM).forEach(([topic, sections]) => {
      let prevNode = null;
      sections.forEach((section, si) => {
        section.concepts.forEach((concept, ci) => {
          const id = `${topic}:${concept}`;
          const isMastered = mastered.includes(concept);
          nodes.push({ id, label: concept, topic, mastered: isMastered, section: section.section, x: 0, y: 0, vx: 0, vy: 0 });
          // Edge to previous concept in section
          if (prevNode) edges.push({ from: prevNode, to: id });
          prevNode = id;
        });
      });
    });

    return { nodes, edges };
  }

  function layoutForce(nodes, edges, W, H) {
    // Group by topic with center positions
    const topicCenters = {
      SQL:     { x: W * 0.25, y: H * 0.5 },
      PowerBI: { x: W * 0.5,  y: H * 0.25 },
      Tableau: { x: W * 0.75, y: H * 0.5 },
    };

    // Initialize positions if zero
    nodes.forEach(n => {
      if (!n.x) {
        const c = topicCenters[n.topic];
        n.x = c.x + (Math.random() - 0.5) * 200;
        n.y = c.y + (Math.random() - 0.5) * 200;
      }
    });

    // Simple force iterations
    for (let iter = 0; iter < 80; iter++) {
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i+1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx*dx+dy*dy) || 0.1;
          const force = 1800 / (dist*dist);
          const fx = (dx/dist)*force, fy = (dy/dist)*force;
          nodes[i].vx -= fx; nodes[i].vy -= fy;
          nodes[j].vx += fx; nodes[j].vy += fy;
        }
      }
      // Attraction along edges
      const nodeMap = {};
      nodes.forEach(n => nodeMap[n.id] = n);
      edges.forEach(e => {
        const a = nodeMap[e.from], b = nodeMap[e.to];
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx*dx+dy*dy) || 0.1;
        const force = (dist - 70) * 0.04;
        const fx = (dx/dist)*force, fy = (dy/dist)*force;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      });
      // Gravity toward topic center
      nodes.forEach(n => {
        const c = topicCenters[n.topic];
        n.vx += (c.x - n.x) * 0.012;
        n.vy += (c.y - n.y) * 0.012;
      });
      // Damping + apply
      nodes.forEach(n => {
        n.x += n.vx * 0.5; n.y += n.vy * 0.5;
        n.vx *= 0.5; n.vy *= 0.5;
        n.x = Math.max(40, Math.min(W-40, n.x));
        n.y = Math.max(40, Math.min(H-40, n.y));
      });
    }
  }

  function render(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const mastered = State.get().masteredConcepts;

    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = 'rgba(26,26,46,0.5)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    const { nodes, edges } = buildGraph();
    layoutForce(nodes, edges, W, H);
    _nodes = nodes;

    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    // Draw edges
    edges.forEach(e => {
      const a = nodeMap[e.from], b = nodeMap[e.to];
      if (!a || !b) return;
      const bothMastered = mastered.includes(a.label) && mastered.includes(b.label);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = bothMastered ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.05)';
      ctx.lineWidth = bothMastered ? 1.5 : 1;
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach(n => {
      const color = TOPIC_COLORS[n.topic];
      const isMastered = mastered.includes(n.label);
      const r = isMastered ? 9 : 6;

      if (isMastered) {
        // Glow
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r*3);
        grd.addColorStop(0, color + '44');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(n.x, n.y, r*3, 0, Math.PI*2);
        ctx.fillStyle = grd; ctx.fill();
      }

      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2);
      ctx.fillStyle = isMastered ? color : 'rgba(255,255,255,0.08)';
      ctx.fill();
      ctx.strokeStyle = isMastered ? color : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label for mastered nodes
      if (isMastered) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label.length > 14 ? n.label.slice(0,13)+'…' : n.label, n.x, n.y - r - 4);
      }
    });

    // Topic legends
    Object.entries(TOPIC_COLORS).forEach(([topic, color], i) => {
      const x = 20 + i * 120, y = H - 20;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2);
      ctx.fillStyle = color; ctx.fill();
      ctx.fillStyle = '#666';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(topic, x + 10, y + 4);
    });

    // Stats
    const masteredCount = nodes.filter(n => mastered.includes(n.label)).length;
    document.getElementById('bmSub').textContent = `${masteredCount} of ${nodes.length} concepts mastered`;
  }

  return {
    open() {
      const overlay = document.getElementById('brainMapOverlay');
      overlay.classList.remove('hidden');
      const canvas = document.getElementById('brainMapCanvas');
      canvas.width  = overlay.offsetWidth;
      canvas.height = overlay.offsetHeight - 60;
      render(canvas);
    },
    close() {
      document.getElementById('brainMapOverlay').classList.add('hidden');
      if (_animFrame) cancelAnimationFrame(_animFrame);
    },
  };
})();
