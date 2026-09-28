// Un verbo è un modo di chiedere «quanti?»: non genera niente da sé
// (`motore/scena.js` lo fa), qui c'è solo la sua carta d'identità.
//   modo       come si risponde: 'cifre' (una fra tre/quattro), 'porta'
//              (si toccano N gettoni e si conferma), 'confronto' (due
//              recinti), 'inclusione' (il sottoinsieme o l'insieme)
//   richiede   quante specie del mondo servono, per categoria
//   consegna   riceve i fatti già decisi dal motore e torna
//              { icone, frase }: la striscia iconica in cima, sempre
//              leggibile senza testo, più la stessa frase per chi legge
//
// Nessuna voce qui dentro: l'italiano non è ancora inciso
// (`strumenti/incidi-voci.mjs` fa solo inglese e spagnolo); il giorno che
// arriverà, il posto giusto è `consegna()`, l'unica che sa cosa dire.

// «quanti» o «quante», «un altro» o «un'altra»: la specie porta il suo
// genere (vedi `mondi.js`), una funzione sola per non lasciare una frase
// storta in un angolo che nessuno rilegge.
const q = (specie, maschile, femminile) => (specie.genere === 'f' ? femminile : maschile)

export const VERBI = {
  quanti: {
    chiave: 'quanti', nome: 'Quanti sono?', modo: 'cifre',
    richiede: { totale: 1 },
    consegna: ({ specie }) => ({
      icone: ['❓', specie.emoji],
      frase: `${q(specie, 'Quanti', 'Quante')} ${specie.tanti} ci sono?`,
    }),
  },

  porta: {
    chiave: 'porta', nome: 'Portamene tot', modo: 'porta',
    richiede: { totale: 1 },
    consegna: ({ specie, n }) => ({
      icone: ['👉', String(n), specie.emoji],
      frase: `Portami ${n} ${n === 1 ? specie.uno : specie.tanti}`,
    }),
  },

  dipiu: {
    chiave: 'dipiu', nome: 'Dove ce n\'è di più?', modo: 'confronto',
    richiede: { animali: 2 },
    consegna: ({ specieA, specieB }) => ({
      icone: [specieA.emoji, '❓', specieB.emoji],
      frase: `Dove ce n'è di più: ${specieA.tanti} o ${specieB.tanti}?`,
    }),
  },

  stessi: {
    chiave: 'stessi', nome: 'Sono sempre gli stessi?', modo: 'cifre',
    richiede: { totale: 1 },
    consegna: ({ specie }) => ({
      icone: [specie.emoji, '🔀', '❓'],
      frase: `${q(specie, 'Contali', 'Contale')}, poi si sparpagliano: ` +
             `${q(specie, 'quanti', 'quante')} sono adesso?`,
    }),
  },

  quantiDi: {
    chiave: 'quantiDi', nome: 'Quante di queste?', modo: 'cifre',
    richiede: { animali: 1, cose: 1 },
    consegna: ({ specie }) => ({
      icone: ['❓', specie.emoji],
      frase: `${q(specie, 'Quanti', 'Quante')} ${specie.tanti} ci sono?`,
    }),
  },

  insieme: {
    chiave: 'insieme', nome: 'Quanti animali in tutto?', modo: 'cifre',
    richiede: { animali: 2, cose: 1 },
    consegna: () => ({
      icone: ['❓', '🐾'],
      frase: `Quanti animali ci sono in tutto?`,
    }),
  },

  inclusione: {
    chiave: 'inclusione', nome: 'Più queste o più animali?', modo: 'inclusione',
    richiede: { animali: 2 },
    consegna: ({ specie }) => ({
      icone: [specie.emoji, '❓', '🐾'],
      frase: `Ci sono più ${specie.tanti} o più animali?`,
    }),
  },

  piuUno: {
    chiave: 'piuUno', nome: 'Uno in più (o uno in meno)', modo: 'cifre',
    richiede: { totale: 1 },
    consegna: ({ specie, direzione }) => ({
      icone: [specie.emoji, direzione === 'arriva' ? '➕' : '➖', '❓'],
      frase: direzione === 'arriva'
        ? `Ne arriva ${q(specie, 'un altro', "un'altra")}: ${q(specie, 'quanti', 'quante')} sono adesso?`
        : `${q(specie, 'Uno', 'Una')} scappa via: ${q(specie, 'quanti', 'quante')} restano?`,
    }),
  },

  unisci: {
    chiave: 'unisci', nome: 'Quanti in tutto?', modo: 'cifre',
    richiede: { totale: 2 },
    consegna: ({ specieA, specieB }) => ({
      icone: [specieA.emoji, '➕', specieB.emoji, '❓'],
      frase: `${specieA.tanti} e ${specieB.tanti}: ` +
             `${specieA.genere === 'f' && specieB.genere === 'f' ? 'quante' : 'quanti'} sono in tutto?`,
    }),
  },
}

export const CHIAVI_VERBI = Object.keys(VERBI)

export const verbo = chiave => VERBI[chiave] || null

const MODI_VALIDI = ['cifre', 'porta', 'confronto', 'inclusione']

export function guastiDeiVerbi(verbi = VERBI) {
  const guasti = []
  for (const [chiave, v] of Object.entries(verbi)) {
    const dove = `verbo "${chiave}"`
    if (!v.nome) guasti.push(`${dove}: senza nome`)
    if (!MODI_VALIDI.includes(v.modo)) guasti.push(`${dove}: modo "${v.modo}" non esiste`)
    if (typeof v.consegna !== 'function') guasti.push(`${dove}: senza consegna`)
    if (!v.richiede || typeof v.richiede !== 'object') guasti.push(`${dove}: senza "richiede"`)
    else if (!(v.richiede.totale > 0 || v.richiede.animali > 0))
      guasti.push(`${dove}: "richiede" non chiede nessuna specie`)
  }
  return guasti
}
