/* Il pentolone e le tre bestie che mangiano da lui (anatre, maiali, capre): i dati del giro G4 della parità con la fattoria di sempre
   (docs/fattoria3d/parita/). Qui, in un punto solo, stanno **tutti i numeri provvisori** di questo giro: livelli, prezzi, capienze e tempi.
   La scala dei livelli (D2) e i tempi (D9) non sono decisi: questi valori sono coerenti con quelli attuali della 3D e col metro di
   docs/apprendimento/calibrazione.md (🪙1 = 10 s di esercizio) e si cambiano QUI, senza toccare altro. Tutto il resto (id, ingredienti, quantità,
   cosa mangia chi) è quello della 2D (`src/giochi/fattoria/dati/coltivazioni.js`) e non è provvisorio.
   Importa solo `colture.js`: `mangime.js`, `animali.js`, `catalogo.js` e `ricette.js` leggono da qui. Vedi docs/fattoria3d/cortile-e-pentolone.md. */

// ── i numeri provvisori ──
// La scaletta di oggi arriva al 18 con una cosa produttiva per livello: il pentolone e le tre bestie si mettono in coda (19–22), come fecero
// la friggitoria e il sushi bar. I prezzi seguono il rapporto 2D→3D delle altre macchine (~0,5) e restano sotto i due terzi del salto del livello.
export const PROVVISORI = {
  pentolone: { liv: 19, prezzo: 75 },
  anatre:    { liv: 20, prezzo: 120, posti: 6, prezzoBestia: 30, rincaroBestia: 14, ms: 20000 },    // 2D: 6 min
  porcile:   { liv: 21, prezzo: 130, posti: 4, prezzoBestia: 70, rincaroBestia: 35, ms: 50000 },    // 2D: 20 min
  capre:     { liv: 22, prezzo: 140, posti: 4, prezzoBestia: 75, rincaroBestia: 35, ms: 45000 },    // 2D: 12 min
}

// ── le ricette del pentolone: id, ingredienti, quantità e tempo (minuti → secondi) sono quelli della 2D ──
// `da`: il prodotto, se non è l'id (la seconda strada del pastone). Sono tutte mangime: non si consegnano.
export const RICETTE_PENTOLONE = {
  beverone:   { nome: 'Verdure lesse',   emoji: '🍢', pezzo: 'cassetta_raccolto', mangime: true, ing: { patata: 2, cavolfiore: 1 }, ms: 4000, liv: PROVVISORI.pentolone.liv },
  zuppa:      { nome: 'Pastone',         emoji: '🫕', pezzo: 'merce_zuppa',       mangime: true, ing: { zucca: 2 },                 ms: 6000, liv: PROVVISORI.pentolone.liv },
  zuppa_orto: { nome: 'Pastone d\'orto', emoji: '🫕', pezzo: 'merce_zuppa', da: 'zuppa', mangime: true, ing: { pomodoro: 2 },     ms: 4000, liv: PROVVISORI.pentolone.liv },
  pastura:    { nome: 'Verdura fresca',  emoji: '🥒', pezzo: 'cassetta1',         mangime: true, ing: { carota: 2, cavolfiore: 1 }, ms: 5000, liv: PROVVISORI.pentolone.liv },
}

// ── il pezzo del catalogo del pentolone (un edificio unico come gli altri) ──
export const EDIFICIO_PENTOLONE = { nome: 'Pentolone', emoji: '🍲', art: 'il', w: 3, d: 3, prezzo: PROVVISORI.pentolone.prezzo, categoria: 'edifici', liv: PROVVISORI.pentolone.liv }

// ── i tre recinti nuovi come pezzi del catalogo (animali, produttivi, rincaro 0) ──
export const PEZZI_DEL_CORTILE = {
  anatre:  { nome: 'Stagno delle anatre', emoji: '🦆', w: 4, d: 3, prezzo: PROVVISORI.anatre.prezzo,  rincaro: 0, categoria: 'animali', liv: PROVVISORI.anatre.liv,  produttivo: true },
  porcile: { nome: 'Porcile',             emoji: '🐖', w: 4, d: 3, prezzo: PROVVISORI.porcile.prezzo, rincaro: 0, categoria: 'animali', liv: PROVVISORI.porcile.liv, produttivo: true },
  capre:   { nome: 'Capre',               emoji: '🐐', w: 4, d: 3, prezzo: PROVVISORI.capre.prezzo,   rincaro: 0, categoria: 'animali', liv: PROVVISORI.capre.liv,   produttivo: true },
}

// ── le bestie nuove, nella forma di `ANIMALI` (dati/animali.js). Cosa mangiano e quanto è della 2D: anatre 1 verdure lesse → uova d'anatra,
//    maiali 2 pastone → tartufi, capre 1 verdura fresca → latte di capra. Uova e latte sono gli stessi `uova` e `latte` di pollaio e stalla (come in 2D: `da: 'uova'`). ──
export const ANIMALI_DEL_CORTILE = {
  anatre: {
    bestia: 'anatra', bestie: 'anatre', emoji: '🦆', prodotto: 'uova', evento: 'uovo',
    ms: PROVVISORI.anatre.ms, mangia: ['beverone'], pasti: 1,
    posti: PROVVISORI.anatre.posti, prezzoBestia: PROVVISORI.anatre.prezzoBestia, rincaroBestia: PROVVISORI.anatre.rincaroBestia,
  },
  porcile: {
    bestia: 'maiale', bestie: 'maiali', emoji: '🐖', prodotto: 'tartufi', evento: 'tartufo',
    ms: PROVVISORI.porcile.ms, mangia: ['zuppa'], pasti: 2,
    posti: PROVVISORI.porcile.posti, prezzoBestia: PROVVISORI.porcile.prezzoBestia, rincaroBestia: PROVVISORI.porcile.rincaroBestia,
  },
  capre: {
    bestia: 'capra', bestie: 'capre', emoji: '🐐', prodotto: 'latte', evento: 'latte',
    ms: PROVVISORI.capre.ms, mangia: ['pastura'], pasti: 1,
    posti: PROVVISORI.capre.posti, prezzoBestia: PROVVISORI.capre.prezzoBestia, rincaroBestia: PROVVISORI.capre.rincaroBestia,
  },
}

/** L'unica merce nuova delle bestie: il tartufo (id, nome, emoji e faccia della 2D). */
export const TARTUFI = { nome: 'Tartufi', emoji: '🍄', pezzo: 'merce_tartufi', dove: 'porcile' }
