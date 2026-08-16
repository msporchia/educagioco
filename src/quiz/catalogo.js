/* ═══════════════════════════════════════════════════════════════════
   IL CATALOGO, COL REGISTRO DENTRO — il ponte fra i moduli e la
   schermata dei grandi.

   Stessa divisione di `saperi.js`: il conto sta in `nucleo/catalogo.js`,
   che non importa niente e si prova in Node; qui si aggiunge il registro
   (`import.meta.glob`, quindi solo sotto Vite) e i due pezzi che vengono
   dal profilo — cosa il genitore ha spento, e cosa è stato giudicato
   giocando.

   Lo usa `Catalogo.vue`, e nient'altro. Un gioco non deve sapere che
   esiste un elenco delle domande: continua a chiederne una e basta.
   ═══════════════════════════════════════════════════════════════════ */

import { MODULI } from './nucleo/registro.js'
import { catalogoDi, giroDellaFascia, FASCE, fasciaDi, quantoEsce } from './nucleo/catalogo.js'
import { classiAmmesse } from './scelta.js'
import { pescaClasse } from './nucleo/classi.js'
import { esempioDa } from './nucleo/esempi.js'
import { sorteQualunque } from './nucleo/sorte.js'
import { saperiSpenti } from '../store/profile.js'
import { leggi as leggiGiudizi } from '../store/giudizi.js'

export { FASCE, fasciaDi, quantoEsce }

/* Il catalogo di adesso: gli spenti li legge dal profilo del bambino che
   si sta guardando, i giudizi arrivano da fuori perché l'archivio è
   asincrono e chi disegna li vuole quando ci sono — senza, l'elenco si
   vede lo stesso e le faccine compaiono un istante dopo. */
export const catalogo = ({ giudizi = [] } = {}) =>
  catalogoDi(MODULI, { spenti: saperiSpenti(), giudizi })

export const giroDi = fascia =>
  giroDellaFascia(MODULI, fascia, { spenti: saperiSpenti() })

/* i giudizi presi dall'archivio, che è dove li scrive `store/giudizi.js`.
   Una lista vuota non è un guasto: vuol dire che l'interruttore dei
   giudizi non è mai stato acceso. */
export const giudiziDelQuaderno = () => leggiGiudizi().catch(() => [])

/* ── una domanda pescata come la pescherebbe un gioco ──
   L'altro modo di provare una fascia, e quello che risponde alla domanda
   vera: *cosa becca un bambino quando il gioco chiede una domanda media?*
   Non è il giro dell'elenco — lì si vedono tutte una per una, in ordine —
   ma la pesca a campana di `nucleo/classi.js`, spenti compresi: escono
   anche le classi vicine alla fascia, con la frequenza che hanno davvero.

   Torna la stessa forma di `esempioDa`, perché il pannello di prova non
   deve sapere da quale dei due modi è arrivata la domanda che mostra. */
export function pescaComeUnGioco(difficolta, sorte = sorteQualunque()) {
  const spenti = saperiSpenti()
  const classe = pescaClasse(sorte, classiAmmesse({ spenti, difficolta }))
  if (!classe) return null
  const { modulo, grado } = classe
  /* tipo `null`: dentro il grado la tipologia se la sceglie il modulo
     come farebbe in partita — è proprio quello che si sta guardando */
  const e = esempioDa({ modulo, grado, tipo: null, nome: '' }, sorte)
  /* «dice» diventa il nome della tipologia che è uscita: senza, di una
     domanda pescata non si saprebbe che cos'era */
  const t = modulo.tipi.find(x => x.chiave === e.domanda.chiave)
  return { ...e, dice: t?.nome || e.dice, difficolta }
}
