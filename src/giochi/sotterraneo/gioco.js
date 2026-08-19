/* ═══════════════════════════════════════════════════════════════════
   IL SOTTERRANEO — IL MANIFESTO

   La carta d'identità del gioco. È **dato puro**: non importa Vue, non
   importa il profilo, non importa nemmeno il proprio `Gioco.vue`. La home
   e la schermata dei genitori hanno bisogno di sapere che questo gioco
   esiste e passano dallo store; se il manifesto si tirasse dietro lo
   store si chiuderebbe un anello di `import` che Vite risolve a caso.

   La schermata sta a parte, in `src/giochi/schermate.js`.

   COS'È IL GIOCO. Un sotterraneo che si **cammina**, dall'alto, col
   dito: si tocca dove si vuole andare, si entra nelle stanze, si toccano
   le cose. Ogni cosa che vale ha un prezzo, e il prezzo è rispondere —
   una porta chiusa una domanda facile, un forziere una sola e tosta, un
   mostro una per colpo. Le domande sono quelle dei moduli di quiz, e il
   gioco non sa di che materia siano: chiede una difficoltà da 0 a 1 che
   cresce scendendo.

   **Non sostituisce il Dungeon a bivi** (`src/giochi/dungeon/`): quello
   è un gioco a carte dove si sceglie un bivio alla volta e non si torna
   indietro, questo è un posto invece che un diagramma. Fanno cose
   diverse con gli stessi esercizi.
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'

export const CHIAVE = 'sotterraneo'

export default {
  chiave: CHIAVE,
  nome: 'Il sotterraneo',
  icona: '🗺️',
  /* invita, non spiega: che le porte si aprano rispondendo lo scopre
     chi tocca la prima */
  che: 'un posto da girare, dove tutto ha un prezzo',
  area: 'avventure',
  come: 'domande',
  /* ── LE DOMANDE QUI SONO QUELLE DEI MODULI DI QUIZ ──
     Non «questo gioco fa domande» — le fa anche Conta gli animali, ma
     sono sue — bensì **il pedaggio passa da `src/quiz/`**, cioè dal
     mazzo che l'età del bambino taglia. Lo chiede il quadro di un'età
     (`data/quadro.js`): se in casa non c'è nessun gioco che dichiara
     questa riga, i quattro blocchi delle domande descrivono un mazzo
     che nessuno pescherà, e vanno detti per quello che sono. */
  quiz: true,
  tappe: QUANTE_TAPPE,

  /* ── ESCE DALLA PROVA ──
     Stava dietro «i giochi in prova» perché non l'aveva giocato nessuno,
     e le due manopole che decidono se una stanza fa paura o fa
     arrabbiare — di quanto i mostri sono più lenti, e i tre secondi di
     calma dopo una fuga — sono tarate a occhio. Restano tarate a occhio:
     quello che cambia è che adesso qualcuno ci gioca, che è l'unico modo
     per sapere se quei numeri sono giusti. Un gioco chiuso in un cancello
     non riceve mai la sola prova che conta. */
  /* chiara anche se il gioco è notturno: in home il testo è blu scuro
     per tutti, e una carta color caverna lo renderebbe illeggibile */
  tinta: '#dfe4f2',

  /* La riga sotto il nome in home: la scrive il gioco perché è il gioco
     a sapere cosa vuol dire il suo avanzamento. Riceve il record di
     `src/giochi/campagne.js` e non se lo va a prendere, così resta una
     funzione e si può provare. */
  riassunto(av = { tappa: 0, libera: false, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `discesa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  /* ═══════════ quello che il gioco porta all'albo ═══════════
     I contatori li muove `Gioco.vue` a fine discesa, uno per riga:
       sotStanze   stanze illuminate, in tutto
       sotPiani    piani scesi fino in fondo
       sotMostri   mostri abbattuti
       sotTesori   forzieri aperti (quelli sbagliati non contano: restano chiusi)
       sotInteri   discese finite senza svenire nemmeno una volta
       sotGemme    (primato) le gemme portate a casa in una discesa sola
     Si scrivono alla fine e non stanza per stanza apposta: salvare venti
     volte per discesa non aggiunge niente e costa a ogni tocco. */
  albo: {
    area: { nome: 'Il sotterraneo', emoji: '🗺️' },

    /* L'unità di lavoro è il piano sceso: una manciata di risposte per
       la chiave, più tutto quello che si è scelto di pagare per strada. */
    xp: m => m.tot('sotPiani') * 6 + m.tot('sotMostri') * 2 +
             m.stelleDi(CHIAVE) * 5 + m.tappeDi(CHIAVE) * 40,
    provato: m => m.tot('sotStanze') > 0,

    traguardi: [
      { id: 'sot-stanze', emoji: '🕯️', nome: 'Ci sono già stato',
        come: n => `Illumina ${n} stanze là sotto`,
        soglie: [20, 100, 400], valore: m => m.tot('sotStanze') },
      { id: 'sot-piani', emoji: '🪜', nome: 'Sempre più giù',
        come: n => n === 1 ? 'Scendi un piano intero' : `Scendi ${n} piani`,
        soglie: [1, 10, 40], valore: m => m.tot('sotPiani') },
      { id: 'sot-mostri', emoji: '⚔️', nome: 'Braccio fermo',
        come: n => `Abbatti ${n} mostri`,
        soglie: [10, 60, 200], valore: m => m.tot('sotMostri') },
      /* il forziere è l'unica cosa che si perde per sempre: contarlo
         vuol dire contare le domande toste indovinate al primo colpo */
      { id: 'sot-tesori', emoji: '🎁', nome: 'Mano ferma',
        come: n => `Apri ${n} forzieri senza sbagliare`,
        soglie: [3, 15, 50], valore: m => m.tot('sotTesori') },
      { id: 'sot-interi', emoji: '❤️', nome: 'Mai a terra',
        come: n => n === 1 ? 'Finisci una discesa senza mai svenire'
                           : `Finisci ${n} discese senza mai svenire`,
        soglie: [1, 3, 10], valore: m => m.tot('sotInteri') },
      { id: 'sot-campagna', emoji: '🏁', nome: 'Fino al fondo',
        come: () => 'Finisci tutte le discese',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}
