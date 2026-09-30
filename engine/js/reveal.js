/* ==========================================================================
   REVEAL — elements with data-reveal fade up as they scroll into view.
   data-reveal="zoom" scales in instead. Nothing is hidden unless this script
   runs, so content never disappears if JavaScript fails.
   With a gate, everything waits until the guest opens the invitation.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var items = [].slice.call(document.querySelectorAll('[data-reveal]'));
  if (!items.length || window.Invite.isStatic || window.Invite.reducedMotion || !('IntersectionObserver' in window)) return;

  function show(el) { el.classList.add('is-revealed'); }

  var gated = root.classList.contains('gate-active');
  if (!gated) {
    // Content already on screen stays visible — only content below the fold animates.
    var h = window.innerHeight;
    items.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h && r.bottom > 0) show(el);
    });
  }
  root.classList.add('reveal-ready');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        show(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  window.Invite.onOpen(function () {
    items.forEach(function (el) {
      if (!el.classList.contains('is-revealed')) observer.observe(el);
    });
  });
})();
