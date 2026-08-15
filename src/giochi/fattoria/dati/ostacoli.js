/* ═══════════════════════════════════════════════════════════════════
   QUELLO CHE C'È NEL BOSCO, E QUANTO COSTA TOGLIERLO

   ── SGOMBRARE COSTA E BASTA ───────────────────────────────────────
   Non rende niente. Per un giro il bosco pagava più di quanto costasse
   toglierlo — la struttura di Hay Day, dove sgombrare finanzia
   l'espansione — ed è stato tolto apposta: **qui non si guadagna**.

   La fattoria è il posto dove si *spende* quello che si è guadagnato
   facendo esercizi negli altri giochi, e un bosco che paga sarebbe una
   seconda fonte di monete che non passa da nessun esercizio. Il primo
   bambino che se ne accorge smette di giocare agli altri giochi e
   comincia a tagliare alberi, e da quel momento la fattoria non è più
   la ricompensa di niente: è il gioco.

   Quindi il conto è tutto in una direzione. Un pezzo di terra costa,
   quello che ci trovi dentro costa toglierlo, e le monete arrivano solo
   da fuori. `costo` è l'unico numero che serve.

   `guastiDegliOstacoli()` controlla che i costi siano numeri sensati e
   che le tessere citate esistano davvero nell'atlante.
   ═══════════════════════════════════════════════════════════════════ */
import { PEZZI } from './atlante.js'

/* I costi vanno con la fatica: un tronco di traverso costa più di due
   sassi. Sono piccoli apposta — devono pesare nel conto della giornata,
   non fermare la giornata.

   Nel bosco c'è solo **roba da buttare**: massi, sassi, ceppi, tronchi
   caduti. Prima c'erano anche l'albero e la siepe, che però si comprano
   dal catalogo — e pagare per togliere una cosa che dieci secondi dopo
   puoi ricomprare è un giro che non vuol dire niente. Quello che si
   sgombra non deve essere in vendita, e viceversa. */
export const OSTACOLI = {
  ceppo:  { pezzo: 'ceppo',  nome: 'Ceppo',  piede: [1, 1], costo: 4 },
  sasso:  { pezzo: 'sasso',  nome: 'Masso',  piede: [1, 1], costo: 6 },
  sassi:  { pezzo: 'sassi',  nome: 'Sassi',  piede: [1, 1], costo: 3 },
  tronco: { pezzo: 'tronco', nome: 'Tronco', piede: [3, 1], costo: 8 },
}

export const TIPI = Object.keys(OSTACOLI)

export function guastiDegliOstacoli() {
  const g = []
  for (const [id, o] of Object.entries(OSTACOLI)) {
    if (!PEZZI[o.pezzo]) g.push(`${id}: la tessera «${o.pezzo}» non è nell'atlante`)
    if (!(o.costo > 0)) g.push(`${id}: costo impossibile`)
    /* Un ostacolo che paga rimetterebbe in piedi la seconda fonte di
       monete che abbiamo tolto apposta: si vede solo giocando, e allora
       è tardi. */
    if (o.resa !== undefined) g.push(`${id}: ha una «resa» — nel bosco non si guadagna`)
    if (!Array.isArray(o.piede) || o.piede.length !== 2 || o.piede.some(n => n < 1))
      g.push(`${id}: piede impossibile`)
  }
  if (!TIPI.length) g.push('un bosco senza niente da sgombrare non è un bosco')
  return g
}
