/* ==========================================================================
   COUNTDOWN — markup from partials/countdown.njk.
   data-countdown holds the target as an ISO time WITH its UTC offset
   (e.g. 2026-12-11T20:00:00+05:30), so every guest sees the same moment
   no matter which time zone their phone is set to.
   ========================================================================== */
(function () {
  'use strict';

  function pad(n) { return String(Math.max(0, Math.floor(n))).padStart(2, '0'); }

  document.querySelectorAll('[data-countdown]').forEach(function (el) {
    var target = Date.parse(el.getAttribute('data-countdown'));
    if (isNaN(target)) return;

    var units = {};
    el.querySelectorAll('[data-unit]').forEach(function (u) { units[u.getAttribute('data-unit')] = u; });

    var timer = null;
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        el.classList.add('is-done');
        Object.keys(units).forEach(function (k) { units[k].textContent = '00'; });
        if (timer) clearInterval(timer);
        return;
      }
      var values = {
        days: diff / 86400000,
        hours: (diff % 86400000) / 3600000,
        mins: (diff % 3600000) / 60000,
        secs: (diff % 60000) / 1000
      };
      Object.keys(values).forEach(function (k) {
        if (units[k]) units[k].textContent = pad(values[k]);
      });
    }

    tick();
    timer = setInterval(tick, 1000);
  });
})();
