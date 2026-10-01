// Gli elenchi in comune fra i capitoli del libro: personaggi, animali,
// colori, cibi… con le forme italiane che servono alle risposte. Il mondo
// da cui una parola è nota NON si scrive qui: lo dice il grafo
// (dati/mondi.js), quindi una parola che entra in una tappa arricchisce da
// sola tutti i capitoli che la possono pescare. Vedi docs/lingue/spagnolo-motore.md.
//
// Campi: es (la chiave di data/parole-es.js, senza articolo), it, un (con
// l'articolo indeterminativo), il (determinativo), itPl / ilPl (plurale),
// genere ('m' | 'f', solo se la regola di motore/lessico.js sbaglia), pl
// (plurale spagnolo, solo se irregolare). Nel capitolo l'articolo spagnolo
// lo mette il segnaposto ({un:x}, {el:x}): qui non si scrive.
// Gli elenchi sono da riempire: ci sono due o tre voci per far vedere la forma.

export const PERSONAGGI = [
  { nome: 'Laura', lei: true },
  { nome: 'Leo' },
  { nome: 'Tom' },
  { nome: 'Pip', cane: true },
]

// Chi può parlare in una storia (`chi` di una frase) e il nome che il libro
// gli mette davanti, in italiano: uno per chiave, in un posto solo.
export const CHI_PARLA = {
  Laura: 'Laura', Leo: 'Leo', Tom: 'Tom', Pip: 'Pip',
  mamma: 'La mamma', papa: 'Il papà', nonna: 'La nonna', nonno: 'Il nonno',
  maestra: 'La maestra', dottore: 'Il dottore', contadino: 'Il contadino', contadina: 'La contadina',
  pappagallo: 'Il pappagallo', voce: 'Una voce',
}
// Le risposte sbagliate di «Chi l'ha detto?» quando nella storia parlano in
// pochi: la gente di casa, che può aver detto qualunque cosa (docs/lingue/libro-racconti.md)
export const CHI_DI_CASA = ['Laura', 'Leo', 'Tom', 'mamma', 'papa', 'nonna', 'nonno']

const a = (es, it, un, il, itPl, ilPl, altro = {}) => ({ es, it, un, il, itPl, ilPl, ...altro })

export const ELENCHI = {
  animali: [
    a('perro', 'cane', 'un cane', 'il cane', 'cani', 'i cani'),
    a('gato', 'gatto', 'un gatto', 'il gatto', 'gatti', 'i gatti'),
    a('vaca', 'mucca', 'una mucca', 'la mucca', 'mucche', 'le mucche'),
  ],
  // gli aggettivi si accordano nel capitolo: {colore~animale} (negro, negra)
  colori: [
    a('negro', 'nero'), a('blanco', 'bianco'), a('azul', 'blu'),
  ],
  // `contabile`: si dice «dos manzanas»; gli altri no («me gusta la leche»)
  cibi: [
    a('manzana', 'mela', 'una mela', 'la mela', 'mele', 'le mele', { contabile: true }),
    a('pan', 'pane', null, 'il pane'),
    a('leche', 'latte', null, 'il latte'),
  ],
}

export function guastiDegliElenchi(paroleNote) {
  const g = []
  for (const [nome, voci] of Object.entries(ELENCHI)) {
    const viste = new Set()
    for (const v of voci) {
      if (!v.es || !v.it) g.push(`elenco ${nome}: voce senza es o it`)
      if (viste.has(v.es)) g.push(`elenco ${nome}: «${v.es}» due volte`)
      viste.add(v.es)
      if (paroleNote && !paroleNote.has(v.es)) g.push(`elenco ${nome}: «${v.es}» non è in data/parole-es.js`)
      if (v.genere && !['m', 'f'].includes(v.genere)) g.push(`elenco ${nome}: «${v.es}» ha un genere sconosciuto`)
    }
  }
  const nomi = new Set()
  for (const p of PERSONAGGI) {
    if (nomi.has(p.nome)) g.push(`personaggio doppio: ${p.nome}`)
    nomi.add(p.nome)
  }
  return g
}
