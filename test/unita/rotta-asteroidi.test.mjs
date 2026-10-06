/* La disposizione della rotta degli asteroidi, senza browser: a ogni
   larghezza da telefono le tappe stanno dentro lo schermo, la rotta non
   passa sopra un nome, il razzo si posa accanto alla sua tappa e da ognuna
   vola alla dopo. Vedi docs/asteroidi/mappa.md.
   `node test/esegui.mjs rotta-asteroidi --niente-build` */
import { SCALETTA, CAPITOLI } from '../../src/data/asteroidi.js'
import { STAZIONI } from '../../src/data/calcolo.js'
import { disponiRotta, stradaDelRazzo, lunghezza, durataVolo, giro } from '../../src/motore/asteroidi/rotta.js'
import { ingombro } from '../../src/grafica/rotta.js'
import { controlla, uguale, dentro, riassunto } from '../aiuto/verifica.mjs'

// le voci come le passa la schermata: il disegno dice quanto è larga una tappa
const voci = SCALETTA.map(v => ({ pos: v.pos, tipo: v.tipo, cap: v.cap, nome: v.T.nome,
  disegno: v.tipo === 'mente' ? { tipo: 'mente', i: v.i, ultima: v.i === STAZIONI.length - 1 }
                              : { tipo: 'pianeta', nuova: v.T.nuova || 0 } }))
const nomi = [...voci.map(v => v.nome), 'Volo infinito']

// quanto prende un nome: 7,5 px a lettera (13,5 px, peso 600), a capo oltre la sua larghezza
function scatola(n, testo) {
  const largo = Math.min(n.etichetta.largo, 150, testo.length * 7.5)
  const righe = Math.ceil((testo.length * 7.5) / Math.min(n.etichetta.largo, 150))
  const x0 = n.lato > 0 ? n.etichetta.x : n.etichetta.x - largo
  return { x0, x1: x0 + largo, y0: n.y - righe * 9, y1: n.y + righe * 9 }
}
const dentroScatola = (p, s, m = 0) => p[0] > s.x0 - m && p[0] < s.x1 + m && p[1] > s.y0 - m && p[1] < s.y1 + m

for (const W of [320, 360, 390, 430, 520]) {
  const q = disponiRotta(W, voci, CAPITOLI, ingombro)
  uguale(`${W} px: un nodo per tappa, più il volo`, q.nodi.length, SCALETTA.length + 1)
  controlla(`${W} px: le tappe stanno dentro lo schermo`,
            q.nodi.every(n => n.x - n.mezzo >= 4 && n.x + n.mezzo <= W - 4),
            q.nodi.filter(n => n.x - n.mezzo < 4 || n.x + n.mezzo > W - 4).map(n => n.k).join(','))
  controlla(`${W} px: e una sotto l'altra, in ordine`,
            q.nodi.every((n, k) => !k || n.y - q.nodi[k - 1].y > n.r + q.nodi[k - 1].r + 40))
  controlla(`${W} px: la rotta passa per ogni tappa`,
            q.nodi.every(n => { const p = q.punti[n.punto]; return Math.hypot(p[0] - n.x, p[1] - n.y) < 0.5 }))

  const sopra = []
  q.nodi.forEach((n, k) => {
    const s = scatola(n, nomi[k])
    if (s.x0 < 4 || s.x1 > W - 4) sopra.push(`${nomi[k]} esce dallo schermo`)
    if (q.punti.some(p => dentroScatola(p, s, 2))) sopra.push(`la rotta passa sopra «${nomi[k]}»`)
    const r = n.razzo
    if (Math.hypot(r.x - n.x, r.y - n.y) < n.mezzo + 10) sopra.push(`il razzo copre «${nomi[k]}»`)
    if (dentroScatola([r.x, r.y], s, 16)) sopra.push(`il razzo sta sul nome di «${nomi[k]}»`)
    if (r.x < 16 || r.x > W - 16) sopra.push(`il razzo di «${nomi[k]}» esce dallo schermo`)
    for (const m of q.nodi) if (m !== n && dentroScatola([m.x, m.y], s, m.r)) sopra.push(`«${nomi[k]}» copre ${m.k}`)
  })
  for (const t of q.titoli) {
    const s = { x0: t.lato > 0 ? t.x : t.x - t.largo, x1: t.lato > 0 ? t.x + Math.min(t.largo, t.titolo.length * 9.5) : t.x,
                y0: t.y - 6, y1: t.y + 30 }
    if (q.punti.some(p => dentroScatola(p, s, 2))) sopra.push(`la rotta passa sopra il capitolo «${t.titolo}»`)
    if (q.nodi.some(m => dentroScatola([m.x, m.y], s, m.r))) sopra.push(`il capitolo «${t.titolo}» copre una tappa`)
  }
  uguale(`${W} px: niente sopra niente`, sopra.join(' · '), '')

  const voli = q.nodi.slice(1).map((n, k) => stradaDelRazzo(q, k, k + 1))
  controlla(`${W} px: da ogni tappa il razzo vola alla dopo`, voli.every(v => v && v.length > 2))
  controlla(`${W} px: partendo dal suo posto e arrivando al posto dell'altra`, voli.every((v, k) =>
    Math.hypot(v[0][0] - q.nodi[k].razzo.x, v[0][1] - q.nodi[k].razzo.y) < 0.5 &&
    Math.hypot(v.at(-1)[0] - q.nodi[k + 1].razzo.x, v.at(-1)[1] - q.nodi[k + 1].razzo.y) < 0.5))
  const durate = voli.map(v => durataVolo(lunghezza(v)))
  dentro(`${W} px: un volo dura fra 0,9 e 2,4 s`, Math.min(...durate), 0.9, 2.4)
  dentro(`${W} px: anche il più lungo`, Math.max(...durate), 0.9, 2.4)
}

uguale('la stessa mappa a ogni apertura',
       JSON.stringify(disponiRotta(390, voci, CAPITOLI, ingombro)),
       JSON.stringify(disponiRotta(390, voci, CAPITOLI, ingombro)))
uguale('il giro più corto passa dall\'altra parte', Math.round(giro(3, -3) * 100) / 100,
       Math.round((2 * Math.PI - 6) * 100) / 100)

riassunto('asteroidi — la rotta, la disposizione')
