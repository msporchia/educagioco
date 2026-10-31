/* Le botteghe del paese: le regole (chi arriva, cosa chiede, cosa succede consegnando). I numeri stanno
   in dati/botteghe.js, l'elenco sulla voce del catalogo — vedi docs/fattoria/chi-chiede.md. La fama
   non si salva, si conta da consegne (famaDi). Stessa forma di motore/mercato.js (pure, caso e ora da fuori). */
import { PRODOTTI } from '../dati/coltivazioni.js'
import { PER_ID, postoDi } from '../dati/catalogo.js'
import { clienteDi, minutiPer, pesoDellaMerce } from '../dati/mercato.js'
import {
  PEZZI_MIN, PEZZI_MAX, ATTESA_MIN, ATTESA_MAX, CUORI, BANCONI_MAX,
  premioInBottega, clientiDellaBottega,
} from '../dati/botteghe.js'
import { merciOrdinabili, cheMancaPer, puoiConsegnare } from './mercato.js'

const MINUTO = 60000

// La bottega in mappa, se c'è: nel baule non conta, come la bancarella.
export const bottegaIn = (f, id) => f.cose.find(c => c.id === id && postoDi(c)) || null

// Le botteghe posate, una per id (sono unico).
export const botteghePosate = f =>
  [...new Set(f.cose.filter(postoDi).map(c => c.id))]

// Lo stato di una bottega, creato vuoto la prima volta.
function statoDi(f, id) {
  if (!f.botteghe || typeof f.botteghe !== 'object') f.botteghe = {}
  if (!f.botteghe[id]) f.botteghe[id] = { consegne: 0, prossimo: 1, banconi: [] }
  return f.botteghe[id]
}

// Ogni consegna è un cuore; a CUORI la bottega cresce di un bancone e i cuori ripartono, fino a BANCONI_MAX.
export function famaDi(stato) {
  const n = Math.max(0, (stato && stato.consegne) | 0)
  const banconi = Math.min(BANCONI_MAX, 1 + Math.floor(n / CUORI))
  const piena = banconi >= BANCONI_MAX
  return { banconi, cuori: piena ? CUORI : n % CUORI, di: CUORI, piena }
}

const pesca = (rnd, quante) => Math.min(quante - 1, Math.floor(rnd() * quante))

function pescaPesata(rnd, merci, livello) {
  const pesi = merci.map(p => pesoDellaMerce(p, livello))
  let x = rnd() * pesi.reduce((s, w) => s + w, 0)
  for (let i = 0; i < merci.length; i++) if ((x -= pesi[i]) < 0) return i
  return merci.length - 1
}

// Le merci che questa bottega può chiedere adesso: il suo elenco, stretto a quello ottenibile.
export function merciDellaBottega(f, id) {
  const posto = (PER_ID[id] || {}).posto
  if (!posto) return []
  const si = new Set(merciOrdinabili(f))
  return posto.chiede.filter(p => si.has(p))
}

// Un cliente nuovo: se un altro bancone chiede già quella merce se ne cerca un'altra, se c'è.
export function componiCliente(f, id, rnd = Math.random, n = 1, gia = []) {
  const posto = (PER_ID[id] || {}).posto
  const tutte = merciDellaBottega(f, id)
  if (!posto || !tutte.length) return null
  const altre = tutte.filter(p => !gia.includes(p))
  const merci = altre.length ? altre : tutte
  const p = merci[pescaPesata(rnd, merci, f.livello)]
  const pezzi = PEZZI_MIN + pesca(rnd, PEZZI_MAX - PEZZI_MIN + 1)
  const possibili = clientiDellaBottega(posto, p)
  const chi = possibili[pesca(rnd, possibili.length)]
  const chiede = { [p]: pezzi }
  return { id: n, chi: chi.id, chiede, xp: premioInBottega(p, pezzi),
           minuti: minutiPer(chiede) }
}

// Fra quanto arriva il cliente dopo.
export const attesaNuova = (rnd = Math.random) =>
  ATTESA_MIN + pesca(rnd, ATTESA_MAX - ATTESA_MIN + 1)

// Rimessa a posto: i banconi che la fama ha aperto ci sono, i vuoti si riempiono, gli in-attesa aspettano.
export function aggiornaLaBottega(f, id, ora = Date.now(), rnd = Math.random) {
  if (!bottegaIn(f, id)) return false
  const b = statoDi(f, id)
  let mosso = false
  const { banconi } = famaDi(b)
  while (b.banconi.length < banconi) { b.banconi.push(null); mosso = true }
  for (let i = 0; i < b.banconi.length; i++) {
    const x = b.banconi[i]
    if (x && x.chiede) continue                      // c'è già qualcuno
    if (x && x.dal > ora) continue                   // arriva più tardi
    const gia = b.banconi.filter(o => o && o.chiede).map(o => Object.keys(o.chiede)[0])
    const c = componiCliente(f, id, rnd, b.prossimo || 1, gia)
    if (!c) { if (x) { b.banconi[i] = null; mosso = true } continue }
    b.prossimo = (b.prossimo || 1) + 1
    c.nato = ora
    b.banconi[i] = c
    mosso = true
  }
  return mosso
}

// Tutte le botteghe in mappa, in un colpo (dal battito del gioco).
export function aggiornaLeBotteghe(f, ora = Date.now(), rnd = Math.random) {
  let mosso = false
  for (const id of botteghePosate(f)) if (aggiornaLaBottega(f, id, ora, rnd)) mosso = true
  return mosso
}

const clientiDi = (f, id) =>
  ((f.botteghe && f.botteghe[id] && f.botteghe[id].banconi) || []).filter(o => o && o.chiede)
const cercaCliente = (f, id, n) => clientiDi(f, id).find(o => o.id === n) || null

// Consegnare: il controllo viene prima di toccare qualunque cosa; se il cuore era il quinto la bottega cresce subito.
export function consegnaInBottega(f, id, n, ora = Date.now(), rnd = Math.random) {
  if (!bottegaIn(f, id)) return { ok: false, motivo: 'niente-bottega' }
  const o = cercaCliente(f, id, n)
  if (!o) return { ok: false, motivo: 'non-esiste' }
  const manca = cheMancaPer(f, o)
  if (manca.length) return { ok: false, motivo: 'manca-roba', manca }
  for (const [p, q] of Object.entries(o.chiede)) f.togli(p, q)
  const salito = f.guadagna(o.xp)
  const b = statoDi(f, id)
  const prima = famaDi(b).banconi
  b.consegne = (b.consegne || 0) + 1
  const attesa = attesaNuova(rnd)
  b.banconi[b.banconi.indexOf(o)] = { dal: ora + attesa * MINUTO }
  const cresciuta = famaDi(b).banconi > prima
  aggiornaLaBottega(f, id, ora, rnd)
  return { ok: true, xp: o.xp, ordine: o, attesa, cresciuta,
           livello: f.livello, salito }
}

// "Non mi va": stessa attesa di una consegna, né di più né di meno.
export function rifiutaInBottega(f, id, n, ora = Date.now(), rnd = Math.random) {
  const o = cercaCliente(f, id, n)
  if (!o) return { ok: false, motivo: 'non-esiste' }
  const b = statoDi(f, id)
  const attesa = attesaNuova(rnd)
  b.banconi[b.banconi.indexOf(o)] = { dal: ora + attesa * MINUTO }
  return { ok: true, attesa }
}

// Il salvataggio: un cliente si rilegge solo se chiede una merce che esiste ancora; le consegne restano sempre.
export function leggiLeBotteghe(d) {
  const fuori = {}
  if (!d || typeof d !== 'object') return fuori
  for (const [id, b] of Object.entries(d)) {
    if (!postoDi({ id }) || !b || typeof b !== 'object') continue
    const banconi = (Array.isArray(b.banconi) ? b.banconi : []).slice(0, BANCONI_MAX).map(x => {
      if (!x) return null
      if (!x.chiede) return x.dal > 0 ? { dal: x.dal } : null
      const merci = Object.entries(x.chiede).filter(([k, n]) => PRODOTTI[k] && n > 0)
      if (merci.length !== 1) return null
      const [[p, n]] = merci
      return { id: x.id | 0, chi: x.chi, chiede: { [p]: Math.floor(n) },
               xp: Math.max(0, x.xp | 0), minuti: Math.max(0, x.minuti | 0),
               nato: x.nato || 0 }
    })
    const consegne = Math.max(0, b.consegne | 0)
    const prossimo = Math.max(1, b.prossimo | 0,
                              ...banconi.map(x => ((x && x.id) || 0) + 1))
    fuori[id] = { consegne, prossimo, banconi }
  }
  return fuori
}

// C'è qualcosa da consegnare in questa bottega adesso? È il fumetto.
export const daConsegnareIn = (f, id) => clientiDi(f, id).some(o => puoiConsegnare(f, o))

// Quello che la schermata deve sapere, già contato.
export function bottegaDi(f, id, ora = Date.now()) {
  const v = PER_ID[id]
  const stato = (f.botteghe && f.botteghe[id]) || { consegne: 0, banconi: [] }
  const banconi = stato.banconi.map((x, i) => {
    if (x && x.chiede) {
      const righe = Object.entries(x.chiede).map(([prodotto, serve]) => ({
        prodotto, serve, hai: f.quantoHo(prodotto),
        nome: (PRODOTTI[prodotto] || {}).nome || prodotto,
        pieno: f.quantoHo(prodotto) >= serve,
      }))
      return { i, cliente: { ...x, cliente: clienteDi(x.chi), righe,
                             pronto: puoiConsegnare(f, x) } }
    }
    const minuti = x && x.dal
      ? Math.max(0, Math.ceil((x.dal - ora) / MINUTO)) : 0
    return { i, minuti }
  })
  return { id, nome: v ? v.nome : id, fama: famaDi(stato), banconi }
}
