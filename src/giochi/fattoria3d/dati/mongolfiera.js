/* La mongolfiera: la nave. Dato puro (le regole stanno in motore/mongolfiera.js). Un ordine grosso, tre file di casse, una merce per
   fila, che si riempie un po' alla volta; chiede solo prodotti finiti delle macchine; paga ESPERIENZA, mai monete, dentro il tetto
   di 🪙6 al minuto. Modello: la mongolfiera della fattoria di sempre (src/giochi/fattoria/dati/mongolfiera.js). Vedi docs/fattoria3d/mongolfiera.md. */
import { RICETTE } from './ricette.js'
import { PEZZI, EDIFICI } from './catalogo.js'
import { livelloDi, msDi, premioDelPezzo, tettoDi, MONETE_AL_MINUTO } from './ordini.js'
import { CIELO_VUOTO_MIN, msDaMinuti } from './parita2d.js'
import { FILE_GRANDE, LIVELLO_GRANDE, fileAl as fileAl2D } from '../../fattoria/dati/mongolfiera.js'

export const FILE = 3                 // file di casse, una merce per fila (meno, se al livello non ci sono tre merci)
export const FILE_MAX = FILE_GRANDE   // dal livello 66 (quello della 2D) il pallone cresce: quattro file, non una cosa da comprare (M17)
export const LIVELLO_QUARTA_FILA = LIVELLO_GRANDE
/** Quante file ha il carico a questo livello: tre, e quattro dal livello della mongolfiera grande della 2D (66). */
export const fileAl = livello => fileAl2D(livello)
export const CASSE_MIN = 2            // casse per fila
export const CASSE_MAX = 3
export const PEZZI_MIN = 1            // pezzi per cassa: ogni cassa di una fila ne chiede lo stesso numero
export const PEZZI_MAX = 3            // il tetto assoluto; sotto il livello `LIVELLO_PEZZI_GRANDI` il massimo è uno di meno
export const LIVELLO_PEZZI_GRANDI = EDIFICI.mongolfiera.liv      // come in 2D: le casse chiedono fino a tre pezzi da subito (la mongolfiera arriva al 26)
export const FASI_MIN = 2             // una merce da cassa passa da almeno due lavorazioni (farina → pasta); il crudo lo chiede il banco
export const BONUS_FILA = 0.25        // fila piena: +25% del premio delle sue casse
export const BONUS_TUTTO = 0.5        // tutto pieno: +50% del premio di tutte le casse, e la sorpresa
export const RIPOSO_MS = msDaMinuti(CIELO_VUOTO_MIN)   // dopo la partenza il cielo resta vuoto un'ora, come in 2D (il banco: cinque minuti); sull'orologio, quindi anche a pagina chiusa
export const SALITA_MS = 4000         // quanto ci mette il pallone a salire e a scendere (la scena)
export const PESO_MACCHINA_TUA = 4    // nella pesca una merce di una macchina che hai pesa quattro volte: la fila si riempie con la tua roba
export const LIVELLO_MONGOLFIERA = EDIFICI.mongolfiera.liv

/** Mangimi: ricette che servono dentro la fattoria, non si caricano su un pallone. Una ricetta può anche dichiararlo (`mangime: true`). */
export const MANGIMI = ['pastone']

/** Quante lavorazioni ci vogliono: 0 per un raccolto, un prodotto delle bestie o la lana; 1 + la più lunga dei suoi ingredienti per una ricetta. */
export function fasiDi(k, giri = 8) {
  const r = RICETTE[k]
  if (!r) return 0
  if (giri <= 0) return Infinity
  return 1 + Math.max(0, ...Object.keys(r.ing).map(i => fasiDi(i, giri - 1)))
}

/** Può salire in una cassa: un prodotto finito, con tempo e livello calcolabili, non un mangime. */
export const merceDaCassa = k =>
  !!RICETTE[k] && !RICETTE[k].mangime && !MANGIMI.includes(k) && fasiDi(k) >= FASI_MIN && Number.isFinite(livelloDi(k)) && Number.isFinite(msDi(k))

/** Le merci che una cassa può chiedere a questo livello: solo ciò che si sa già fare (mai richieste impossibili). */
export const merciDelLivello = livello => Object.keys(RICETTE).filter(k => merceDaCassa(k) && livelloDi(k) <= livello)

export const pezziMaxAl = livello => (livello | 0) >= LIVELLO_PEZZI_GRANDI ? PEZZI_MAX : PEZZI_MAX - 1

/** L'esperienza di una cassa: pezzo per pezzo, come in 2D (`premioDelPezzo`, senza la base dell'ordine). */
export const premioDellaCassa = (merce, pezzi) => Math.round(premioDelPezzo(merce) * pezzi)
export const bonusDellaFila = premioCasse => Math.round(BONUS_FILA * premioCasse)
export const bonusDelTutto = premioCasse => Math.round(BONUS_TUTTO * premioCasse)

/** I pezzi che la sorpresa della fiera può regalare: le decorazioni del catalogo, tranne i pezzi d'acqua (e ciò che si dichiarerà `fiera: true`). */
export const SORPRESE = Object.entries(PEZZI).filter(([, d]) => (d.categoria === 'decori' || d.fiera) && !d.calpestabile && !d.acqua && !d.stagione).map(([t]) => t)

export function guastiDellaMongolfiera() {
  const g = []
  if (!(FILE >= 1 && CASSE_MIN >= 1 && CASSE_MAX >= CASSE_MIN)) g.push('le file o le casse non stanno in piedi')
  if (!(FILE_MAX > FILE && fileAl(LIVELLO_QUARTA_FILA - 1) === FILE && fileAl(LIVELLO_QUARTA_FILA) === FILE_MAX)) g.push('la quarta fila non arriva al livello della 2D')
  if (!(PEZZI_MIN >= 1 && PEZZI_MAX >= PEZZI_MIN && pezziMaxAl(1) >= PEZZI_MIN)) g.push('i pezzi di una cassa non stanno in piedi')
  if (!(RIPOSO_MS > 0 && SALITA_MS > 0 && RIPOSO_MS > 2 * SALITA_MS)) g.push('il viaggio non lascia il tempo di salire e scendere')
  if (!(BONUS_FILA > 0 && BONUS_TUTTO > 0)) g.push('i bonus non esistono')
  if (!SORPRESE.length) g.push('la sorpresa della fiera non ha un pezzo da regalare')
  if (!(merciDelLivello(LIVELLO_MONGOLFIERA).length >= 2)) g.push(`al livello ${LIVELLO_MONGOLFIERA} la mongolfiera ha meno di due merci da chiedere`)
  /* Il tetto, sul caso peggiore: una fila intera di quella merce, casse piene fino in cima, tutti e due i bonus. Il bonus del tutto è la
     metà di tutte le casse, quindi per merce vale la metà delle sue: contarlo così è esatto. */
  for (const k of Object.keys(RICETTE)) {
    if (!merceDaCassa(k)) continue
    const casse = CASSE_MAX * premioDellaCassa(k, PEZZI_MAX)
    const reso = casse + bonusDellaFila(casse) + bonusDelTutto(casse)
    const tetto = tettoDi({ [k]: CASSE_MAX * PEZZI_MAX })
    if (reso > tetto + 1e-9) g.push(`una fila di ${k} rende ${reso} e il tetto è ${tetto.toFixed(1)} (🪙${MONETE_AL_MINUTO} al minuto)`)
  }
  return g
}
