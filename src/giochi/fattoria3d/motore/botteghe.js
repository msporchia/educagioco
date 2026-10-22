/* Le botteghe del paese: le regole (chi arriva, cosa chiede, cosa succede consegnando), sorella di motore/botteghe.js della 2D. Sono
   funzioni che lavorano su una `Fattoria3d` (`f.s.botteghe`, `f.scortaDi`, `f.ora()`, `f.rnd`, `f._togli`, `f._guadagna`); la classe ne
   tiene i metodi sottili. I numeri (pezzi, attese, fama, +25%) e il premio sono quelli della 2D (dati/botteghe.js); paga ESPERIENZA, mai
   monete, e mai più del tempo che costa. La fama non si salva: si conta dalle consegne (`famaDi`). Il caso e l'ora vengono da fuori, così
   i test li tengono fermi. Vedi docs/fattoria3d/botteghe.md. */
import { COLTURE } from '../dati/colture.js'
import { RICETTE } from '../dati/ricette.js'
import { PRODOTTI_ANIMALI, LANA } from '../dati/animali.js'
import {
  BOTTEGHE, TIPI_DI_BOTTEGA, eBottega, prodotto2D, PEZZI_MIN, PEZZI_MAX, ATTESA_MIN, ATTESA_MAX, CUORI, BANCONI_MAX, premioInBottega,
} from '../dati/botteghe.js'
import { EDIFICI } from '../dati/catalogo.js'
import { livelloDellaColtura, livelloDellaRicetta, livelloDelPezzo } from '../dati/livelli.js'
import { tettoDi } from '../dati/ordini.js'
import { MINUTO } from '../dati/parita2d.js'
import { clientiDellaBottega } from '../../fattoria/dati/botteghe.js'
import { clienteDi as clienteDi2D, pesoDellaMerce } from '../../fattoria/dati/mercato.js'

/** Il livello a cui si può avere una merce: il raccolto e la ricetta dicono il loro; uova, latte, tartufi e lana quello del pezzo che li fa. */
export function livelloDellaMerce(k) {
  if (COLTURE[k]) return livelloDellaColtura(k)
  if (RICETTE[k]) return livelloDellaRicetta(k)
  const p = PRODOTTI_ANIMALI[k] || LANA[k]
  return p ? livelloDelPezzo(p.dove) : Infinity
}
/** Nome ed emoji di una merce (raccolto, prodotto, uova, latte, lana). */
export const faccia = k => COLTURE[k] || RICETTE[k] || PRODOTTI_ANIMALI[k] || LANA[k] || { nome: k, emoji: '📦' }

/** Ogni consegna è un cuore; a CUORI la bottega cresce di un bancone e i cuori ripartono, fino a BANCONI_MAX. */
export function famaDi(stato) {
  const n = Math.max(0, (stato && stato.consegne) | 0)
  const banconi = Math.min(BANCONI_MAX, 1 + Math.floor(n / CUORI))
  const piena = banconi >= BANCONI_MAX
  return { banconi, cuori: piena ? CUORI : n % CUORI, di: CUORI, piena }
}

const pesca = (rnd, quante) => Math.min(quante - 1, Math.floor(rnd() * quante))

function pescaPesata(rnd, merci, livello) {
  const pesi = merci.map(k => pesoDellaMerce(prodotto2D(k), livello))
  let x = rnd() * pesi.reduce((s, w) => s + w, 0)
  for (let i = 0; i < merci.length; i++) if ((x -= pesi[i]) < 0) return i
  return merci.length - 1
}

/** Lo stato di una bottega, creato vuoto la prima volta (`f.s.botteghe` manca in uno stato di prima: `normalizza` lo riempie, qui si ripara lo stesso). */
function statoDi(f, tipo) {
  if (!f.s.botteghe || typeof f.s.botteghe !== 'object') f.s.botteghe = {}
  if (!f.s.botteghe[tipo]) f.s.botteghe[tipo] = { consegne: 0, prossimo: 1, banconi: [] }
  return f.s.botteghe[tipo]
}
const posata = (f, tipo) => eBottega(tipo) && !!f.s.posseduti[tipo]
/** Le botteghe che sono in mappa. */
export const botteghePosate = f => TIPI_DI_BOTTEGA.filter(t => posata(f, t))

/** Le merci che questa bottega può chiedere adesso: il suo elenco, stretto a quello che il livello permette di avere. */
export const merciDellaBottega = (f, tipo) => (BOTTEGHE[tipo] ? BOTTEGHE[tipo].merci.filter(k => livelloDellaMerce(k) <= f.livello()) : [])

/** Un cliente nuovo: se un altro bancone chiede già quella merce se ne cerca un'altra, se c'è. */
export function componiCliente(f, tipo, rnd = f.rnd, n = 1, gia = []) {
  const tutte = merciDellaBottega(f, tipo)
  if (!tutte.length) return null
  const altre = tutte.filter(k => !gia.includes(k))
  const merci = altre.length ? altre : tutte
  const k = merci[pescaPesata(rnd, merci, f.livello())]
  const pezzi = PEZZI_MIN + pesca(rnd, PEZZI_MAX - PEZZI_MIN + 1)
  const possibili = clientiDellaBottega({ clienti: BOTTEGHE[tipo].clienti }, prodotto2D(k))
  const chi = possibili[pesca(rnd, possibili.length)]
  return { id: n, chi: chi.id, chiede: { [k]: pezzi }, xp: premioInBottega(prodotto2D(k), pezzi) }
}

/** Fra quanto arriva il cliente dopo (minuti). */
export const attesaNuova = rnd => ATTESA_MIN + pesca(rnd, ATTESA_MAX - ATTESA_MIN + 1)

/** Rimessa a posto: i banconi che la fama ha aperto ci sono, i vuoti si riempiono, quelli in attesa aspettano. Torna true se è cambiato qualcosa. */
export function aggiornaLaBottega(f, tipo, ora = f.ora(), rnd = f.rnd) {
  if (!posata(f, tipo)) return false
  const b = statoDi(f, tipo)
  let mosso = false
  const { banconi } = famaDi(b)
  while (b.banconi.length < banconi) { b.banconi.push(null); mosso = true }
  for (let i = 0; i < b.banconi.length; i++) {
    const x = b.banconi[i]
    if (x && x.chiede) continue                      // c'è già qualcuno
    if (x && x.dal > ora) continue                   // arriva più tardi
    const gia = b.banconi.filter(o => o && o.chiede).map(o => Object.keys(o.chiede)[0])
    const c = componiCliente(f, tipo, rnd, b.prossimo || 1, gia)
    if (!c) { if (x) { b.banconi[i] = null; mosso = true } continue }
    b.prossimo = (b.prossimo || 1) + 1
    c.nato = ora
    b.banconi[i] = c
    mosso = true
  }
  return mosso
}
/** Tutte le botteghe in mappa, in un colpo (dal battito del gioco). */
export function aggiornaLeBotteghe(f, ora = f.ora(), rnd = f.rnd) {
  let mosso = false
  for (const tipo of botteghePosate(f)) if (aggiornaLaBottega(f, tipo, ora, rnd)) mosso = true
  return mosso
}

const clientiDi = (f, tipo) => ((f.s.botteghe && f.s.botteghe[tipo] && f.s.botteghe[tipo].banconi) || []).filter(o => o && o.chiede)
const cercaCliente = (f, tipo, n) => clientiDi(f, tipo).find(o => o.id === n) || null
/** Cosa manca per consegnare a quel cliente: { chiave: quanti }, vuoto se si può. */
const cheMancaPer = (f, o) => Object.fromEntries(Object.entries(o.chiede).filter(([k, n]) => f.scortaDi(k) < n).map(([k, n]) => [k, n - f.scortaDi(k)]))

/** Consegnare: il controllo viene prima di toccare qualunque cosa; se il cuore era il quinto la bottega cresce subito. Paga esperienza, mai monete. */
export function consegnaInBottega(f, tipo, n, ora = f.ora(), rnd = f.rnd) {
  if (!posata(f, tipo)) return { ok: false, motivo: 'niente-bottega' }
  const o = cercaCliente(f, tipo, n)
  if (!o) return { ok: false, motivo: 'non-esiste' }
  const mancano = cheMancaPer(f, o)
  if (Object.keys(mancano).length) return { ok: false, motivo: 'mancano', mancano }
  for (const [k, q] of Object.entries(o.chiede)) f._togli(k, q)
  f._guadagna(o.xp)
  const b = statoDi(f, tipo), prima = famaDi(b).banconi
  b.consegne = (b.consegne || 0) + 1
  const attesa = attesaNuova(rnd)
  b.banconi[b.banconi.indexOf(o)] = { dal: ora + attesa * MINUTO }
  const cresciuta = famaDi(b).banconi > prima
  aggiornaLaBottega(f, tipo, ora, rnd)
  f._evento('bottega', { bottega: tipo, cliente: o.chi, xp: o.xp, chiede: { ...o.chiede }, cresciuta })
  return { ok: true, xp: o.xp, cliente: clienteDi2D(o.chi), attesa, cresciuta, banconi: famaDi(b).banconi }
}

/** «Non mi va»: stessa attesa di una consegna, né di più né di meno (qui non c'è niente da scorrere: rifiutare non deve essere più svelto di consegnare). */
export function rifiutaInBottega(f, tipo, n, ora = f.ora(), rnd = f.rnd) {
  if (!posata(f, tipo)) return { ok: false, motivo: 'niente-bottega' }
  const o = cercaCliente(f, tipo, n)
  if (!o) return { ok: false, motivo: 'non-esiste' }
  const b = statoDi(f, tipo), attesa = attesaNuova(rnd)
  b.banconi[b.banconi.indexOf(o)] = { dal: ora + attesa * MINUTO }
  return { ok: true, attesa }
}

/** Il salvataggio: un cliente si rilegge solo se chiede una merce che la bottega chiede ancora (premio ricalcolato dai dati di oggi); le consegne restano sempre. Non lancia mai. */
export function leggiLeBotteghe(d) {
  const fuori = {}
  if (!d || typeof d !== 'object' || Array.isArray(d)) return fuori
  for (const [tipo, b] of Object.entries(d)) {
    if (!eBottega(tipo) || !b || typeof b !== 'object') continue
    const consegne = Number.isFinite(b.consegne) ? Math.min(1e6, Math.max(0, Math.floor(b.consegne))) : 0
    const banconi = (Array.isArray(b.banconi) ? b.banconi : []).slice(0, BANCONI_MAX).map(x => {
      if (!x || typeof x !== 'object') return null
      if (!x.chiede || typeof x.chiede !== 'object') return Number.isFinite(x.dal) && x.dal > 0 ? { dal: x.dal } : null
      const merci = Object.entries(x.chiede).filter(([k, q]) => BOTTEGHE[tipo].merci.includes(k) && Number.isInteger(q) && q >= PEZZI_MIN && q <= PEZZI_MAX)
      if (merci.length !== 1) return null
      const [[k, q]] = merci
      return { id: Number.isInteger(x.id) && x.id >= 1 ? x.id : 1, chi: clienteDi2D(x.chi).id, chiede: { [k]: q }, xp: premioInBottega(prodotto2D(k), q), nato: Number.isFinite(x.nato) ? x.nato : 0 }
    })
    const prossimo = Math.max(1, Number.isInteger(b.prossimo) ? b.prossimo : 1, ...banconi.map(x => ((x && x.id) || 0) + 1))
    fuori[tipo] = { consegne, prossimo, banconi }
  }
  return fuori
}

/** C'è qualcosa da consegnare in questa bottega adesso? Il numero sul cartello. */
export const daConsegnareIn = (f, tipo) => clientiDi(f, tipo).filter(o => Object.keys(cheMancaPer(f, o)).length === 0).length
/** Quanti clienti, in tutte le botteghe in mappa, hanno già la loro roba: il pallino. */
export const daConsegnareOvunque = f => botteghePosate(f).reduce((n, t) => n + daConsegnareIn(f, t), 0)

/** Quello che il foglio deve sapere, già contato. Una bottega non in mappa (o chiusa dal livello) lo dice nello `stato`. */
export function vistaDellaBottega(f, tipo, ora = f.ora()) {
  const E = EDIFICI[tipo]
  if (!E || !E.bottega) return null
  aggiornaLaBottega(f, tipo, ora, f.rnd)
  const base = { tipo, nome: E.nome, emoji: E.emoji, liv: E.liv, prezzo: E.prezzo }
  if (!posata(f, tipo)) return { ...base, stato: 'non-tua', fama: famaDi(null), banconi: [], pronti: 0 }
  const s = (f.s.botteghe && f.s.botteghe[tipo]) || { consegne: 0, banconi: [] }
  let pronti = 0
  const banconi = s.banconi.map((x, i) => {
    if (x && x.chiede) {
      const chiede = Object.entries(x.chiede).map(([k, n]) => {
        const ha = f.scortaDi(k), m = faccia(k)
        return { k, n, nome: m.nome, emoji: m.emoji, ha: Math.min(ha, n), manca: Math.max(0, n - ha) }
      })
      const pronto = chiede.every(c => !c.manca)
      if (pronto) pronti++
      return { i, id: x.id, cliente: clienteDi2D(x.chi), chiede, xp: x.xp, pronto }
    }
    return { i, attesa: true, minuti: x && x.dal ? Math.max(0, Math.ceil((x.dal - ora) / MINUTO)) : 0 }
  })
  return { ...base, stato: 'aperta', fama: famaDi(s), banconi, pronti }
}

export function guastiDelleBotteghe() {
  const g = []
  if (!(PEZZI_MIN >= 1 && PEZZI_MIN <= PEZZI_MAX && PEZZI_MAX <= 8)) g.push('i pezzi di una bottega non stanno fra uno e uno scomparto')
  if (!(ATTESA_MIN > 0 && ATTESA_MIN <= ATTESA_MAX)) g.push('l\'attesa del cliente dopo è impossibile')
  if (!(CUORI >= 1 && BANCONI_MAX >= 1)) g.push('la fama non fa crescere niente')
  for (const tipo of TIPI_DI_BOTTEGA) {
    const B = BOTTEGHE[tipo], E = EDIFICI[tipo]
    if (!E || !E.bottega) { g.push(`${tipo}: manca nel catalogo`); continue }
    if (!B.clienti.length) g.push(`${tipo}: non ha clienti`)
    if (B.merci.length < 3) g.push(`${tipo}: ha solo ${B.merci.length} merci che la 3D fa`)
    // la bottega arriva con almeno tre merci già consegnabili (come in 2D: guastiDegliSblocchi)
    const subito = B.merci.filter(k => livelloDellaMerce(k) <= E.liv)
    if (subito.length < 3) g.push(`${tipo}: al livello ${E.liv} si possono chiedere solo ${subito.length} merci`)
    for (const k of B.merci) {
      if (!Number.isFinite(livelloDellaMerce(k))) g.push(`${tipo}: ${k} non si fa in nessun modo`)
      // il tetto, come al banco: un quarto in più non basta a garantirlo, va ricontrollato sul caso peggiore (i minuti sono quelli della 3D)
      for (let n = PEZZI_MIN; n <= PEZZI_MAX; n++) {
        const reso = premioInBottega(prodotto2D(k), n), tetto = tettoDi({ [k]: n })
        if (!(reso <= tetto + 1e-9)) g.push(`${tipo}: ${n} ${k} rendono ${reso} e il tetto è ${tetto.toFixed(1)}`)
      }
    }
  }
  return g
}
