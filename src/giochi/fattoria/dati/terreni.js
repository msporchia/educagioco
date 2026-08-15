/* ═══════════════════════════════════════════════════════════════════
   DI COSA È FATTA UNA CELLA

   Il terreno non è «il prato più delle pozze d'acqua disegnate sopra»:
   è una **mappa che dice cosa è ogni cella** — prato, acqua, strada,
   roccia — e un pittore che, guardando i vicini, sceglie le tessere
   giuste. È una distinzione che sembra pedante finché non arriva la
   seconda materia: allora «l'acqua col suo bordo» e «la strada col suo
   bordo» diventano due pezzi di codice gemelli, e il terzo pezzo lo
   scrive qualcun altro in un modo diverso.

   ── IL BORDO È FRA DUE MATERIE, NON ATTORNO A UNA ─────────────────
   È il punto che regge tutto il resto. Acqua **contro prato** è una
   riva; acqua **contro roccia** è un'altra cosa, e vuole altre tessere.
   Per questo `bordi` è indicizzato per **chi c'è dall'altra parte**:

       bordi: { erba: {…}, roccia: {…}, '*': {…} }

   `'*'` è il ripiego per una materia per cui non si è dichiarato
   niente: meglio una riva un po' generica che un buco nero.

   Chi disegna non deve sapere cosa siano prato e acqua: chiede a questa
   tabella e alle nove chiavi di sempre (`centro`, `n`, `s`, `e`, `o`,
   `no`, `ne`, `so`, `se`). Aggiungere una materia è aggiungere una voce
   qui e le sue tessere in un foglietto: `scena/` non si tocca.

   ── OGGI C'È POCO, ED È GIUSTO COSÌ ───────────────────────────────
   Il set ha le tessere per una riva d'acqua sul prato e basta. Strada e
   roccia sono dichiarate senza tessere apposta: `guastiDeiTerreni()` le
   segnala come «annunciate e non disegnabili» invece di lasciarle
   comparire mezze. La struttura c'è, il disegno arriva quando arrivano
   gli sprite.
   ═══════════════════════════════════════════════════════════════════ */
import { PEZZI } from './atlante.js'

/* Le nove chiavi che un insieme di bordi deve avere. Sempre le stesse,
   per qualunque materia: è quello che permette a un pittore solo di
   dipingere l'acqua, la strada e quello che verrà. */
export const LATI = ['centro', 'n', 's', 'e', 'o', 'no', 'ne', 'so', 'se']

export const BASE = 'erba'          // di cosa è fatta una cella che nessuno ha toccato

export const TERRENI = {
  erba: {
    nome: 'Prato',
    /* Il prato non ha bordi: è il fondo su cui tutto il resto si
       affaccia, e non si affaccia su niente. Le sue tessere si
       alternano — quasi sempre la piatta, le altre di rado, se no da
       lontano si vede il motivo che si ripete. */
    tessere: ['erba0', 'erba0', 'erba0', 'erba0', 'erba0', 'erba0',
              'erba1', 'erba2', 'erba3'],
  },

  acqua: {
    nome: 'Acqua',
    prezzo: 4,                      // a cella: si dipinge, non si compra a blocchi
    passa: false,                   // non ci si cammina e non ci si posa niente
    bordi: {
      erba: {
        centro: 'stagno_centro',
        n: 'stagno_bordo_n', s: 'stagno_bordo_s',
        e: 'stagno_bordo_e', o: 'stagno_bordo_o',
        no: 'stagno_angolo_no', ne: 'stagno_angolo_ne',
        so: 'stagno_angolo_so', se: 'stagno_angolo_se',
      },
    },
  },

  /* Annunciate e ancora senza tessere: la mappa le sa tenere già oggi,
     il pittore le saprà dipingere quando il foglio le avrà. Stanno qui
     e non in un commento perché un progetto scritto in un commento non
     lo controlla nessuno — così invece `guastiDeiTerreni()` le nomina. */
  strada: { nome: 'Strada', bordi: {} },
  roccia: { nome: 'Roccia', passa: false, bordi: {} },
}

export const CHIAVI = Object.keys(TERRENI)

/* Le tessere di bordo giuste fra una materia e quella che ha di fronte.
   Se per quel vicino non c'è niente di dichiarato si prende `'*'`, e se
   non c'è nemmeno quello torna `null`: chi disegna lascia il fondo,
   che è meglio di una tessera a caso. */
export function bordiFra(materia, vicino) {
  const t = TERRENI[materia]
  if (!t || !t.bordi) return null
  return t.bordi[vicino] || t.bordi['*'] || null
}

export const siPassa = materia => TERRENI[materia] ? TERRENI[materia].passa !== false : true
export const prezzoDi = materia => (TERRENI[materia] && TERRENI[materia].prezzo) || 0

/* Quali materie si possono davvero dipingere oggi: quelle che hanno un
   prezzo e almeno un insieme di bordi con tutte e nove le tessere. Si
   ricava, non si scrive: una materia a metà non deve comparire fra i
   pennelli e far chiedere a un bambino perché non funziona. */
export const dipingibili = () => CHIAVI.filter(m => {
  const t = TERRENI[m]
  if (!t.prezzo) return false
  return Object.values(t.bordi || {}).some(b => LATI.every(l => PEZZI[b[l]]))
})

export function guastiDeiTerreni() {
  const g = []
  if (!TERRENI[BASE]) g.push(`la materia di base «${BASE}» non è dichiarata`)
  for (const [m, t] of Object.entries(TERRENI)) {
    if (!t.nome) g.push(`${m}: senza nome`)
    for (const nome of t.tessere || [])
      if (!PEZZI[nome]) g.push(`${m}: la tessera «${nome}» non è nell'atlante`)
    for (const [vicino, b] of Object.entries(t.bordi || {})) {
      const mancanti = LATI.filter(l => !b[l])
      if (mancanti.length)
        g.push(`${m} contro ${vicino}: mancano ${mancanti.join(', ')}`)
      for (const l of LATI)
        if (b[l] && !PEZZI[b[l]])
          g.push(`${m} contro ${vicino}: «${b[l]}» non è nell'atlante`)
    }
    /* non è un guasto, è un promemoria che si vede */
    if (m !== BASE && !Object.keys(t.bordi || {}).length && !t.tessere)
      g.push(`nota: ${m} è annunciata e non ancora disegnabile`)
  }
  return g
}
