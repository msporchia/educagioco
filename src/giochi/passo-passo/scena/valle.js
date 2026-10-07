// Le due valli di Passo passo: la valle dei piccoli e il mondo dello zaino, due
// fondali dipinti con sopra il grafo del loro foglietto (dati/isole-mappa.js e
// dati/zaino-mappa.js, generati), le tappe al posto delle caselle, i ponti
// chiusi, la strada più corta e i salti del segnalino. Puro, gira in Node: il
// disegno sta in viste/Valle.vue, le scelte in docs/passo-passo/mappa.md.
import * as VALLE from '../dati/isole-mappa.js'
import * as ZAINO from '../dati/zaino-mappa.js'
import { ANIMALE, SENTIERO } from './animale.js'

// i dati di ogni mondo: NODI, ARCHI, PONTI, ISOLE, LIBERE, LARGO, ALTO, LATO, MAPPA, FIRMA
export const DATI = { valle: VALLE, zaino: ZAINO }
export const MONDI = Object.keys(DATI)

// in che mondo sta un'isola (la chiave di motore/strade.js): 'valle', 'zaino' o null
export const mondoDellIsola = chiave =>
  MONDI.find(m => Object.prototype.hasOwnProperty.call(DATI[m].ISOLE, chiave)) ?? null
export const nellaValle = chiave => mondoDellIsola(chiave) === 'valle'

export const SALTO = 72             // la lunghezza di un saltello, sulla strada
export const SALTI_MAX = 16         // oltre, i salti si allungano: un viaggio lungo non dura di più
export const TEMPO_MAX = 3.6        // secondi: un viaggio da un capo all'altro della valle
const TANA_DENTRO = 0.34, TANA_FUORI = 0.36, CAMBIO = 0.24

const lunghezza = p => p.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0)

/* Il quadro di una valle: i nodi del foglietto con l'id della tappa al posto
   di quello della casella (`passi:3` → la quarta tappa delle isole di passi,
   in motore/strade.js), l'animale della loro isola, il piede dove si siede
   il segnalino; e gli archi con la loro lunghezza. */
export function quadroValle(S, { mondo = 'valle', dati = DATI[mondo] } = {}) {
  const isolaDi = new Map(S.isole.map(s => [s.chiave, s]))
  const nuovo = new Map()
  const nodi = dati.NODI.map(n => {
    const isola = isolaDi.get(n.isola)
    let id = n.id, tipo = n.tipo
    if (tipo === 'casella') {
      const t = isola ? isola.tappe[n.k] : undefined
      // una casella in più delle tappe resta un punto della strada: unita/passo-passo-valle lo dice
      if (t === undefined) tipo = 'incrocio'
      else id = t
    }
    const lato = tipo === 'casella' ? dati.LATO : tipo === 'sentiero' ? Math.round(dati.LATO * SENTIERO) : 0
    nuovo.set(n.id, id)
    return {
      ...n, id, tipo, chiave: n.id, animale: isola ? isola.animale : 'coniglio', lato,
      // seduto su una casella poggia sul bordo di sopra; altrove sta in piedi sulla strada
      piede: lato ? { x: n.x, y: n.y - lato / 2 + ANIMALE.piede } : { x: n.x, y: n.y },
    }
  })
  const archi = dati.ARCHI.map(e => ({ ...e, a: nuovo.get(e.a), b: nuovo.get(e.b), lungo: lunghezza(e.punti) }))
  return { W: dati.LARGO, H: dati.ALTO, lato: dati.LATO, nodi, archi, ponti: dati.PONTI, isole: dati.ISOLE,
           libere: dati.LIBERE || [] }
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
   'esce', dove, dur, animale, al, qui, sbuffo? } dove l'animale cambia.
   Il segnalino salta lungo la strada a saltelli di SALTO px (più lunghi se
   la strada è lunga); `al` è il nodo dove arriva (null a metà di un arco),
   `qui` dove si trova dopo il passo, per ripartire da lì. Nella tana il
   coniglio entra e dall'altra parte esce il cane; su un ponte fra le isole
   del coniglio e il pascolo cambia in una nuvoletta, sul capo del pascolo:
   il ponte è del coniglio. Nella tana di un'isoletta del cane dello zaino,
   dalla parte del coniglio, dove sul fondale non c'è il buco (`nuvola` del
   nodo), il coniglio entra e esce in una nuvoletta. Senza strada (il segnalino su un'isola chiusa)
   un balzo solo. */
export function viaggio(q, da, a, bloccati = new Set()) {
  const per = new Map(q.nodi.map(n => [n.id, n]))
  const meta = per.get(a)
  if (!meta) return []
  const punto = d => (typeof d === 'object' && d !== null ? lungo(q.archi[d.arco].punti, d.s) : per.get(d).piede)
  const animaleDi = d => (typeof d === 'object' && d !== null
    ? (per.get(q.archi[d.arco].a).animale === per.get(q.archi[d.arco].b).animale ? per.get(q.archi[d.arco].a).animale : 'coniglio')
    : per.get(d).animale)
  const tratti = percorso(q, da, a, bloccati)
  if (tratti && !tratti.length) return []
  const passi = []
  let ora = punto(da)
  const salto = (verso, animale, al, qui, durata = null) => {
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
    salto(meta.piede, meta.animale, a, a, 0.9)
    return passi
  }
  const strada = tratti.reduce((s, t) => s + (q.archi[t.arco].tipo === 'tunnel' ? 0 : Math.abs(t.a - t.da)), 0)
  const passo = Math.max(SALTO, strada / SALTI_MAX)
  const cambia = (dove, prima, dopo, al) => {
    passi.push({ che: 'entra', dove, dur: CAMBIO, animale: prima, al: null, qui: al, sbuffo: true })
    passi.push({ che: 'esce', dove, dur: CAMBIO, animale: dopo, al, qui: al, sbuffo: true })
  }
  /* I tratti si mettono in fila in pezzi da saltare: un pezzo finisce su una
     casella, una tana, alla meta e dove l'animale cambia; dentro un pezzo i
     saltelli sono tutti uguali, e passano sopra gli incroci senza fermarsi. */
  const chiDi = t => {
    const e = q.archi[t.arco], A = per.get(e.a).animale, B = per.get(e.b).animale
    return A === B ? A : 'coniglio'           // un ponte fra due animali è del coniglio
  }
  const ferma = n => n.tipo === 'casella' || n.tipo === 'sentiero' || n.tipo === 'tana' || n.tipo === 'passaggio'
  let pezzo = [], animalePezzo = null
  const salta = () => {
    if (!pezzo.length) return
    const tot = pezzo.reduce((s, t) => s + Math.abs(t.a - t.da), 0)
    const quanti = Math.max(1, Math.round(tot / passo))
    for (let j = 1; j <= quanti; j++) {
      if (j === quanti) { const fine = pezzo.at(-1).verso; salto(per.get(fine).piede, animalePezzo, fine, fine); break }
      // dove cade il saltello j: in quale tratto del pezzo, e a che punto
      let d = tot * j / quanti
      let t = pezzo[0]
      for (t of pezzo) { const l = Math.abs(t.a - t.da); if (d <= l) break; d -= l }
      const s = t.da + Math.sign(t.a - t.da) * d
      salto(lungo(q.archi[t.arco].punti, s), animalePezzo, null, { arco: t.arco, s })
    }
    pezzo = []
  }
  let animaleOra = animaleDi(da)
  tratti.forEach((t, k) => {
    const e = q.archi[t.arco]
    const verso = per.get(t.verso)
    if (e.tipo === 'tunnel') {
      salta()
      const daId = t.da === 0 ? e.a : e.b
      // senza il buco dipinto da quella parte, l'animale sparisce e ricompare in una nuvoletta
      const nuvola = id => (per.get(id).nuvola ? { sbuffo: true } : {})
      passi.push({ che: 'entra', dove: ora, dur: TANA_DENTRO, animale: animaleOra, al: null, qui: daId, ...nuvola(daId) })
      ora = verso.piede
      animaleOra = verso.animale
      passi.push({ che: 'esce', dove: ora, dur: TANA_FUORI, animale: animaleOra, al: t.verso, qui: t.verso, ...nuvola(t.verso) })
      return
    }
    const chi = chiDi(t)
    // si cambia animale sul capo del ponte che sta sul pascolo: prima di salire, o appena scesi
    if (chi !== animaleOra) {
      salta()
      const qui = k ? tratti[k - 1].verso : (typeof da === 'object' ? null : da)
      cambia(ora, animaleOra, chi, qui)
      animaleOra = chi
    }
    animalePezzo = chi
    pezzo.push(t)
    const prossimo = tratti[k + 1]
    const cambiaDopo = verso.animale !== chi || (prossimo && q.archi[prossimo.arco].tipo !== 'tunnel' && chiDi(prossimo) !== chi)
    if (ferma(verso) || !prossimo || cambiaDopo) salta()
    if (verso.animale !== chi && (!prossimo || q.archi[prossimo.arco].tipo !== 'tunnel')) {
      cambia(ora, chi, verso.animale, t.verso)
      animaleOra = verso.animale
    }
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
