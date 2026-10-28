// Única función del servidor. Hace de intermediario para lo que el navegador no puede leer directamente:
//   GET /api/proxy?cal=<enlace iCal de Google>&desde=<ISO>&hasta=<ISO>  → eventos ya desarrollados
//   GET /api/proxy?tablero=<código de Talentos>                         → saldos de los niños
//   GET /api/proxy?equipos=esp.1|esp.2                                  → equipos de la liga (ESPN no deja leer esa lista desde otra web)
//   GET /api/proxy                                                       → 200 si la clave es buena (para el asistente)
// Siempre exige la cabecera X-Marco-Clave = MARCO_CLAVE (variable de entorno de Vercel), para que nadie más la use.
// Solo habla con Google Calendar, Talentos y ESPN: no es un proxy abierto.
import { timingSafeEqual } from 'node:crypto'
import { eventos } from './_calendario.js'

const TALENTOS = 'https://lostalentos.vercel.app'
const DIA = 864e5

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const clave = process.env.MARCO_CLAVE
  if (!clave) return res.status(500).json({ error: 'Falta MARCO_CLAVE en las variables de entorno de Vercel' })
  if (!igual(String(req.headers['x-marco-clave'] || ''), clave)) return res.status(401).json({ error: 'Clave incorrecta' })

  const { cal, tablero, equipos } = req.query
  try {
    if (cal) {
      const url = enlaceGoogle(String(cal))
      if (!url) return res.status(400).json({ error: 'Ese enlace no es un calendario iCal de Google' })
      const desde = fechaO(req.query.desde, Date.now() - DIA), hasta = fechaO(req.query.hasta, Date.now() + 14 * DIA)
      if (hasta - desde > 62 * DIA || hasta <= desde) return res.status(400).json({ error: 'Rango de fechas no válido' })
      const r = await fetch(url, { signal: AbortSignal.timeout(15000) })
      if (!r.ok) return res.status(502).json({ error: r.status === 404 ? 'Google no encuentra ese calendario (¿enlace caducado?)' : 'Google respondió ' + r.status })
      return res.json(eventos(await r.text(), desde, hasta))
    }
    if (tablero) {
      if (!/^[a-z0-9-]{6,80}$/.test(tablero)) return res.status(400).json({ error: 'Código de tablero no válido' })
      const r = await fetch(`${TALENTOS}/api/tablero/${tablero}`, { signal: AbortSignal.timeout(10000) })
      if (!r.ok) return res.status(r.status === 404 ? 404 : 502).json({ error: r.status === 404 ? 'No existe ese tablero' : 'Talentos respondió ' + r.status })
      return res.json(await r.json())
    }
    if (equipos) {
      if (!/^esp\.[12]$/.test(equipos)) return res.status(400).json({ error: 'Liga no válida' })
      const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${equipos}/teams`, { signal: AbortSignal.timeout(10000) })
      if (!r.ok) return res.status(502).json({ error: 'ESPN respondió ' + r.status })
      const teams = (await r.json()).sports?.[0]?.leagues?.[0]?.teams || []
      return res.json(teams.map(({ team: t }) => ({ id: t.id, name: t.displayName, short: t.shortDisplayName, color: t.color, alt: t.alternateColor })))
    }
    return res.json({ ok: true })
  } catch (e) {
    return res.status(502).json({ error: e.name === 'TimeoutError' ? 'Tardó demasiado en responder' : 'No se pudo leer: ' + e.message })
  }
}

const igual = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))
const fechaO = (v, def) => { const t = v ? Date.parse(v) : NaN; return new Date(isNaN(t) ? def : t) }

// Acepta el enlace tal como lo copia Google (https o webcal) y solo de calendar.google.com
export function enlaceGoogle(s) {
  let u
  try { u = new URL(s.trim().replace(/^webcals?:\/\//i, 'https://')) } catch { return null }
  return u.protocol === 'https:' && u.hostname === 'calendar.google.com' && u.pathname.startsWith('/calendar/ical/') && u.pathname.endsWith('.ics') ? u.href : null
}
