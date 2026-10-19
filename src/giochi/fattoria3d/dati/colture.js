/* Le dieci colture: quanto ci mette a maturare (tempo vero), come si chiama e a che livello si semina (`liv`: da questo
   campo lo legge dati/livelli.js, vedi docs/fattoria3d/livelli.md). Come appare nel campo (altezza, colori, frutto) è del
   disegno, scena3d/modelli.js. In prova i tempi sono corti: da rivedere con la calibrazione
   (docs/apprendimento/calibrazione.md) se il gioco esce dalla prova. */
export const COLTURE = {
  grano:     { nome: 'Grano',      emoji: '🌾', ms: 20000, liv: 1 },
  carota:    { nome: 'Carote',     emoji: '🥕', ms: 16000, liv: 1 },
  mais:      { nome: 'Mais',       emoji: '🌽', ms: 24000, liv: 2 },
  pomodoro:  { nome: 'Pomodori',   emoji: '🍅', ms: 26000, liv: 4 },
  patata:    { nome: 'Patate',     emoji: '🥔', ms: 28000, liv: 6 },
  zucca:     { nome: 'Zucche',     emoji: '🎃', ms: 32000, liv: 8 },
  cipolla:   { nome: 'Cipolle',    emoji: '🧅', ms: 34000, liv: 9 },
  fragola:   { nome: 'Fragole',    emoji: '🍓', ms: 36000, liv: 11 },
  melanzana: { nome: 'Melanzane',  emoji: '🍆', ms: 38000, liv: 13 },
  lavanda:   { nome: 'Lavanda',    emoji: '💜', ms: 40000, liv: 15 },
}
export const CHIAVI_COLTURE = Object.keys(COLTURE)
export const TESSERE = 4          // un campo è fatto di quattro tessere: un raccolto ciascuna

export function guastiDelleColture() {
  const g = []
  for (const [k, c] of Object.entries(COLTURE)) {
    if (!c.nome || !c.emoji) g.push(`${k}: manca nome o emoji`)
    if (!(c.ms >= 1000)) g.push(`${k}: tempo sotto il secondo`)
    if (!(Number.isInteger(c.liv) && c.liv >= 1)) g.push(`${k}: manca il livello`)
  }
  return g
}
