// Il banco di prova: un giocatore finto gioca una tappa intera toccando
// le vignette, usando quello che il quesito già sa (la risposta giusta è
// nei suoi dati). `probErrore` è quanto spesso sbaglia la prima risposta
// di una storia; non sbaglia mai la seconda, perché ha appena visto la
// fila giusta accendersi davanti agli occhi.
import { Corsa } from './corsa.js'

function rispondiGiusto(q) {
  if (q.tipo === 'ordina') { q.sequenza.forEach((_, id) => q.tocca(id)); return }
  if (q.tipo === 'intruso') { q.tocca(q.vignette.find(v => v.intruso).id); return }
  q.tocca(q.corretta)   // manca | dopo | prima
}

// In "ordina" scambia le prime due vignette toccate, negli altri tipi
// sceglie la prima opzione non giusta.
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
      // capiterebbe solo per un guasto del generatore
      corsa.registraErrore()
      corsa.riprova()
    }
  }
  return corsa
}

// Le chiavi delle storie proposte in una corsa intera, nell'ordine in
// cui sono capitate: serve a controllare la varietà senza rigiocare.
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

// Il caso ripetibile, lo stesso di codice-segreto/motore/banco.js.
export function caso(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5;  s >>>= 0
    return s / 4294967296
  }
}
