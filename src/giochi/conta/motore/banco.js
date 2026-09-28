// Il banco di prova: un bambino finto legge la domanda esattamente come
// farebbe un vero (la risposta giusta è quella scritta in
// `domanda.rispostaGiusta`, non un calcolo rifatto) e sceglie fra le
// opzioni, o tocca `n` gettoni nel modo «porta».
//
// `tassoErrore` è quanto spesso sbaglia apposta: 0.25 è il bambino vero,
// che una risposta su quattro la sbaglia. Una tappa che non porta a casa
// non è difficile, è ingiusta.
import { Corsa } from './corsa.js'

// Sbagliando non si tira a caso fra il niente: si sposta di poco dalla
// risposta giusta (un dito di troppo sui gettoni, l'opzione vicina) —
// così sbaglia un bambino distratto, non uno che non ha capito il gioco.
export function rispostaGiocatore(domanda, rnd, { tassoErrore = 0 } = {}) {
  const sbaglia = rnd() < tassoErrore

  if (domanda.modo === 'porta') {
    if (!sbaglia) return domanda.n
    const scarto = rnd() < 0.5 ? 1 : -1
    return Math.max(0, domanda.n + scarto)
  }

  if (!sbaglia) return domanda.rispostaGiusta
  const sbagliate = domanda.opzioni.filter(o => !Object.is(o.valore, domanda.rispostaGiusta))
  const scelta = sbagliate[Math.floor(rnd() * sbagliate.length)] || domanda.opzioni[0]
  return scelta.valore
}

// Gioca una tappa intera. Non può girare in eterno: se un guasto facesse
// sì che non si trovi mai la risposta giusta, meglio un errore subito.
export function gioca(tappa, { rnd = Math.random, tassoErrore = 0 } = {}) {
  const corsa = Corsa.perTappa(tappa, { rnd })
  let tentativi = 0
  const limite = corsa.richieste * 30 + 30
  while (!corsa.finita) {
    if (++tentativi > limite)
      throw new Error(`conta: la tappa "${tappa.chiave}" non finisce mai (banco di prova bloccato)`)
    const valore = rispostaGiocatore(corsa.domanda, rnd, { tassoErrore })
    corsa.rispondi(valore)
  }
  return corsa
}

// Il caso ripetibile, per test che devono raccontare sempre la stessa storia.
export function caso(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5;  s >>>= 0
    return s / 4294967296
  }
}
