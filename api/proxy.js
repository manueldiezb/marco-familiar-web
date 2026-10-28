// Única función del servidor. Hace de intermediario para lo que el navegador no puede leer directamente:
//   GET /api/proxy?cal=<enlace iCal de Google>&desde=<ISO>&hasta=<ISO>  → eventos ya desarrollados
//   GET /api/proxy?tablero=<código de Talentos>                         → saldos de los niños
//   GET /api/proxy?equipos=esp.1|esp.2                                  → equipos de la liga (ESPN no deja leer esa lista desde otra web)
//   GET /api/proxy?version=1                                            → qué versión está publicada y de qué repo (para Ajustes → Actualizaciones)
//   POST /api/proxy?actualizar=1                                        → «Sync fork» con el repo original (solo si hay GITHUB_TOKEN)
// Sin clave a propósito: solo habla con Google Calendar, Talentos y ESPN (no es un proxy abierto) y no guarda nada.
// Quien la use solo puede leer un calendario cuya dirección secreta ya tiene, o un tablero cuyo código ya conoce.
import { eventos } from './_calendario.js'

const TALENTOS = 'https://lostalentos.vercel.app'
const DIA = 864e5

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const { cal, tablero, equipos, version, actualizar } = req.query
  const E = process.env
  try {
    if (version) return res.json({ sha: E.VERCEL_GIT_COMMIT_SHA || null, owner: E.VERCEL_GIT_REPO_OWNER || null, repo: E.VERCEL_GIT_REPO_SLUG || null, token: !!E.GITHUB_TOKEN })
    // ponytail: sin clave; cualquiera podría pedirlo, pero solo trae los cambios del repo original, que es lo que el dueño ya aceptó al activarlo
    if (actualizar) {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST' })
      if (!E.GITHUB_TOKEN || !E.VERCEL_GIT_REPO_OWNER) return res.status(400).json({ error: 'Falta GITHUB_TOKEN en Vercel' })
      const r = await fetch(`https://api.github.com/repos/${E.VERCEL_GIT_REPO_OWNER}/${E.VERCEL_GIT_REPO_SLUG}/merge-upstream`, {
        method: 'POST', signal: AbortSignal.timeout(15000), body: JSON.stringify({ branch: E.VERCEL_GIT_COMMIT_REF || 'main' }),
        headers: { Authorization: 'Bearer ' + E.GITHUB_TOKEN, Accept: 'application/vnd.github+json', 'User-Agent': 'marco-familiar' } })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) return res.status(502).json({ error: r.status === 409 ? 'Tu copia tiene cambios propios que chocan con los nuevos: actualízala en GitHub' : r.status === 401 || r.status === 403 ? 'GitHub no acepta el token (¿caducado o sin permiso de escritura?)' : 'GitHub respondió ' + r.status + (j.message ? ': ' + j.message : '') })
      return res.json({ ok: true, nada: j.merge_type === 'none' })
    }
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
    return res.status(400).json({ error: 'Falta qué leer: cal, tablero, equipos o version' })
  } catch (e) {
    return res.status(502).json({ error: e.name === 'TimeoutError' ? 'Tardó demasiado en responder' : 'No se pudo leer: ' + e.message })
  }
}

const fechaO = (v, def) => { const t = v ? Date.parse(v) : NaN; return new Date(isNaN(t) ? def : t) }

// Acepta el enlace tal como lo copia Google (https o webcal) y solo de calendar.google.com
export function enlaceGoogle(s) {
  let u
  try { u = new URL(s.trim().replace(/^webcals?:\/\//i, 'https://')) } catch { return null }
  return u.protocol === 'https:' && u.hostname === 'calendar.google.com' && u.pathname.startsWith('/calendar/ical/') && u.pathname.endsWith('.ics') ? u.href : null
}
