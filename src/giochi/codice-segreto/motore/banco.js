// Il banco di prova: un giocatore finto che sceglie sempre un codice
// ancora compatibile con le risposte avute, e uno «distratto» che ci
// riesce solo ogni tanto (`attenzione`). Non lo importa il gioco, non
// finisce nel file unico.
import { Partita } from './partita.js'
import { confronta } from './indizi.js'

// Tutti i codici possibili, tenuti da parte per `regole`: `gioca` li legge
// e `compatibili` li filtra senza scriverci dentro, così un banco che
// gioca centinaia di partite sullo stesso scaglione non li ricostruisce
// ogni volta.
const listino = new WeakMap()

export function tuttiICodici(regole) {
  const pronta = listino.get(regole)
  if (pronta) return pronta
  const fatta = componiTutti(regole)
  listino.set(regole, fatta)
  return fatta
}

function componiTutti(regole) {
  let liste = [[]]
  for (let i = 0; i < regole.caselle; i++) {
    const nuove = []
    for (const parziale of liste)
      for (const s of regole.pool) {
        if (!regole.ripetizioni && parziale.includes(s)) continue
        nuove.push([...parziale, s])
      }
    liste = nuove
  }
  return liste
}

export const compatibili = (candidati, prova) => candidati.filter(c => {
  const r = confronta(c, prova.simboli)
  return r.pieni === prova.pieni && r.vuoti === prova.vuoti
})

// `attenzione` è quanto spesso il giocatore ragiona davvero: 1 = sempre,
// 0.6 = ogni tanto tira a caso fra tutti i codici, come un bambino stanco.
export function gioca(regole, { codice = null, rnd = Math.random, attenzione = 1 } = {}) {
  const partita = new Partita(regole, { rnd, codice })
  const tutti = tuttiICodici(regole)
  let candidati = tutti
  while (!partita.finita) {
    const daDove = (rnd() <= attenzione && candidati.length) ? candidati : tutti
    const scelto = daDove[Math.floor(rnd() * daDove.length)]
    scelto.forEach(s => partita.posa(s))
    candidati = compatibili(candidati, partita.conferma())
  }
  return partita
}

// Quante volte su cento questo giocatore vince, e in quante prove medie:
// il numero con cui si dice se una tappa è tarata o solo ingiusta.
export function misura(regole, { volte = 200, attenzione = 1, rnd = Math.random } = {}) {
  let vinte = 0, prove = 0
  for (let i = 0; i < volte; i++) {
    const p = gioca(regole, { rnd, attenzione })
    if (p.vinta) { vinte++; prove += p.usate }
  }
  return { volte, vinte, quota: vinte / volte, proveMedie: vinte ? prove / vinte : 0 }
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
