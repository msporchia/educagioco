/* ═══════════════════════════════════════════════════════════════════
   LO ZAINO — quante righe può scrivere il bambino in un livello

   È la stessa idea di Passo passo (lì sono carte, qui righe): un livello
   può dire quante righe tiene il programma (`zaino` nel livello), e il
   lavoro scritto riga per riga non ci sta. Non è un par — le stelle non
   guardano quante righe si sono usate, e meno righe non vale di più — è
   il vincolo che rende **necessario** quello che il livello insegna:
   un progetto scritto una volta e chiamato tre, un ripeti al posto di
   dieci righe uguali.

   Il perché è una misura, non un'impressione. Prima dello zaino tutti e
   quattordici i livelli che usano un progetto si vincevano lo stesso
   srotolando le chiamate, e in undici il programma srotolato era
   **più corto** — il villaggio, che insegna «progetti fatti di
   progetti», senza progetti aveva una riga in meno. Il progetto era una
   cosa che il racconto chiedeva, non una cosa che servisse.

   ── COSA SI CONTA ─────────────────────────────────────────────────
   Ogni istruzione è una riga, e un blocco conta la sua testa più le
   righe che ha dentro («ripeti 3 volte» con due righe dentro sono tre
   righe). Si contano **il principale e i progetti del bambino**; gli
   attrezzi del capomastro no (`dati/attrezzi.js`): sono già scritti, e
   usarli invece di riscriverli è proprio quello che lo zaino vuole
   insegnare.

   ── SROTOLARE ──────────────────────────────────────────────────────
   `srotola` riscrive un programma senza i progetti del bambino: ogni
   chiamata diventa il corpo del progetto, con le misure sostituite dagli
   argomenti. Serve al banco (`unita/costruttore`): in un livello che
   insegna i progetti la soluzione srotolata **non deve starci** — se ci
   sta, il livello non insegna quello che dichiara.
   ═══════════════════════════════════════════════════════════════════ */
import { copia } from '../dati/scrivi.js'

const RAMI = ['corpo', 'allora', 'altrimenti']

/* le righe di una fila: ogni istruzione una, e dentro i blocchi le loro */
export const righeDi = fila =>
  (fila || []).reduce((n, i) => n + 1 + RAMI.reduce((m, r) => m + righeDi(i[r]), 0), 0)

/* quelle che ha scritto il bambino: il principale e i suoi progetti */
export const righeScritte = prog =>
  righeDi(prog.principale) + (prog.progetti || []).filter(p => !p.attrezzo).reduce((n, p) => n + righeDi(p.corpo), 0)

/* il programma sta nello zaino del livello? (senza zaino, sempre) */
export const ciSta = (prog, zaino) => !zaino || righeScritte(prog) <= zaino

/* ── srotolare ── */
const PROFONDO = 30

/* un valore con le misure sostituite: `{ v: 'alta' }` diventa quello che
   la chiamata aveva passato, anche dentro un conto */
function sostituisci(x, misure) {
  if (Array.isArray(x)) return x.map(y => sostituisci(y, misure))
  if (!x || typeof x !== 'object') return x
  if (typeof x.v === 'string' && Object.keys(x).length === 1 && x.v in misure) return copia(misure[x.v])
  const o = {}
  for (const [k, v] of Object.entries(x)) if (k !== 'id') o[k] = sostituisci(v, misure)
  return o
}

function srotolaFila(fila, prog, misure, profondo) {
  if (profondo > PROFONDO) throw new Error('srotola: un progetto chiama sé stesso')
  const out = []
  for (const i of fila || []) {
    const p = i.tipo === 'chiama' && (prog.progetti || []).find(q => q.id === i.progetto)
    if (p && !p.attrezzo) {
      const nuove = {}
      ;(p.misure || []).forEach((m, k) => { nuove[m] = sostituisci((i.argomenti || [])[k], misure) })
      out.push(...srotolaFila(p.corpo, prog, nuove, profondo + 1))
      continue
    }
    const q = sostituisci({ ...i, corpo: undefined, allora: undefined, altrimenti: undefined }, misure)
    for (const r of RAMI) {
      if (Array.isArray(i[r])) q[r] = srotolaFila(i[r], prog, misure, profondo)
      else delete q[r]
    }
    if (i.tipo === 'se' && i.altrimenti === null) q.altrimenti = null
    out.push(q)
  }
  return out
}

/* il programma senza i progetti del bambino (gli attrezzi restano) */
export function srotola(prog) {
  return {
    principale: srotolaFila(prog.principale, prog, {}, 0),
    progetti: copia((prog.progetti || []).filter(p => p.attrezzo)),
    lavagnette: [...(prog.lavagnette || [])],
  }
}
