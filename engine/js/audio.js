/* ==========================================================================
   AUDIO — background music. Markup comes from partials/audio.njk.
   - Starts when the invitation is opened (inside the guest's tap).
   - If the browser refuses (no tap yet), it retries on the next tap.
   - Pauses when the phone locks / the guest switches app, resumes on return
     unless the guest paused it themselves.
   ========================================================================== */
(function () {
  'use strict';

  var audio = document.querySelector('[data-audio]');
  var button = document.querySelector('[data-audio-toggle]');
  if (!audio) return;

  var wantPlay = false;
  var userPaused = false;
  var resumeOnReturn = false;
  var retryArmed = false;
  var RETRY_EVENTS = ['pointerup', 'touchend', 'click', 'keydown'];

  function setUI(playing) {
    if (!button) return;
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-pressed', playing ? 'true' : 'false');
    button.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
  }

  function retry() {
    retryArmed = false;
    RETRY_EVENTS.forEach(function (t) { window.removeEventListener(t, retry, true); });
    if (wantPlay && !userPaused && audio.paused) play();
  }

  function armRetry() {
    if (retryArmed) return;
    retryArmed = true;
    RETRY_EVENTS.forEach(function (t) { window.addEventListener(t, retry, true); });
  }

  function play() {
    if (userPaused || document.hidden) return;
    wantPlay = true;
    var result = audio.play();
    if (result && typeof result.catch === 'function') result.catch(armRetry);
  }

  function pauseForLater() {
    if (!audio.paused) {
      resumeOnReturn = true;
      audio.pause();
    }
  }

  function resumeIfNeeded() {
    if (resumeOnReturn && !userPaused && !document.hidden) {
      resumeOnReturn = false;
      play();
    }
  }

  audio.addEventListener('play', function () { setUI(true); });
  audio.addEventListener('pause', function () { setUI(false); });
  audio.addEventListener('ended', function () { setUI(false); });

  if (button) {
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      if (audio.paused) {
        userPaused = false;
        play();
      } else {
        userPaused = true;
        audio.pause();
      }
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pauseForLater();
    else resumeIfNeeded();
  });
  window.addEventListener('pagehide', pauseForLater);
  document.addEventListener('freeze', pauseForLater);
  window.addEventListener('pageshow', resumeIfNeeded);

  window.Invite.onOpen(function () {
    if (window.Invite.isStatic) return;
    if (button) button.classList.add('is-visible');
    play();
  });
})();
