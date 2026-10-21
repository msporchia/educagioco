/* Le sedici colture: quanto ci mette a maturare (tempo vero), come si chiama e a che livello si semina (`liv`: da questo
   campo lo legge dati/livelli.js, vedi docs/fattoria3d/livelli.md). Come appare nel campo (altezza, colori, frutto) è del
   disegno, scena3d/modelli.js. `pezzo` è la faccia nell'atlante della 2D (docs/fattoria3d/merci-e-ricette.md). In prova i tempi sono corti: da rivedere con la calibrazione
   (docs/apprendimento/calibrazione.md) se il gioco esce dalla prova. */
export const COLTURE = {
  grano:     { nome: 'Grano',      emoji: '🌾', pezzo: 'raccolto_grano', ms: 20000, liv: 1 },
  carota:    { nome: 'Carote',     emoji: '🥕', pezzo: 'raccolto_carote', ms: 16000, liv: 1 },
  mais:      { nome: 'Mais',       emoji: '🌽', pezzo: 'raccolto_mais', ms: 24000, liv: 2 },
  pomodoro:  { nome: 'Pomodori',   emoji: '🍅', pezzo: 'raccolto_pomodori', ms: 28000, liv: 4 },
  patata:    { nome: 'Patate',     emoji: '🥔', pezzo: 'raccolto_patate', ms: 32000, liv: 6 },
  zucca:     { nome: 'Zucche',     emoji: '🎃', pezzo: 'raccolto_zucche', ms: 38000, liv: 8 },
  cavolfiore:{ nome: 'Cavolfiori', emoji: '🥦', pezzo: 'raccolto_cavolfiori', ms: 40000, liv: 8 },
  cipolla:   { nome: 'Cipolle',    emoji: '🧅', pezzo: 'raccolto_cipolle', ms: 44000, liv: 9 },
  aglio:     { nome: 'Aglio',      emoji: '🧄', pezzo: 'raccolto_aglio', ms: 46000, liv: 10 },
  fragola:   { nome: 'Fragole',    emoji: '🍓', pezzo: 'raccolto_fragole', ms: 50000, liv: 11 },
  barbabietola: { nome: 'Barbabietola', emoji: '🍠', pezzo: 'raccolto_barbabietola', ms: 48000, liv: 11 },
  peperone:  { nome: 'Peperoni',   emoji: '🫑', pezzo: 'raccolto_peperoni', ms: 54000, liv: 12 },
  melanzana: { nome: 'Melanzane',  emoji: '🍆', pezzo: 'raccolto_melanzane', ms: 56000, liv: 13 },
  lavanda:   { nome: 'Lavanda',    emoji: '💐', pezzo: 'raccolto_lavanda', ms: 64000, liv: 15 },
  riso:      { nome: 'Riso',       emoji: '🍚', pezzo: 'raccolto_riso', ms: 70000, liv: 15 },
  // L'erba medica non è cibo per nessuno e non la chiede nessuno (`mangime: true`): serve solo al fienile, dove diventa foraggio. Come in 2D è la più
  // svelta (4 minuti contro i 6 delle carote), quindi sta fuori dalla regola «chi arriva dopo matura dopo» (motore/taratura.js).
  erba:      { nome: 'Erba medica', emoji: '🌿', pezzo: 'raccolto_erba', ms: 12000, liv: 9, mangime: true },
}
export const CHIAVI_COLTURE = Object.keys(COLTURE)
export const TESSERE = 4          // un campo è fatto di quattro tessere: un raccolto ciascuna

export function guastiDelleColture() {
  const g = []
  for (const [k, c] of Object.entries(COLTURE)) {
    if (!c.nome || !c.emoji) g.push(`${k}: manca nome o emoji`)
    if (typeof c.pezzo !== 'string' || !c.pezzo) g.push(`${k}: manca il pezzo dell'atlante (la faccia)`)
    if (!(c.ms >= 1000)) g.push(`${k}: tempo sotto il secondo`)
    if (!(Number.isInteger(c.liv) && c.liv >= 1)) g.push(`${k}: manca il livello`)
  }
  return g
}
