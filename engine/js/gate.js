/* ==========================================================================
   GATE — the opening screen. Markup comes from partials/gate.njk, or from a
   theme's own gate.njk (any design: envelope, doors, wax seal…).

   Inside the element with data-gate, the engine looks for:
     [data-gate-track] + [data-gate-handle]  a slider: drag the handle past
                                             OPEN_AT of the track, or tap it
     [data-gate-open]                        anything that opens on tap/click
   Timing (attributes on the data-gate element, in ms):
     data-gate-delay="200"   after opening starts, before .is-leaving is added
     data-gate-leave="400"   after .is-leaving, before the gate is removed
   Classes for theme animations: .is-opening (at once), .is-leaving (after delay).
   Without a gate on the page the invitation opens at once.
   ========================================================================== */
(function () {
  'use strict';

  var OPEN_AT = 0.35;

  function init() {
    var gate = document.querySelector('[data-gate]');
    if (!gate || window.Invite.isStatic) {
      if (gate) gate.remove();
      window.Invite.open({ auto: true });
      return;
    }

    var delay = parseInt(gate.getAttribute('data-gate-delay'), 10);
    var leave = parseInt(gate.getAttribute('data-gate-leave'), 10);
    if (isNaN(delay)) delay = 200;
    if (isNaN(leave)) leave = 400;
    var done = false;
    var slider = setupSlider(gate, finish);

    function finish() {
      if (done) return;
      done = true;
      if (slider) slider.complete();
      gate.classList.add('is-opening');
      // Synchronous, so it still counts as the guest's tap (browsers only allow music after a tap).
      window.Invite.open({ auto: false });
      setTimeout(function () {
        gate.classList.add('is-leaving');
        setTimeout(function () { gate.remove(); }, leave);
      }, delay);
    }

    gate.querySelectorAll('[data-gate-open]').forEach(function (el) {
      el.addEventListener('click', finish);
    });
  }

  function setupSlider(gate, finish) {
    var track = gate.querySelector('[data-gate-track]');
    var handle = gate.querySelector('[data-gate-handle]');
    if (!track || !handle) return null;
    var fill = gate.querySelector('[data-gate-fill]');
    var label = gate.querySelector('[data-gate-label]');

    var dragging = false;
    var moved = false;
    var suppressClick = false;
    var downX = 0;
    var grabOffset = 0;
    var x = 0;

    function maxX() {
      return Math.max(1, track.clientWidth - handle.offsetWidth - 2 * handle.offsetLeft);
    }

    function setX(value, animate) {
      x = Math.max(0, Math.min(value, maxX()));
      var progress = x / maxX();
      var transition = animate ? '' : 'none';
      handle.style.transition = transition;
      handle.style.transform = 'translate3d(' + x + 'px, 0, 0)';
      if (fill) {
        fill.style.transition = transition;
        fill.style.width = (progress * 100) + '%';
      }
      if (label) label.style.opacity = String(Math.max(0, 1 - progress * 1.5));
      return progress;
    }

    handle.addEventListener('pointerdown', function (e) {
      dragging = true;
      moved = false;
      downX = e.clientX;
      grabOffset = e.clientX - x;
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
      e.preventDefault();
    });

    handle.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      if (Math.abs(e.clientX - downX) > 4) moved = true;
      if (setX(e.clientX - grabOffset) >= OPEN_AT) finish();
    });

    handle.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false;
      suppressClick = moved;
      if (!moved || x / maxX() >= OPEN_AT) finish();
      else setX(0, true);
    });

    handle.addEventListener('pointercancel', function () {
      dragging = false;
      setX(0, true);
    });

    // Tapping the track, or pressing Enter/Space on the handle, also opens.
    track.addEventListener('click', function () {
      if (suppressClick) { suppressClick = false; return; }
      finish();
    });

    return {
      complete: function () {
        dragging = false;
        setX(maxX(), true);
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
