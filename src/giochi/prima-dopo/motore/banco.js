/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DI PROVA — un giocatore finto

   Non serve al gioco: serve a chi lo prova. Gioca una tappa intera
   toccando le vignette come farebbe un bambino, usando quello che il
   quesito sa già di sé — non serve dedurre niente, la risposta giusta
   è scritta nei dati del quesito, esattamente come la vedrebbe un
   bambino che ha capito la storia.

   `probErrore` è quanto spesso il finto giocatore sbaglia la prima
   risposta di una storia: un bambino vero, non un ragionatore perfetto.
   Non sbaglia mai la seconda — ha appena visto la sequenza giusta
   scorrere davanti agli occhi, ed è proprio quello che il replay deve
   ottenere.
   ═══════════════════════════════════════════════════════════════════ */
import { Corsa } from './corsa.js'

function rispondiGiusto(q) {
  if (q.tipo === 'ordina') { q.sequenza.forEach((_, id) => q.tocca(id)); return }
  if (q.tipo === 'intruso') { q.tocca(q.vignette.find(v => v.intruso).id); return }
  q.tocca(q.corretta)   // manca | dopo | prima
}

/* Sbaglia di proposito: in "ordina" scambia le prime due vignette
   toccate (garantito diverso dall'ordine giusto quando ce ne sono
   almeno due), negli altri tipi sceglie la prima opzione non giusta. */
function rispondiSbagliato(q) {
  if (q.tipo === 'ordina') {
    const ordine = q.sequenza.map((_, id) => id)
    ;[ordine[0], ordine[1]] = [ordine[1], ordine[0]]
    ordine.forEach(id => q.tocca(id))
    return
  }
  if (q.tipo === 'intruso') {
    q.tocca(q.vignette.find(v => !v.intruso).id)
    return
  }
  q.tocca(q.opzioni.find(o => !o.giusta).emoji)
}

export function gioca(tappa, { rnd = Math.random, probErrore = 0, storie } = {}) {
  const corsa = Corsa.perTappa(tappa, { rnd, storie })
  let passi = 0
  while (!corsa.finita) {
    if (passi++ > 1000) throw new Error(`prima e dopo: la tappa "${tappa.chiave}" non finisce mai`)
    const q = corsa.quesito
    if (rnd() < probErrore) {
      rispondiSbagliato(q)
      corsa.registraErrore()
      corsa.riprova()
      continue
    }
    rispondiGiusto(q)
    if (q.esito === 'giusta') {
      corsa.registraSuccesso()
      if (!corsa.finita) corsa.avanti()
    } else {
      /* capiterebbe solo per un guasto del generatore: la risposta
         "giusta" del banco deve sempre essere giusta */
      corsa.registraErrore()
      corsa.riprova()
    }
  }
  return corsa
}

/* Le chiavi delle storie proposte in una corsa intera, nell'ordine in
   cui sono capitate: serve a controllare la varietà da fuori, senza
   rigiocare la tappa un'altra volta. */
export function storieProposte(tappa, opzioni = {}) {
  const chiavi = []
  const corsaOriginale = Corsa.perTappa(tappa, opzioni)
  chiavi.push(corsaOriginale.quesito.storia.chiave)
  while (!corsaOriginale.finita) {
    corsaOriginale.registraSuccesso()
    if (corsaOriginale.finita) break
    corsaOriginale.avanti()
    chiavi.push(corsaOriginale.quesito.storia.chiave)
  }
  return chiavi
}

/* Il caso ripetibile, lo stesso di `codice-segreto/motore/banco.js`: due
   prove uguali devono raccontare la stessa storia, o un test rosso non
   si sa se è un guasto o sfortuna. */
export function caso(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5;  s >>>= 0
    return s / 4294967296
  }
}
