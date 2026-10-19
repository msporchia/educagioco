/* I numeri delle regole che non stanno altrove: quanto costa muovere, i tempi delle bestie e della mongolfiera.
   Il perché di ognuno è in docs/fattoria3d/regole.md. Niente si vende: il verso è sempre monete → cose. */
export const COSTI = {
  spostare: 1,        // un pezzo spostato o rimesso nel magazzino: la fattoria non è un tavolino dove si sposta per ore
  strada: 1,          // a pezzo
  lottoBase: 40,      // il primo lotto comprato
  lottoRincaro: 20,   // ogni lotto già comprato in più (oltre quelli di partenza)
}
export const LEGNA_PER_ALBERO = 2

export const PECORE = {
  laneMs: 25000,      // quanto ci mette una pecora tosata a rifare la lana (un numero da prova)
  max: 4,             // per recinto
  pastiPerCrescere: 2,
  pastiPerNascere: 2,
}

export const MONGOLFIERA = {
  carico: 2,          // raccolti da caricare
  viaggioMs: 14000,
  premioLana: 2,
}

export function guastiDelleRegole() {
  const g = []
  for (const [k, v] of Object.entries(COSTI)) if (!(v >= 0)) g.push(`costo ${k} negativo`)
  if (!(PECORE.max >= 2)) g.push('un recinto deve poter tenere almeno due pecore')
  if (!(PECORE.laneMs >= 1000)) g.push('la lana ricresce in meno di un secondo')
  if (!(MONGOLFIERA.carico >= 1)) g.push('la mongolfiera parte vuota')
  return g
}
