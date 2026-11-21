/* LA CUCINA IN DUE — due cuochi nella stessa stanza, su due telefoni che si scambiano le mosse (docs/core/insieme.md). I conti
   non passano di qui: li fa ognuno sul suo telefono, e all'altro arriva solo che sta calcolando e che ha finito.
   Vedi docs/bancarella/in-due.md. Puro, gira in Node. */
import { cucinaNuova, passoCuoco, passoStanza, usa, tocca, vaiA, arriva, consegna, cheManca } from './cucina.js'
import { RICETTE, MINUTI_IN_DUE, MENU_IN_DUE, campInDue } from '../../data/bancarella-cucine.js'
import { chiaveVeste } from '../../data/bancarella-cuochi.js'

export const PASSO = 0.05          // i secondi di un tick
const VERSIONE = 2                 // la 2 manda com'è fatto il proprio cuoco (`veste`)
const IN_LISTA = 4                 // le ordinazioni che si vedono
const STACCO = 15                  // all'inizio scadono una dopo l'altra
// quello che è di ogni cuoco: nella stanza ci sta il cuoco di turno (`conCuoco`), così il motore di uno solo resta com'è
const DEL_CUOCO = ['cuoco', 'fila', 'strada', 'arrivato', 'perche', 'tagliando', 'colpo', 'lavando', 'lavata']

export const altroDi = ruolo => (ruolo === 'host' ? 'ospite' : 'host')

function conCuoco(S, ruolo, fa) {
  const c = S.cucina, io = S.cuochi[ruolo]
  for (const k of DEL_CUOCO) c[k] = io[k]
  const esito = fa(c)
  for (const k of DEL_CUOCO) io[k] = c[k]
  return esito
}

// il caso col suo stato dentro la partita: la fotografia lo porta con sé
function caso(S, n) {
  S.seme = (Math.imul(S.seme, 1664525) + 1013904223) >>> 0
  return Math.floor(S.seme / 4294967296 * n)
}

function nuovaOrdinazione(S, ritardo = 0) {
  const ricette = S.cucina.ricette, tempo = MENU_IN_DUE[S.menu].tempo + ritardo
  S.ordini.push({ id: ++S.ordinazioni, piatto: ricette[caso(S, ricette.length)].emoji, tempo, resta: tempo, di: '', auto: false, paga: false })
}

export function partitaNuova({ seme, minuti, menu }) {
  const c = cucinaNuova(campInDue(menu))
  const cuocoDa = x => ({ cuoco: { ...c.cuoco, x }, fila: [], strada: [], arrivato: '', perche: '', tagliando: '', colpo: 0, lavando: false, lavata: 0,
                          calcola: 0, fatti: 0, detti: 0, detto: '', veste: '' })
  const S = { seme: seme >>> 0, menu, resta: minuti * 60, cucina: c, ordini: [], ordinazioni: 0, scadute: 0, serviti: { host: 0, ospite: 0 }, fine: null,
              cuochi: { host: cuocoDa(1.5), ospite: cuocoDa(c.largo - 1.5) } }
  for (let i = 0; i < IN_LISTA; i++) nuovaOrdinazione(S, i * STACCO)
  return S
}

/* Quale ordinazione prende il piatto di questo cuoco: la sua, se no una libera. */
const daServire = (S, ruolo, emoji) => S.ordini.find(o => !o.paga && o.piatto === emoji && o.di === ruolo) ||
  S.ordini.find(o => !o.paga && o.piatto === emoji && !o.di)

const lasciaLaStrada = (S, ruolo) => { for (const o of S.ordini) if (o.di === ruolo && o.auto) { o.di = ''; o.auto = false } }

/* Chi va a consegnare si prende l'ordinazione da solo: se cambia strada, la lascia. */
function vaAConsegnare(S, ruolo, id) {
  lasciaLaStrada(S, ruolo)
  const m = S.cuochi[ruolo].cuoco.mano
  if (S.cucina.celle.find(k => k.id === id)?.tipo !== 'consegna' || !m?.pronto || m.nudo) return
  const o = daServire(S, ruolo, m.pronto)
  if (o && !o.di) { o.di = ruolo; o.auto = true }
}

function serve(S, ruolo, c) {
  const io = S.cuochi[ruolo], m = c.cuoco.mano, emoji = m?.nudo ? '' : m?.pronto
  const o = emoji && daServire(S, ruolo, emoji)
  if (!o) {
    const libere = S.ordini.filter(x => !x.paga)
    c.perche = !m ? 'Qui si porta il piatto finito'
      : emoji && libere.some(x => x.piatto === emoji) ? 'Questa l\'ha prenotata l\'altro cuoco'
      : cheManca(c, m, libere.map(x => x.piatto))
    return false
  }
  consegna(c, [emoji])
  Object.assign(o, { di: ruolo, auto: false, paga: true })
  io.calcola = o.id
  return true
}

function agisci(S, ruolo, c) {
  const posto = arriva(c), io = S.cuochi[ruolo]
  if (posto.tipo === 'consegna' ? serve(S, ruolo, c) : usa(c, posto)) io.fatti++
  else if (c.perche) { io.detti++; io.detto = c.perche }
}

export function avanza(S) {
  if (S.fine) return
  S.resta -= PASSO
  if (S.resta <= 0) { S.fine = 'tempo'; return }
  passoStanza(S.cucina, PASSO)
  for (const ruolo of ['host', 'ospite']) {
    if (S.cuochi[ruolo].calcola) continue         // sta facendo i conti: è fermo, e sopra ha la calcolatrice
    conCuoco(S, ruolo, c => {
      passoCuoco(c, PASSO)
      if (c.arrivato) agisci(S, ruolo, c)
    })
  }
  // mentre si fanno i conti l'ordinazione non scade: la fretta sta nel muoversi
  for (const o of S.ordini) if (!o.paga) o.resta -= PASSO
  const prima = S.ordini.length
  S.ordini = S.ordini.filter(o => o.paga || o.resta > 0)
  S.scadute += prima - S.ordini.length
  while (S.ordini.length < IN_LISTA) nuovaOrdinazione(S)
}

export function applica(S, ruolo, [che, a, b]) {
  const io = S.cuochi[ruolo]
  if (che === 'prenota') {
    const o = S.ordini.find(x => x.id === a)
    if (!o || o.paga || (o.di && o.di !== ruolo)) return
    Object.assign(o, { di: o.di === ruolo && !o.auto ? '' : ruolo, auto: false })
  } else if (che === 'pagata') {
    if (io.calcola !== a) return
    S.ordini = S.ordini.filter(o => o.id !== a)
    S.serviti[ruolo]++
    io.calcola = 0
  } else if (che === 'veste') io.veste = chiaveVeste(a)      // com'è fatto il suo cuoco: solo da guardare, non cambia la partita
  else if (io.calcola) return
  else if (che === 'tocca') { vaAConsegnare(S, ruolo, a); conCuoco(S, ruolo, c => tocca(c, a)) }
  else if (che === 'vai') { lasciaLaStrada(S, ruolo); conCuoco(S, ruolo, c => vaiA(c, a, b)) }
}

const cella = /^\d{1,2},\d{1,2}$/
const piccolo = n => Number.isInteger(n) && n >= 0 && n < 1e6
export function mossaValida(m) {
  if (!Array.isArray(m)) return false
  if (m[0] === 'tocca') return m.length === 2 && typeof m[1] === 'string' && cella.test(m[1])
  if (m[0] === 'vai') return m.length === 3 && piccolo(m[1]) && piccolo(m[2])
  if (m[0] === 'veste') return m.length === 2 && typeof m[1] === 'string' && m[1].length <= 160
  return (m[0] === 'prenota' || m[0] === 'pagata') && m.length === 2 && piccolo(m[1])
}

const centesimi = n => Math.round(n * 100)
export function improntaDi(S) {
  const [h, o] = [S.cuochi.host, S.cuochi.ospite]
  return [centesimi(S.resta), S.ordinazioni, S.scadute, S.serviti.host, S.serviti.ospite, S.ordini.length, S.cucina.puliti, S.cucina.sporchi,
          centesimi(h.cuoco.x), centesimi(h.cuoco.z), centesimi(o.cuoco.x), centesimi(o.cuoco.z), h.calcola, o.calcola, S.seme]
}

/* Il motore del lockstep attorno a una partita. */
export function motoreDi(S) {
  return {
    S,
    passo: PASSO,
    avanza: () => avanza(S),
    applica: (ruolo, mossa) => applica(S, ruolo, mossa),
    valida: mossaValida,
    impronta: () => improntaDi(S),
    simili: (a, b) => a.length === b.length && a.every((n, i) => n === b[i]),
    foto: () => JSON.parse(JSON.stringify(S)),
    rimetti: f => Object.assign(S, JSON.parse(JSON.stringify(f))),
    fine: () => S.fine,
    finisci: f => { if (f === 'tempo') S.fine = f },
  }
}

/* La regola per l'Incontro: chi crea sceglie `{ minuti, menu }`. */
export const regolaCucina = ({ firma = RICETTE.length } = {}) => ({
  versione: `cucina:${VERSIONE}:${firma}`,
  proponi: ({ minuti, menu, seme = (Math.random() * 2 ** 31) | 0 }) => ({ seme, minuti, menu }),
  accetta: p => (Number.isInteger(p?.seme) && MINUTI_IN_DUE.includes(p.minuti) && MENU_IN_DUE[p.menu] ? null : 'proposta'),
  crea: proposta => motoreDi(partitaNuova(proposta)),
})

/* Come vede la stanza chi gioca qui: il suo cuoco è `cuoco`, l'altro sta in `altro`. Riempie sempre lo stesso oggetto: la scena lo legge. */
export const vistaDi = (S, ruolo, v = {}) =>
  Object.assign(v, S.cucina, S.cuochi[ruolo], { mio: ruolo, altro: S.cuochi[altroDi(ruolo)] })
