/* ==========================================================================
   RSVP — markup from partials/rsvp.njk. Sends the answer to the Google Apps
   Script endpoint (rsvp/Code.gs), which writes one row in the invite's tab.
   Content-Type text/plain keeps the request "simple" so the browser does not
   send a CORS preflight, which Apps Script cannot answer.
   ========================================================================== */
(function () {
  'use strict';

  document.querySelectorAll('[data-rsvp]').forEach(function (form) {
    var endpoint = form.getAttribute('data-endpoint');
    var inviteId = form.getAttribute('data-invite-id');
    var status = form.querySelector('[data-rsvp-status]');
    var eventsBox = form.querySelector('[data-rsvp-events]');
    var guestsBox = form.querySelector('[data-rsvp-guests]');
    var submit = form.querySelector('[type="submit"]');
    var storeKey = 'rsvp:' + inviteId;

    function say(text, kind) {
      if (!status) return;
      status.textContent = text || '';
      status.className = 'rsvp__status' + (kind ? ' is-' + kind : '');
    }

    function selectedOption() {
      return form.querySelector('input[name="attending"]:checked');
    }

    function syncVisibility() {
      var opt = selectedOption();
      if (eventsBox) eventsBox.hidden = !(opt && opt.hasAttribute('data-ask-events'));
      if (guestsBox) guestsBox.hidden = !!(opt && opt.hasAttribute('data-not-attending'));
    }

    form.addEventListener('change', syncVisibility);
    syncVisibility();

    try {
      if (localStorage.getItem(storeKey)) say(form.getAttribute('data-already') || '', 'info');
    } catch (e) { /* storage blocked — not important */ }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = (form.elements.name && form.elements.name.value || '').trim();
      var opt = selectedOption();
      if (!name) { say(form.getAttribute('data-need-name'), 'error'); form.elements.name.focus(); return; }
      if (!opt) { say(form.getAttribute('data-need-choice'), 'error'); return; }

      var events = [];
      if (eventsBox && !eventsBox.hidden) {
        eventsBox.querySelectorAll('input:checked').forEach(function (c) { events.push(c.value); });
      }

      var payload = {
        inviteId: inviteId,
        name: name,
        phone: form.elements.phone ? form.elements.phone.value.trim() : '',
        attending: opt.value,
        attendingLabel: opt.getAttribute('data-label') || opt.value,
        events: events,
        guests: guestsBox && !guestsBox.hidden && form.elements.guests ? Number(form.elements.guests.value) || 1 : 0,
        message: form.elements.message ? form.elements.message.value.trim() : '',
        website: form.elements.website ? form.elements.website.value : ''
      };

      submit.disabled = true;
      say(form.getAttribute('data-sending'), 'info');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || !data.ok) throw new Error((data && data.error) || 'failed');
          try { localStorage.setItem(storeKey, String(Date.now())); } catch (e) { /* ignore */ }
          form.classList.add('is-sent');
          say(form.getAttribute('data-thanks'), 'success');
        })
        .catch(function () {
          say(form.getAttribute('data-error'), 'error');
        })
        .then(function () { submit.disabled = false; });
    });
  });
})();
