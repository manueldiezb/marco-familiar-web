// node test/calendario.test.js — repeticiones, excepciones y cambio de hora, como los manda Google
import assert from 'node:assert/strict'
import { eventos } from '../api/_calendario.js'
import { enlaceGoogle } from '../api/proxy.js'

const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
X-WR-CALNAME:Familia
X-WR-TIMEZONE:Europe/Madrid
BEGIN:VTIMEZONE
TZID:Europe/Madrid
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:natacion@google.com
SUMMARY:Natación
LOCATION:Polideportivo, Calle Falsa 1
DTSTART;TZID=Europe/Madrid:20260901T170000
DTEND;TZID=Europe/Madrid:20260901T180000
RRULE:FREQ=WEEKLY;BYDAY=TU
EXDATE;TZID=Europe/Madrid:20261013T170000
END:VEVENT
BEGIN:VEVENT
UID:natacion@google.com
RECURRENCE-ID;TZID=Europe/Madrid:20261020T170000
SUMMARY:Natación (cambio de hora)
DTSTART;TZID=Europe/Madrid:20261020T183000
DTEND;TZID=Europe/Madrid:20261020T193000
END:VEVENT
BEGIN:VEVENT
UID:excursion@google.com
SUMMARY:Excursión
DTSTART;VALUE=DATE:20261016
DTEND;VALUE=DATE:20261018
END:VEVENT
BEGIN:VEVENT
UID:cancelada@google.com
SUMMARY:Cena cancelada
STATUS:CANCELLED
DTSTART:20261015T190000Z
DTEND:20261015T210000Z
END:VEVENT
BEGIN:VEVENT
UID:vieja@google.com
SUMMARY:Fuera de rango
DTSTART:20250101T100000Z
DTEND:20250101T110000Z
END:VEVENT
END:VCALENDAR`.replace(/\n/g, '\r\n')

const { name, events } = eventos(ics, new Date('2026-10-12T00:00Z'), new Date('2026-11-01T00:00Z'))
const ver = events.map(e => `${e.title}|${e.start}|${e.end}|${e.allDay}`)
assert.equal(name, 'Familia')
assert.deepEqual(ver, [
  // 13 de octubre: quitado con EXDATE
  'Excursión|2026-10-16|2026-10-18|true',                                       // día entero: solo fechas
  'Natación (cambio de hora)|2026-10-20T16:30:00.000Z|2026-10-20T17:30:00.000Z|false',   // la excepción manda
  'Natación|2026-10-27T16:00:00.000Z|2026-10-27T17:00:00.000Z|false',            // tras el 25-oct: 17:00 Madrid = 16:00Z
], 'eventos desarrollados')
assert.equal(events.find(e => e.title === 'Natación').place, 'Polideportivo, Calle Falsa 1')

// solo enlaces de Google Calendar
assert.ok(enlaceGoogle('https://calendar.google.com/calendar/ical/abc%40gmail.com/private-123/basic.ics'))
assert.equal(enlaceGoogle('webcal://calendar.google.com/calendar/ical/x/public/basic.ics'), 'https://calendar.google.com/calendar/ical/x/public/basic.ics')
assert.equal(enlaceGoogle('https://evil.com/calendar/ical/x/basic.ics'), null)
assert.equal(enlaceGoogle('https://calendar.google.com.evil.com/calendar/ical/x/basic.ics'), null)
assert.equal(enlaceGoogle('http://calendar.google.com/calendar/ical/x/basic.ics'), null)
assert.equal(enlaceGoogle('no es un enlace'), null)
console.log('✓ calendario OK')
