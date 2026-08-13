/* ═══════════════════════════════════════════════════════════════════
   REAZIONE — quello che fai senza che nessuno te l'abbia detto

   Sta nella SCHEDA di un'unità, non nel suo piano, perché non è un
   ordine che qualcuno le ha dato: è come è fatta lei. E si legge — la
   scheda che il bambino apre col dito la mostra — perché una reazione
   che non si può leggere non è una regola del mondo: è una sorpresa.

   ── LA DIFFERENZA CON UN «QUANDO SENTI» È UNA SOLA ──
   Un ascolto è una cosa che **hai scritto tu**: aspetta educatamente
   che il personaggio sia libero, perché se ti interrompesse a metà
   strada il tuo piano non si spiegherebbe più. Una reazione **ti
   prende mentre stai facendo altro**, ti fa fare la sua cosa e poi ti
   restituisce dov'eri. Nel codice sono la stessa struttura con un
   numero diverso: la priorità.

   ── QUI DENTRO NON C'È NESSUN COMPORTAMENTO ──
   E questa è la cosa importante. La sequenza — «corri dove hai sentito,
   guardati intorno, torna» — non è scritta qui: è un DATO del livello,
   fatto degli stessi ordini che scrive il bambino. Il motore sa
   soltanto **quando** far partire una fila e **con che priorità**.
   Averla cablata qui vorrebbe dire che una guardia che corre e non
   torna, o che corre e grida, richiede di modificare il motore — ed è
   lo stesso errore del vecchio verbo `pattuglia`, che prendeva una
   lista di punti e non lasciava metterci dentro nient'altro.

   ── I DUE COMPLEMENTI CHE NON SI POSSONO SCRIVERE PRIMA ──
   `dove ho sentito` e `dov'ero` sono gli unici pezzi che il livello non
   può conoscere quando lo si scrive: il primo lo dice il messaggio, il
   secondo dipende da dove ti ha colto. Si risolvono in celle vere nel
   momento in cui la reazione parte, e da lì in poi sono ordini come
   tutti gli altri — nel registro si legge «vado a (11,6)».
   ═══════════════════════════════════════════════════════════════════ */
import { Ascoltatore, REAZIONE } from '../filo.js'
import { Fila } from '../azioni/fila.js'
import { compilaFila } from '../azioni/indice.js'

/* i due complementi riservati. Sono stringhe che nessun livello userebbe
   come id, e restano leggibili in una diff. */
export const DOVE_HO_SENTITO = 'dove-ho-sentito'
export const DOV_ERO = 'dov-ero'

export class Reazione extends Ascoltatore {
  /* `dato` è quello che il livello ha scritto:
       { quando:'senti', segnale:'richiamo', fai:[ …ordini… ] }
       { quando:'vedi',  chi:'nostri',       fai:[ …ordini… ] }
       { quando:'colpito',                   fai:[ …ordini… ] } */
  constructor (dato) {
    super(dato.segnale || null, new Fila([]),
          `reagisce a «${dato.segnale || dato.chi || 'un colpo'}»`, REAZIONE)
    this.evento = dato.quando
    this.chi = dato.chi || null
    this.ordini = Array.isArray(dato.fai) ? dato.fai : []
  }

  riconosce (messaggio) {
    if (this.evento !== 'senti') return false
    return !this.segnale || messaggio.segnale === this.segnale
  }

  /* ── LA FILA SI SCRIVE QUANDO L'EVENTO ARRIVA ──
     Prima non si può: la meta è il punto da cui è partito il rumore, e
     quello lo dice il messaggio. Si risolvono i due complementi
     riservati e si compila, e quello che ne esce sono ordini normali. */
  preparaPer (messaggio, chi) {
    const qui = `${chi.x},${chi.y}`
    const la = messaggio && messaggio.x != null ? `${messaggio.x},${messaggio.y}` : qui
    this.filo.fila = compilaFila(this.ordini.map(o => risolvi(o, la, qui)))
    this.filo.azzera()
    return this.filo
  }

  /* come si legge in una scheda: gli ordini veri, non una frase che
     qualcuno deve tenere allineata al codice */
  get comeSiLegge () { return this.ordini }
}

/* i complementi riservati diventano celle. Si scende anche nei blocchi,
   perché una reazione può contenere un bivio come qualunque altra fila. */
function risolvi (ordine, dovHoSentito, dovEro) {
  if (!ordine || typeof ordine !== 'object') return ordine
  const fuori = { ...ordine }
  if (fuori.complemento === DOVE_HO_SENTITO) fuori.complemento = dovHoSentito
  if (fuori.complemento === DOV_ERO) fuori.complemento = dovEro
  for (const dentro of ['corpo', 'vero', 'falso', 'allora'])
    if (Array.isArray(fuori[dentro]))
      fuori[dentro] = fuori[dentro].map(o => risolvi(o, dovHoSentito, dovEro))
  return fuori
}
