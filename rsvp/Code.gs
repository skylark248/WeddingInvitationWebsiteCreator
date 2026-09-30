/**
 * RSVP collector — ONE Google Sheet + ONE web-app URL for every invite.
 *
 * - Each invite writes to its own tab, named after the invite id (created automatically).
 * - Only invites listed in the "Invites" tab with "Accepting RSVPs" = yes are accepted,
 *   so strangers can't fill the sheet with junk tabs. Set it to "no" to close RSVPs.
 * - GET ?invite=<id> answers whether that invite is set up (used by `npm run verify`).
 *
 * Setup and updating: see rsvp/SETUP.md.
 */

var INVITES_TAB = 'Invites';
var INVITES_HEADERS = ['Invite id', 'Accepting RSVPs (yes/no)', 'Couple', 'Notes'];
var RSVP_HEADERS = ['Received', 'Name', 'Phone', 'Attending', 'Events', 'Guests', 'Message'];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Bots fill in the hidden "website" field. Pretend it worked and save nothing.
    if (data.website) return json({ ok: true });

    var inviteId = String(data.inviteId || '').trim();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!isAccepting(ss, inviteId)) return json({ ok: false, error: 'This invite is not accepting RSVPs.' });

    var name = clean(data.name, 120);
    if (!name) return json({ ok: false, error: 'Name is required.' });

    var events = Array.isArray(data.events) ? data.events.map(function (x) { return clean(x, 60); }).join(', ') : '';
    var row = [
      new Date(),
      name,
      clean(data.phone, 30),
      clean(data.attendingLabel || data.attending, 120),
      events,
      Math.max(0, Math.min(50, Number(data.guests) || 0)),
      clean(data.message, 500)
    ];

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      tabFor(ss, inviteId).appendRow(row);
    } finally {
      lock.releaseLock();
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'Could not save the RSVP.' });
  }
}

function doGet(e) {
  var id = e && e.parameter && e.parameter.invite;
  if (!id) return json({ ok: true, service: 'rsvp' });
  return json({ ok: true, invite: id, accepting: isAccepting(SpreadsheetApp.getActiveSpreadsheet(), String(id).trim()) });
}

/** Run once from the Apps Script editor (select "setupSheet" → Run) to create the Invites tab. */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(INVITES_TAB) || ss.insertSheet(INVITES_TAB, 0);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(INVITES_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, INVITES_HEADERS.length).setFontWeight('bold');
    sheet.setColumnWidths(1, INVITES_HEADERS.length, 200);
  }
}

function isAccepting(ss, inviteId) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(inviteId)) return false;
  var sheet = ss.getSheetByName(INVITES_TAB);
  if (!sheet) return false;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === inviteId) {
      return String(rows[i][1]).trim().toLowerCase() !== 'no';
    }
  }
  return false;
}

function tabFor(ss, inviteId) {
  var sheet = ss.getSheetByName(inviteId);
  if (!sheet) {
    sheet = ss.insertSheet(inviteId);
    sheet.appendRow(RSVP_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, RSVP_HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

/** Trim, shorten, and stop text that starts with = + - @ from being run as a spreadsheet formula. */
function clean(value, max) {
  var s = String(value == null ? '' : value).trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
