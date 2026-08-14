/* ═══════════════════════════════════════════════════════════════════
   I VERBI — sei modi di chiedere la stessa cosa

   Tutti partono dagli stessi ingredienti (una storia, una sequenza di
   emoji) e chiedono di riconoscere il tempo che passa: rimettere in
   ordine, indovinare il buco, dire cosa viene dopo o prima, trovare
   quello che non c'entra.

   `tipo` decide come si gioca, e `motore/quesito.js` sceglie la classe
   da usare guardandolo:
     'ordina'   si toccano le vignette sparse, una per buca
     'scegli'   si tocca una delle tre opzioni
     'intruso'  si tocca la vignetta che non c'entra

   `minPassi` è quanto deve essere lunga una storia per reggere questo
   verbo: tre passi bastano per mettere in fila o indovinare un buco,
   ma per «trovare l'intruso» in mezzo a quattro vignette vere ce ne
   vogliono almeno quattro, o l'intruso sarebbe l'unica vignetta vera
   rimasta e la domanda si risponderebbe da sola.

   `icona` è la consegna senza parole — la freccia del tempo di cui
   parla il capitolato — e `frase` è il testo piccolo sotto, per chi
   legge e per i genitori: il gioco deve restare giocabile ignorandolo
   del tutto.
   ═══════════════════════════════════════════════════════════════════ */

export const VERBI = {
  ordina3: { chiave: 'ordina3', tipo: 'ordina', n: 3, minPassi: 3,
             icona: '⏱️➡️', frase: 'Rimetti in ordine: prima, poi, infine.' },
  ordina4: { chiave: 'ordina4', tipo: 'ordina', n: 4, minPassi: 4,
             icona: '⏱️➡️', frase: 'Quattro vignette: in che ordine vengono?' },
  manca:   { chiave: 'manca', tipo: 'scegli', minPassi: 3,
             icona: '🧩', frase: "L'inizio e la fine ci sono già: cosa manca nel mezzo?" },
  dopo:    { chiave: 'dopo', tipo: 'scegli', minPassi: 3,
             icona: '➡️❓', frase: 'Si vede l\'inizio della storia. Cosa succede dopo?' },
  prima:   { chiave: 'prima', tipo: 'scegli', minPassi: 3,
             icona: '❓➡️', frase: 'Si vede la fine della storia. Cosa c\'era prima?' },
  intruso: { chiave: 'intruso', tipo: 'intruso', minPassi: 4,
             icona: '🔍', frase: "Una vignetta non c'entra con questa storia: toccala." },
}

export const CHIAVI_VERBI = Object.keys(VERBI)

export const verbo = chiave => VERBI[chiave] || VERBI.ordina3

const TIPI = ['ordina', 'scegli', 'intruso']

export function guastiDeiVerbi(verbi = VERBI) {
  const guasti = []
  for (const [chiave, v] of Object.entries(verbi)) {
    const dove = `verbo "${chiave}"`
    if (v.chiave !== chiave) guasti.push(`${dove}: la chiave interna non combacia`)
    if (!TIPI.includes(v.tipo)) guasti.push(`${dove}: tipo "${v.tipo}" sconosciuto`)
    if (!v.icona || !v.frase) guasti.push(`${dove}: senza icona o senza frase`)
    if (!(v.minPassi >= 3)) guasti.push(`${dove}: minPassi ${v.minPassi} è troppo poco`)
    if (v.tipo === 'ordina' && !(v.n >= 3))
      guasti.push(`${dove}: è un "ordina" ma "n" non è impostato bene`)
    if (v.tipo === 'ordina' && v.n > v.minPassi)
      guasti.push(`${dove}: chiede ${v.n} vignette ma accetta storie da ${v.minPassi} passi`)
    if (v.tipo === 'intruso' && v.minPassi < 4)
      guasti.push(`${dove}: l'intruso in mezzo a meno di quattro vignette vere si vede da solo`)
  }
  return guasti
}
