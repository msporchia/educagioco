// due scene sorde a euro/risposte: { che:'monete', pezzi:[{cents,testo}] } e { che:'linea-numeri', da, a, punti:[{lettera,pos}] }. `cents` decide solo la forma (colore serve solo a distinguere a vista); `pos` è la frazione 0..1, il pittore non sa che numero rappresenti.

const COLORI_MONETA = { piccola: '#d7a24a', grande: '#e7c565', nota: '#bcd6a3' }

function pezzo(p, cx, cy, mz) {
  if (mz.cents >= 500) {                       // banconota: un rettangolo
    p.rett(cx - 19, cy - 11, 38, 22, COLORI_MONETA.nota)
    p.testo(mz.testo, cx, cy, '#22421f', 9, 800)
    return
  }
  const grande = mz.cents >= 100
  p.cerchio(cx, cy, grande ? 16 : 12.5, grande ? COLORI_MONETA.grande : COLORI_MONETA.piccola)
  p.testo(mz.sulla ?? mz.testo, cx, cy, '#5a3d10', grande ? 8 : 7, 800)
}

export function monete(p, { pezzi = [] }) {
  const n = pezzi.length || 1
  const cols = n <= 2 ? n : 3
  const rows = Math.ceil(n / cols)
  const cellW = 100 / cols, cellH = 100 / rows
  pezzi.forEach((mz, i) => {
    const cx = cellW * (i % cols) + cellW / 2
    const cy = cellH * Math.floor(i / cols) + cellH / 2
    pezzo(p, cx, cy, mz)
  })
}

export function lineaNumeri(p, { da = 0, a = 1, punti = [] }) {
  const x0 = 12, x1 = 88, y = 52
  p.rett(4, 22, 92, 56, '#f4f6fb') // foglio chiaro sotto: senza, i numeri scuri sparivano sulla carta scura
  p.linea([{ x: x0, y }, { x: x1, y }], '#7d8cb4', 2)

  for (let i = 0; i <= 10; i++) { // undici tacche: estremi più marcati, decimi in mezzo
    const x = x0 + (x1 - x0) * (i / 10)
    const capo = i === 0 || i === 10
    p.linea([{ x, y: y - (capo ? 9 : 5) }, { x, y: y + (capo ? 9 : 5) }],
      capo ? '#22304f' : '#a9b6da', capo ? 2 : 1)
  }
  p.testo(String(da), x0, y + 18, '#22304f', 13, 800)
  p.testo(String(a), x1, y + 18, '#22304f', 13, 800)

  const TINTE = ['#d8574f', '#3d7a3d', '#3d5aa8']
  punti.forEach((pt, i) => {
    const x = x0 + (x1 - x0) * pt.pos
    p.cerchio(x, y, 4.5, TINTE[i % TINTE.length])
    p.testo(pt.lettera, x, y - 16, TINTE[i % TINTE.length], 12, 900)
  })
}

export const PITTORI_SOLDI = { monete, 'linea-numeri': lineaNumeri }
