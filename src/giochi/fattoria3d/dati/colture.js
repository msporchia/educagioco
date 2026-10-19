/* Le cinque colture: quanto ci mette a maturare (tempo vero) e come si chiama. Come appare nel campo (altezza, colori,
   frutto) è del disegno, scena3d/modelli.js. In prova i tempi sono corti: da rivedere con la calibrazione
   (docs/apprendimento/calibrazione.md) se il gioco esce dalla prova. */
export const COLTURE = {
  grano:    { nome: 'Grano',    emoji: '🌾', ms: 20000 },
  carota:   { nome: 'Carote',   emoji: '🥕', ms: 14000 },
  mais:     { nome: 'Mais',     emoji: '🌽', ms: 28000 },
  pomodoro: { nome: 'Pomodori', emoji: '🍅', ms: 24000 },
  zucca:    { nome: 'Zucche',   emoji: '🎃', ms: 32000 },
}
export const CHIAVI_COLTURE = Object.keys(COLTURE)
export const TESSERE = 4          // un campo è fatto di quattro tessere: un raccolto ciascuna

export function guastiDelleColture() {
  const g = []
  for (const [k, c] of Object.entries(COLTURE)) {
    if (!c.nome || !c.emoji) g.push(`${k}: manca nome o emoji`)
    if (!(c.ms >= 1000)) g.push(`${k}: tempo sotto il secondo`)
  }
  return g
}
