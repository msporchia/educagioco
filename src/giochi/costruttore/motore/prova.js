// La prova: un programma su tutti gli ordini di un livello, giocata
// d'un fiato (serve ai test e al banco). Vedi docs/costruttore/linguaggio.md
// (la sfida sono gli ordini, come si vince un ordine). Chi anima usa
// `Esecuzione` a passi.
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
