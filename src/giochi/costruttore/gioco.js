/* ═══════════════════════════════════════════════════════════════════
   IL COSTRUTTORE — IL MANIFESTO

   Un robot costruisce, visto di lato, quello che il bambino programma.
   Il bambino scrive **progetti** (le funzioni) con delle **misure** (i
   parametri) e usa delle **lavagnette** (le variabili); qualcuno ordina
   una cosa — una scala, un ponte, un castello — e le misure dell'ordine
   cambiano: lo stesso programma deve reggere su tre gradini e su
   cinque. È il gioco che il Generale aveva lasciato a un domani: quello
   «dove si scrive di più e si tocca di meno», e dove le variabili le
   crea il bambino.

   Dato puro, come tutti i manifesti (vedi `codice-segreto/gioco.js`).
   La struttura della cartella è quella di sempre:

     dati/    colori, legenda delle mappe, i livelli, la campagna, e
              `scrivi.js` — come si scrive un programma dentro un dato
     motore/  il mondo, l'esecutore a passi, la prova sugli ordini, le
              modifiche al programma: tutto senza schermo, gira in Node
     scena/   il cantiere disegnato: mattoni, robot, omino
     viste/   la mappa, l'editor e le sue caselle, i cartelli
     Gioco.vue  il coordinatore: l'unico che sa di monete e profilo
   ═══════════════════════════════════════════════════════════════════ */
import { CAMPAGNA, QUANTE_TAPPE } from './dati/campagna.js'

export const CHIAVE = 'costruttore'

export default {
  chiave: CHIAVE,
  nome: 'Il costruttore',
  icona: '🏗️',
  che: 'programmare con funzioni e variabili',
  area: 'logica',
  come: 'pensare',
  tappe: QUANTE_TAPPE,
  tinta: '#f3e3d3',
  /* si legge: le righe del programma sono frasi, e le lavagnette hanno
     un nome. Sotto la terza elementare non si comincia da qui */
  grandi: true,
  /* in prova: dietro «giochi in prova» finché non l'ha visto giocare
     un bambino vero */
  sperimentale: true,
  /* la fila si apre per merito: chi ha vinto un livello apre il
     successivo anche oltre la mira dell'età (`data/portata-giochi.js`).
     Ogni livello è il passo dopo di quello prima, e averlo vinto è la
     prova che il bambino ci arriva */
  perMerito: true,

  riassunto(av = { tappa: 0, stelle: {} }) {
    const stelle = Object.values(av.stelle || {}).reduce((n, s) => n + s, 0)
    const coda = stelle ? ` · ⭐ ${stelle}` : ''
    if ((av.tappa || 0) >= QUANTE_TAPPE) return `tutti i cantieri finiti${coda}`
    const i = Math.min(av.tappa || 0, QUANTE_TAPPE - 1)
    return `livello ${i + 1} di ${QUANTE_TAPPE} · ${CAMPAGNA[i].nome}${coda}`
  },

  /* ═══════════ quello che il gioco porta all'albo ═══════════
     Un contatore solo, mosso da `Gioco.vue` con `segna()`:
       coMattoni   i mattoni che il robot ha posato, in qualunque prova
     Il resto lo sanno già le campagne (tappe, stelle, finita). */
  albo: {
    area: { nome: 'Il costruttore', emoji: '🏗️' },

    xp: m => m.tappeDi(CHIAVE) * 40 + m.stelleDi(CHIAVE) * 10 + Math.floor(m.tot('coMattoni') / 20),
    provato: m => m.tot('coMattoni') > 0 || m.tappeDi(CHIAVE) > 0,

    traguardi: [
      { id: 'co-livelli', emoji: '🏗️', nome: 'Capomastro',
        come: n => n === 1 ? 'Finisci il primo livello del costruttore'
                           : `Finisci ${n} livelli del costruttore`,
        soglie: [1, 6, QUANTE_TAPPE], valore: m => m.tappeDi(CHIAVE) },
      { id: 'co-stelle', emoji: '⭐', nome: 'Tutto da solo',
        come: n => `Raccogli ${n} stelle nel costruttore`,
        soglie: [5, 14, QUANTE_TAPPE * 2], valore: m => m.stelleDi(CHIAVE) },
      { id: 'co-mattoni', emoji: '🧱', nome: 'Mille mattoni',
        come: n => `Fai posare al robot ${n} mattoni`,
        soglie: [100, 1000, 5000], valore: m => m.tot('coMattoni') },
      { id: 'co-fine', emoji: '🏁', nome: 'Il cantiere è finito',
        come: () => 'Finisci tutti i livelli del costruttore',
        soglie: [1], valore: m => m.finita(CHIAVE) },
    ],
  },
}
