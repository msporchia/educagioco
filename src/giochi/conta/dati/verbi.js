/* ═══════════════════════════════════════════════════════════════════
   I VERBI — i tipi di domanda

   Un verbo è un modo di chiedere «quanti?». Non genera niente da solo
   (quello è `motore/scena.js`, che ha bisogno del mondo e del caso): qui
   c'è solo la sua carta d'identità, dato puro come vuole `CONVENZIONE.md`.

     modo       come si risponde — decide quale riga di bottoni mostra
                la vista, non il verbo:
                  'cifre'      si sceglie una cifra fra tre o quattro
                  'porta'      si toccano N gettoni e si conferma con ✔
                  'confronto'  due recinti: sinistra / uguale / destra
                  'inclusione' due bottoni: il sottoinsieme o l'insieme
     richiede   quante specie del mondo servono, per categoria — è quello
                che dice se un mondo può ospitare questa tappa, e lo
                controlla `guastiDellaCampagna` (vedi `campagna.js`)
     consegna   la striscia iconica in cima, **sempre leggibile senza
                testo**: riceve i fatti già decisi dal motore (quale
                specie, quanti) e torna `{ icone, frase }`. `frase` è la
                stessa cosa scritta piccola sotto, per chi legge.

   Nessuna voce qui dentro: l'italiano non è ancora inciso
   (`strumenti/incidi-voci.mjs` fa solo inglese e spagnolo). Il giorno
   in cui arriverà, entrerà proprio qui — `consegna()` è già il posto
   giusto, perché è l'unico che sa cosa dire.
   ═══════════════════════════════════════════════════════════════════ */

export const VERBI = {
  quanti: {
    chiave: 'quanti', nome: 'Quanti sono?', modo: 'cifre',
    richiede: { totale: 1 },
    consegna: ({ specie }) => ({
      icone: ['❓', specie.emoji],
      frase: `Quante ${specie.tanti} ci sono?`,
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
    /* due specie animali distinte, un recinto per ciascuna */
    richiede: { animali: 2 },
    consegna: ({ specieA, specieB }) => ({
      icone: [specieA.emoji, '❓', specieB.emoji],
      frase: `Dove ce n'è di più: ${specieA.tanti} o ${specieB.tanti}?`,
    }),
  },

  /* la conservazione del numero: la quantità non cambia se cambia la
     disposizione. È il concetto più importante del gioco — vedi
     `motore/scena.js` per come si costruiscono le due file di posizioni. */
  stessi: {
    chiave: 'stessi', nome: 'Sono sempre gli stessi?', modo: 'cifre',
    richiede: { totale: 1 },
    consegna: ({ specie }) => ({
      icone: [specie.emoji, '🔀', '❓'],
      frase: `Contali, poi si sparpagliano: quanti sono adesso?`,
    }),
  },

  /* nella scena ci sono animali e cose: si conta solo la specie giusta,
     ignorando i distrattori */
  quantiDi: {
    chiave: 'quantiDi', nome: 'Quante di queste?', modo: 'cifre',
    richiede: { animali: 1, cose: 1 },
    consegna: ({ specie }) => ({
      icone: ['❓', specie.emoji],
      frase: `Quante ${specie.tanti} ci sono?`,
    }),
  },

  /* l'unione: due specie animali stanno tutte e due dentro «animali» */
  insieme: {
    chiave: 'insieme', nome: 'Quanti animali in tutto?', modo: 'cifre',
    richiede: { animali: 2, cose: 1 },
    consegna: () => ({
      icone: ['❓', '🐾'],
      frase: `Quanti animali ci sono in tutto?`,
    }),
  },

  /* l'inclusione di classe: la risposta è sempre «più animali», perché
     la specie bersaglio è sempre un sottoinsieme proprio — mai un
     mucchio uguale all'altro, o la domanda sarebbe ingiusta */
  inclusione: {
    chiave: 'inclusione', nome: 'Più queste o più animali?', modo: 'inclusione',
    richiede: { animali: 2 },
    consegna: ({ specie }) => ({
      icone: [specie.emoji, '❓', '🐾'],
      frase: `Ci sono più ${specie.tanti} o più animali?`,
    }),
  },

  /* il successore/predecessore: ponte all'addizione */
  piuUno: {
    chiave: 'piuUno', nome: 'Uno in più (o uno in meno)', modo: 'cifre',
    richiede: { totale: 1 },
    consegna: ({ specie, direzione }) => ({
      icone: [specie.emoji, direzione === 'arriva' ? '➕' : '➖', '❓'],
      frase: direzione === 'arriva'
        ? `Ne arriva un'altra: quante sono adesso?`
        : `Una scappa via: quante restano?`,
    }),
  },

  /* l'addizione concreta: due gruppi separati, quanti in tutto */
  unisci: {
    chiave: 'unisci', nome: 'Quanti in tutto?', modo: 'cifre',
    richiede: { totale: 2 },
    consegna: ({ specieA, specieB }) => ({
      icone: [specieA.emoji, '➕', specieB.emoji, '❓'],
      frase: `${specieA.tanti} e ${specieB.tanti}: quanti sono in tutto?`,
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
