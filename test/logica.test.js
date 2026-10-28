// node test/logica.test.js — luz, código del tablero y código de configuración (logica.js es un script de navegador)
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

process.env.TZ = 'Europe/Madrid'
const ctx = { TextEncoder, TextDecoder, btoa, atob, Uint8Array, String, JSON }
vm.runInNewContext(readFileSync(new URL('../logica.js', import.meta.url), 'utf8') + ';this.L={mejorTramo,periodo,siguienteValle,codigoTablero,codificar,decodificar}', ctx)
const L = ctx.L

// --- mejorTramo: 24 h de precios; lo más barato es 14-16 h; a las 15:30 ya no se puede empezar a las 14 ---
const dia = new Date(2026, 9, 28).getTime(), H = 36e5
const p = [.20, .19, .18, .18, .19, .20, .22, .25, .27, .24, .20, .16, .14, .12, .10, .09, .15, .22, .28, .30, .29, .26, .23, .21]
const precios = p.map((x, h) => ({ t: dia + h * H, p: x }))
assert.equal(L.mejorTramo(precios, 2, dia + 8 * H).t, dia + 14 * H, '2 h desde las 8: 14-16')
assert.equal(L.mejorTramo(precios, 3, dia + 8 * H).t, dia + 13 * H, '3 h: 13-16')
assert.equal(L.mejorTramo(precios, 2, dia + 15.5 * H).t, dia + 15 * H, 'la hora en curso sí cuenta')
assert.equal(L.mejorTramo(precios, 5, dia + 22 * H), null, 'no quedan 5 horas con precio')
assert.ok(Math.abs(L.mejorTramo(precios, 2, dia).media - .095) < 1e-9, 'media del tramo')

// --- tarifa con tramos ---
const at = (d, h, m = 0) => new Date(2026, 9, d, h, m)          // 28-oct-2026 es miércoles
assert.equal(L.periodo(at(28, 7, 59)), 'valle')
assert.equal(L.periodo(at(28, 9)), 'llano')
assert.equal(L.periodo(at(28, 12)), 'punta')
assert.equal(L.periodo(at(28, 21, 59)), 'punta')
assert.equal(L.periodo(at(28, 23)), 'llano')
assert.equal(L.periodo(at(31, 12)), 'valle', 'sábado')
assert.equal(+L.siguienteValle(at(28, 12, 30)), +at(29, 0), 'de punta al valle de medianoche')
assert.equal(+L.siguienteValle(at(30, 9)), +at(31, 0), 'viernes por la mañana → sábado 0:00')
assert.equal(+L.siguienteValle(at(28, 3)), +at(28, 3), 'ya en valle')

// --- código del tablero ---
assert.equal(L.codigoTablero('https://lostalentos.vercel.app/tablero/ab3dEf'), 'ab3def')
assert.equal(L.codigoTablero('  ab3def  '), 'ab3def')
assert.equal(L.codigoTablero('https://lostalentos.vercel.app/tablero/ab3def/?x=1'), 'ab3def')
assert.equal(L.codigoTablero('abc'), null)

// --- configuración de ida y vuelta, con tildes y emojis ---
const cfg = { family: 'Pérez Núñez', cals: [{ name: 'Mamá', color: '#E8743B' }], countdown: { emoji: '🎂' } }
assert.deepEqual(L.decodificar(L.codificar(cfg)), cfg)
assert.equal(L.decodificar('esto no es'), null)
console.log('✓ lógica OK')
