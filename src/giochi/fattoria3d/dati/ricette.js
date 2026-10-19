/* La pasticceria: ogni ricetta chiede raccolti precisi e un tempo. Il forno ha tre posti e cuoce uno alla volta. */
export const RICETTE = {
  pane:        { nome: 'Pane',            emoji: '🍞', ing: { grano: 2 },                ms: 6000 },
  popcorn:     { nome: 'Popcorn',         emoji: '🍿', ing: { mais: 2 },                 ms: 8000 },
  tortaCarote: { nome: 'Torta di carote', emoji: '🍰', ing: { carota: 2, grano: 1 },     ms: 10000 },
  pizza:       { nome: 'Pizza',           emoji: '🍕', ing: { pomodoro: 2, grano: 1 },   ms: 12000 },
  tortaZucca:  { nome: 'Torta di zucca',  emoji: '🥧', ing: { zucca: 2, grano: 1 },      ms: 14000 },
}
export const FORNO_POSTI = 3

export function guastiDelleRicette(colture) {
  const g = []
  for (const [k, r] of Object.entries(RICETTE)) {
    if (!r.nome || !r.emoji) g.push(`${k}: manca nome o emoji`)
    if (!(r.ms >= 1000)) g.push(`${k}: tempo sotto il secondo`)
    const ing = Object.entries(r.ing)
    if (!ing.length) g.push(`${k}: senza ingredienti`)
    for (const [i, n] of ing) {
      if (!colture[i]) g.push(`${k}: ingrediente ${i} sconosciuto`)
      if (!(n >= 1)) g.push(`${k}: quantità di ${i} impossibile`)
    }
  }
  return g
}
