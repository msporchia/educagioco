// due scene sorde a euro/risposte: { che:'monete', pezzi:[{cents,testo}] } e { che:'linea-numeri', da, a, punti:[{lettera,pos}] }. `pos` è la frazione 0..1, il pittore non sa che numero rappresenti.

/* Le monete non si dipingono qui: le mostrano i pezzi HTML della bancarella
   (`grafica/soldi.js`), da `Domanda.vue` e da `scheda.js`. Resta una funzione
   vuota solo perché `guastiDi` pretende un pittore per ogni scena. */
export function monete() {}
monete.altrove = true

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
