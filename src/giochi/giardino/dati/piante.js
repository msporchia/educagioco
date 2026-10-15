// Le piante: costo in soli, ricarica fissa dopo averla messa, vita, e il conto
// che la compra (`op`: + − × ÷, quello che la tappa ha già insegnato). Il
// girasole fa soli; chi ha `colpi` spara in su ogni `ogni` secondi.
// Dato puro. Vedi docs/giardino/regole.md.
export const PIANTE = {
  girasole: { nome: 'Girasole', emoji: '🌻', costo: 50,  ricarica: 6,  vita: 8,  op: '+', sole: 25, ogni: 9,
              nota: 'Fa soli da solo, ogni tanto: toccali per prenderli.' },
  tiratore: { nome: 'Tiratore', emoji: '🌱', costo: 100, ricarica: 5,  vita: 8,  op: '+', colpi: 1, ogni: 1.4,
              nota: 'Spara in su agli zombi della sua corsia.' },
  noce:     { nome: 'Noce',     emoji: '🥜', costo: 50,  ricarica: 14, vita: 40, op: '−',
              nota: 'Non spara: tiene fermi gli zombi mentre gli altri lavorano.' },
  doppio:   { nome: 'Doppio',   emoji: '🌿', costo: 175, ricarica: 8,  vita: 8,  op: '×', colpi: 2, ogni: 1.4,
              nota: 'Due colpi alla volta.' },
  gelo:     { nome: 'Gelo',     emoji: '🧊', costo: 150, ricarica: 8,  vita: 8,  op: '÷', colpi: 1, ogni: 1.6, gelo: true,
              nota: 'I suoi colpi rallentano chi colpiscono.' },
}

export function guastiDellePiante(piante = PIANTE) {
  const g = []
  for (const [id, p] of Object.entries(piante)) {
    for (const k of ['costo', 'ricarica', 'vita']) if (!(p[k] > 0)) g.push(`${id}: ${k} deve essere positivo`)
    if (!['+', '−', '×', '÷'].includes(p.op)) g.push(`${id}: operazione sconosciuta «${p.op}»`)
    if (p.colpi && !(p.ogni > 0)) g.push(`${id}: spara ma non ha una cadenza`)
    if (p.sole && !(p.ogni > 0)) g.push(`${id}: fa soli ma non ha una cadenza`)
    if (!p.emoji || !p.nome) g.push(`${id}: manca il nome o l'emoji`)
  }
  return g
}
