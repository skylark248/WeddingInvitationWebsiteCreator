/* ==========================================================================
   STARFIELD — shooting stars on <canvas data-starfield>. The canvas fills its
   parent (e.g. the night-sky hero). Stops drawing while scrolled out of view.
   Options: data-starfield-interval="1800"  minimum ms between shooting stars
   ========================================================================== */
(function () {
  'use strict';

  document.querySelectorAll('canvas[data-starfield]').forEach(function (canvas) {
    var parent = canvas.parentElement;
    var ctx = canvas.getContext('2d', { alpha: true });
    var minGap = parseFloat(canvas.getAttribute('data-starfield-interval')) || 1800;
    var meteors = [];
    var sparks = [];
    var W = 0, H = 0;
    var visible = true;
    var running = false;
    var mobile = window.innerWidth <= 768;

    function size() {
      W = parent.clientWidth || 375;
      H = parent.clientHeight || 700;
      var dpr = mobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      if (visible && !(mobile && meteors.length >= 1)) {
        var angle = (35 + Math.random() * 15) * Math.PI / 180;
        var speed = 7.5 + Math.random() * 5;
        meteors.push({
          x: Math.random() * (W + 100), y: Math.random() * Math.min(160, H * 0.25),
          dx: -Math.cos(angle) * speed, dy: Math.sin(angle) * speed, speed: speed,
          len: 100 + Math.random() * 60, life: 0, maxLife: 50 + Math.random() * 25,
          size: 1.8 + Math.random() * 1.4, opacity: 0
        });
      }
      setTimeout(spawn, minGap + Math.random() * 3200);
    }

    function frame() {
      if (!visible) { running = false; return; }
      ctx.clearRect(0, 0, W, H);

      for (var i = sparks.length - 1; i >= 0; i--) {
        var s = sparks[i];
        s.x += s.vx; s.y += s.vy; s.alpha -= s.decay;
        if (s.alpha <= 0) { sparks.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 235, 180, ' + s.alpha + ')';
        ctx.fill();
      }

      for (var j = meteors.length - 1; j >= 0; j--) {
        var m = meteors[j];
        m.x += m.dx; m.y += m.dy; m.life++;
        m.opacity = Math.sin((m.life / m.maxLife) * Math.PI);
        if (m.life >= m.maxLife || m.x < -100 || m.y > H) { meteors.splice(j, 1); continue; }

        if (Math.random() < 0.45 && sparks.length < 20) {
          sparks.push({ x: m.x + (Math.random() - 0.5) * 4, y: m.y + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 0.6, vy: 0.4 + Math.random() * 0.6,
            r: 0.8 + Math.random() * 1.2, alpha: m.opacity * 0.85, decay: 0.03 + Math.random() * 0.03 });
        }

        var tx = m.x - (m.dx / m.speed) * m.len;
        var ty = m.y - (m.dy / m.speed) * m.len;
        var g = ctx.createLinearGradient(m.x, m.y, tx, ty);
        g.addColorStop(0, 'rgba(255, 255, 255, ' + m.opacity + ')');
        g.addColorStop(0.25, 'rgba(255, 240, 190, ' + m.opacity * 0.85 + ')');
        g.addColorStop(0.7, 'rgba(255, 190, 110, ' + m.opacity * 0.35 + ')');
        g.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = g;
        ctx.lineWidth = m.size;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + m.opacity + ')';
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      requestAnimationFrame(frame);
    }

    size();
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(parent);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(canvas);
    }
    if (window.Invite.isStatic || window.Invite.reducedMotion) return;
    spawn();
    start();
  });
})();
