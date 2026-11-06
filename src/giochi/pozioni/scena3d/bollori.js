// I modi di ribollire: quanti numeri ci vogliono per dire come si muove il brodo.
// Li usa banco.js; quale spetta a quale pozione sta in dati/bollori.js.
// `quante` bolle su quattordici, `misura` e `vel` rispetto alle bolle normali, `piatte` schiacciate,
// `bordo` stanno lungo il bordo, `giro` girano, `vapore` quanto fumo, `basso` il fumo non sale
// ma scivola fuori, `cangia` il colore va e viene, `scia` quello che schizza dal brodo.
const BASE = { quante: 14, misura: 1, vel: 1, piatte: 1, bordo: 0, giro: 0, vapore: 1, basso: 0, cangia: 0, scia: null }

export const MODI = {
  bolle: BASE,
  grosse: { ...BASE, quante: 5, misura: 2.8, vel: 0.42 },
  schiuma: { ...BASE, misura: 1.5, vel: 0.28, bordo: 1, vapore: 0.6 },
  lava: { ...BASE, quante: 7, misura: 2.3, vel: 0.3, piatte: 0.5, vapore: 0.4 },
  vortice: { ...BASE, misura: 0.8, vel: 0.9, giro: 1.5 },
  nebbia: { ...BASE, quante: 5, misura: 0.7, vel: 0.6, vapore: 2.6, basso: 1 },
  cangiante: { ...BASE, quante: 9, misura: 0.9, cangia: 1 },
  frizzante: { ...BASE, misura: 0.45, vel: 2.4, scia: { ogni: 0.05, quante: 2, misura: 0.05, vita: 0.7, su: 1.6, gravita: 0 } },
  scintille: { ...BASE, quante: 8, misura: 0.8, vel: 1.2, scia: { ogni: 0.09, quante: 3, misura: 0.08, vita: 0.8, su: 2.8, gravita: 2.5 } },
  stelline: { ...BASE, quante: 6, misura: 0.7, vel: 0.8, scia: { ogni: 0.16, quante: 2, misura: 0.17, vita: 1.2, su: 0.7, gravita: -0.2 } },
  lampi: { ...BASE, quante: 8, misura: 1.1, vel: 1.3, scia: { ogni: 2.1, quante: 22, misura: 0.1, vita: 0.5, su: 3.2, gravita: 1, lampo: true } },
}
