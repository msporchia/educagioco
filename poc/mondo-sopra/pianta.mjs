// La pianta del mondo generato, in caratteri, e i suoi guasti: `node poc/mondo-sopra/pianta.mjs [seme]`
import { generaMondo, ERBA, ACQUA, ROCCIA } from './generatore.js'
const t0 = Date.now()
const m = generaMondo(process.argv[2] ? Number(process.argv[2]) : undefined)
const ms = Date.now() - t0
const segno = Array.from({ length: m.W * m.H }, (_, k) => {
  if (m.ponte[k] >= 0) return '='
  if (m.terreno[k] === ACQUA) return '~'
  if (m.terreno[k] === ROCCIA) return '^'
  if (m.fuori[k]) return '>'
  if (m.strada[k] === 3) return 'o'
  if (m.campo[k]) return ','
  if (m.blocco[k] === 2) return 't'
  if (m.blocco[k]) return '#'
  if (m.strada[k]) return '+'
  return '.'
})
for (const p of m.posti) segno[p.y * m.W + p.x] = p.chiave[0].toUpperCase()
for (const c of m.mercanti) segno[c.piede.y * m.W + c.piede.x] = '$'
if (m.minatore) segno[m.minatore.piede.y * m.W + m.minatore.piede.x] = 'M'
if (m.mulino) segno[m.mulino.y * m.W + m.mulino.x] = 'W'
for (let y = 0; y < m.H; y++) console.log(segno.slice(y * m.W, (y + 1) * m.W).join(''))
console.log(`${ms} ms · ${m.posti.length} ingressi · ${m.mercanti.length} mercanti · ${m.case.length} case · ${m.campi.length} campi · ${m.ponti.length} ponti · ${m.decoro.length} decori`)
console.log(m.guasti.length ? 'GUASTI:\n' + m.guasti.join('\n') : 'nessun guasto')
