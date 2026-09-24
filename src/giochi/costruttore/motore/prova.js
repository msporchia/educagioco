/* ═══════════════════════════════════════════════════════════════════
   LA PROVA — un programma, tutti gli ordini di un livello

   Il cuore della sfida del costruttore sta qui, ed è un'idea presa dal
   Generale: **il programma si scrive prima, e deve reggere su ordini che
   non hai davanti**. Un livello dichiara più ordini — la stessa scala
   con 3 gradini e con 5, lo stesso fiume largo 3 e largo 6 — e vince
   solo il programma che li regge tutti. Chi scrive «3» dove l'ordine
   dice «gradini» vince il primo e perde il secondo, e lo vede: la scala
   si ferma a metà e l'omino resta sotto.

   Nel porto un ordine è **una giornata**: altri clienti, altri colori,
   la gru che cala più casse. Il programma non le vede prima, e deve
   reggerle tutte lo stesso.

   Come si vince un ordine lo dichiara il livello (`prova`):
     disegno     a programma finito i mattoni sono esattamente il disegno
     passaggio   a programma finito l'omino arriva alla bandiera
     libero      niente da vincere: è il cantiere libero
     giornata    il porto: a sera, gli obiettivi del livello
                 (`motore/porto/esito.js`)

   Questo file gioca d'un fiato: serve ai test, al banco e alla vista per
   sapere l'esito prima di animarlo. Chi anima usa `Esecuzione` a passi.
   ═══════════════════════════════════════════════════════════════════ */
import { Mondo, camminaOmino } from './mondo.js'
import { Porto } from './porto/mondo.js'
import { esitoDelPorto } from './porto/esito.js'
import { Esecuzione } from './esecutore.js'
import { conAttrezzi } from './attrezzi.js'

export const nelPorto = livello => livello.mondo === 'porto'

export const mondoDellOrdine = (livello, i) => {
  const o = livello.ordini[i]
  if (nelPorto(livello)) return Porto.daOrdine(o, livello)
  return Mondo.daMappa(o.mappa, { robot: o.robot || null })
}

/* Il verdetto su un mondo già costruito: serve alla vista, che il
   programma lo anima a passi e alla fine chiede solo «è venuto?». */
export function verdetto(livello, mondo) {
  if (nelPorto(livello)) {
    const e = esitoDelPorto(mondo)
    return { vinto: e.vinto, giornata: e }
  }
  /* il cantiere libero non ha niente da confrontare: finire è riuscire */
  if (livello.prova === 'libero') return { vinto: true, libero: true, mattoni: mondo.mattoni.size }
  if (livello.prova === 'passaggio') {
    const omino = camminaOmino(mondo)
    return { vinto: omino.esito === 'arrivato', omino }
  }
  const confronto = mondo.confronta()
  return { vinto: confronto.giusto, confronto }
}

/* Un ordine solo: `{ esito: 'vinto'|'sbagliato'|'errore', errore?, ... }`.
   Gli attrezzi del livello ci sono sempre, anche se il programma che
   arriva non li porta (la soluzione scritta nel livello, per esempio). */
export function provaOrdine(livello, i, programma) {
  const mondo = mondoDellOrdine(livello, i)
  const es = new Esecuzione(conAttrezzi(programma, livello), mondo, { lavagnette: livello.ordini[i].lavagnette || {} })
  const ultimo = es.finoInFondo()
  if (ultimo.tipo === 'errore') return { esito: 'errore', errore: ultimo, mondo, passi: es.passi }
  const v = verdetto(livello, mondo)
  return { esito: v.vinto ? 'vinto' : 'sbagliato', ...v, mondo, passi: es.passi }
}

/* Tutti gli ordini, in fila. Si prova anche dopo il primo che cade:
   il banco vuole sapere **quali** cadono, non solo se ne cade uno. */
export function provaLivello(livello, programma) {
  const esiti = livello.ordini.map((_, i) => provaOrdine(livello, i, programma))
  return { vinto: esiti.every(e => e.esito === 'vinto'), esiti }
}
