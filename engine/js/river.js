/* ==========================================================================
   RIVER — flowing water drawn on a canvas as tall as the page, with floating
   diyas. The path follows the page layout instead of fixed pixel values:

     <canvas data-river ...>                  the canvas (first child of the page wrapper)
     <div data-river-start>                   water begins at this element's centre (e.g. the moon)
     <section data-river-side="left|center|right">   river runs along this side past the section
     <div data-river-end="0.3">               optional: water stops 30% down this element

   Canvas options (all optional):
     data-river-width="84"        river width in px
     data-river-left="0.146"      x of the left lane as a fraction of page width
     data-river-right="0.854"     x of the right lane
     data-river-transition="260"  length in px of each bend between lanes
     data-river-diyas="5"         number of floating diyas
     data-river-diya-src="assets/images/lotus-diya.png"
     data-river-diya-size="62"
     data-river-speed="1"         flow speed multiplier
   ========================================================================== */
(function () {
  'use strict';

  var canvas = document.querySelector('canvas[data-river]');
  if (!canvas) return;

  var wrapper = canvas.parentElement;
  var ctx = canvas.getContext('2d', { alpha: true });
  var isStatic = window.Invite.isStatic;

  function opt(name, fallback) {
    var v = parseFloat(canvas.dataset[name]);
    return isNaN(v) ? fallback : v;
  }
  var RIVER_W = opt('riverWidth', 84);
  var LEFT = opt('riverLeft', 0.146);
  var RIGHT = opt('riverRight', 0.854);
  var BEND = opt('riverTransition', 260);
  var DIYAS = opt('riverDiyas', 5);
  var DIYA_SIZE = opt('riverDiyaSize', 62);
  var SPEED = opt('riverSpeed', 1);

  var diyaImg = null;
  var diyaReady = false;
  if (canvas.dataset.riverDiyaSrc) {
    diyaImg = new Image();
    diyaImg.onload = function () { diyaReady = true; };
    diyaImg.src = canvas.dataset.riverDiyaSrc;
  }

  var W = 0, H = 0, startY = 0, endY = 0, wrapperDocTop = 0;
  var stations = [];
  var scrollY = window.scrollY || 0;
  var viewH = window.innerHeight;
  var currents = [], foam = [], glints = [], diyas = [];
  var time = 0, last = 0;

  // ---------------------------------------------------------------- layout

  function topWithin(el) {
    return el.getBoundingClientRect().top - wrapper.getBoundingClientRect().top;
  }

  function laneX(side) {
    if (side === 'left') return Math.max(50, Math.round(W * LEFT));
    if (side === 'right') return Math.min(W - 50, Math.round(W * RIGHT));
    return W / 2;
  }

  function measure() {
    W = wrapper.clientWidth || 375;
    H = wrapper.scrollHeight || wrapper.clientHeight;
    wrapperDocTop = wrapper.getBoundingClientRect().top + (window.scrollY || 0);

    var start = wrapper.querySelector('[data-river-start]');
    startY = start ? topWithin(start) + start.offsetHeight / 2 : 0;
    var end = wrapper.querySelector('[data-river-end]');
    endY = end ? topWithin(end) + end.offsetHeight * (parseFloat(end.getAttribute('data-river-end')) || 0) : H;
    endY = Math.min(H, Math.max(startY + 1, endY));

    var half = BEND / 2;
    var lanes = [].slice.call(wrapper.querySelectorAll('[data-river-side]')).map(function (el) {
      var top = topWithin(el);
      return { top: top, bottom: top + el.offsetHeight, x: laneX(el.getAttribute('data-river-side')) };
    }).sort(function (a, b) { return a.top - b.top; });

    stations = lanes.map(function (lane, i) {
      var from = i === 0 ? -Infinity : lane.top + half;
      var to = i === lanes.length - 1 ? Infinity : lane.bottom - half;
      if (from > to) from = to = (lane.top + lane.bottom) / 2;
      return { from: from, to: to, x: lane.x };
    });

    // Sharp enough on desktop, light on phones; stay under iOS's 16.7M-pixel canvas limit.
    var dpr = window.innerWidth <= 768 ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    var maxArea = 16000000;
    if (W * H * dpr * dpr > maxArea) dpr = Math.sqrt(maxArea / (W * H));
    var pw = Math.round(W * dpr), ph = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!currents.length) seed();
    viewH = window.innerHeight;
  }

  function riverX(y) {
    if (!stations.length) return W / 2;
    for (var i = 0; i < stations.length; i++) {
      var s = stations[i];
      if (y <= s.to) {
        if (i === 0 || y >= s.from) return s.x;
        var p = stations[i - 1];
        var span = s.from - p.to;
        if (span <= 0) return s.x;
        var t = (y - p.to) / span;
        t = t * t * (3 - 2 * t);
        return p.x + (s.x - p.x) * t;
      }
    }
    return stations[stations.length - 1].x;
  }

  // ------------------------------------------------------------- particles

  function rand(a, b) { return a + Math.random() * (b - a); }
  function randomY() { return rand(startY, endY); }

  function seed() {
    var mobile = window.innerWidth <= 768;
    currents = []; foam = []; glints = []; diyas = [];
    var i;
    for (i = 0; i < (mobile ? 65 : 110); i++) {
      currents.push({ y: randomY(), vy: rand(1.2, 2.7), off: rand(-0.41, 0.41), len: rand(50, 135),
        thick: rand(1.4, 3.8), alpha: rand(0.28, 0.76), freq: rand(0.015, 0.04), phase: rand(0, Math.PI * 2) });
    }
    for (i = 0; i < (mobile ? 48 : 85); i++) {
      foam.push({ y: randomY(), vy: rand(1.5, 2.9), off: rand(-0.44, 0.44), len: rand(35, 100),
        thick: rand(1.1, 2.9), alpha: rand(0.24, 0.62) });
    }
    for (i = 0; i < (mobile ? 36 : 60); i++) {
      glints.push({ y: randomY(), vy: rand(1.1, 2.2), off: rand(-0.375, 0.375), len: rand(16, 48),
        thick: rand(1.2, 3), alpha: rand(0.35, 0.85), phase: rand(0, Math.PI * 2) });
    }
    for (i = 0; i < DIYAS; i++) {
      diyas.push({ y: startY + DIYA_SIZE + (i + 0.5) * ((endY - startY) / Math.max(1, DIYAS)), off: i % 2 ? 6 : -6 });
    }
  }

  function advance(p, step) {
    p.y += p.vy * step;
    if (p.y > endY) p.y = startY;
  }

  // --------------------------------------------------------------- drawing

  function band(from, to, stepPx, halfWidth, waveFn) {
    ctx.beginPath();
    var y;
    for (y = from; y <= to; y += stepPx) {
      var x = riverX(y) - halfWidth + waveFn(y);
      if (y === from) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (y = to; y >= from; y -= stepPx) ctx.lineTo(riverX(y) + halfWidth + waveFn(y), y);
    ctx.closePath();
  }

  function edge(from, to, side, waveFn) {
    ctx.beginPath();
    for (var y = from; y <= to; y += 10) {
      var x = riverX(y) + side * (RIVER_W / 2 - 2) + waveFn(y);
      if (y === from) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function drawBody(viewTop, viewBottom) {
    var from = Math.max(startY, Math.floor(viewTop - 60));
    var to = Math.min(endY, Math.ceil(viewBottom + 60));
    if (from >= to) return;

    band(from, to, 8, RIVER_W / 2, function (y) { return Math.sin(y * 0.015 + time * 2.5) * 1.2; });
    var bed = ctx.createLinearGradient(0, 0, W, 0);
    bed.addColorStop(0, '#1B4756');
    bed.addColorStop(0.25, '#296A7E');
    bed.addColorStop(0.5, '#3A8297');
    bed.addColorStop(0.75, '#296A7E');
    bed.addColorStop(1, '#173E4D');
    ctx.fillStyle = bed;
    ctx.fill();

    band(from, to, 12, RIVER_W * 0.31, function (y) { return Math.sin(y * 0.02 + time * 3.2) * 2; });
    var core = ctx.createLinearGradient(0, 0, W, 0);
    core.addColorStop(0, 'rgba(115, 195, 220, 0.08)');
    core.addColorStop(0.5, 'rgba(175, 230, 248, 0.28)');
    core.addColorStop(1, 'rgba(115, 195, 220, 0.08)');
    ctx.fillStyle = core;
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(215, 245, 255, 0.25)';
    edge(from, to, -1, function (y) { return Math.sin(y * 0.03 + time * 4) * 1.5; });
    edge(from, to, 1, function (y) { return Math.cos(y * 0.03 + time * 4) * 1.5; });
  }

  function streak(x1, y1, x2, y2, alpha, thickness, color) {
    var g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, 'rgba(' + color + ', 0)');
    g.addColorStop(0.5, 'rgba(' + color + ', ' + alpha + ')');
    g.addColorStop(1, 'rgba(' + color + ', 0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function drawFlow(viewTop, viewBottom, step) {
    ctx.lineCap = 'round';
    var half = RIVER_W / 2;

    currents.forEach(function (c) {
      advance(c, step);
      var yEnd = Math.min(endY, c.y + c.len);
      if (yEnd < viewTop || c.y > viewBottom) return;
      var w = half * 0.78;
      var x1 = riverX(c.y) + c.off * w;
      var midY = (c.y + yEnd) / 2;
      var midX = riverX(midY) + c.off * w + Math.sin(midY * c.freq + time * 3.5 + c.phase) * 3;
      var x2 = riverX(yEnd) + c.off * w;
      var g = ctx.createLinearGradient(x1, c.y, x2, yEnd);
      g.addColorStop(0, 'rgba(215, 245, 255, 0)');
      g.addColorStop(0.4, 'rgba(230, 250, 255, ' + c.alpha + ')');
      g.addColorStop(0.7, 'rgba(200, 240, 255, ' + c.alpha * 0.8 + ')');
      g.addColorStop(1, 'rgba(215, 245, 255, 0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = c.thick;
      ctx.beginPath();
      ctx.moveTo(x1, c.y);
      ctx.quadraticCurveTo(midX, midY, x2, yEnd);
      ctx.stroke();
    });

    foam.forEach(function (f) {
      advance(f, step);
      var yEnd = Math.min(endY, f.y + f.len);
      if (yEnd < viewTop || f.y > viewBottom) return;
      var w = half * 0.82;
      streak(riverX(f.y) + f.off * w, f.y,
        riverX(yEnd) + f.off * w + Math.sin(f.y * 0.04 + time * 4) * 2, yEnd,
        f.alpha, f.thick, '255, 255, 255');
    });

    glints.forEach(function (p) {
      advance(p, step);
      var yEnd = Math.min(endY, p.y + p.len);
      if (yEnd < viewTop || p.y > viewBottom) return;
      var a = p.alpha * (0.5 + Math.sin(time * 6 + p.phase) * 0.5);
      if (a <= 0.05) return;
      var w = half * 0.65;
      streak(riverX(p.y) + p.off * w, p.y, riverX(yEnd) + p.off * w, yEnd, a, p.thick, '255, 255, 255');
    });

    if (!diyaReady) return;
    var restart = startY + DIYA_SIZE;
    diyas.forEach(function (d) {
      d.y += 0.55 * step;
      if (d.y > endY - 40) d.y = restart;
      if (d.y < viewTop || d.y > viewBottom) return;
      var x = riverX(d.y) + d.off + Math.sin(d.y * 0.015 + time) * 4;
      var glowR = DIYA_SIZE * 0.65;
      var glow = ctx.createRadialGradient(x, d.y - 12, 2, x, d.y - 12, glowR);
      glow.addColorStop(0, 'rgba(255, 225, 120, 0.75)');
      glow.addColorStop(0.5, 'rgba(255, 175, 45, 0.32)');
      glow.addColorStop(1, 'rgba(255, 175, 45, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, d.y - 12, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(diyaImg, x - DIYA_SIZE / 2, d.y - DIYA_SIZE / 2, DIYA_SIZE, DIYA_SIZE);
    });
  }

  function frame(now) {
    // Speeds were tuned per 60fps frame; scale by real elapsed time so 120Hz screens don't double speed.
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    var step = dt * 60 * SPEED;
    time += 0.01 * step;

    var viewTop = isStatic ? 0 : scrollY - wrapperDocTop - 100;
    var viewBottom = isStatic ? H : scrollY - wrapperDocTop + viewH + 100;
    var clearTop = Math.max(0, Math.floor(viewTop));
    ctx.clearRect(0, clearTop, W, Math.min(H, Math.ceil(viewBottom)) - clearTop);

    drawBody(viewTop, viewBottom);
    drawFlow(viewTop, viewBottom, step);
    requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------ lifecycle

  var pending = null;
  function remeasureSoon() {
    clearTimeout(pending);
    pending = setTimeout(measure, 120);
  }

  window.addEventListener('scroll', function () { scrollY = window.scrollY || 0; }, { passive: true });
  window.addEventListener('resize', function () {
    viewH = window.innerHeight;
    if (wrapper.clientWidth !== W) remeasureSoon();
  }, { passive: true });
  // Re-measure whenever the page's size changes (images/fonts loading, RSVP form expanding…).
  if ('ResizeObserver' in window) new ResizeObserver(remeasureSoon).observe(wrapper);
  window.addEventListener('load', remeasureSoon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasureSoon);

  measure();
  requestAnimationFrame(frame);
})();
