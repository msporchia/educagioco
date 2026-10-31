/* Il pentolone e le tre bestie che mangiano da lui (anatre, maiali, capre): i dati del giro G4 della parità con la fattoria di sempre
   (docs/fattoria3d/parita/). Dal giro G3 livelli, prezzi e tempi sono quelli della 2D (dati/parita2d.js: pentolone 23, stagno delle anatre 24,
   porcile 28, capre 40; il tempo di una bestia è la sua ricetta, uova d'anatra 6 min, pancetta 20, latte di capra 12). Restano solo 3D le
   capienze e il prezzo delle singole bestie dentro il recinto (`posti`, `prezzoBestia`, `rincaroBestia`): nella 2D non esistono (c'è la fila di
   un posto per macchina). Tutto il resto (id, ingredienti, quantità, cosa mangia chi) è quello della 2D (`src/giochi/fattoria3d/da2d/dati/coltivazioni.js`).
   Importa solo `parita2d.js`: `mangime.js`, `animali.js`, `catalogo.js` e `ricette.js` leggono da qui. Vedi docs/fattoria3d/cortile-e-pentolone.md. */
import { numeriRicetta as N, prezzoDa2D, livelloDa2D, crescitaDa2D, bestia2d, msDaMinuti } from './parita2d.js'

// ── i numeri: prezzi e livelli dei pezzi e tempi delle bestie sono della 2D; capienze e prezzo delle bestie sono solo 3D ──
export const NUMERI_DEL_CORTILE = {
  pentolone: { liv: livelloDa2D('pentolone'), prezzo: prezzoDa2D('pentolone') },
  anatre:    { liv: livelloDa2D('anatre'),  prezzo: prezzoDa2D('anatre'),  posti: 6, prezzoBestia: 30, rincaroBestia: 14, ms: msDaMinuti(bestia2d('anatre').minuti) },
  porcile:   { liv: livelloDa2D('porcile'), prezzo: prezzoDa2D('porcile'), posti: 4, prezzoBestia: 70, rincaroBestia: 35, ms: msDaMinuti(bestia2d('porcile').minuti) },
  capre:     { liv: livelloDa2D('capre'),   prezzo: prezzoDa2D('capre'),   posti: 4, prezzoBestia: 75, rincaroBestia: 35, ms: msDaMinuti(bestia2d('capre').minuti) },
}

// ── le ricette del pentolone: id, ingredienti, quantità e tempo (minuti → secondi) sono quelli della 2D ──
// `da`: il prodotto, se non è l'id (la seconda strada del pastone). Sono tutte mangime: non si consegnano.
export const RICETTE_PENTOLONE = {
  beverone:   { nome: 'Verdure lesse',   emoji: '🍢', pezzo: 'cassetta_raccolto', mangime: true, ing: { patata: 2, cavolfiore: 1 }, ...N('beverone') },
  zuppa:      { nome: 'Pastone',         emoji: '🫕', pezzo: 'merce_zuppa',       mangime: true, ing: { zucca: 2 }, ...N('zuppa') },
  zuppa_orto: { nome: 'Pastone d\'orto', emoji: '🫕', pezzo: 'merce_zuppa', da: 'zuppa', mangime: true, ing: { pomodoro: 2 }, ...N('zuppa_orto') },
  pastura:    { nome: 'Verdura fresca',  emoji: '🥒', pezzo: 'cassetta1',         mangime: true, ing: { carota: 2, cavolfiore: 1 }, ...N('pastura') },
}

// ── il pezzo del catalogo del pentolone (un edificio unico come gli altri) ──
export const EDIFICIO_PENTOLONE = { nome: 'Pentolone', emoji: '🍲', art: 'il', w: 3, d: 3, prezzo: NUMERI_DEL_CORTILE.pentolone.prezzo, categoria: 'edifici', liv: NUMERI_DEL_CORTILE.pentolone.liv }

// ── i tre recinti nuovi come pezzi del catalogo (animali, produttivi; rincarano a ogni copia come nella 2D) ──
export const PEZZI_DEL_CORTILE = {
  anatre:  { nome: 'Stagno delle anatre', emoji: '🦆', w: 4, d: 3, prezzo: NUMERI_DEL_CORTILE.anatre.prezzo,  rincaro: Math.round(NUMERI_DEL_CORTILE.anatre.prezzo * crescitaDa2D('anatre')), cresce: crescitaDa2D('anatre'), categoria: 'animali', liv: NUMERI_DEL_CORTILE.anatre.liv,  produttivo: true },
  porcile: { nome: 'Porcile',             emoji: '🐖', w: 4, d: 3, prezzo: NUMERI_DEL_CORTILE.porcile.prezzo, rincaro: Math.round(NUMERI_DEL_CORTILE.porcile.prezzo * crescitaDa2D('porcile')), cresce: crescitaDa2D('porcile'), categoria: 'animali', liv: NUMERI_DEL_CORTILE.porcile.liv, produttivo: true },
  capre:   { nome: 'Capre',               emoji: '🐐', w: 4, d: 3, prezzo: NUMERI_DEL_CORTILE.capre.prezzo,   rincaro: Math.round(NUMERI_DEL_CORTILE.capre.prezzo * crescitaDa2D('capre')), cresce: crescitaDa2D('capre'), categoria: 'animali', liv: NUMERI_DEL_CORTILE.capre.liv,   produttivo: true },
}

// ── le bestie nuove, nella forma di `ANIMALI` (dati/animali.js). Cosa mangiano e quanto è della 2D: anatre 1 verdure lesse → uova d'anatra,
//    maiali 2 pastone → pancetta (in 2D `tartufi`), capre 1 verdura fresca → latte di capra. Uova e latte sono gli stessi `uova` e `latte` di pollaio e stalla (come in 2D: `da: 'uova'`). ──
export const ANIMALI_DEL_CORTILE = {
  anatre: {
    bestia: 'anatra', bestie: 'anatre', emoji: '🦆', prodotto: 'uova', evento: 'uovo',
    ms: NUMERI_DEL_CORTILE.anatre.ms, costo: bestia2d('anatre').costo, mangia: ['beverone'], pasti: 1,
    posti: NUMERI_DEL_CORTILE.anatre.posti, prezzoBestia: NUMERI_DEL_CORTILE.anatre.prezzoBestia, rincaroBestia: NUMERI_DEL_CORTILE.anatre.rincaroBestia,
  },
  porcile: {
    bestia: 'maiale', bestie: 'maiali', emoji: '🐖', prodotto: 'pancetta', evento: 'pancetta',
    ms: NUMERI_DEL_CORTILE.porcile.ms, costo: bestia2d('porcile').costo, mangia: ['zuppa'], pasti: 2,
    posti: NUMERI_DEL_CORTILE.porcile.posti, prezzoBestia: NUMERI_DEL_CORTILE.porcile.prezzoBestia, rincaroBestia: NUMERI_DEL_CORTILE.porcile.rincaroBestia,
  },
  capre: {
    bestia: 'capra', bestie: 'capre', emoji: '🐐', prodotto: 'latte', evento: 'latte',
    ms: NUMERI_DEL_CORTILE.capre.ms, costo: bestia2d('capre').costo, mangia: ['pastura'], pasti: 1,
    posti: NUMERI_DEL_CORTILE.capre.posti, prezzoBestia: NUMERI_DEL_CORTILE.capre.prezzoBestia, rincaroBestia: NUMERI_DEL_CORTILE.capre.rincaroBestia,
  },
}

/** L'unica merce nuova delle bestie: l'id è `pancetta` (in 2D è `tartufi`, la ricetta 2D del porcile resta in dati/parita2d.js: la mappa è esplicita; il tartufo sembrava una cacca, come Hay Day
    il maiale fa la pancetta; le scorte 2D di tartufi non passano: migra.js le lascia «da regalare»). Senza `pezzo` (`aspetta`: lo sprite d'atlante non c'è ancora): la faccia è l'emoji (Faccia.vue). Le tre ricette che la usano: dati/pancetta.js (numeri provvisori). Vedi docs/fattoria3d/cortile-e-pentolone.md. */
export const PANCETTA = { nome: 'Pancetta', emoji: '🥓', aspetta: 'merce_pancetta', silo: 'stalla', dove: 'porcile' }
