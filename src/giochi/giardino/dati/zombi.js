// Gli zombi: vita in colpi, velocità in pixel di mondo al secondo, quanto
// mangia (vita al secondo tolta alla pianta, di difetto `MANGIA`).
// Dato puro. Vedi docs/giardino/regole.md.
export const ZOMBI = {
  normale: { nome: 'Zombi',          emoji: '🧟',   vita: 7,  vel: 14 },
  cono:    { nome: 'Zombi col cono', emoji: '🧟‍♂️', vita: 14, vel: 14, cono: true },
  veloce:  { nome: 'Zombi di corsa', emoji: '🧟‍♀️', vita: 5,  vel: 26 },
  gigante: { nome: 'Il gigante',     emoji: '🧌',   vita: 60, vel: 9, mangia: 3, grande: true },
}

export function guastiDegliZombi(zombi = ZOMBI) {
  const g = []
  for (const [id, z] of Object.entries(zombi)) {
    if (!(z.vita > 0)) g.push(`${id}: la vita deve essere positiva`)
    if (!(z.vel > 0)) g.push(`${id}: la velocità deve essere positiva`)
    if (!z.emoji || !z.nome) g.push(`${id}: manca il nome o l'emoji`)
  }
  return g
}
