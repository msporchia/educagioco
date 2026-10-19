/* Gli animali da cortile: il pollaio (galline, uova) e la stalla (mucche, latte). Sono pezzi del catalogo come il recinto, ma
   più semplici delle pecore: una bestia nutrita ci mette un tempo e poi ha il suo prodotto, che aspetta finché non lo si
   raccoglie. I prodotti (`uova`, `latte`) stanno in `stato.prodotti` come quelli delle macchine ma non sono ricette: sono
   ingredienti delle ricette. Il tempo e i posti sono da prova. Vedi docs/fattoria3d/animali.md. */
import { COLTURE } from './colture.js'

export const ANIMALI = {
  pollaio: {
    bestia: 'gallina', bestie: 'galline', emoji: '🐔', prodotto: 'uova', evento: 'uovo',
    ms: 25000,                    // dal pasto all'uovo
    mangia: ['grano', 'mais'],    // cosa si dà da mangiare (dalla scorta più grande di queste)
    pasti: 1,                     // raccolti per pasto
    posti: 3,                     // galline al massimo
    livelliPosti: [0, 2, 4],      // a quanti livelli DOPO quello del pezzo si apre ogni posto: il primo è nel prezzo
    prezzoBestia: 12,
  },
  stalla: {
    bestia: 'mucca', bestie: 'mucche', emoji: '🐄', prodotto: 'latte', evento: 'latte',
    ms: 40000,
    mangia: ['mais', 'carota'],
    pasti: 2,
    posti: 2,
    livelliPosti: [0, 3],
    prezzoBestia: 30,
  },
}
export const TIPI_DI_ANIMALI = Object.keys(ANIMALI)

// I prodotti degli animali: l'id è la chiave di `stato.prodotti`; `dove` è il pezzo che li fa.
export const PRODOTTI_ANIMALI = {
  uova:  { nome: 'Uova',  emoji: '🥚', dove: 'pollaio' },
  latte: { nome: 'Latte', emoji: '🥛', dove: 'stalla' },
}

/** Quanto ci vuole per averne uno: il suo tempo più il raccolto che mangia (il primo della lista), per i calcoli degli ordini. */
export function msDelProdotto(k) {
  const p = PRODOTTI_ANIMALI[k], a = p && ANIMALI[p.dove]
  return a ? a.ms + a.pasti * COLTURE[a.mangia[0]].ms : Infinity
}

/** Quanti posti sono aperti, dato il livello a cui il pollaio (o la stalla) si è comprato e quello di oggi. */
export function postiAl(tipo, livelloDelPezzo, livello) {
  const a = ANIMALI[tipo]
  return a ? a.livelliPosti.filter(o => livelloDelPezzo + o <= livello).length : 0
}

export function guastiDegliAnimali(pezzi) {
  const g = []
  for (const [t, a] of Object.entries(ANIMALI)) {
    if (!pezzi[t]) g.push(`${t}: animale senza pezzo nel catalogo`)
    if (!a.bestia || !a.bestie || !a.emoji) g.push(`${t}: manca nome o emoji`)
    if (!(a.ms >= 1000)) g.push(`${t}: tempo sotto il secondo`)
    if (!(a.pasti >= 1)) g.push(`${t}: nessun pasto`)
    if (!a.mangia.length || a.mangia.some(k => !COLTURE[k])) g.push(`${t}: mangia qualcosa che non è un raccolto`)
    if (a.livelliPosti.length !== a.posti || a.livelliPosti[0] !== 0 || a.livelliPosti.some((o, i) => i && o <= a.livelliPosti[i - 1])) g.push(`${t}: i livelli dei posti non tornano`)
    if (!(a.prezzoBestia > 0)) g.push(`${t}: la bestia non costa`)
    if (!PRODOTTI_ANIMALI[a.prodotto] || PRODOTTI_ANIMALI[a.prodotto].dove !== t) g.push(`${t}: il prodotto non torna`)
  }
  for (const [k, p] of Object.entries(PRODOTTI_ANIMALI)) {
    if (COLTURE[k]) g.push(`${k}: un prodotto con l'id di una coltura`)
    if (!p.nome || !p.emoji || !ANIMALI[p.dove]) g.push(`${k}: nome, emoji o pezzo sbagliati`)
  }
  return g
}
