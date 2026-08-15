/* ═══════════════════════════════════════════════════════════════════
   IL DUNGEON A BIVI — IL MANIFESTO

   La carta d'identità del gioco. È **dato puro**: non importa Vue, non
   importa il profilo, non importa nemmeno il proprio `Gioco.vue`. La
   home e la schermata dei genitori hanno bisogno di sapere che questo
   gioco esiste e passano dallo store; se il manifesto si tirasse dietro
   lo store si chiuderebbe un anello di `import` che Vite risolve a caso.

   La schermata sta a parte, in `src/giochi/schermate.js`.

   COS'È IL GIOCO. Si scende in un dungeon disegnato da capo ogni volta.
   A ogni bivio si sceglie una stanza fra due o tre, e ognuna dice
   prima cosa promette e quanto chiede: il mostro grosso lascia un
   bottino doppio ma vuole tre risposte difficili, lo scrigno non fa
   male ma se sbagli il tesoro resta lì. **La domanda è il passaggio** —
   quella che apre le porte è una domanda dei moduli di quiz, e il gioco
   non sa nemmeno di che materia sia: chiede una difficoltà da 0 a 1,
   che cresce mano a mano che si scende.

   Struttura della cartella (il calco è `codice-segreto/`, vedi
   `src/giochi/CONVENZIONE.md`):

     dati/    tabelle: campagna, stanze, mostri, tesori, stranezze, taratura
     motore/  le regole, a classi, senza schermo — girano anche in Node
     scena/   la caverna disegnata su tela, che di regole non sa niente
     viste/   un componente per schermata
     Gioco.vue  il coordinatore, l'unico che sa di monete e di quiz
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'

export const CHIAVE = 'dungeon'

export default {
  chiave: CHIAVE,
  nome: 'Il Dungeon',
  icona: '🗝️',
  che: 'scegli la strada, le domande aprono le porte',
  area: 'avventure',
  come: 'domande',
  tappe: QUANTE_TAPPE,
  /* Il colore della carta in home: se lo porta il gioco, aggiungerne uno
     non vuol dire aggiungere una riga al foglio di stile della home.
     **Va tenuto chiaro** anche se il gioco è notturno: in home il testo
     è blu scuro per tutti, e una carta color caverna lo rende
     illeggibile. Il buio comincia dopo, quando si entra. */
  tinta: '#e6dcf7',

  /* La riga che la home mostra sotto il nome. La scrive il gioco perché
     è il gioco a sapere cosa vuol dire il suo avanzamento. Riceve il
     record di `src/giochi/campagne.js` e non se lo va a prendere: così
     resta una funzione e si può provare. */
  riassunto(av = { tappa: 0, libera: false, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if (av.libera) return `discesa senza fondo ♾️${coda}`
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  /* ═══════════ quello che il gioco porta all'albo ═══════════
     Un gioco si presenta da solo: la sua famiglia di traguardi, quanto
     vale in esperienza, e come si capisce che è stato provato. Chi
     raccoglie è `src/giochi/albo.js`, e né `data/traguardi.js` né
     `store/progressi.js` sanno che questo gioco esiste.

     Le misure sono quelle di tutti (`m.tot`, `m.best`) più le tre che
     ogni campagna ha per forza — `m.tappeDi`, `m.stelleDi`, `m.finita`.

     I contatori li muove `Gioco.vue` a fine discesa, uno per riga:
       dungeonStanze   stanze attraversate in tutto
       dungeonBoss     guardiani battuti (cioè discese portate a termine)
       dungeonInteri   discese finite senza perdere nemmeno un cuore
       dungeonTesori   tesori raccolti
     Si scrivono alla fine e non stanza per stanza apposta: salvare
     dodici volte per discesa non aggiunge niente e costa a ogni tocco. */
  albo: {
    area: { nome: 'Il Dungeon', emoji: '🗝️' },

    /* L'unità di lavoro è la stanza attraversata: due o tre risposte in
       fila più una scelta. Il guardiano vale come una discesa intera,
       perché lo è. */
    xp: m => m.tot('dungeonStanze') * 2 + m.tot('dungeonBoss') * 15 +
             m.stelleDi(CHIAVE) * 5 + m.tappeDi(CHIAVE) * 40,
    provato: m => m.tot('dungeonStanze') > 0,

    traguardi: [
      { id: 'dng-stanze', emoji: '🚪', nome: 'Esploratore',
        come: n => `Attraversa ${n} stanze del dungeon`,
        soglie: [15, 80, 300], valore: m => m.tot('dungeonStanze') },
      { id: 'dng-boss', emoji: '👑', nome: 'Ammazzaguardiani',
        come: n => n === 1 ? 'Batti il guardiano in fondo a un dungeon'
                           : `Batti ${n} guardiani`,
        soglie: [1, 5, 15], valore: m => m.tot('dungeonBoss') },
      /* quello che dice che non è fortuna: si arriva in fondo, e si
         arriva **interi**. Con un cuore perso non conta */
      { id: 'dng-interi', emoji: '❤️', nome: 'Nemmeno un graffio',
        come: n => n === 1 ? 'Finisci un dungeon senza perdere un cuore'
                           : `Finisci ${n} dungeon senza perdere un cuore`,
        soglie: [1, 3, 10], valore: m => m.tot('dungeonInteri') },
      { id: 'dng-tesori', emoji: '🎁', nome: 'Cercatore di tesori',
        come: n => `Trova ${n} tesori là sotto`,
        soglie: [3, 15, 50], valore: m => m.tot('dungeonTesori') },
      { id: 'dng-tappe', emoji: '🪜', nome: 'Sempre più giù',
        come: n => n === 1 ? 'Supera la prima discesa della campagna'
                           : `Supera ${n} discese della campagna`,
        soglie: [1, 5, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      { id: 'dng-campagna', emoji: '🏁', nome: 'Il covo del drago',
        come: () => 'Finisci tutte le discese della campagna',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}
