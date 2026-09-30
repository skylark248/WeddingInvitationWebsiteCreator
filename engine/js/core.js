/* ==========================================================================
   ENGINE CORE — loaded first. Shared state for the other engine modules.
   window.Invite.onOpen(fn)  run fn once the guest has opened the invitation
   window.Invite.open(detail) mark the invitation as opened (called by gate.js)
   ?static in the URL        screenshot mode: no gate, no reveal animations, no music
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var isStatic = /[?&]static\b/.test(location.search);
  var reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var opened = false;
  var openDetail = null;

  function onOpen(fn) {
    if (opened) { fn(openDetail); return; }
    document.addEventListener('invite:open', function (e) { fn(e.detail || {}); }, { once: true });
  }

  function open(detail) {
    if (opened) return;
    opened = true;
    openDetail = detail || {};
    root.classList.remove('gate-active');
    root.classList.add('is-open');
    // Dispatched synchronously so listeners still run inside the guest's tap (needed for audio).
    document.dispatchEvent(new CustomEvent('invite:open', { detail: openDetail }));
  }

  window.Invite = {
    onOpen: onOpen,
    open: open,
    isOpen: function () { return opened; },
    isStatic: isStatic,
    reducedMotion: reducedMotion
  };
})();
