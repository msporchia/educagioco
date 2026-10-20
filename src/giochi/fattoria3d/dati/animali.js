/* Gli animali da cortile: il pollaio (galline, uova) e la stalla (mucche, latte). Sono pezzi del catalogo come il recinto, ma
   più semplici delle pecore: una bestia nutrita ci mette un tempo e poi ha il suo prodotto, che aspetta finché non lo si
   raccoglie. I prodotti (`uova`, `latte`) stanno in `stato.prodotti` come quelli delle macchine ma non sono ricette: sono
   ingredienti delle ricette. Il tempo è da prova. Vedi docs/fattoria3d/animali.md.
   Le bestie si comprano dentro l'edificio (recinto, pollaio, stalla allo stesso modo): una è nel prezzo del pezzo, le altre una
   per volta, ognuna più cara della precedente, fino alla capienza (`posti`); il livello apre il pezzo, non i posti. */
import { COLTURE } from './colture.js'
import { PECORE } from './regole.js'

export const ANIMALI = {
  pollaio: {
    bestia: 'gallina', bestie: 'galline', emoji: '🐔', prodotto: 'uova', evento: 'uovo',
    ms: 25000,                    // dal pasto all'uovo
    mangia: ['grano', 'mais'],    // cosa si dà da mangiare (dalla scorta più grande di queste)
    pasti: 1,                     // raccolti per pasto
    posti: 6,                     // galline al massimo (la capienza del pollaio)
    prezzoBestia: 25,             // la seconda gallina; ogni altra costa `rincaroBestia` in più della precedente
    rincaroBestia: 12,
  },
  stalla: {
    bestia: 'mucca', bestie: 'mucche', emoji: '🐄', prodotto: 'latte', evento: 'latte',
    ms: 40000,
    mangia: ['mais', 'carota'],
    pasti: 2,
    posti: 4,
    prezzoBestia: 60,
    rincaroBestia: 30,
  },
}
export const TIPI_DI_ANIMALI = Object.keys(ANIMALI)

/** Tutti i pezzi che tengono bestie, con la stessa forma: il recinto (pecore, `PECORE.max` posti) e i due del cortile. */
export const CORTILE = {
  recinto: { bestia: 'pecora', bestie: 'pecore', emoji: '🐑', posti: PECORE.max, prezzoBestia: 40, rincaroBestia: 20 },
  ...ANIMALI,
}
export const TIPI_DEL_CORTILE = Object.keys(CORTILE)

/** Quanto costa la prossima bestia di un pezzo che ne ha già `n` (la prima è nel prezzo del pezzo); null se è pieno. */
export function prezzoDellaBestia(tipo, n) {
  const a = CORTILE[tipo]
  return a && n >= 1 && n < a.posti ? a.prezzoBestia + a.rincaroBestia * (n - 1) : null
}

// I prodotti degli animali: l'id è la chiave di `stato.prodotti` (è anche quello della 2D); `pezzo` la faccia nell'atlante; `dove` il pezzo che li fa.
export const PRODOTTI_ANIMALI = {
  uova:  { nome: 'Uova',  emoji: '🥚', pezzo: 'merce_uova', dove: 'pollaio' },
  latte: { nome: 'Latte', emoji: '🥛', pezzo: 'latte', dove: 'stalla' },
}

/** La lana è l'unica merce delle bestie che non sta in `stato.prodotti`: il contatore `stato.lana` (la tosa, la mongolfiera). È l'ingrediente del
    telaio e della sartoria, come nella 2D. `dove` è il pezzo che la fa; `ms` quanto ci vuole per averne una: il tempo della lana (PECORE.laneMs) più i pasti che chiede,
    contati sul grano come per le uova (`msDelProdotto`). */
export const LANA = {
  lana: { nome: 'Lana', emoji: '🧶', pezzo: 'merce_lana', dove: 'recinto', ms: PECORE.laneMs + (PECORE.pastiPerLana || 0) * COLTURE.grano.ms },
}

/** Quanto ci vuole per averne uno: il suo tempo più il raccolto che mangia (il primo della lista), per i calcoli degli ordini. */
export function msDelProdotto(k) {
  const p = PRODOTTI_ANIMALI[k], a = p && ANIMALI[p.dove]
  return a ? a.ms + a.pasti * COLTURE[a.mangia[0]].ms : Infinity
}

export function guastiDegliAnimali(pezzi) {
  const g = []
  for (const [t, a] of Object.entries(ANIMALI)) {
    if (!pezzi[t]) g.push(`${t}: animale senza pezzo nel catalogo`)
    if (!a.bestia || !a.bestie || !a.emoji) g.push(`${t}: manca nome o emoji`)
    if (!(a.ms >= 1000)) g.push(`${t}: tempo sotto il secondo`)
    if (!(a.pasti >= 1)) g.push(`${t}: nessun pasto`)
    if (!a.mangia.length || a.mangia.some(k => !COLTURE[k])) g.push(`${t}: mangia qualcosa che non è un raccolto`)
  }
  for (const [t, a] of Object.entries(CORTILE)) {
    if (!(a.posti >= 2)) g.push(`${t}: la capienza non basta per comprare una bestia`)
    if (!(a.prezzoBestia > 0) || !(a.rincaroBestia >= 0)) g.push(`${t}: il prezzo della bestia non torna`)
  }
  for (const [t, a] of Object.entries(ANIMALI)) {
    if (!PRODOTTI_ANIMALI[a.prodotto] || PRODOTTI_ANIMALI[a.prodotto].dove !== t) g.push(`${t}: il prodotto non torna`)
  }
  for (const [k, p] of Object.entries(LANA)) {
    if (COLTURE[k] || PRODOTTI_ANIMALI[k]) g.push(`${k}: la lana con l'id di un'altra merce`)
    if (!p.nome || !p.emoji || !p.pezzo || !CORTILE[p.dove]) g.push(`${k}: nome, emoji o pezzo sbagliati`)
  }
  for (const [k, p] of Object.entries(PRODOTTI_ANIMALI)) {
    if (COLTURE[k]) g.push(`${k}: un prodotto con l'id di una coltura`)
    if (!p.nome || !p.emoji || !p.pezzo || !ANIMALI[p.dove]) g.push(`${k}: nome, emoji o pezzo sbagliati`)
  }
  return g
}
