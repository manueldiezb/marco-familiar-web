// Cálculos sin pantalla, para poder probarlos con node (test/logica.test.js). La página los carga con <script>.

// --- Luz ---
// precios: [{ t: inicio de la hora en ms, p: €/kWh }] seguidos y ordenados. Devuelve el arranque más barato para un
// aparato de `horas` horas que empiece en la hora en curso o después: { t, media } o null si no hay datos suficientes.
function mejorTramo(precios, horas, ahora) {
  const hora = ahora - ahora % 36e5, desde = precios.filter(x => x.t >= hora)   // la hora en curso cuenta
  let mejor = null
  for (let i = 0; i + horas <= desde.length; i++) {
    if (desde[i + horas - 1].t - desde[i].t !== (horas - 1) * 36e5) continue    // huecos (cambio de hora): fuera
    const media = desde.slice(i, i + horas).reduce((a, x) => a + x.p, 0) / horas
    if (!mejor || media < mejor.media - 1e-9) mejor = { t: desde[i].t, media }
  }
  return mejor
}

// Tarifa 2.0TD con tramos fijos (hora peninsular): valle de 0 a 8 y fines de semana; punta de 10 a 14 y de 18 a 22;
// el resto, llano. ponytail: los festivos nacionales cuentan como valle y aquí no se tienen en cuenta
function periodo(d) {
  const h = d.getHours(), dia = d.getDay()
  if (dia === 0 || dia === 6 || h < 8) return 'valle'
  return (h >= 10 && h < 14) || (h >= 18 && h < 22) ? 'punta' : 'llano'
}
// Primer momento desde `d` (incluido) en que es valle
function siguienteValle(d) {
  const t = new Date(d)
  if (periodo(t) === 'valle') return t
  t.setMinutes(0, 0, 0)
  while (periodo(t) !== 'valle') t.setHours(t.getHours() + 1)
  return t
}

// --- Talentos: vale el enlace del tablero entero o solo el código ---
function codigoTablero(s) {
  const m = String(s || '').trim().match(/(?:\/tablero\/)?([a-z0-9-]{6,80})\/?(?:[?#].*)?$/i)
  return m ? m[1].toLowerCase() : null
}

// --- Configuración: se guarda en el iPad y se pasa a otro con este código (JSON en base64, con tildes) ---
const codificar = cfg => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(cfg))))
function decodificar(s) {
  try { return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(String(s).trim()), c => c.charCodeAt(0)))) } catch { return null }
}
