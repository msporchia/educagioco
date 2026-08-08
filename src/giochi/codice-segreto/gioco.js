/* ═══════════════════════════════════════════════════════════════════
   CODICE SEGRETO — IL MANIFESTO

   La carta d'identità del gioco: chi è, come si chiama, dove è arrivato
   chi ci gioca. È **dato puro** — non importa Vue, non importa il
   profilo, non importa nemmeno il proprio `Gioco.vue` — e questo non è
   pignoleria: la home e la schermata dei genitori hanno bisogno di
   sapere che questo gioco esiste, e passano dallo store; se il manifesto
   si tirasse dietro lo store si chiuderebbe un anello di `import` che
   Vite risolve a caso e che si rompe un lunedì mattina senza motivo.

   La schermata sta a parte, in `src/giochi/schermate.js`, ed è l'unico
   posto che tira dentro il `.vue`.

   Struttura della cartella (il calco per i giochi che verranno, vedi
   `src/giochi/CONVENZIONE.md`):

     dati/    tabelle e basta: temi, difficoltà, tappe
     motore/  le regole, a classi, senza schermo — girano anche in Node
     scena/   canvas e coreografie, che di regole non sanno niente
     viste/   un componente per schermata
     Gioco.vue  il coordinatore, l'unico che sa che esistono le monete
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'

export const CHIAVE = 'codice'

export default {
  chiave: CHIAVE,
  nome: 'Codice Segreto',
  icona: '🔐',
  che: 'logica: dedurre il codice dagli indizi',
  tappe: QUANTE_TAPPE,
  /* il colore della carta in home: se lo porta il gioco, così aggiungerne
     uno non vuol dire aggiungere una riga al foglio di stile della home */
  tinta: '#f7ecd6',

  /* La riga che la home mostra sotto il nome. La scrive il gioco perché
     è il gioco a sapere cosa vuol dire il suo avanzamento: la home non
     deve imparare cos'è una tappa del Codice Segreto. Riceve il record
     dell'avanzamento (`src/giochi/campagne.js`) e non se lo va a
     prendere: così resta una funzione e si può provare. */
  riassunto(av = { tappa: 0, libera: false, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if (av.libera) return `gioco libero ♾️${coda}`
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `tappa ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  /* ═══════════ quello che il gioco porta all'albo ═══════════
     Un gioco si presenta da solo: la sua famiglia di traguardi, quanto
     vale in esperienza, e come si capisce che è stato provato. Chi
     raccoglie è `src/giochi/albo.js`, e né `data/traguardi.js` né
     `store/progressi.js` sanno che questo gioco esiste.

     Le misure che i traguardi leggono sono quelle di tutti (`m.tot`,
     `m.best`) più le tre che ogni campagna ha per forza — `m.tappeDi`,
     `m.stelleDi`, `m.finita` — che leggono `profile.campagne[chiave]` e
     valgono uguali per qualunque gioco nuovo.

     I contatori li muove `Gioco.vue` con `segna()`/`segnaBest()`:
       codici        codici indovinati in tutto
       codiciTappe   tappe portate a casa
       serieCodici   (primato) codici indovinati di fila             */
  albo: {
    area: { nome: 'Codice Segreto', emoji: '🔐' },

    /* L'unità di lavoro è il codice indovinato: sono cinque o sei
       ragionamenti in fila, quindi vale più di una risposta a quiz. Il
       resto sono le cose che si portano a casa una volta sola. */
    xp: m => m.tot('codici') * 3 + m.stelleDi(CHIAVE) * 5 + m.tappeDi(CHIAVE) * 40,
    provato: m => m.tot('codici') > 0,

    traguardi: [
      { id: 'cod-codici', emoji: '🔓', nome: 'Scassinatore',
        come: n => `Indovina ${n} codici`,
        soglie: [5, 30, 120], valore: m => m.tot('codici') },
      { id: 'cod-tappe', emoji: '🗝️', nome: 'Di porta in porta',
        come: n => n === 1 ? 'Supera la prima tappa del Codice Segreto'
                           : `Supera ${n} tappe del Codice Segreto`,
        soglie: [1, 5, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      /* le stelle sono la somma dei primati per tappa, non delle partite:
         rigiocarne una già fatta non ne aggiunge */
      { id: 'cod-stelle', emoji: '⭐', nome: 'Chiavi d\'oro',
        come: n => `Raccogli ${n} stelle sui codici`,
        soglie: [6, 15, QUANTE_TAPPE * 3], valore: m => m.stelleDi(CHIAVE) },
      /* quello che dice che non è fortuna: due di fila capitano, otto no */
      { id: 'cod-serie', emoji: '🔥', nome: 'Non sbaglio un colpo',
        come: n => `Indovina ${n} codici di fila`,
        soglie: [3, 6, 12], valore: m => m.best('serieCodici') },
      { id: 'cod-campagna', emoji: '🏁', nome: 'Cassaforte aperta',
        come: () => 'Finisci tutte le tappe del Codice Segreto',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}
