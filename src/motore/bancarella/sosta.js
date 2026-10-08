// La giornata lasciata a metà (docs/bancarella/regole.md, «Lasciare a metà»).
// Si scrive quello che è successo: a che banco si è, cuori e conti, le ceste
// sul banco (in ordine), chi è in fila e con quanta pazienza, e il cliente a
// metà com'è (cosa ha già preso, le monete posate, la cifra battuta, gli
// errori; gli intoppi già fatti, che decidono le stelle). Prezzi, resti e
// tempi si rifanno dal listino e dalla giornata.
import { CAMPAGNE, LIBERA, BANCHI, TAGLI, campagnaDi, tappaDi, merceDi, scomponi,
         chiaveResto } from '../../data/bancarella.js'

export const VERSIONE = 1

const intero = (n, min = 0) => Number.isInteger(n) && n >= min
const numero = n => typeof n === 'number' && Number.isFinite(n)
const tondo = n => Math.round(n * 1000) / 1000

// la giornata per id, non per indice: -1 è la giornata libera
function giornataDi(id) {
  if (id === LIBERA.id) return -1
  const i = CAMPAGNE.findIndex(c => c.id === id)
  return i >= 0 ? i : null
}

/* `g` è la fotografia della schermata: { idx, nTappa, hud, esposti, coda,
   momento, presi, piatto, digitato, contoFatto, rifiuti, cartello,
   trascorso, monete, finita }. Una giornata finita non si scrive. */
export function scrivi(g) {
  if (!g || g.finita || !g.coda || !g.coda.length) return null
  const camp = campagnaDi(g.idx)
  const dato = {
    v: VERSIONE, giornata: camp.id, tappa: g.nTappa,
    cuori: g.hud.cuori, serviti: g.hud.serviti, perfetti: g.hud.perfetti, incasso: g.hud.incasso,
    intoppi: g.hud.intoppi || 0,
    esposti: g.esposti.map(p => p.emoji),
    fila: g.coda.map(c => ({ articoli: c.articoli.map(a => [a.emoji, a.quanti]), paga: c.paga,
                             faccia: c.faccia, vestito: c.vestito, resta: tondo(c.restaPazienza) })),
    cartello: !!g.cartello,
    monete: { chiesto: g.monete?.chiesto || 0, dato: g.monete?.dato || 0 },
  }
  // col cartello del banco su, il primo cliente non è ancora arrivato
  if (!g.cartello) dato.banco = {
    momento: g.momento, presi: [...g.presi], piatto: [...g.piatto], digitato: g.digitato || '',
    contoFatto: !!g.contoFatto, rifiuti: g.rifiuti || 0, trascorso: Math.round(g.trascorso || 0),
  }
  return dato
}

// un cliente rifatto dal listino: quello che `generaCliente` aveva calcolato
function cliente(t, esposti, f) {
  if (!f || !Array.isArray(f.articoli) || !f.articoli.length || !intero(f.paga, 1) ||
      !numero(f.resta)) return null
  const articoli = []
  for (const [emoji, quanti] of f.articoli) {
    const m = esposti.find(p => p.emoji === emoji)
    if (!m || !intero(quanti, 1) || quanti > 3 || articoli.some(a => a.emoji === emoji)) return null
    articoli.push({ ...m, quanti })
  }
  const pezzi = articoli.reduce((s, a) => s + a.quanti, 0)
  const totale = articoli.reduce((s, a) => s + a.prezzo * a.quanti, 0)
  const resto = f.paga - totale
  const pezziResto = scomponi(resto, t.monete)
  if (resto <= 0 || pezziResto.reduce((s, v) => s + v, 0) !== resto) return null
  const pazienza = t.tempo + 8 * (pezzi - 3)
  return { faccia: String(f.faccia || '🧑'), vestito: String(f.vestito || '#e2725b'),
           articoli, pezzi, totale, paga: f.paga, resto,
           conto: t.conto, chiediTotale: !!t.chiediTotale, chiediResto: !!t.chiediResto,
           pagaCon: scomponi(f.paga, TAGLI), banco: t.banco, pazienza, monete: t.monete,
           chiave: chiaveResto(resto), minimo: pezziResto.length,
           restaPazienza: Math.min(pazienza, f.resta) }
}

// il cliente al banco com'era: `null` se non torna con quello che chiede
function alBanco(c, b) {
  if (!b || !['raccolta', 'cassa'].includes(b.momento) || !Array.isArray(b.presi) ||
      !Array.isArray(b.piatto) || typeof b.digitato !== 'string' || !/^[\d,]{0,8}$/.test(b.digitato) ||
      !intero(b.rifiuti) || !numero(b.trascorso)) return null
  const quanti = e => b.presi.filter(x => x === e).length
  if (b.presi.some(e => !c.articoli.some(a => a.emoji === e))) return null
  if (c.articoli.some(a => quanti(a.emoji) > a.quanti)) return null
  const tutto = c.articoli.every(a => quanti(a.emoji) === a.quanti)
  if ((b.momento === 'cassa') !== tutto) return null
  if (b.momento === 'raccolta' && b.piatto.length) return null
  if (b.piatto.some(v => !c.monete.includes(v))) return null
  const posato = b.piatto.reduce((s, v) => s + v, 0)
  // dove la cassa conta il resto non si posa oltre, e a resto pari era già consegnato
  if (!c.chiediResto && posato >= c.resto) return null
  const contoFatto = !!b.contoFatto && c.chiediTotale
  if (c.chiediTotale && !contoFatto && b.piatto.length) return null
  return { momento: b.momento, presi: [...b.presi], piatto: [...b.piatto],
           digitato: contoFatto ? '' : b.digitato, contoFatto, rifiuti: b.rifiuti,
           trascorso: Math.max(0, b.trascorso) }
}

/* Rimette la giornata: { idx, camp, nTappa, hud, esposti, coda, banco,
   cartello, monete }, o `null` se il salvataggio non torna (versione,
   giornata sparita, merce tolta dal listino): chi chiama butta la sosta. */
export function leggi(dato) {
  if (!dato || dato.v !== VERSIONE) return null
  const idx = giornataDi(dato.giornata)
  if (idx === null || !intero(dato.tappa)) return null
  const camp = campagnaDi(idx)
  if (!camp.libera && dato.tappa >= camp.tappe.length) return null
  const t = tappaDi(camp, dato.tappa)
  if (!intero(dato.cuori, 1) || !intero(dato.serviti) || !intero(dato.perfetti) ||
      !intero(dato.incasso)) return null

  const merce = merceDi(t.passo, t.banco)
  if (!Array.isArray(dato.esposti) || !dato.esposti.length) return null
  const esposti = dato.esposti.map(e => merce.find(p => p.emoji === e))
  if (esposti.some(p => !p) || new Set(dato.esposti).size !== esposti.length) return null

  if (!Array.isArray(dato.fila) || !dato.fila.length) return null
  const coda = dato.fila.map(f => cliente(t, esposti, f))
  if (coda.some(c => !c)) return null

  const banco = dato.cartello ? null : alBanco(coda[0], dato.banco)
  if (!dato.cartello && !banco) return null
  const m = dato.monete || {}
  return { idx, camp, nTappa: dato.tappa, t, esposti, coda, banco, cartello: !!dato.cartello,
           hud: { cuori: dato.cuori, serviti: dato.serviti, perfetti: dato.perfetti,
                  incasso: dato.incasso, intoppi: intero(dato.intoppi) ? dato.intoppi : 0 },
           monete: { chiesto: intero(m.chiesto) ? m.chiesto : 0, dato: intero(m.dato) ? m.dato : 0 } }
}

// cosa dice la mappa in cima, senza aprire la giornata: solo se si rilegge tutta
export function dice(dato) {
  const g = leggi(dato)
  if (!g) return null
  return { emoji: g.camp.emoji, nome: g.camp.nome, libera: !!g.camp.libera,
           banco: BANCHI[g.t.banco], n: g.nTappa + 1, di: g.camp.libera ? 0 : g.camp.tappe.length,
           cuori: g.hud.cuori, serviti: g.hud.serviti }
}
