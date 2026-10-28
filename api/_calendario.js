// Pasa un fichero iCal (.ics) a la lista de eventos entre dos fechas, con las repeticiones ya desarrolladas
// («todos los martes», con sus excepciones: un martes cancelado o movido de hora).
// Los ficheros que empiezan por _ dentro de api/ no son funciones de Vercel: esto lo usa proxy.js.
import ICAL from 'ical.js'

const MAX_REPETICIONES = 5000   // ponytail: tope para reglas sin fin que empezaron hace años; de sobra para una diaria de 10 años

export function eventos(texto, desde, hasta) {
  const cal = new ICAL.Component(ICAL.parse(texto))
  for (const tz of cal.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(tz)
  const ini = ICAL.Time.fromJSDate(desde, true), fin = ICAL.Time.fromJSDate(hasta, true)

  // Las excepciones (RECURRENCE-ID) se cuelgan de su evento repetido; si este no está, van sueltas
  const base = new Map(), sueltos = []
  const todos = cal.getAllSubcomponents('vevent').map(v => new ICAL.Event(v))
  for (const e of todos) if (!e.isRecurrenceException()) base.set(e.uid, e)
  for (const e of todos) if (e.isRecurrenceException()) base.has(e.uid) ? base.get(e.uid).relateException(e) : sueltos.push(e)

  const out = []
  const meter = (item, start, end) => {
    if (item.component.getFirstPropertyValue('status') === 'CANCELLED') return
    if (start.compare(fin) >= 0 || end.compare(ini) <= 0) return
    out.push({
      title: item.summary || '(sin título)',
      place: item.location || '',
      allDay: start.isDate,
      // día entero: solo la fecha (el navegador la toma en su hora local); con hora: instante exacto
      start: start.isDate ? fecha(start) : start.toJSDate().toISOString(),
      end: end.isDate ? fecha(end) : end.toJSDate().toISOString(),
    })
  }
  for (const e of [...base.values(), ...sueltos]) {
    if (!e.isRecurring()) { meter(e, e.startDate, e.endDate || e.startDate); continue }
    const it = e.iterator()
    for (let i = 0, t; i < MAX_REPETICIONES && (t = it.next()); i++) {
      if (t.compare(fin) >= 0) break
      const o = e.getOccurrenceDetails(t)
      meter(o.item, o.startDate, o.endDate)
    }
  }
  return { name: cal.getFirstPropertyValue('x-wr-calname') || '', events: out.sort((a, b) => a.start < b.start ? -1 : 1) }
}

const p2 = n => String(n).padStart(2, '0')
const fecha = t => `${t.year}-${p2(t.month)}-${p2(t.day)}`
