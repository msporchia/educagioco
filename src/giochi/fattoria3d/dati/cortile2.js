/* Il secondo cortile: conigliera, alpaca, asini e arnie, e le merci che portano (lana d'angora e d'alpaca, concime, miele, fiori per le api,
   la merenda e le caramelle): i dati del giro G5 della parità con la fattoria di sempre (docs/fattoria3d/parita/, A1g–A1k, C18, C19).
   Come per il cortile di G4 (dati/cortile.js) livelli, prezzi e tempi sono quelli della 2D, letti da dati/parita2d.js; restano solo 3D le capienze
   e il prezzo delle singole bestie dentro il recinto. Ricette, ingredienti, quantità e cosa mangia chi sono quelli della 2D
   (`src/giochi/fattoria/dati/coltivazioni.js`). La peschiera non c'è: la pesca (molo, porticciolo) ne prende il posto allo stesso livello.
   Importa solo `parita2d.js`: `mangime.js`, `animali.js`, `catalogo.js` e `ricette.js` leggono da qui. Vedi docs/fattoria3d/cortile-2.md. */
import { numeriRicetta as N, prezzoDa2D, livelloDa2D, crescitaDa2D, bestia2d, msDaMinuti } from './parita2d.js'

// ── i numeri: prezzi e livelli dei recinti e tempi delle bestie sono della 2D; capienze e prezzo delle bestie sono solo 3D ──
export const NUMERI_DEL_CORTILE_2 = {
  conigliera: { liv: livelloDa2D('conigliera'), prezzo: prezzoDa2D('conigliera'), posti: 6, prezzoBestia: 20, rincaroBestia: 10, ms: msDaMinuti(bestia2d('conigliera').minuti) },
  alpaca:     { liv: livelloDa2D('alpaca'),     prezzo: prezzoDa2D('alpaca'),     posti: 4, prezzoBestia: 90, rincaroBestia: 45, ms: msDaMinuti(bestia2d('alpaca').minuti) },
  asini:      { liv: livelloDa2D('asini'),      prezzo: prezzoDa2D('asini'),      posti: 4, prezzoBestia: 95, rincaroBestia: 45, ms: msDaMinuti(bestia2d('asini').minuti) },
  arnie:      { liv: livelloDa2D('arnie'),      prezzo: prezzoDa2D('arnie'),      posti: 4, prezzoBestia: 70, rincaroBestia: 35, ms: msDaMinuti(bestia2d('arnie').minuti) },
}
const N2 = NUMERI_DEL_CORTILE_2

// ── i quattro recinti come pezzi del catalogo (animali, produttivi; rincarano a ogni copia come nella 2D) ──
const recinto = (tipo, nome, emoji, extra = {}) => ({ nome, emoji, w: 4, d: 3, prezzo: N2[tipo].prezzo, rincaro: Math.round(N2[tipo].prezzo * crescitaDa2D(tipo)), cresce: crescitaDa2D(tipo), categoria: 'animali', liv: N2[tipo].liv, produttivo: true, ...extra })
export const PEZZI_DEL_CORTILE_2 = {
  conigliera: recinto('conigliera', 'Conigliera', '🐇'),
  alpaca:     recinto('alpaca', 'Recinto degli alpaca', '🦙'),
  asini:      recinto('asini', 'Recinto degli asini', '🐴'),
  arnie:      recinto('arnie', 'Arnie', '🐝', { art: 'le' }),       // «le arnie»: l'articolo dei pezzi si indovina dal nome (-a), qui è plurale
}

// ── le bestie, nella forma di `ANIMALI` (dati/animali.js). Cosa mangiano e quanto è della 2D: conigli 2 foraggi → lana d'angora, alpaca 1 foraggio → lana
//    d'alpaca, asini 2 foraggi → concime, arnie 2 fiori → miele. La lana è la stessa dell'ovile (`stato.lana`, come in 2D `da: 'lana'`). ──
const bestia = (tipo, o) => ({ ms: N2[tipo].ms, costo: bestia2d(tipo).costo, posti: N2[tipo].posti, prezzoBestia: N2[tipo].prezzoBestia, rincaroBestia: N2[tipo].rincaroBestia, ...o })
export const ANIMALI_DEL_CORTILE_2 = {
  conigliera: bestia('conigliera', { bestia: 'coniglio', bestie: 'conigli', emoji: '🐇', prodotto: 'lana', evento: 'lana', mangia: ['foraggio'], pasti: 2 }),
  alpaca:     bestia('alpaca',     { bestia: 'alpaca',   bestie: 'alpaca',  emoji: '🦙', prodotto: 'lana', evento: 'lana', mangia: ['foraggio'], pasti: 1 }),
  asini:      bestia('asini',      { bestia: 'asino',    bestie: 'asini',   emoji: '🐴', prodotto: 'concime', evento: 'concime', mangia: ['foraggio'], pasti: 2 }),
  arnie:      bestia('arnie',      { bestia: 'arnia',    bestie: 'arnie',   emoji: '🐝', prodotto: 'miele', evento: 'miele', mangia: ['fiori'], pasti: 2 }),
}

/** Le merci nuove delle bestie (id, nome, emoji e faccia della 2D): il miele e il concime. Come uova e latte non si chiedono da soli al banco. */
export const PRODOTTI_DEL_CORTILE_2 = {
  miele:   { nome: 'Miele',   emoji: '🍯', pezzo: 'merce_miele', dove: 'arnie' },
  concime: { nome: 'Concime', emoji: '💩', pezzo: 'sacco', dove: 'asini' },
}

/** Il mangime che non ha una ricetta col suo id: i fiori. Li fa il fienile in due modi (`fiorume`, `fiorume_concime`: `da: 'fiori'`) e li mangiano le api. */
export const MANGIMI_SENZA_RICETTA = {
  fiori: { nome: 'Fiori', emoji: '🌼', pezzo: 'cesto_fiori_misti0', mangime: true, dove: 'fienile' },
}

/** Le due ricette del fienile per i fiori (id, ingredienti e tempi della 2D): cipolle e aglio lasciati fiorire, e il concime che torna al prato.
    L'erba medica è la coltura `erba` (nella 2D il suo raccolto si chiama `fieno`). */
export const RICETTE_FIENILE_2 = {
  fiorume:         { nome: 'Fiori di cipolla e aglio', emoji: '🌼', pezzo: 'cesto_fiori_misti0', da: 'fiori', mangime: true, ing: { cipolla: 1, aglio: 1 }, ...N('fiorume') },
  fiorume_concime: { nome: 'Prato fiorito',            emoji: '🌼', pezzo: 'cesto_fiori_misti0', da: 'fiori', mangime: true, ing: { concime: 1, erba: 1 }, ...N('fiorume_concime') },
}

/** Le due ricette di cucina che vogliono il miele: la merenda (panificio) e le caramelle (zuccherificio). */
export const RICETTA_MERENDA = { nome: 'Merenda', emoji: '🥧', pezzo: 'cesta_picnic', ing: { fragola: 2, miele: 1 }, ...N('merenda') }
export const RICETTA_CARAMELLE = { nome: 'Caramelle', emoji: '🍬', pezzo: 'merce_caramelle', ing: { zucchero: 1, miele: 1 }, ...N('caramelle') }

/** La lana d'angora e d'alpaca sono lana come quella dell'ovile (un contatore solo): chi la fa, oltre al recinto delle pecore. */
export const FANNO_LANA_2 = ['conigliera', 'alpaca']
