/* La mongolfiera, senza stato proprio: come si compone un carico, cosa succede consegnando una cassa, quando parte e torna. Sono
   funzioni che lavorano su una `Fattoria3d` (`f.s.mongolfiera`, `f.scortaDi`, `f.ora()`, `f.rnd`); la classe ne tiene i metodi
   sottili. Paga esperienza, mai monete. Vedi docs/fattoria3d/mongolfiera.md. */
import { EDIFICI } from '../dati/catalogo.js'
import { RICETTE } from '../dati/ricette.js'
import { livelloDelPezzo } from '../dati/livelli.js'
import {
  FILE_MAX, fileAl, CASSE_MIN, CASSE_MAX, PEZZI_MIN, PEZZI_MAX, RIPOSO_MS, PESO_MACCHINA_TUA, BONUS_FILA, BONUS_TUTTO,
  merceDaCassa, merciDelLivello, fasiDi, pezziMaxAl, premioDellaCassa, bonusDellaFila, bonusDelTutto, SORPRESE,
} from '../dati/mongolfiera.js'

const traMinMax = (rnd, min, max) => min + Math.min(max - min, Math.floor(rnd() * (max - min + 1)))
const somma = casse => casse.reduce((n, c) => n + c.xp, 0)
const filaPiena = fila => fila.casse.every(c => c.piena)

/** Un carico nuovo per questo livello: una fila per merce (fino a tre, quattro dal livello 66), 2–3 casse per fila, lo stesso numero di pezzi in ogni cassa
    di una fila. Le merci di una macchina che hai pesano di più. Null se al livello non c'è niente da chiedere. */
export function nuovaStiva(f) {
  const livello = f.livello()
  const resta = merciDelLivello(livello)
  const quante = Math.min(fileAl(livello), resta.length)
  if (!quante) return null
  const pezziMax = pezziMaxAl(livello), file = []
  for (let n = 0; n < quante; n++) {
    const pesi = resta.map(k => (f.s.posseduti[RICETTE[k].dove] ? PESO_MACCHINA_TUA : 1) * (1 + 0.5 * (fasiDi(k) - 1)))
    let x = f.rnd() * pesi.reduce((a, w) => a + w, 0), i = 0
    for (; i < resta.length - 1; i++) if ((x -= pesi[i]) < 0) break
    const [merce] = resta.splice(i, 1)
    const pezzi = traMinMax(f.rnd, PEZZI_MIN, pezziMax)
    const casse = traMinMax(f.rnd, CASSE_MIN, CASSE_MAX)
    file.push({ merce, casse: Array.from({ length: casse }, () => ({ pezzi, xp: premioDellaCassa(merce, pezzi), piena: false })) })
  }
  return { file }
}

/** Un carico letto da un salvataggio, rimesso in forma: premi ricalcolati dai dati di oggi, merci che non esistono più scartate. Null se è da buttare. */
export function stivaInForma(x) {
  if (!x || typeof x !== 'object' || !Array.isArray(x.file)) return null
  const file = []
  for (const fila of x.file) {
    if (file.length >= FILE_MAX) break
    if (!fila || !merceDaCassa(fila.merce) || file.some(g => g.merce === fila.merce) || !Array.isArray(fila.casse)) continue
    const casse = fila.casse.slice(0, CASSE_MAX)
      .filter(c => c && Number.isInteger(c.pezzi) && c.pezzi >= PEZZI_MIN && c.pezzi <= PEZZI_MAX)
      .map(c => ({ pezzi: c.pezzi, xp: premioDellaCassa(fila.merce, c.pezzi), piena: !!c.piena }))
    if (casse.length) file.push({ merce: fila.merce, casse })
  }
  return file.length ? { file } : null
}

/** Il tempo che passa: se è finito il riposo atterra il carico nuovo; se non c'è un carico (appena comprata, o un salvataggio senza)
    ne compone uno. Torna true se è cambiato qualcosa. Senza mongolfiera, niente. */
export function aggiornaMongolfiera(f) {
  const M = f.s.mongolfiera
  if (!f.s.posseduti.mongolfiera) return false
  let cambiato = false
  if (M.riposo !== null) {
    if (f.ora() < M.riposo) return false
    M.riposo = null; M.via = null; cambiato = true
  }
  if (!M.stiva) { M.stiva = nuovaStiva(f); if (M.stiva) cambiato = true }
  return cambiato
}

/** La sorpresa della fiera: un pezzo decorativo gratis nel magazzino, fra quelli che si possono già comprare, preferendo quelli che hai di
    meno (cose in mappa più magazzino); a parità decide `rnd`. Torna il tipo, o null se non ce n'è. */
export function scegliLaSorpresa(f) {
  const aperte = SORPRESE.filter(t => livelloDelPezzo(t) <= f.livello())
  const fra = aperte.length ? aperte : SORPRESE
  if (!fra.length) return null
  const ne = t => f.s.cose.filter(c => c.tipo === t).length + (f.s.magazzino[t] || 0)
  const minimo = Math.min(...fra.map(ne))
  const pari = fra.filter(t => ne(t) === minimo)
  return pari[Math.min(pari.length - 1, Math.floor(f.rnd() * pari.length))]
}

function parte(f) {
  const M = f.s.mongolfiera, t = f.ora()
  M.stiva = null; M.via = t; M.riposo = t + RIPOSO_MS; M.giri++
}

/** Mette sulla mongolfiera la cassa `c` della fila `i`: toglie la roba, paga l'esperienza (la cassa; più il bonus se la fila si chiude;
    più il bonus del tutto e la sorpresa se è l'ultima) e, a tutto pieno, la mongolfiera parte. */
export function caricaLaCassa(f, i, c) {
  const M = f.s.mongolfiera
  if (!f.s.posseduti.mongolfiera) return { ok: false, motivo: 'non-tua' }
  if (M.riposo !== null) return { ok: false, motivo: 'in-viaggio' }
  const fila = M.stiva && M.stiva.file[i], cassa = fila && fila.casse[c]
  if (!cassa) return { ok: false, motivo: 'sconosciuta' }
  if (cassa.piena) return { ok: false, motivo: 'gia-piena' }
  const ha = f.scortaDi(fila.merce) || 0
  if (ha < cassa.pezzi) return { ok: false, motivo: 'mancano', mancano: { [fila.merce]: cassa.pezzi - ha } }
  f._togli(fila.merce, cassa.pezzi)
  cassa.piena = true
  const bonusFila = filaPiena(fila) ? bonusDellaFila(somma(fila.casse)) : 0
  const pieno = M.stiva.file.every(filaPiena)
  const bonusTutto = pieno ? bonusDelTutto(M.stiva.file.reduce((n, x) => n + somma(x.casse), 0)) : 0
  const xp = cassa.xp + bonusFila + bonusTutto
  f._guadagna(xp)
  f._evento('cassa', { merce: fila.merce, pezzi: cassa.pezzi, xp })
  let sorpresa = null
  if (pieno) {
    sorpresa = scegliLaSorpresa(f)
    if (sorpresa) { f.s.magazzino[sorpresa] = (f.s.magazzino[sorpresa] || 0) + 1; f._evento('fiera', { pezzo: sorpresa }) }
    parte(f)
  }
  return { ok: true, xp, cassa: cassa.xp, bonusFila, bonusTutto, sorpresa, pieno, parte: pieno, merce: fila.merce }
}

/** «Parti!» senza aspettare: restano i ⭐ delle casse già messe, niente bonus del tutto né sorpresa. Il carico nuovo arriva dopo il riposo. */
export function partiLaMongolfiera(f) {
  const M = f.s.mongolfiera
  if (!f.s.posseduti.mongolfiera) return { ok: false, motivo: 'non-tua' }
  if (M.riposo !== null) return { ok: false, motivo: 'in-viaggio' }
  if (!M.stiva) return { ok: false, motivo: 'sconosciuta' }
  const casse = M.stiva.file.flatMap(x => x.casse)
  const piene = casse.filter(c => c.piena).length
  parte(f)
  return { ok: true, piene, di: casse.length }
}

/** Tutto quello che la vista vuole sapere, senza toccare lo stato (salvo atterrare un carico scaduto). */
export function vistaDellaMongolfiera(f) {
  aggiornaMongolfiera(f)
  const M = f.s.mongolfiera, E = EDIFICI.mongolfiera
  const base = { posseduta: !!f.s.posseduti.mongolfiera, liv: E.liv, prezzo: E.prezzo, giri: M.giri, bonusFila: BONUS_FILA, bonusTutto: BONUS_TUTTO }
  if (!base.posseduta) return { ...base, stato: 'non-tua', aperta: f.livello() >= E.liv, file: [], piene: 0, totale: 0, pronte: 0 }
  if (M.riposo !== null) return { ...base, stato: 'viaggio', restoMs: Math.max(0, M.riposo - f.ora()), file: [], piene: 0, totale: 0, pronte: 0 }
  if (!M.stiva) return { ...base, stato: 'vuota', file: [], piene: 0, totale: 0, pronte: 0 }
  let piene = 0, totale = 0, pronte = 0
  const file = M.stiva.file.map((fila, i) => {
    const ric = RICETTE[fila.merce], ha = f.scortaDi(fila.merce) || 0
    const casse = fila.casse.map((c, n) => {
      totale++; if (c.piena) piene++
      const pronta = !c.piena && ha >= c.pezzi
      if (pronta) pronte++
      return { c: n, pezzi: c.pezzi, xp: c.xp, piena: c.piena, ha: Math.min(ha, c.pezzi), manca: c.piena ? 0 : Math.max(0, c.pezzi - ha), pronta }
    })
    return { i, k: fila.merce, nome: ric.nome, emoji: ric.emoji, casse, piena: filaPiena(fila), bonus: bonusDellaFila(somma(fila.casse)), xp: somma(fila.casse) }
  })
  const xpTutto = M.stiva.file.reduce((n, x) => n + somma(x.casse), 0)
  return { ...base, stato: 'terra', file, piene, totale, pronte, bonusTuttoXp: bonusDelTutto(xpTutto), xpTotale: xpTutto }
}

