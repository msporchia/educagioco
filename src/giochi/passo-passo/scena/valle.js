// Le due valli di Passo passo: la valle dei piccoli e il mondo dello zaino, due
// fondali dipinti con sopra il grafo del loro foglietto (dati/isole-mappa.js e
// dati/zaino-mappa.js, generati), le tappe al posto delle caselle, i ponti
// chiusi, la strada più corta e i salti del segnalino. Puro, gira in Node: il
// disegno sta in viste/Valle.vue, le scelte in docs/passo-passo/mappa.md.
import * as VALLE from '../dati/isole-mappa.js'
import * as ZAINO from '../dati/zaino-mappa.js'
import { ANIMALE, SENTIERO, SENTIERO_CANE } from './animale.js'

// i dati di ogni mondo: NODI, ARCHI, PONTI, ISOLE, LIBERE, LARGO, ALTO, LATO, MAPPA, FIRMA
export const DATI = { valle: VALLE, zaino: ZAINO }
export const MONDI = Object.keys(DATI)

/* Dove sta sul fondale ogni isola delle strade (la chiave di motore/strade.js):
   quella del coniglio ha la chiave dell'isola dipinta, quella del cane sta nel
   `cane` dell'isola dipinta che la porta. Per mondo: isola delle strade → isola dipinta */
const DOVE = Object.fromEntries(MONDI.map(m => [m, new Map(Object.entries(DATI[m].ISOLE).flatMap(([k, d]) =>
  [...(d.caselle ? [[k, k]] : []), ...(d.cane ? [[d.cane.isola, k]] : [])]))]))
// in che mondo sta un'isola delle strade: 'valle', 'zaino' o null
export const mondoDellIsola = chiave => MONDI.find(m => DOVE[m].has(chiave)) ?? null
export const nellaValle = chiave => mondoDellIsola(chiave) === 'valle'

export const SALTO = 72             // la lunghezza di un saltello, sulla strada
export const SALTI_MAX = 16         // oltre, i salti si allungano: un viaggio lungo non dura di più
export const TEMPO_MAX = 3.6        // secondi: un viaggio da un capo all'altro della valle
const TANA_DENTRO = 0.34, TANA_FUORI = 0.36

const lunghezza = p => p.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0)

/* Il quadro di una valle per un protagonista: i nodi del foglietto con l'id
   della tappa al posto di quello della casella (`passi:3` → la quarta tappa
   dell'isola passi, `ripeti-cane:0` → la prima del cane col ripeti, in
   motore/strade.js), il piede dove si siede il segnalino, e gli archi con la
   loro lunghezza. Sulla stessa isola dipinta possono stare le caselle dei due:
   quelle dell'altro sono strada. Un'isola dove chi gioca non ha caselle è
   terra da attraversare, sempre aperta (il pascolo per il coniglio, il salto
   per il cane); la tana per l'altro mondo c'è solo se di là ha delle tappe.
   L'animale è sempre il protagonista, e il sentiero senza fine è il suo. Vedi
   docs/passo-passo/mappa.md, «Due protagonisti». */
const SENTIERO_DI = { coniglio: 'senza-fine', cane: SENTIERO_CANE }
export function quadroValle(S, { mondo = 'valle', dati = DATI[mondo], protagonista = 'coniglio' } = {}) {
  const sue = new Map(S.isole.filter(s => s.animale === protagonista).map(s => [s.chiave, s]))
  // isola dipinta → la sua isola delle strade, per chi gioca
  const strada = new Map()
  for (const [k, d] of Object.entries(dati.ISOLE)) {
    if (d.caselle && sue.has(k)) strada.set(k, k)
    else if (d.cane && sue.has(d.cane.isola)) strada.set(k, d.cane.isola)
  }
  const altroMondo = MONDI.find(m => m !== mondo)
  const diLa = [...sue.keys()].some(k => DOVE[altroMondo] && DOVE[altroMondo].has(k))
  const via = new Set(dati.NODI.filter(n => n.tipo === 'passaggio' && !diLa).map(n => n.id))
  let archi = dati.ARCHI.filter(e => !via.has(e.a) && !via.has(e.b))
  const nuovo = new Map()
  const nodi = dati.NODI.filter(n => !via.has(n.id)).map(n => {
    let id = n.id, tipo = n.tipo
    // il sentiero senza fine dell'altro è un punto della strada
    if (tipo === 'sentiero') {
      if (n.id === SENTIERO_DI[protagonista]) id = SENTIERO_DI[protagonista]
      else tipo = 'incrocio'
    }
    if (tipo === 'casella') {
      const isola = sue.get(n.di || n.isola)
      const t = isola && strada.get(n.isola) === isola.chiave ? isola.tappe[n.k] : undefined
      // una casella dell'altro, o una in più delle tappe, resta un punto della strada
      if (t === undefined) tipo = 'incrocio'
      else id = t
    }
    const lato = tipo === 'casella' ? dati.LATO : tipo === 'sentiero' ? Math.round(dati.LATO * SENTIERO) : 0
    nuovo.set(n.id, id)
    return {
      ...n, id, tipo, chiave: n.id, animale: protagonista, lato,
      // seduto su una casella poggia sul bordo di sopra; altrove sta in piedi sulla strada
      piede: lato ? { x: n.x, y: n.y - lato / 2 + ANIMALE.piede } : { x: n.x, y: n.y },
    }
  })
  archi = archi.map(e => ({ ...e, a: nuovo.get(e.a), b: nuovo.get(e.b), lungo: lunghezza(e.punti) }))
  // i cartelli: uno per isola dipinta dove chi gioca ha caselle, col nome della sua isola delle strade
  const isole = Object.fromEntries([...strada].map(([k, chiave]) => {
    const d = dati.ISOLE[k], suo = protagonista === 'cane' ? d.cane || {} : d
    return [chiave, { cartello: suo.cartello || d.cartello, stemma: !!suo.stemma, isola: k }]
  }))
  const libere = [...(dati.LIBERE || []), ...Object.keys(dati.ISOLE).filter(k => !strada.has(k))]
  return { W: dati.LARGO, H: dati.ALTO, lato: dati.LATO, nodi, archi, ponti: dati.PONTI, isole, strada, libere, protagonista }
}

/* Cosa è chiuso: un'isola è aperta se ha almeno una casella aperta. Un arco
   si passa solo se le isole dei suoi due capi sono aperte (una sosta a metà
   di un ponte non è di un'isola: sul ponte si va fino al blocco); un ponte
   fra un'isola aperta e una chiusa ha il blocco dalla parte della chiusa
   (fra due chiuse non serve: non ci si arriva). */
export function chiusure(q, aperta) {
  const per = new Map(q.nodi.map(n => [n.id, n]))
  // le rive da cui si arriva (`libere`) sono aperte sempre
  const aperte = new Set([...q.nodi.filter(n => n.tipo === 'casella' && aperta(n.id)).map(n => n.isola), ...q.libere])
  const libero = id => { const k = per.get(id).isola; return k === null || k === undefined || aperte.has(k) }
  const bloccati = new Set()
  q.archi.forEach((e, i) => {
    if (!libero(e.a) || !libero(e.b)) bloccati.add(i)
  })
  const blocchi = []
  for (const [nome, p] of Object.entries(q.ponti)) {
    const [A, B] = p.isole
    if (aperte.has(A) === aperte.has(B)) continue
    const chiusa = aperte.has(A) ? B : A
    const [x, y, gradi] = p.blocchi[chiusa]
    blocchi.push({ ponte: nome, isola: chiusa, x, y, gradi })
  }
  return { aperte, bloccati, blocchi }
}

// un punto a distanza s lungo una spezzata
function lungo(p, s) {
  let fatto = 0
  for (let i = 1; i < p.length; i++) {
    const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])
    if (fatto + d >= s) {
      const t = d ? (s - fatto) / d : 0
      return { x: p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, y: p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t }
    }
    fatto += d
  }
  const u = p[p.length - 1]
  return { x: u[0], y: u[1] }
}

/* La strada più corta da `da` ad `a` sugli archi che si passano. `da` è
   l'id di un nodo, o un punto a metà di un arco ({ arco, s }: s dal capo
   `a` dell'arco), dove il segnalino è atterrato. Torna i tratti: { arco, da,
   a } in s lungo l'arco, nell'ordine; null se non ci si arriva. */
export function percorso(q, da, a, bloccati = new Set()) {
  const per = new Map(q.nodi.map(n => [n.id, n]))
  if (!per.has(a)) return null
  const vicini = new Map(q.nodi.map(n => [n.id, []]))
  q.archi.forEach((e, i) => {
    if (bloccati.has(i)) return
    const costo = e.tipo === 'tunnel' ? 40 : e.lungo
    vicini.get(e.a).push({ v: e.b, costo, tratto: { arco: i, da: 0, a: e.lungo } })
    vicini.get(e.b).push({ v: e.a, costo, tratto: { arco: i, da: e.lungo, a: 0 } })
  })
  const VIA = '\u0000qui'
  if (typeof da === 'object' && da !== null) {
    const e = q.archi[da.arco]
    vicini.set(VIA, [{ v: e.a, costo: da.s, tratto: { arco: da.arco, da: da.s, a: 0 } },
                     { v: e.b, costo: e.lungo - da.s, tratto: { arco: da.arco, da: da.s, a: e.lungo } }])
    da = VIA
  } else if (!per.has(da)) return null
  if (da === a) return []
  const dist = new Map([[da, 0]]), prima = new Map(), fatti = new Set()
  for (;;) {
    let u = null
    for (const [k, d] of dist) if (!fatti.has(k) && (u === null || d < dist.get(u))) u = k
    if (u === null) return null
    if (u === a) break
    fatti.add(u)
    for (const { v, costo, tratto } of vicini.get(u) || []) {
      const d = dist.get(u) + costo
      if (!dist.has(v) || d < dist.get(v)) { dist.set(v, d); prima.set(v, { u, tratto }) }
    }
  }
  const tratti = []
  for (let k = a; k !== da; k = prima.get(k).u) tratti.unshift({ ...prima.get(k).tratto, verso: k })
  return tratti
}

/* I nodi dove si arriva da `da`, con la distanza: per scegliere dove andare
   quando si tocca un punto della mappa che non è una casella. */
export function raggiungibili(q, da, bloccati = new Set()) {
  const vicini = new Map(q.nodi.map(n => [n.id, []]))
  q.archi.forEach((e, i) => {
    if (bloccati.has(i)) return
    vicini.get(e.a).push([e.b, e.lungo]); vicini.get(e.b).push([e.a, e.lungo])
  })
  const dist = new Map(), fatti = new Set()
  if (typeof da === 'object' && da !== null) {
    const e = q.archi[da.arco]
    dist.set(e.a, da.s); dist.set(e.b, e.lungo - da.s)
  } else dist.set(da, 0)
  for (;;) {
    let u = null
    for (const [k, d] of dist) if (!fatti.has(k) && (u === null || d < dist.get(u))) u = k
    if (u === null) break
    fatti.add(u)
    for (const [v, c] of vicini.get(u) || []) if (!dist.has(v) || dist.get(u) + c < dist.get(v)) dist.set(v, dist.get(u) + c)
  }
  return dist
}

// il nodo raggiungibile più vicino, in linea d'aria, al punto (x, y) toccato
export function vicinoA(q, x, y, da, bloccati) {
  const dove = raggiungibili(q, da, bloccati)
  let meglio = null, dm = Infinity
  for (const n of q.nodi) {
    if (!dove.has(n.id) || n.tipo === 'passaggio') continue
    const d = Math.hypot(n.x - x, n.y - y)
    if (d < dm) { dm = d; meglio = n.id }
  }
  return meglio
}

/* I passi del viaggio: { che: 'salto', da,
   a, dur, alto, verso, animale, al, qui } fra due punti, { che: 'entra' |
   'esce', dove, dur, animale, al, qui, sbuffo? } in una tana. L'animale è
   sempre il protagonista. Il segnalino salta lungo la strada a saltelli di
   SALTO px (più lunghi se la strada è lunga); `al` è il nodo dove arriva
   (null a metà di un arco), `qui` dove si trova dopo il passo, per
   ripartire da lì. Da una tana senza il buco dipinto (`nuvola` del nodo)
   l'animale entra ed esce in una nuvoletta. Senza strada (il segnalino su
   un'isola chiusa) un balzo solo. */
export function viaggio(q, da, a, bloccati = new Set()) {
  const per = new Map(q.nodi.map(n => [n.id, n]))
  const meta = per.get(a)
  if (!meta) return []
  const punto = d => (typeof d === 'object' && d !== null ? lungo(q.archi[d.arco].punti, d.s) : per.get(d).piede)
  const animale = q.protagonista
  const tratti = percorso(q, da, a, bloccati)
  if (tratti && !tratti.length) return []
  const passi = []
  let ora = punto(da)
  const salto = (verso, al, qui, durata = null) => {
    const lungoSalto = Math.hypot(verso.x - ora.x, verso.y - ora.y)
    passi.push({
      che: 'salto', da: ora, a: verso, animale, al, qui,
      dur: durata ?? Math.min(0.42, 0.26 + lungoSalto / 1400),
      alto: Math.min(durata ? 150 : 50, 20 + lungoSalto * (durata ? 0.18 : 0.14)),
      // girato verso dove va; un salto dritto in giù tiene il verso di prima
      verso: Math.abs(verso.x - ora.x) < 2 ? 0 : Math.sign(verso.x - ora.x),
    })
    ora = verso
  }
  if (!tratti) {
    salto(meta.piede, a, a, 0.9)
    return passi
  }
  const strada = tratti.reduce((s, t) => s + (q.archi[t.arco].tipo === 'tunnel' ? 0 : Math.abs(t.a - t.da)), 0)
  const passo = Math.max(SALTO, strada / SALTI_MAX)
  /* I tratti si mettono in fila in pezzi da saltare: un pezzo finisce su una
     casella, una tana e alla meta; dentro un pezzo i saltelli sono tutti
     uguali, e passano sopra gli incroci senza fermarsi. */
  const ferma = n => n.tipo === 'casella' || n.tipo === 'sentiero' || n.tipo === 'tana' || n.tipo === 'passaggio'
  let pezzo = []
  const salta = () => {
    if (!pezzo.length) return
    const tot = pezzo.reduce((s, t) => s + Math.abs(t.a - t.da), 0)
    const quanti = Math.max(1, Math.round(tot / passo))
    for (let j = 1; j <= quanti; j++) {
      if (j === quanti) { const fine = pezzo.at(-1).verso; salto(per.get(fine).piede, fine, fine); break }
      // dove cade il saltello j: in quale tratto del pezzo, e a che punto
      let d = tot * j / quanti
      let t = pezzo[0]
      for (t of pezzo) { const l = Math.abs(t.a - t.da); if (d <= l) break; d -= l }
      const s = t.da + Math.sign(t.a - t.da) * d
      salto(lungo(q.archi[t.arco].punti, s), null, { arco: t.arco, s })
    }
    pezzo = []
  }
  tratti.forEach((t, k) => {
    const e = q.archi[t.arco]
    const verso = per.get(t.verso)
    if (e.tipo === 'tunnel') {
      salta()
      const daId = t.da === 0 ? e.a : e.b
      // senza il buco dipinto da quella parte, l'animale sparisce e ricompare in una nuvoletta
      const nuvola = id => (per.get(id).nuvola ? { sbuffo: true } : {})
      passi.push({ che: 'entra', dove: ora, dur: TANA_DENTRO, animale, al: null, qui: daId, ...nuvola(daId) })
      ora = verso.piede
      passi.push({ che: 'esce', dove: ora, dur: TANA_FUORI, animale, al: t.verso, qui: t.verso, ...nuvola(t.verso) })
      return
    }
    pezzo.push(t)
    if (ferma(verso) || k === tratti.length - 1) salta()
  })
  // un viaggio lungo non dura di più: i salti si fanno più svelti
  const tempo = passi.reduce((s, p) => s + (p.che === 'salto' ? p.dur : 0), 0)
  if (tempo > TEMPO_MAX) for (const p of passi) if (p.che === 'salto') p.dur = Math.max(0.12, p.dur * TEMPO_MAX / tempo)
  return passi
}

// la tana dove l'animale entra per passare all'altro mondo, e da dove esce arrivando
export const entraNellaTana = (n, animale = 'coniglio') =>
  ({ che: 'entra', dove: n.piede, dur: TANA_DENTRO, animale, al: n.id, qui: n.id })
export const esceDallaTana = (n, animale = 'coniglio') =>
  ({ che: 'esce', dove: n.piede, dur: TANA_FUORI, animale, al: n.id, qui: n.id })
