// Date helpers. Every event time in the config is an ISO string WITH its UTC offset,
// e.g. "2026-12-11T20:00:00+05:30", and is displayed in the invite's own time zone.

export const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)$/;

export function isValidTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** "+05:30" for Asia/Kolkata at that moment. */
export function offsetAt(date, timeZone) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(date).find((p) => p.type === 'timeZoneName').value; // "GMT+05:30" or "GMT"
  return name === 'GMT' ? '+00:00' : name.replace('GMT', '');
}

export function offsetOf(iso) {
  if (iso.endsWith('Z')) return '+00:00';
  return iso.slice(-6);
}

/**
 * Every way a design might show an event's date, worked out in the invite's time zone.
 * e.g. for 2026-12-11T20:00:00+05:30 with timeFormat "12h", locale "en-GB":
 *   day "11", dayOrdinal "11th", month "December", monthShort "Dec", monthNumber "12", year "2026",
 *   weekday "Friday", weekdayShort "Fri", time "8:00 PM", long "Friday, 11 December 2026"
 * Use locale "hi-IN" for Hindi month and weekday names.
 */
export function dateParts(iso, timeZone, timeFormat = '24h', locale = 'en-GB') {
  const date = new Date(iso);
  const twelve = timeFormat === '12h';
  const pick = (options) => Object.fromEntries(
    new Intl.DateTimeFormat(locale, { timeZone, ...options }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  const long = pick({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const short = pick({ weekday: 'short', month: 'short' });
  const num = pick({ month: '2-digit' });
  const clock = pick({ hour: twelve ? 'numeric' : '2-digit', minute: '2-digit', hourCycle: twelve ? 'h12' : 'h23' });
  const time = twelve
    ? `${clock.hour}:${clock.minute} ${String(clock.dayPeriod || '').toUpperCase()}`.trim()
    : `${clock.hour}:${clock.minute}`;
  return {
    day: long.day,
    dayOrdinal: locale.startsWith('en') ? ordinal(Number(long.day)) : long.day,
    month: long.month,
    monthShort: short.month,
    monthNumber: num.month,
    year: long.year,
    weekday: long.weekday,
    weekdayShort: short.weekday,
    time,
    long: new Intl.DateTimeFormat(locale, { timeZone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date),
    iso,
  };
}

function ordinal(n) {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  return `${n}${suffix}`;
}
