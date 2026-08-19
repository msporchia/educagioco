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
import { catalogoDi, giroDellaFascia, FASCE, fasciaDi, quantoEsce,
         FASCE_ETA, doveCadeCon } from './nucleo/catalogo.js'
import { classiAmmesse } from './scelta.js'
import { pescaClasse, finestraDi } from './nucleo/classi.js'
import { esempioDa } from './nucleo/esempi.js'
import { sorteQualunque } from './nucleo/sorte.js'
import { saperiSpenti, regoleDomande, etaDelBambino, ritoccoSapere,
         state } from '../store/profile.js'
import { sapereDi } from '../data/saperi.js'
import { consiglioDa, contoDi } from './consiglio.js'
import { leggi as leggiGiudizi } from '../store/giudizi.js'

export { FASCE, fasciaDi, quantoEsce }

/* Il catalogo di adesso: gli spenti li legge dal profilo del bambino che
   si sta guardando, i giudizi arrivano da fuori perché l'archivio è
   asincrono e chi disegna li vuole quando ci sono — senza, l'elenco si
   vede lo stesso e le faccine compaiono un istante dopo. */
export const catalogo = ({ giudizi = [] } = {}) =>
  catalogoDi(MODULI, { spenti: saperiSpenti(), giudizi })

/* ── le classi nude ──
   Tutte le righe, senza niente addosso del profilo: nessuno spento,
   nessun giudizio, nessun ritocco. Le vuole `data/quadro.js`, che è il
   riassunto della manopola dei grandi e gli spenti se li applica da sé
   — anzi *deve* applicarseli da sé, perché il suo mestiere è mostrare
   cosa succederebbe con impostazioni diverse da quelle di adesso. */
export const classiNude = () => catalogoDi(MODULI, {}).flatMap(m => m.classi)

/* ── LE CINQUE FASCE, VISTE DA QUESTO BAMBINO ──
   Il catalogo per modulo dice *cosa esiste*; questo dice **dove cade
   ognuna rispetto a chi gioca**, che è l'unica domanda che un grande si
   fa davvero quando guarda una taratura: cosa gli arriva spesso, cosa
   ogni tanto, e cosa gli abbiamo tolto.

   I confini non li decide questo file: stanno in `nucleo/catalogo.js`
   (`FASCE_ETA`, `doveCadeCon`), perché li chiede anche il quadro di
   un'età — e due copie degli stessi confini divergono senza che niente
   diventi rosso. Qui si aggiunge quello che il nucleo non può sapere:
   cosa il genitore ha spento, cosa ha ritoccato, cosa è stato detto
   giocando.

   Il livello di ogni riga è quello **visto**: il ritocco di un grande è
   già dentro, se no la riga resterebbe dov'era mentre le domande si
   spostano. */
export { FASCE_ETA }

export function fasceDelBambino({ eta = etaDelBambino(), giudizi = [] } = {}) {
  const dove = doveCadeCon(eta)

  /* Il gruppo che il ✕ spegnerebbe: **il più specifico** fra quelli che
     la riga dichiara. Una conversione di pesi sta sotto «Metri, litri e
     chili» e sotto «Le conversioni»: spegnere il primo porta via anche
     «con che cosa si misura un secchio», che non c'entra. Fra due
     gruppi si sceglie quello che tiene meno domande, che è quasi sempre
     quello che il genitore aveva in mente. */
  const quanteHa = {}
  const tutte = catalogoDi(MODULI, { spenti: saperiSpenti(), giudizi }).flatMap(m => m.classi)
  for (const c of tutte) for (const k of (c.sa || [])) quanteHa[k] = (quanteHa[k] || 0) + 1
  const gruppoDi = sa => (sa || []).slice()
    .sort((x, y) => (quanteHa[x] || 0) - (quanteHa[y] || 0))[0] || null

  const righe = tutte
    .map(c => {
      const ritocco = ritoccoSapere(c.tipo) + (c.sa || []).reduce((n, k) => n + ritoccoSapere(k), 0)
      const visto = c.livello - ritocco * 6
      const gruppo = gruppoDi(c.sa)
      return {
        ...c,
        ritocco,
        visto,
        dove: c.spenta ? 'spenta' : dove(visto),
        /* cosa spegnerebbe il ✕, detto con le parole del catalogo dei
           saperi: «Le divisioni», non «divisioni» */
        gruppo,
        gruppoNome: gruppo ? (sapereDi(gruppo)?.nome || gruppo) : '',
        gruppoQuante: gruppo ? quanteHa[gruppo] : 0,
        /* e quello che il bambino ha già detto rispondendo */
        consiglio: consiglioDa(contoDi([c.tipo], state.profile.items || {}), ritocco),
      }
    })
    .sort((a, b) => a.visto - b.visto || a.modulo.localeCompare(b.modulo))

  return FASCE_ETA.map(f => ({ ...f, righe: righe.filter(r => r.dove === f.chiave) }))
    .concat([{ chiave: 'spenta', nome: 'Spente', righe: righe.filter(r => r.dove === 'spenta'),
               che: 'tolte a mano da «Cosa sa»' }])
}

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
/* `eta` è il bambino di cui si vuole sapere cosa becca: le fasce della
   schermata ne propongono uno per blocco (sei anni e mezzo, otto e
   mezzo…), e il pannello pesca come pescherebbe un gioco per lui. */
export function pescaComeUnGioco(eta, sorte = sorteQualunque(), difficolta = 0.5) {
  const spenti = saperiSpenti()
  /* la finestra si rifà su QUESTA età, se no resterebbe quella del
     bambino che sta giocando e il pannello mostrerebbe le sue domande
     comunque — l'unica cosa che il pannello non deve fare */
  const regole = { ...regoleDomande(), eta, finestra: finestraDi(eta) }
  const classe = pescaClasse(sorte, classiAmmesse({ spenti, difficolta, regole }))
  if (!classe) return null
  const { modulo, grado } = classe
  /* tipo `null`: dentro il grado la tipologia se la sceglie il modulo
     come farebbe in partita — è proprio quello che si sta guardando */
  const e = esempioDa({ modulo, grado, tipo: null, nome: '' }, sorte)
  /* «dice» diventa il nome della tipologia che è uscita: senza, di una
     domanda pescata non si saprebbe che cos'era */
  const t = modulo.tipi.find(x => x.chiave === e.domanda.chiave)
  return { ...e, dice: t?.nome || e.dice, eta }
}
