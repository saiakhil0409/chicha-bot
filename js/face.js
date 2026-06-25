// ── CHICHA FACE ───────────────────────────────────────────────────────────────
// Animated canvas face that reacts to answers
const Face = (() => {
  let _timer = null;

  // Draw face on canvas
  function draw(canvas, state) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, r = W*0.44;

    ctx.clearRect(0, 0, W, H);

    // Background circle
    const grad = ctx.createRadialGradient(cx, cy-10, 5, cx, cy, r);

    const faceColors = {
      joy:       ['#8b5cf6','#6d28d9'],
      pride:     ['#7c3aed','#5b21b6'],
      shocked:   ['#f59e0b','#d97706'],
      angry:     ['#ef4444','#b91c1c'],
      frustrated:['#f97316','#c2410c'],
      comfort:   ['#6366f1','#4338ca'],
      asleep:    ['#334155','#1e293b'],
      excited:   ['#ec4899','#be185d'],
    };

    const cols = faceColors[state] || faceColors.joy;
    grad.addColorStop(0, cols[0]);
    grad.addColorStop(1, cols[1]);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Glow ring
    ctx.beginPath();
    ctx.arc(cx, cy, r+4, 0, Math.PI*2);
    ctx.strokeStyle = cols[0] + '66';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw eyes + mouth based on state
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (state === 'joy' || state === 'pride') {
      // Happy eyes (arcs)
      drawEyeArc(ctx, cx-22, cy-12, 14, true);
      drawEyeArc(ctx, cx+22, cy-12, 14, true);
      // Big smile
      ctx.beginPath();
      ctx.arc(cx, cy+5, 22, 0.1*Math.PI, 0.9*Math.PI);
      ctx.stroke();
      // Cheeks
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath(); ctx.arc(cx-30, cy+8, 10, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+30, cy+8, 10, 0, Math.PI*2); ctx.fill();
    }

    else if (state === 'excited') {
      // Star eyes
      drawStar(ctx, cx-22, cy-12, 10);
      drawStar(ctx, cx+22, cy-12, 10);
      // Open mouth wow
      ctx.beginPath();
      ctx.arc(cx, cy+10, 16, 0, Math.PI*2);
      ctx.fillStyle = '#1a0030';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }

    else if (state === 'shocked') {
      // Wide oval eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(cx-22, cy-12, 12, 14, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+22, cy-12, 12, 14, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1a0010';
      ctx.beginPath(); ctx.arc(cx-22, cy-12, 6, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+22, cy-12, 6, 0, Math.PI*2); ctx.fill();
      // O mouth
      ctx.strokeStyle = '#fff';
      ctx.beginPath(); ctx.arc(cx, cy+14, 12, 0, Math.PI*2); ctx.stroke();
    }

    else if (state === 'angry') {
      // Angry brows
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx-32, cy-26); ctx.lineTo(cx-12, cy-18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+32, cy-26); ctx.lineTo(cx+12, cy-18); ctx.stroke();
      // Squinting eyes
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx-30, cy-12); ctx.lineTo(cx-14, cy-12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+14, cy-12); ctx.lineTo(cx+30, cy-12); ctx.stroke();
      // Flat frown
      ctx.beginPath(); ctx.moveTo(cx-18, cy+22); ctx.lineTo(cx+18, cy+22); ctx.stroke();
    }

    else if (state === 'frustrated') {
      // Wavy brow
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx-30, cy-24); ctx.quadraticCurveTo(cx-20, cy-30, cx-10, cy-22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+10, cy-22); ctx.quadraticCurveTo(cx+20, cy-30, cx+30, cy-24); ctx.stroke();
      // Small eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(cx-20, cy-10, 7, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+20, cy-10, 7, 0, Math.PI*2); ctx.fill();
      // Slight frown
      ctx.beginPath(); ctx.arc(cx, cy+18, 16, 1.15*Math.PI, 1.85*Math.PI); ctx.stroke();
    }

    else if (state === 'comfort') {
      // Soft gentle eyes
      drawEyeArc(ctx, cx-22, cy-12, 12, true);
      drawEyeArc(ctx, cx+22, cy-12, 12, true);
      // Small warm smile
      ctx.beginPath();
      ctx.arc(cx, cy+8, 14, 0.15*Math.PI, 0.85*Math.PI);
      ctx.stroke();
    }

    else if (state === 'asleep') {
      // Zzz eyes
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx-30, cy-10); ctx.lineTo(cx-12, cy-10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+12, cy-10); ctx.lineTo(cx+30, cy-10); ctx.stroke();
      // Small flat mouth
      ctx.beginPath(); ctx.moveTo(cx-10, cy+18); ctx.lineTo(cx+10, cy+18); ctx.stroke();
      // Zzz text
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('z', cx+32, cy-20);
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('z', cx+42, cy-30);
    }
  }

  function drawEyeArc(ctx, x, y, size, closed) {
    ctx.beginPath();
    if (closed) {
      ctx.arc(x, y, size*0.6, Math.PI, 0);
    } else {
      ctx.arc(x, y, size*0.6, 0, Math.PI*2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.fillStyle = '#1a003a';
      ctx.beginPath(); ctx.arc(x, y, size*0.3, 0, Math.PI*2); ctx.fill();
      return;
    }
    ctx.stroke();
  }

  function drawStar(ctx, cx, cy, r) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI/2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.fill();
  }

  // Animate through states
  function animate(states, texts, onDone) {
    const overlay = document.getElementById('chichFace');
    const canvas  = document.getElementById('faceCanvas');
    const textEl  = document.getElementById('cfText');
    overlay.classList.remove('hidden');
    const inner = overlay.querySelector('.cf-inner');
    inner.classList.remove('cf-exit');

    let i = 0;
    function step() {
      draw(canvas, states[i]);
      textEl.textContent = texts[i] || '';
      i++;
      if (i < states.length) {
        _timer = setTimeout(step, 900);
      } else {
        _timer = setTimeout(() => {
          inner.classList.add('cf-exit');
          setTimeout(() => {
            overlay.classList.add('hidden');
            inner.classList.remove('cf-exit');
            if (onDone) onDone();
          }, 350);
        }, 1200);
      }
    }
    step();
  }

  return {
    correct(streakCount) {
      if (streakCount >= 4) {
        animate(['shocked','excited','excited'], ['Wait…','NO WAY!!','You\'re on fire 🔥']);
      } else if (streakCount >= 2) {
        animate(['joy','pride'], ['Yesss!','That\'s my student 💪']);
      } else {
        animate(['joy','comfort'], ['Correct!','Keep going →']);
      }
    },

    wrong(attempts) {
      if (attempts >= 3) {
        animate(['angry','frustrated','comfort'],
          ['AGAIN?! 😤','Okay… breathe.','Let\'s figure this out together.']);
      } else {
        animate(['shocked','frustrated','comfort'],
          ['Hmm, not quite.','Think again…','You\'ve got this.']);
      }
    },

    aha() {
      animate(['shocked','excited','pride'],
        ['Wait…','That\'s the aha moment!','Bookmark that feeling ✨']);
    },

    idle() {
      animate(['asleep','comfort'], ['...zzz...','Oh! You\'re back. Let\'s go.']);
    },

    greeting() {
      animate(['joy','excited'], ['Hey!','Ready to make you smarter today?']);
    },
  };
})();
