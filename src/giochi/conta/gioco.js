/* ═══════════════════════════════════════════════════════════════════
   CONTA GLI ANIMALI — IL MANIFESTO

   Il gioco più semplice dell'applicazione, e il primo che un bambino di
   quattro anni apre da solo: si conta quello che si vede, si tocca
   quello che si conta. Niente consegna da leggere — la striscia in cima
   è tutta icone — niente punteggio che scende, niente tempo che stringe.
   Una tappa non si perde: se una risposta è sbagliata si conta insieme
   e si riprova la stessa domanda, finché non riesce.

   Dato puro, come vuole `src/giochi/CONVENZIONE.md`: non importa Vue, non
   importa il profilo. La schermata sta a parte, in
   `src/giochi/schermate.js`.

   Struttura della cartella (lo stesso calco di `codice-segreto/`):

     dati/    mondi (le specie), verbi (i tipi di domanda), campagna
     motore/  la domanda e la corsa nella tappa — senza schermo, gira
              anche in Node
     viste/   la mappa, la scena di gioco, il cartello di fine
     Gioco.vue  il coordinatore, l'unico che sa che esistono le monete
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA, SCALINI, QUANTE_TAPPE } from './dati/campagna.js'

export const CHIAVE = 'conta'

export default {
  chiave: CHIAVE,
  nome: 'Conta gli animali',
  icona: '🐑',
  /* accorciato quando `che` è finito sulla carta in home: per esteso
     («dal contare in fila alla conservazione del numero, agli insiemi»)
     prendeva tre righe e diceva a un genitore quello che qui non serve
     — la carta invita, non spiega. Il lungo vive nei traguardi. */
  che: 'contare davvero: in fila, sparpagliati e a insiemi',
  area: 'numeri',
  come: 'domande',
  tappe: QUANTE_TAPPE,
  tinta: '#eaf6e3',

  /* dichiarato per la home dei più piccoli che arriverà dopo — un gioco
     senza testo da leggere e senza modo di perdere è il primo che si
     apre da soli. Non tocca niente qui dentro: è solo un'etichetta. */
  piccoli: true,

  riassunto(av = { tappa: 0, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if ((av.tappa || 0) >= QUANTE_TAPPE) return `campagna finita${coda}`
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    const s = SCALINI.find(s => s.chiave === CAMPAGNA[i].scalino)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${s.nome}${coda}`
  },

  /* ═══════════ quello che il gioco porta all'albo ═══════════
     I contatori li muove `Gioco.vue` con `segna()`/`segnaBest()`:
       contate      domande giuste, in tutto
       contaTappe   tappe portate a casa
       serieConta   (primato) domande giuste di fila                  */
  albo: {
    area: { nome: 'Conta gli animali', emoji: '🐑' },

    xp: m => m.tot('contate') * 2 + m.stelleDi(CHIAVE) * 4 + m.tappeDi(CHIAVE) * 30,
    provato: m => m.tot('contate') > 0,

    traguardi: [
      { id: 'conta-contate', emoji: '🔢', nome: 'Sa contare',
        come: n => `Rispondi giusto a ${n} domande`,
        soglie: [10, 50, 150], valore: m => m.tot('contate') },
      { id: 'conta-tappe', emoji: '🐑', nome: 'Di tappa in tappa',
        come: n => n === 1 ? 'Supera la prima tappa di Conta gli animali'
                           : `Supera ${n} tappe di Conta gli animali`,
        soglie: [1, 6, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      { id: 'conta-stelle', emoji: '⭐', nome: 'Stelle nel prato',
        come: n => `Raccogli ${n} stelle contando`,
        soglie: [8, 20, QUANTE_TAPPE * 3], valore: m => m.stelleDi(CHIAVE) },
      /* quello che dice che non è fortuna: tre di fila capitano, dieci no */
      { id: 'conta-serie', emoji: '🔥', nome: 'Filotto',
        come: n => `Rispondi giusto ${n} volte di fila`,
        soglie: [3, 8, 15], valore: m => m.best('serieConta') },
      { id: 'conta-campagna', emoji: '🏁', nome: 'Il libretto è pieno',
        come: () => 'Finisci tutte le tappe di Conta gli animali',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}
