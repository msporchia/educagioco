/* ═══════════════════════════════════════════════════════════════════
   QUELLO CHE C'È NEL BOSCO, E COSA RENDE TOGLIERLO

   ── LA REGOLA CHE FA GIRARE TUTTO: RENDE PIÙ DI QUANTO COSTA ─────
   Sgombrare **finanzia** l'espansione invece di frenarla. È la
   struttura di Hay Day senza le sue tre valute: compri un pezzo di
   bosco, dentro ci trovi legna e sassi che valgono più di quanto costa
   toglierli, e quel guadagno ti avvicina al pezzo dopo. Se `resa` fosse
   minore di `costo`, comprare terra sarebbe una punizione e il gioco si
   fermerebbe al primo pezzo.

   Il margine è volutamente stretto (mezza moneta ogni due, più o meno):
   deve convenire, non deve diventare una macchina per fare soldi che
   svuota di senso gli esercizi fatti negli altri giochi.

   `guastiDegliOstacoli()` controlla proprio questa cosa, che è la sola
   che rompe il gioco senza far comparire nessun errore.
   ═══════════════════════════════════════════════════════════════════ */
import { PEZZI } from './atlante.js'

export const OSTACOLI = {
  albero: { pezzo: 'albero', nome: 'Albero', piede: [2, 1], costo: 10, resa: 16 },
  siepe:  { pezzo: 'siepe',  nome: 'Siepe',  piede: [2, 1], costo:  5, resa:  8 },
  ceppo:  { pezzo: 'ceppo',  nome: 'Ceppo',  piede: [1, 1], costo:  4, resa:  7 },
  sasso:  { pezzo: 'sasso',  nome: 'Masso',  piede: [1, 1], costo:  6, resa: 10 },
  sassi:  { pezzo: 'sassi',  nome: 'Sassi',  piede: [1, 1], costo:  3, resa:  5 },
  tronco: { pezzo: 'tronco', nome: 'Tronco', piede: [3, 1], costo:  8, resa: 13 },
}

export const TIPI = Object.keys(OSTACOLI)

export function guastiDegliOstacoli() {
  const g = []
  for (const [id, o] of Object.entries(OSTACOLI)) {
    if (!PEZZI[o.pezzo]) g.push(`${id}: la tessera «${o.pezzo}» non è nell'atlante`)
    if (!(o.costo > 0)) g.push(`${id}: costo impossibile`)
    /* la regola che tiene in piedi l'economia, e l'unica che si rompe in
       silenzio: nessun errore a schermo, solo un gioco che non gira più */
    if (!(o.resa > o.costo))
      g.push(`${id}: rende ${o.resa} e costa ${o.costo} — sgombrare deve convenire`)
    if (o.resa > o.costo * 2)
      g.push(`${id}: rende più del doppio, il bosco diventa una zecca`)
    if (!Array.isArray(o.piede) || o.piede.length !== 2 || o.piede.some(n => n < 1))
      g.push(`${id}: piede impossibile`)
  }
  if (!TIPI.length) g.push('un bosco senza niente da sgombrare non è un bosco')
  return g
}
