/* Il mercato: le regole (cosa si può chiedere, quando arriva un ordine, cosa succede consegnando).
   I numeri stanno in dati/mercato.js — vedi docs/fattoria/chi-chiede.md e regole.md. rnd arriva da
   fuori (una partita si deve poter rifare identica). */
import { PRODOTTI } from '../dati/coltivazioni.js'
import { eMercato } from '../dati/catalogo.js'
import {
  CLIENTI, POSTI, MERCI_MAX, PEZZI_MAX, RIPOSO_MIN,
  merciDelLivello, premioPer, minutiPer, clientiPer, pesoDellaMerce,
} from '../dati/mercato.js'

const MINUTO = 60000

// C'è una bancarella in mappa? In magazzino non conta, come per il carretto del vicino.
export const mercatoIn = f => f.cose.find(eMercato) || null

// Le merci che un ordine può chiedere: livello (dato) e ottenibile (dipende dai premi presi).
export const merciOrdinabili = f =>
  merciDelLivello(f.livello).filter(p => f.ottenibile(p))

const pesca = (rnd, quante) => Math.min(quante - 1, Math.floor(rnd() * quante))

// Come pesca, ma una merce pesa quanto dice pesoDellaMerce (un'estrazione sola, così si rifà identica).
function pescaPesata(rnd, merci, livello) {
  const pesi = merci.map(p => pesoDellaMerce(p, livello))
  let x = rnd() * pesi.reduce((s, w) => s + w, 0)
  for (let i = 0; i < merci.length; i++) if ((x -= pesi[i]) < 0) return i
  return merci.length - 1
}

// Un ordine nuovo: quasi sempre una o due merci diverse, mai più di quante se ne possano produrre.
export function componiOrdine(f, rnd = Math.random, id = 1) {
  const merci = merciOrdinabili(f)
  if (!merci.length) return null
  let quante = 1
  if (rnd() < 0.55) quante++
  if (rnd() < 0.2) quante++
  quante = Math.min(quante, MERCI_MAX, merci.length)

  const resta = merci.slice()
  const chiede = {}
  for (let i = 0; i < quante; i++) {
    const [p] = resta.splice(pescaPesata(rnd, resta, f.livello), 1)
    chiede[p] = 1 + Math.floor(rnd() * PEZZI_MAX)
  }
  // Prima la roba, poi chi la vuole (clientiPer): pescare il cliente fra tutti faceva sembrare il banco una lotteria.
  const possibili = clientiPer(chiede)
  const chi = possibili[pesca(rnd, possibili.length)]
  return { id, chi: chi.id, chiede, xp: premioPer(chiede), minuti: minutiPer(chiede) }
}

// I tre posti rimessi a posto: i vuoti si riempiono, quelli in riposo aspettano il loro minuto.
export function aggiornaIlMercato(f, ora = Date.now(), rnd = Math.random) {
  if (!Array.isArray(f.ordini)) f.ordini = []
  let mosso = false
  while (f.ordini.length < POSTI) { f.ordini.push(null); mosso = true }
  if (f.ordini.length > POSTI) { f.ordini.length = POSTI; mosso = true }
  for (let i = 0; i < POSTI; i++) {
    const p = f.ordini[i]
    if (p && p.chiede) continue                       // c'è già un ordine
    if (p && p.dal > ora) continue                    // sta riposando
    const o = componiOrdine(f, rnd, f.prossimoOrdine || 1)
    if (!o) { if (p) { f.ordini[i] = null; mosso = true } continue }
    f.prossimoOrdine = (f.prossimoOrdine || 1) + 1
    o.nato = ora
    f.ordini[i] = o
    mosso = true
  }
  return mosso
}

// Gli ordini veri, senza i posti vuoti; i posti in riposo escono a parte (riposi).
export const ordiniDi = f => (f.ordini || []).filter(o => o && o.chiede)
export const riposiDi = f => (f.ordini || []).filter(o => o && !o.chiede && o.dal)
export const ordineDi = (f, id) => ordiniDi(f).find(o => o.id === id) || null

// Quello che manca per consegnare: mai un sì/no da solo, porta sempre cosa manca.
export function cheMancaPer(f, ordine) {
  if (!ordine) return []
  return Object.entries(ordine.chiede)
    .map(([prodotto, serve]) => ({ prodotto, serve, hai: f.quantoHo(prodotto) }))
    .filter(r => r.hai < r.serve)
}

export const puoiConsegnare = (f, ordine) => !!ordine && !cheMancaPer(f, ordine).length

// Consegnare: il controllo viene prima di toccare qualunque cosa, come in nutri e coccola.
export function consegna(f, id, ora = Date.now(), rnd = Math.random) {
  if (!mercatoIn(f)) return { ok: false, motivo: 'niente-mercato' }
  const o = ordineDi(f, id)
  if (!o) return { ok: false, motivo: 'non-esiste' }
  const manca = cheMancaPer(f, o)
  if (manca.length) return { ok: false, motivo: 'manca-roba', manca }
  for (const [p, n] of Object.entries(o.chiede)) f.togli(p, n)
  const salito = f.guadagna(o.xp)
  const i = f.ordini.indexOf(o)
  if (i >= 0) f.ordini[i] = null
  aggiornaIlMercato(f, ora, rnd)
  return { ok: true, xp: o.xp, ordine: o, livello: f.livello, salito }
}

// Rifiutare: non si perde niente, si paga solo tempo.
export function rifiuta(f, id, ora = Date.now()) {
  const o = ordineDi(f, id)
  if (!o) return { ok: false, motivo: 'non-esiste' }
  const i = f.ordini.indexOf(o)
  if (i < 0) return { ok: false, motivo: 'non-esiste' }
  f.ordini[i] = { dal: ora + RIPOSO_MIN * MINUTO }
  return { ok: true, minuti: RIPOSO_MIN }
}

// Fra quanti minuti torna un posto rifiutato.
export const mancaAlProssimo = (riposo, ora = Date.now()) =>
  Math.max(0, Math.ceil(((riposo && riposo.dal ? riposo.dal : ora) - ora) / MINUTO))

// C'è qualcosa da consegnare adesso? È il fumetto sopra la bancarella.
export const qualcosaDaConsegnare = f => ordiniDi(f).some(o => puoiConsegnare(f, o))

// Quello che la schermata deve sapere, già contato.
export function bancoDi(f, ora = Date.now()) {
  return {
    ordini: ordiniDi(f).map(o => ({
      ...o,
      cliente: CLIENTI.find(c => c.id === o.chi) || CLIENTI[0],
      righe: Object.entries(o.chiede).map(([prodotto, serve]) => ({
        prodotto, serve, hai: f.quantoHo(prodotto),
        nome: (PRODOTTI[prodotto] || {}).nome || prodotto,
        pieno: f.quantoHo(prodotto) >= serve,
      })),
      pronto: puoiConsegnare(f, o),
    })),
    riposi: riposiDi(f).map(r => ({ minuti: mancaAlProssimo(r, ora) })),
  }
}
