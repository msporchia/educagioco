/* I numeri delle regole che non stanno altrove: quanto costa muovere, i tempi delle pecore (la mongolfiera ha i suoi numeri in dati/mongolfiera.js).
   Il perché di ognuno è in docs/fattoria3d/regole.md. Niente si vende: il verso è sempre monete → cose. */
export const COSTI = {
  spostare: 1,        // un pezzo spostato o rimesso nel magazzino: la fattoria non è un tavolino dove si sposta per ore
  strada: 1,          // a pezzo
  lottoBase: 40,      // il primo lotto comprato
  lottoRincaro: 20,   // ogni lotto già comprato in più (oltre quelli di partenza)
  albero: 3,          // un colpo d'ascia: tre monete (30 s di esercizio); la legna non c'è, il prato si libera e basta
  ostacolo: 1,        // un sasso o un cespuglio tolto
}

export const PECORE = {
  laneMs: 25000,      // quanto ci mette la lana a rifarsi dal pasto (un numero da prova)
  pastiPerLana: 1,    // raccolti che una tosata vuole per rifarla: dopo la tosa ha fame, come le galline
  max: 4,             // per recinto
  pastiPerCrescere: 2,
  pastiPerNascere: 2,
}

export function guastiDelleRegole() {
  const g = []
  for (const [k, v] of Object.entries(COSTI)) if (!(v >= 0)) g.push(`costo ${k} negativo`)
  if (!(PECORE.max >= 2)) g.push('un recinto deve poter tenere almeno due pecore')
  if (!(PECORE.laneMs >= 1000)) g.push('la lana ricresce in meno di un secondo')
  return g
}
