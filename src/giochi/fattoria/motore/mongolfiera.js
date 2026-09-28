/* La mongolfiera: le regole (quando atterra, cosa chiede, cosa succede caricando). I numeri stanno
   in dati/mongolfiera.js — vedi docs/fattoria/chi-chiede.md. Non ha fretta: costa solo tempo (il
   cielo resta vuoto CIELO_VUOTO_MIN dopo la partenza). Stessa forma pura di motore/mercato.js. */
import { PRODOTTI } from '../dati/coltivazioni.js'
import { PER_ID, CATALOGO, eMongolfiera } from '../dati/catalogo.js'
import { pesoDellaMerce } from '../dati/mercato.js'
import {
  CASSE_MIN, CASSE_MAX, PEZZI_MIN, PEZZI_MAX, CIELO_VUOTO_MIN,
  fileAl, merceDaCassa, premioDellaCassa, bonusDellaFila, bonusDelTutto,
} from '../dati/mongolfiera.js'
import { merciOrdinabili } from './mercato.js'

const MINUTO = 60000

// Le otto sorprese della fiera, nell'ordine del catalogo.
export const SORPRESE = CATALOGO.filter(v => v.fiera).map(v => v.id)

// La piazzola in mappa, se c'è: nel baule non conta, come la bancarella.
export const mongolfieraIn = f => f.cose.find(eMongolfiera) || null

// Le merci che una cassa può chiedere a questa fattoria.
export const merciDaCassa = f => merciOrdinabili(f).filter(merceDaCassa)

const traMinMax = (rnd, min, max) => min + Math.min(max - min, Math.floor(rnd() * (max - min + 1)))

// Come la pesca del banco: una merce pesa quanto dice pesoDellaMerce.
function pescaPesata(rnd, merci, livello) {
  const pesi = merci.map(p => pesoDellaMerce(p, livello))
  let x = rnd() * pesi.reduce((s, w) => s + w, 0)
  for (let i = 0; i < merci.length; i++) if ((x -= pesi[i]) < 0) return i
  return merci.length - 1
}

// Un pallone nuovo: ogni fila ha una quantità per tutte le sue casse (si legge in un'occhiata).
export function componiLaMongolfiera(f, rnd = Math.random, n = 1, ora = Date.now()) {
  const resta = merciDaCassa(f)
  const quante = Math.min(fileAl(f.livello), resta.length)
  if (!quante) return null
  const file = []
  for (let i = 0; i < quante; i++) {
    const [merce] = resta.splice(pescaPesata(rnd, resta, f.livello), 1)
    const casse = traMinMax(rnd, CASSE_MIN, CASSE_MAX)
    const pezzi = traMinMax(rnd, PEZZI_MIN, PEZZI_MAX)
    file.push({ merce, casse: Array.from({ length: casse },
      () => ({ pezzi, xp: premioDellaCassa(merce, pezzi), piena: false })) })
  }
  return { n, nata: ora, file }
}

// È a terra?
export const aTerra = m => !!(m && Array.isArray(m.file) && m.file.length)

// Fra quanti minuti ne atterra un'altra: zero se il cielo è già pronto.
export const minutiAlProssimo = (f, ora = Date.now()) => {
  const m = f.mongolfiera
  if (!m || !(m.via > 0)) return 0
  return Math.max(0, Math.ceil((m.via + CIELO_VUOTO_MIN * MINUTO - ora) / MINUTO))
}

// Se il cielo è libero (mai atterrato, o partito da più di un'ora) ne scende uno; senza la piazzola non succede niente.
export function aggiornaLaMongolfiera(f, ora = Date.now(), rnd = Math.random) {
  if (!mongolfieraIn(f)) return false
  const m = f.mongolfiera
  if (aTerra(m)) return false
  if (m && m.via > 0 && minutiAlProssimo(f, ora) > 0) return false
  const nuova = componiLaMongolfiera(f, rnd, ((m && m.n) || 0) + 1, ora)
  if (!nuova) return false
  f.mongolfiera = nuova
  return true
}

// La cassa c della fila i, se esiste e il pallone è a terra.
function cassaDi(f, i, c) {
  const m = f.mongolfiera
  if (!aTerra(m)) return null
  const fila = m.file[i]
  const cassa = fila && fila.casse[c]
  return cassa ? { fila, cassa } : null
}

export const filaPiena = fila => fila.casse.every(c => c.piena)
export const tuttoPieno = m => aTerra(m) && m.file.every(filaPiena)
const premioDelleCasse = casse => casse.reduce((s, c) => s + c.xp, 0)

// Si può riempire questa cassa adesso?
export const cassaPronta = (f, fila, cassa) =>
  !cassa.piena && f.quantoHo(fila.merce) >= cassa.pezzi

// C'è una cassa da riempire con la roba che c'è? È il fumetto sopra il pallone.
export const qualcosaDaCaricare = f => aTerra(f.mongolfiera) &&
  f.mongolfiera.file.some(fila => fila.casse.some(c => cassaPronta(f, fila, c)))

// La sorpresa: una delle otto che non si hanno ancora; finite, di nuovo a caso fra tutte.
export function scegliLaSorpresa(f, rnd = Math.random) {
  if (!SORPRESE.length) return null
  const nuove = SORPRESE.filter(id => !f.quanteNeHo(id))
  const fra = nuove.length ? nuove : SORPRESE
  return fra[Math.min(fra.length - 1, Math.floor(rnd() * fra.length))]
}

// Riempire una cassa: il controllo viene prima di tutto. Fila piena rende il bonus, tutto pieno anche la sorpresa.
export function caricaLaCassa(f, i, c, rnd = Math.random) {
  if (!mongolfieraIn(f)) return { ok: false, motivo: 'niente-mongolfiera' }
  const dove = cassaDi(f, i, c)
  if (!dove) return { ok: false, motivo: 'non-esiste' }
  const { fila, cassa } = dove
  if (cassa.piena) return { ok: false, motivo: 'gia-piena' }
  const hai = f.quantoHo(fila.merce)
  if (hai < cassa.pezzi)
    return { ok: false, motivo: 'manca-roba', manca: { prodotto: fila.merce, serve: cassa.pezzi, hai } }
  f.togli(fila.merce, cassa.pezzi)
  cassa.piena = true
  const m = f.mongolfiera
  const bonusFila = filaPiena(fila) ? bonusDellaFila(premioDelleCasse(fila.casse)) : 0
  const pieno = tuttoPieno(m)
  const bonusTutto = pieno ? bonusDelTutto(m.file.reduce((s, x) => s + premioDelleCasse(x.casse), 0)) : 0
  let sorpresa = null
  if (pieno) {
    sorpresa = scegliLaSorpresa(f, rnd)
    if (sorpresa) f.magazzino[sorpresa] = f.quantiNe(sorpresa) + 1
  }
  const xp = cassa.xp + bonusFila + bonusTutto
  const salito = f.guadagna(xp)
  return { ok: true, xp, cassa: cassa.xp, bonusFila, bonusTutto, sorpresa,
           tutto: pieno, livello: f.livello, salito }
}

// "Parti!": quando si vuole, anche a metà — il premio delle casse consegnate resta.
export function parti(f, ora = Date.now()) {
  const m = f.mongolfiera
  if (!aTerra(m)) return { ok: false, motivo: 'non-a-terra' }
  const casse = m.file.flatMap(x => x.casse)
  const piene = casse.filter(c => c.piena).length
  f.mongolfiera = { n: m.n || 1, via: ora }
  return { ok: true, piene, di: casse.length, minuti: CIELO_VUOTO_MIN }
}

// La piazzola cambia disegno partita (come un recinto che cambia faccia); il fumetto solo se una cassa si può riempire.
export function aspettoDellaMongolfiera(f, cosa, ora = Date.now()) {
  const m = f.mongolfiera
  const v = PER_ID[cosa && cosa.id] || {}
  if (m && m.via > 0 && minutiAlProssimo(f, ora) > 0)
    return v.partita ? { invece: v.partita.pezzo } : null
  return qualcosaDaCaricare(f) ? { sopra: null, fumetto: '📦' } : null
}

// Il salvataggio: senza nasce null (cielo libero); una fila di merce tolta dalla tabella si scorda.
export function leggiLaMongolfiera(d) {
  if (!d || typeof d !== 'object') return null
  const n = Math.max(1, Math.floor(d.n) || 1)
  if (d.via > 0) return { n, via: d.via }
  const file = (Array.isArray(d.file) ? d.file : [])
    .filter(x => x && PRODOTTI[x.merce] && Array.isArray(x.casse))
    .map(x => ({ merce: x.merce, casse: x.casse.filter(c => c && c.pezzi > 0).map(c => ({
      pezzi: Math.min(PEZZI_MAX, Math.max(PEZZI_MIN, Math.floor(c.pezzi))),
      xp: Math.max(0, Math.floor(c.xp) || 0),
      piena: c.piena === true })) }))
    .filter(x => x.casse.length)
  if (!file.length) return null
  return { n, nata: d.nata > 0 ? d.nata : 0, file }
}

// Quello che la schermata deve sapere, già contato.
export function naveDi(f, ora = Date.now()) {
  const m = f.mongolfiera
  if (!aTerra(m)) return { aTerra: false, minuti: minutiAlProssimo(f, ora), n: (m && m.n) || 0 }
  const tutte = m.file.flatMap(x => x.casse)
  const somma = premioDelleCasse(tutte)
  const file = m.file.map((fila, i) => {
    const p = PRODOTTI[fila.merce] || {}
    const suo = premioDelleCasse(fila.casse)
    return {
      i, merce: fila.merce, nome: p.nome || fila.merce, hai: f.quantoHo(fila.merce),
      piena: filaPiena(fila), bonus: bonusDellaFila(suo),
      casse: fila.casse.map((c, j) => ({ j, pezzi: c.pezzi, xp: c.xp, piena: c.piena,
                                         pronta: cassaPronta(f, fila, c) })),
    }
  })
  const piene = tutte.filter(c => c.piena).length
  const preso = file.reduce((s, x) => s + x.casse.filter(c => c.piena)
    .reduce((t, c) => t + c.xp, 0) + (x.piena ? x.bonus : 0), 0)
    + (piene === tutte.length ? bonusDelTutto(somma) : 0)
  const tuttoIntero = somma + file.reduce((s, x) => s + x.bonus, 0) + bonusDelTutto(somma)
  return {
    aTerra: true, n: m.n || 1, file, piene, di: tutte.length,
    preso, tuttoIntero, bonusTutto: bonusDelTutto(somma),
    pieno: piene === tutte.length,
  }
}
