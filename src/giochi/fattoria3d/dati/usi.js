/* A cosa serve una merce, tutte le uscite, dette in modo che un bambino le capisca: la ricetta che la vuole (e dove si fa), le bestie
   che la mangiano, il banco e la mongolfiera. Dato puro: lo leggono l'inventario (una frase) e «Come si fa» (dati/albero.js).
   Il modello è dati/usi.js della fattoria di sempre. Vedi docs/fattoria3d/guida.md. */
import { COLTURE } from './colture.js'
import { RICETTE, merceDi } from './ricette.js'
import { CORTILE } from './animali.js'
import { PECORE } from './regole.js'
import { EDIFICI } from './catalogo.js'
import { merceDaCassa } from './mongolfiera.js'

const mangiano = (t, a) => (t === 'recinto' ? PECORE.mangia : a.mangia)

/** Le bestie che mangiano quel mangime (becchime: galline; foraggio: pecore e mucche), nell'ordine del cortile. */
export const bestieChe = k => Object.entries(CORTILE).filter(([t, a]) => mangiano(t, a).includes(k)).map(([, a]) => a.bestie)

/** Tutti gli usi di una merce, nell'ordine in cui si dicono:
    `{ che: 'ricetta', nome, emoji, dove }` (la ricetta che la usa e il nome della macchina), `{ che: 'bestie', nome, emoji }` (le bestie che la mangiano),
    `{ che: 'banco', nome, emoji }` (si può consegnare), `{ che: 'nave', nome, emoji }` (può salire in mongolfiera). */
export function usiDi(k) {
  const m = merceDi(k)
  if (!m) return []
  const usi = []
  for (const r of Object.values(RICETTE)) if (r.ing && r.ing[k]) usi.push({ che: 'ricetta', nome: r.nome, emoji: r.emoji, dove: (EDIFICI[r.dove] || {}).nome || r.dove })
  for (const [t, a] of Object.entries(CORTILE)) if (mangiano(t, a).includes(k)) usi.push({ che: 'bestie', nome: a.bestie, emoji: a.emoji })
  if (!m.mangime) usi.push({ che: 'banco', nome: 'il banco', emoji: '🧺' })
  if (merceDaCassa(k)) usi.push({ che: 'nave', nome: 'la mongolfiera', emoji: '🎈' })
  return usi
}

/** Solo le ricette che la usano (nomi), nell'ordine dei dati. */
export const serveA = k => usiDi(k).filter(u => u.che === 'ricetta').map(u => u.nome)

/** I guasti: una merce che non serve a niente, o un uso senza nome o senza faccia. Vuoto = tutto bene. */
export function guastiDegliUsi() {
  const g = []
  // una variante di mangime (`da`: foraggio di carote) è un altro modo di fare lo stesso mangime, e serve come lui
  for (const k of [...Object.keys(COLTURE), ...Object.keys(RICETTE).filter(r => !RICETTE[r].da)]) {
    const usi = usiDi(k)
    if (!usi.length) g.push(`${k}: non serve a niente, e occuperebbe un posto per sempre`)
    for (const u of usi) if (!u.nome || !u.emoji) g.push(`${k} → ${u.che}: un uso senza nome o senza faccia`)
  }
  return g
}
