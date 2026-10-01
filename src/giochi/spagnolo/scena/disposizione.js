// Dove cade ogni cosa sulla mappa del tesoro: puro, senza canvas, gira in
// Node (test/unita/inglese-vista, test/misure/inglese-isole). Riceve lo stato
// della mappa (motore/mappa.js, statoMappa) e la larghezza, e torna nodi,
// sentieri, le coste delle isole, il mare basso, i porti della nave e il mare
// dove naviga, in pixel CSS. Si calcola una volta per disposizione: la tela
// la dipinge, la vista ci mette sopra i tasti e la nave.
// Le scelte sono in docs/lingue/mondi-vista.md («La mappa del tesoro», «Le isole»).
import { dado } from '../../../grafica/comune.js'
import { tondo, tratto, unione, scatola, griglia, leggi, contorni, area, liscia, rumori } from './costa.js'
import { creaMare, attracco, rotta, sfoltisci } from './rotte.js'

export const R_TAPPA = 30
export const R_PICCOLO = 22        // il libro e il cassetto
export const PASSO = 104           // da una tappa all'altra, in verticale
const TITOLO = 40                  // il nome del mondo, sopra la sua prima tappa
const SOTTO = 44                   // il nome sotto un nodo, e un po' d'aria
const LATO = 10
const ANELLO = 8                   // le dieci tacche del grado attorno al medaglione
// la costa: almeno MARGINE di terra attorno a quello che l'isola porta, e il
// rumore la sposta di DENTRO verso l'interno o di FUORI verso il mare
export const MARGINE = 8
const DENTRO = 10
const FRASTAGLIO = 4             // la costa fine, frastagliata: sta dentro DENTRO
const FUORI = { pronto: 22, arrivo: 16 }
export const CANALE = 40           // il mare minimo fra due isole
const CORSIA = 44                  // il mare ai lati di un'isola lunga: la nave ci passa
const CORSIA_SU = 40               // e fra un'isola e quella sotto
const FINE = 4                     // il lato della griglia delle coste
export const MARE_BASSO = [7, 14, 22]
// l'onda del sentiero dentro un mondo: si legge come una strada, non come una colonna
const ONDA = [0, 0.85, 0.15, -0.8, -0.1, 0.75, 0.05, -0.85]

// il seme di un mondo: dal suo id, così la sua isola è la stessa su ogni schermo
export function semeDi(id) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  return (h >>> 0) % 100000
}

// quanto è largo un testo in Georgia, a occhio: serve solo a tenerlo sulla terra
const largo = (t, px, k = 0.56) => String(t || '').length * px * k

// la profondità di un mondo nel grafo: 0 per chi non dipende da nessuno
function profondita(mondi) {
  const per = new Map(mondi.map(m => [m.id, m]))
  const memo = new Map()
  const p = id => {
    if (memo.has(id)) return memo.get(id)
    const m = per.get(id)
    const dip = m ? [...m.dopo, ...(m.dopoUno || [])].filter(d => per.has(d)) : []
    const v = dip.length ? 1 + Math.max(...dip.map(p)) : 0
    memo.set(id, v)
    return v
  }
  mondi.forEach(m => p(m.id))
  return memo
}

// un arco leggermente curvo fra due punti: il verso della curva lo decide il
// caso fisso (dado), così la mappa è la stessa a ogni ridisegno
function sentiero(da, a, seme, battuto, tipo) {
  const mx = (da.x + a.x) / 2, my = (da.y + a.y) / 2
  const dx = a.x - da.x, dy = a.y - da.y
  const lung = Math.hypot(dx, dy) || 1
  const piega = (dado(seme, 7, 3) - 0.5) * 0.45 * lung
  return { da: { x: da.x, y: da.y }, a: { x: a.x, y: a.y },
           ctrl: { x: mx - (dy / lung) * piega, y: my + (dx / lung) * piega }, battuto, tipo }
}
// il sentiero come capsule: la strada tratteggiata deve stare sulla terra
function lungoIlSentiero(s, r) {
  const out = []
  let [px, py] = [s.da.x, s.da.y]
  for (let k = 1; k <= 4; k++) {
    const t = k / 4, u = 1 - t
    const x = u * u * s.da.x + 2 * u * t * s.ctrl.x + t * t * s.a.x
    const y = u * u * s.da.y + 2 * u * t * s.ctrl.y + t * t * s.a.y
    out.push(tratto(px, py, x, y, r)); px = x; py = y
  }
  return out
}
// un nome sta in uno stadio (un rettangolo coi lati tondi): la costa attorno non fa spigoli
const stadio = (x, y, w2, h2) => w2 > h2 ? tratto(x - w2 + h2, y, x + w2 - h2, y, h2 + 2) : tondo(x, y, h2 + 2)
// il nome sotto un nodo, come lo mette la vista (Mappa.vue, .ing-nodo-nome)
function sottoIlNodo(n, testo) {
  const riga = Math.min(120, n.larg), w = largo(testo, 12.5)
  const righe = Math.max(1, Math.ceil(w / riga))
  const h = 15 * righe
  return stadio(n.x, n.y + n.r + 9 + h / 2, Math.min(w, riga) / 2 + 2, h / 2 + 1)
}
function ilTitolo(t, px) {
  const riga = Math.max(90, t.larg - 8), w = largo(t.nome, px, 0.52)
  const righe = Math.max(1, Math.ceil(w / riga))
  return stadio(t.x, t.y, Math.min(w, riga) / 2 + 3, (px * 1.15 * righe) / 2 + 1)
}

/* Un mondo con le tappe, da solo nella sua riga: il sentiero serpeggia al
   centro, e la costa del porto (`lato`) è quella da cui la nave attracca. */
function mondoPronto(m, W, y0, extra) {
  const seme = semeDi(m.id)
  const lato = dado(seme, 5) < 0.5 ? -1 : 1
  const larg = W - 2 * LATO
  const cx = W / 2
  const nodi = [], sentieri = [], deve = [], corpo = [], strade = []
  const nomi = m.tappe.map(t => Math.max(R_TAPPA + ANELLO, Math.min(60, largo(t.nome, 12.5) / 2 + 2)))
  const mezzo = Math.max(...nomi)
  const A = Math.max(18, Math.min(70, (W / 2 - CORSIA - mezzo - MARGINE - DENTRO - FUORI.pronto) / 0.85))
  const primoY = y0 + TITOLO + R_TAPPA
  let prima = null, giaAdesso = false
  m.tappe.forEach((t, i) => {
    const n = {
      chiave: 'tappa:' + t.id, tipo: 'tappa', id: t.id, mondo: m.id,
      x: cx + A * ONDA[i % ONDA.length], y: primoY + i * PASSO, r: R_TAPPA,
      disegno: t.disegno, nome: t.nome, bandiera: t.bandiera, grado: t.grado, larg,
      stato: t.vinta ? 'vinta' : t.aperta ? 'aperta' : 'chiusa',
      adesso: false,
    }
    if (!giaAdesso && t.aperta && !t.vinta) { n.adesso = true; giaAdesso = true }
    nodi.push(n)
    deve.push(tondo(n.x, n.y, R_TAPPA + ANELLO), sottoIlNodo(n, t.nome))
    if (prima) {
      const s = sentiero(prima, n, seme * 31 + i, t.vinta, 'dentro')
      sentieri.push(s); strade.push(...lungoIlSentiero(s, 3))
      corpo.push(tratto(prima.x, prima.y, n.x, n.y, 20))
    }
    prima = n
  })
  const uscita = prima
  const ex = extra(m.id) || {}
  const coda = [['libro', ex.libro], ['cassetto', ex.cassetto]].filter(([, v]) => v)
  coda.forEach(([tipo, v], k) => {
    const verso = coda.length === 1 ? (uscita.x > cx ? -1 : 1) : (k ? 1 : -1)
    const n = { chiave: tipo + ':' + m.id, tipo, id: m.id, mondo: m.id,
                x: cx + verso * Math.min(58, larg / 2 - R_PICCOLO - 12), y: uscita.y + PASSO * 0.9,
                r: R_PICCOLO, disegno: tipo, stato: v.aperto ? 'aperta' : 'chiusa', larg: larg / 2 }
    nodi.push(n)
    deve.push(tondo(n.x, n.y, R_PICCOLO + 4), sottoIlNodo(n, tipo === 'libro' ? 'Il libro' : 'Il cassetto'))
    const s = sentiero(uscita, n, seme * 17 + k, v.aperto, 'spiazzo')
    sentieri.push(s); strade.push(...lungoIlSentiero(s, 3))
    corpo.push(tratto(uscita.x, uscita.y, n.x, n.y, 20))
  })
  const titolo = { mondo: m.id, nome: m.nome, x: cx, y: y0 + TITOLO / 2 - 2, larg, pronto: true, aperto: m.aperto }
  deve.push(ilTitolo(titolo, 17))
  // la schiena: la terra piena dietro il sentiero, dal lato opposto al porto
  const ultimoY = Math.max(...nodi.map(n => n.y))
  const sx = cx - lato * A * 0.3
  corpo.push(tratto(sx, primoY - 12, sx, ultimoY, 30))
  // e qualche promontorio, sempre sulla schiena: la costa del porto resta libera
  for (let k = 0; k < 3; k++) {
    const n = nodi[Math.floor(dado(seme, 20 + k) * nodi.length)]
    const a = (lato > 0 ? Math.PI : 0) + (dado(seme, 30 + k) - 0.5) * 1.6
    const l = 26 + dado(seme, 40 + k) * 26
    const bx = n.x + Math.cos(a) * (R_TAPPA + l), by = n.y + Math.sin(a) * (R_TAPPA + l)
    corpo.push(tratto(n.x, n.y, bx, by, 9 + dado(seme, 50 + k) * 8))
  }
  return {
    nodi, sentieri, titoli: [titolo], entrata: nodi[0], uscita,
    isola: { mondo: m.id, stato: m.aperto ? 'aperto' : 'chiuso', seme, lato, deve, corpo, strade,
             fuori: FUORI.pronto, centro: { x: cx, y: (primoY + ultimoY) / 2 }, isolotti: 2 },
  }
}

/* Un mondo in arrivo: un'isola piccola, qualche mondo per riga. */
function mondoInArrivo(m, cx, y0, larg, alta) {
  const seme = semeDi(m.id)
  const y = y0 + alta / 2
  const n = { chiave: 'mondo:' + m.id, tipo: 'mondo', id: m.id, mondo: m.id, x: cx, y, r: R_TAPPA,
              disegno: m.disegno, stato: 'arrivo', nome: m.nome, larg }
  const titolo = { mondo: m.id, nome: m.nome, x: cx, y: y - R_TAPPA - TITOLO / 2 - 4, larg,
                   pronto: false, aperto: false }
  const deve = [tondo(cx, y, R_TAPPA + 3), sottoIlNodo(n, 'in arrivo'), ilTitolo(titolo, 13.5)]
  // tre colline di terra attorno al medaglione, spostate a caso: l'isola non è un tondo
  const corpo = [0, 1, 2].map(k => {
    const a = (k / 3 + dado(seme, 11 + k) * 0.25 + 0.04) * Math.PI * 2
    return tondo(cx + Math.cos(a) * (30 + dado(seme, 14 + k) * 18), y + Math.sin(a) * (22 + dado(seme, 17 + k) * 14),
                 16 + dado(seme, 20 + k) * 12)
  })
  return {
    nodi: [n], sentieri: [], titoli: [titolo], entrata: n, uscita: n,
    isola: { mondo: m.id, stato: 'arrivo', seme, lato: 1, deve, corpo, strade: [], fuori: FUORI.arrivo,
             centro: { x: cx, y }, isolotti: dado(seme, 3) < 0.6 ? 1 : 0 },
  }
}

// le righe della mappa: i mondi con le tappe da soli, gli altri a gruppi
function righeDi(stato, W) {
  const prof = profondita(stato)
  const file = []
  for (const m of stato) (file[prof.get(m.id)] ||= []).push(m)
  const quanti = Math.max(1, Math.floor((W - 2 * LATO + CANALE) / (2 * (R_TAPPA + 36) + CANALE + 24)))
  const righe = []
  for (const fila of file.filter(Boolean)) {
    const pronti = fila.filter(m => m.pronto).sort((a, b) => b.tappe.length - a.tappe.length)
    const lontani = fila.filter(m => !m.pronto)
    for (const m of pronti) righe.push({ pronto: true, mondi: [m] })
    for (let i = 0; i < lontani.length; i += quanti) righe.push({ pronto: false, mondi: lontani.slice(i, i + quanti) })
  }
  return { prof, righe }
}

function mettiRiga(riga, W, y0, extra, k) {
  if (riga.pronto) return [mondoPronto(riga.mondi[0], W, y0, extra)]
  const larg = (W - 2 * LATO) / riga.mondi.length
  const alta = TITOLO + 2 * R_TAPPA + SOTTO
  // le isole piccole non stanno in fila come piastrelle: un po' a destra e a sinistra
  const gioco = Math.max(0, Math.min(48, larg / 2 - 96))
  return riga.mondi.map((m, i) => {
    const q = riga.mondi.length === 1 ? (k % 2 ? 1 : -1) * (0.6 + 0.4 * dado(semeDi(m.id), 9))
      : (dado(semeDi(m.id), 9) - 0.5) * 0.8 + (i ? 0.35 : -0.35)
    return mondoInArrivo(m, LATO + larg * (i + 0.5) + q * gioco, y0 + (dado(semeDi(m.id), 10) - 0.5) * 22, larg, alta)
  })
}
const estensione = pezzi => {
  const s = scatola(pezzi.flatMap(p => p.isola.deve))
  return { su: s.y0, giu: s.y1, fuori: Math.max(...pezzi.map(p => p.isola.fuori)) }
}

/* `stato`: l'uscita di statoMappa. `extra(mondo)` → { libro: null | { aperto },
   cassetto: null | { aperto } }, deciso dal gioco. */
export function disponi(stato, W, extra = () => ({})) {
  const { prof, righe } = righeDi(stato, W)
  const pezzi = []
  let sotto = null   // dove finisce la terra della riga sopra
  for (const [k, riga] of righe.entries()) {
    const prova = estensione(mettiRiga(riga, W, 0, extra, k))
    const bordo = MARGINE + DENTRO + prova.fuori
    const y0 = sotto === null ? bordo + 26 - prova.su : sotto + CORSIA_SU + bordo - prova.su
    const messi = mettiRiga(riga, W, y0, extra, k)
    pezzi.push(...messi)
    sotto = estensione(messi).giu + bordo
  }
  const H = Math.ceil(sotto + 96)

  const nodi = pezzi.flatMap(p => p.nodi)
  const titoli = pezzi.flatMap(p => p.titoli)
  const sentieri = pezzi.flatMap(p => p.sentieri)
  const geo = geografia(pezzi, stato, prof, W, H)
  for (const n of nodi) n.porto = geo.porti.get(n.chiave) || null
  const aperto = new Map(stato.map(m => [m.id, m.aperto]))
  sentieri.push(...sfoltisci(geo.rotte.map(r => ({ ...r, battuto: !!aperto.get(r.a) }))))
  const statoIsola = new Map(pezzi.map(p => [p.isola.mondo, p.isola.stato]))
  const paesaggio = new Map(stato.map(m => [m.id, m.paesaggio || null]))
  const isole = geo.isole.map(is => ({ ...is, stato: statoIsola.get(is.mondo), paesaggio: paesaggio.get(is.mondo) }))
  return { W, H, nodi, sentieri, titoli, isole, mareBasso: geo.mareBasso, mare: geo.mare,
           rosa: geo.rosa, decori: geo.decori }
}

// dove sta la nave quando la mappa si apre: dov'era l'ultima volta, se lì
// si può ancora andare; se no accanto alla tappa da fare adesso
export function doveStaLaNave(q, chiave) {
  const buono = n => n && n.porto && (n.stato === 'aperta' || n.stato === 'vinta')
  const n = q.nodi.find(x => x.chiave === chiave)
  if (buono(n)) return n
  const indietro = [...q.nodi].reverse()
  return q.nodi.find(x => x.adesso && x.porto) || indietro.find(x => x.tipo === 'tappa' && buono(x))
    || indietro.find(buono) || q.nodi.find(x => x.porto) || null
}

/* La geografia costa: coste, mare, porti e rotte non dipendono da cosa è
   vinto ma solo da dove sta ogni cosa, quindi si tengono da parte per
   forma (larghezza, mondi, nomi): tornare alla mappa dopo una tappa non
   ricalcola niente. */
const GEOGRAFIE = new Map()
// per i test: la stessa isola deve venire uguale anche ricalcolata da capo
export const dimenticaGeografie = () => GEOGRAFIE.clear()
function geografia(pezzi, stato, prof, W, H) {
  const chiave = W + '|' + pezzi.map(p => p.nodi.map(n => n.chiave + '@' + Math.round(n.x) + ',' + Math.round(n.y)).join(';')
    + '#' + p.titoli.map(t => t.nome).join()).join('|')
  if (GEOGRAFIE.has(chiave)) return GEOGRAFIE.get(chiave)
  const isole = coste(pezzi.map(p => p.isola), W, H)
  // il mare: dove la nave ci sta, il porto di ogni nodo, le rotte fra i mondi
  const terra = (x, y) => isole.some(is => leggi(is.campo, x, y) < 0)
  const mare = creaMare(W, H, terra)
  const latoDi = new Map(isole.map(is => [is.mondo, is.lato]))
  const porti = new Map()
  for (const p of pezzi) for (const n of p.nodi) porti.set(n.chiave, attracco(mare, n.x, n.y, latoDi.get(n.mondo) || 1))
  const entrata = new Map(pezzi.map(p => [p.entrata.mondo, porti.get(p.entrata.chiave)]))
  const uscita = new Map(pezzi.map(p => [p.uscita.mondo, porti.get(p.uscita.chiave)]))
  // fra i mondi: solo dalla fila appena sopra (un mondo che dipendesse da
  // tutti con un filo da ognuno farebbe una ragnatela)
  const rotte = []
  for (const m of stato) {
    const p = prof.get(m.id)
    for (const d of [...m.dopo, ...(m.dopoUno || [])]) {
      if (prof.get(d) !== p - 1 || !uscita.get(d) || !entrata.get(m.id)) continue
      const punti = rotta(mare, uscita.get(d), entrata.get(m.id))
      if (punti) rotte.push({ tipo: 'fra', punti, da: d, a: m.id })
    }
  }
  const geo = { isole, mare, porti, rotte, mareBasso: mareBasso(isole, W, H), rosa: rosaDeiVenti(mare),
                decori: isole.flatMap(is => is.decori) }
  if (GEOGRAFIE.size > 5) GEOGRAFIE.delete(GEOGRAFIE.keys().next().value)
  GEOGRAFIE.set(chiave, geo)
  return geo
}

/* ── le coste ──
   Il campo di un'isola è la distanza (morbida) da quello che deve portare,
   meno il margine, più un rumore col seme del mondo; la costa è dove vale
   zero. Il rumore è limitato (fra -FUORI e DENTRO), quindi quello che l'isola
   porta resta a terra con almeno MARGINE attorno. Due isole si dividono il
   mare a metà, con CANALE in mezzo: la terra dell'una non tocca l'altra. */
function coste(elenco, W, H) {
  const tutte = elenco.map(is => ({ ...is, forme: [...is.deve, ...is.corpo], box: scatola([...is.deve, ...is.corpo]) }))
  const vicine = (a, b, d) => a.box.x0 - d < b.box.x1 && b.box.x0 - d < a.box.x1 && a.box.y0 - d < b.box.y1 && b.box.y0 - d < a.box.y1
  const bordoDi = (x, y) => 10 - Math.min(x, W - x, y, H - y)
  return tutte.map(is => {
    const altre = tutte.filter(o => o !== is && vicine(is, o, 2 * CANALE + 60))
    const { largo: rl, fine: rf } = rumori(is.seme, is.fuori > 20 ? 95 : 52)
    const soglia = MARGINE + DENTRO
    const { x: cx, y: cy } = is.centro
    // il rumore largo sta fra -fuori e DENTRO - FRASTAGLIO: col fine sommato non passa DENTRO
    const onda = (x, y) => { const v = rl(x - cx, y - cy); return v > 0 ? v * (DENTRO - FRASTAGLIO) : v * is.fuori }
    const liscio = (x, y) => unione(is.forme, x, y, 26) - soglia + onda(x, y)
    const lontano = (x, y) => {
      let d = Infinity
      for (const o of altre) d = Math.min(d, unione(o.forme, x, y))
      return d
    }
    // gli isolotti: pochi, vicino alla costa, sulla schiena o in punta
    const isolotti = []
    for (let k = 0; k < 14 && isolotti.length < is.isolotti; k++) {
      const a = dado(is.seme, 60 + k) * Math.PI * 2
      const r = 5 + dado(is.seme, 80 + k) * (is.fuori > 15 ? 6 : 3)
      const dx = Math.cos(a), dy = Math.sin(a)
      if (dx * is.lato > 0.2) continue        // la costa del porto resta libera
      let d = 0
      while (d < 400 && liscio(cx + dx * d, cy + dy * d) < r + 11) d += 4
      const x = cx + dx * d, y = cy + dy * d
      if (-bordoDi(x, y) + 10 < r + 16) continue
      if (lontano(x, y) < r + CANALE) continue
      if (isolotti.some(o => Math.hypot(o.x - x, o.y - y) < o.r + r + 20)) continue
      isolotti.push({ x, y, r })
    }
    const pad = soglia + is.fuori + MARE_BASSO[MARE_BASSO.length - 1] + 10
    const x0 = Math.max(0, Math.floor(is.box.x0 - pad)), y0 = Math.max(0, Math.floor(is.box.y0 - pad))
    const x1 = Math.min(W, Math.ceil(is.box.x1 + pad)), y1 = Math.min(H, Math.ceil(is.box.y1 + pad))
    // il campo liscio (per il mare basso) e la distanza vera dalle forme (per il canale)
    const gl = griglia(x0, y0, x1, y1, FINE, (x, y) => {
      let v = liscio(x, y)
      for (const o of isolotti) v = Math.min(v, Math.hypot(x - o.x, y - o.y) - o.r)
      return Math.max(v, bordoDi(x, y))
    })
    const campo = griglia(x0, y0, x1, y1, FINE, (x, y, i, j) => {
      if (i === 0 || j === 0 || x >= x1 - FINE || y >= y1 - FINE) return 50
      const v = gl.v[j * gl.nx + i]
      if (v > 12) return v                     // lontano dalla costa: il resto non la sposta
      const f = v + rf(x - cx, y - cy) * FRASTAGLIO
      if (!altre.length || v < -24) return f   // dentro l'isola: nessun'altra ci arriva
      return Math.max(f, (unione(is.forme, x, y) - lontano(x, y) + CANALE) / 2)
    })
    // tutti girati nello stesso verso (area positiva): chi dipinge sa da che parte è il mare
    const anelli = contorni(campo).map(a => liscia(a)).map(a => (area(a) < 0 ? a.reverse() : a))
      .filter(a => area(a) > 40).sort((a, b) => area(b) - area(a))
    return { mondo: is.mondo, stato: is.stato, lato: is.lato, seme: is.seme, centro: is.centro,
             costa: anelli[0], isolotti: anelli.slice(1), campo, basso: gl, deve: is.deve, strade: is.strade,
             decori: decori(is, campo) }
  })
}

// il mare basso: le linee che seguono la costa a 7, 14, 22 px, tutte le isole insieme
function mareBasso(isole, W, H) {
  const passo = 5
  const g = griglia(0, 0, W, H, passo, (x, y, i, j) => {
    if (i === 0 || j === 0 || x >= W - passo || y >= H - passo) return 99
    let v = 99
    for (const is of isole) v = Math.min(v, leggi(is.basso, x, y, 99))
    return v
  })
  return MARE_BASSO.map(livello => ({ livello, anelli: contorni(g, livello).map(a => liscia(a, 3, 3)) }))
}

// alberelli, monticelli e ciuffi dove la terra è libera: mai sotto una tappa,
// un nome o il sentiero
function decori(is, campo) {
  const out = []
  const passo = 21
  const b = scatola(is.deve)
  for (let y = b.y0 - 20, j = 0; y < b.y1 + 30; y += passo, j++) {
    for (let x = b.x0 - 30, i = 0; x < b.x1 + 30; x += passo, i++) {
      const px = x + (dado(is.seme, i, 900 + j) - 0.5) * 12, py = y + (dado(is.seme, i, 1900 + j) - 0.5) * 12
      if (leggi(campo, px, py, 99) > -12) continue
      if (unione(is.deve, px, py) < 14 || unione(is.strade, px, py) < 10) continue
      const q = dado(is.seme, i, 2900 + j)
      if (q < 0.3) continue
      const tipo = q < 0.7 ? 'albero' : q < 0.86 ? 'monte' : 'ciuffo'
      if (leggi(campo, px, py - 10, 99) > -6) continue          // la chioma o la cima non escono dalla costa
      const spazio = tipo === 'monte' ? 26 : 19
      if (out.some(d => Math.hypot(d.x - px, d.y - py) < spazio)) continue
      out.push({ mondo: is.mondo, tipo, x: Math.round(px), y: Math.round(py), s: 1 + dado(is.seme, i, 3900 + j) * 0.4 })
    }
  }
  return out
}

// la rosa dei venti: dove c'è mare largo, in basso e verso sinistra
function rosaDeiVenti(mare) {
  let meglio = null
  for (let j = mare.ny - 1; j >= 0; j--) for (let i = 0; i < mare.nx; i++) {
    const s = mare.spazio[j * mare.nx + i]
    if (s < 34) continue
    const x = (i + 0.5) * mare.passo, y = (j + 0.5) * mare.passo
    const voto = y - x * 0.6
    if (!meglio || voto > meglio.voto) meglio = { x, y, voto }
  }
  return meglio ? { x: meglio.x, y: meglio.y } : { x: 44, y: mare.H - 58 }
}
