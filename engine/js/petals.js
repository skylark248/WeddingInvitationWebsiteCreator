/* ==========================================================================
   PETALS — a shower of petals when the guest opens the invitation.
   Turn on by adding an element:
     <div data-petals="assets/images/petals/1.png, assets/images/petals/2.png"
          data-petals-count="28" data-petals-seconds="5"></div>
   ========================================================================== */
(function () {
  'use strict';

  var config = document.querySelector('[data-petals]');
  if (!config || !('animate' in Element.prototype)) return;

  var images = config.getAttribute('data-petals').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (!images.length) return;

  function shower() {
    var vw = window.innerWidth || 360;
    var vh = window.innerHeight || 640;
    var count = parseInt(config.getAttribute('data-petals-count'), 10) || (vw < 768 ? 28 : 36);
    var windowSec = parseFloat(config.getAttribute('data-petals-seconds')) || 5;

    var layer = document.createElement('div');
    layer.className = 'petals-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    var remaining = count;
    for (var i = 0; i < count; i++) {
      var img = document.createElement('img');
      img.src = images[i % images.length];
      img.alt = '';
      img.className = 'petals-layer__petal';
      img.style.width = (26 + Math.random() * 20) + 'px';
      layer.appendChild(img);

      // Golden-angle spacing spreads petals evenly across the screen (no clumps).
      var margin = 25;
      var startX = margin + (((i * 137.5) % 100) / 100) * Math.max(100, vw - margin * 2) + (Math.random() * 20 - 10);
      var endX = startX + (Math.random() * 140 - 70);
      var rz = Math.random() * 360, rx = Math.random() * 180, ry = Math.random() * 180;
      var scale = 0.85 + Math.random() * 0.3;
      var duration = (6 + Math.random() * 2) * 1000;
      var delay = Math.max(0, (i / count) * windowSec + (Math.random() * 0.2 - 0.1)) * 1000;

      var anim = img.animate([
        { transform: 'translate3d(' + startX + 'px,-60px,0) rotateZ(' + rz + 'deg) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(' + scale + ')', opacity: 1 },
        { opacity: 1, offset: 0.8 },
        { transform: 'translate3d(' + endX + 'px,' + (vh + 80) + 'px,0) rotateZ(' + (rz + Math.random() * 360 - 180) + 'deg) rotateX(' + (rx + Math.random() * 450) + 'deg) rotateY(' + (ry + Math.random() * 450) + 'deg) scale(' + scale + ')', opacity: 0 }
      ], { duration: duration, delay: delay, easing: 'ease-in-out', fill: 'both' });

      anim.onfinish = function () {
        remaining--;
        if (remaining <= 0 && layer.parentNode) layer.parentNode.removeChild(layer);
      };
    }
  }

  window.Invite.onOpen(function () {
    if (window.Invite.isStatic || window.Invite.reducedMotion) return;
    shower();
  });
})();
