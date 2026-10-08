/* Le zucche della festa, dai disegni in pixel di `scena/pixel-festa.js` a un foglio dell'atlante.
   Il disegno sta nel codice (un carattere, un pixel); qui diventa `festa.png` col suo foglietto, e
   `python3 strumenti/sprite/atlante.py fattoria` lo porta nell'atlante come ogni altro foglio.
   `node strumenti/sprite/festa.mjs` — vedi docs/fattoria/stagioni.md. */
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { DISEGNI } from '../../src/giochi/fattoria/scena/pixel-festa.js'

const DOVE = new URL('./sorgenti/fattoria/generati/', import.meta.url)
// Quali disegni diventano pezzi, e con che nome: la luce dentro è accesa piena.
const PEZZI = { zucca: 'zucca_intagliata', zucche_mucchio: 'zucche_mucchio' }

const esadecimale = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const LUCE = '#ffd34d'

const pezzi = Object.entries(PEZZI).map(([disegno, nome]) => {
  const d = DISEGNI[disegno]
  return { nome, d, w: Math.max(...d.righe.map(r => r.length)), h: d.righe.length }
})
const W = pezzi.reduce((a, p) => a + p.w + 1, 0), H = Math.max(...pezzi.map(p => p.h))
const rgba = Buffer.alloc(W * H * 4)
const sprite = {}
let x0 = 0
for (const p of pezzi) {
  p.d.righe.forEach((riga, y) => [...riga].forEach((c, x) => {
    if (c === '.') return
    const [r, g, b] = esadecimale(c === 'L' ? LUCE : p.d.colori[c])
    rgba.set([r, g, b, 255], ((y + H - p.h) * W + x0 + x) * 4)
  }))
  sprite[p.nome] = { da: [x0, H - p.h], cella: [p.w, p.h] }
  x0 += p.w + 1
}

// Un PNG a mano: zlib è nel Node, e un'altra dipendenza per tre righe di pixel non vale.
const crc = buf => {
  let c = ~0
  for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)) }
  return ~c >>> 0
}
const pezzo = (tipo, dati) => {
  const t = Buffer.from(tipo)
  const lun = Buffer.alloc(4); lun.writeUInt32BE(dati.length)
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, dati])))
  return Buffer.concat([lun, t, dati, c])
}
const testa = Buffer.alloc(13)
testa.writeUInt32BE(W, 0); testa.writeUInt32BE(H, 4); testa.set([8, 6, 0, 0, 0], 8)
const righe = Buffer.alloc((W * 4 + 1) * H)
for (let y = 0; y < H; y++) rgba.copy(righe, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4)
writeFileSync(new URL('festa.png', DOVE), Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  pezzo('IHDR', testa), pezzo('IDAT', deflateSync(righe)), pezzo('IEND', Buffer.alloc(0)),
]))
writeFileSync(new URL('festa.json', DOVE), JSON.stringify({
  __: 'GENERATO da strumenti/sprite/festa.mjs dai disegni di src/giochi/fattoria/scena/pixel-festa.js: non si scrive a mano.',
  fondo: 'trasparente', colori: 0, cella: [1, 1], famiglia: 'oggetto', sprite,
}, null, 1) + '\n')
console.log(`festa.png ${W}×${H}: ${Object.keys(sprite).join(', ')}`)
