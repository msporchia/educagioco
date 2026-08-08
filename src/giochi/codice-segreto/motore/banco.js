/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DI PROVA — un giocatore finto

   Non serve al gioco: serve a chi lo prova. Il gioco non lo importa, e
   nel file unico non ci finisce (il build lo scarta: nessuno lo chiama).

   Il finto giocatore sceglie sempre un codice ancora **compatibile** con
   tutte le risposte avute: se un codice non spiegherebbe i pallini già
   visti, non lo prova. È il ragionamento che il gioco vorrebbe insegnare
   — «il 🐶 qui non può starci, l'ho già escluso» — ridotto all'osso, e
   se con questo le prove concesse non bastano vuol dire che quella tappa
   chiede fortuna, non testa.

   Sotto c'è anche un giocatore **distratto**, che quel ragionamento lo
   fa solo ogni tanto: è il bambino vero, ed è quello che dice se la
   tappa è giocabile davvero e non solo in teoria.
   ═══════════════════════════════════════════════════════════════════ */
import { Partita } from './partita.js'
import { confronta } from './indizi.js'

/* Tutti i codici possibili con queste regole. Cresce come una potenza: lo
   chiama solo il banco, e solo sugli scaglioni della campagna (al più
   16.807 con «esperto», che una macchina se li mangia). */
export function tuttiICodici(regole) {
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

/* `attenzione` è quanto spesso il giocatore ragiona davvero: 1 = sempre
   (il ragionatore perfetto), 0.6 = ogni tanto tira a caso fra tutti i
   codici, come fa un bambino stanco. */
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

/* Quante volte su cento questo giocatore porta a casa un codice, e in
   quante prove di media quando ce la fa. È il numero che dice se una
   tappa è tarata: sotto una certa soglia non è difficile, è ingiusta. */
export function misura(regole, { volte = 200, attenzione = 1, rnd = Math.random } = {}) {
  let vinte = 0, prove = 0
  for (let i = 0; i < volte; i++) {
    const p = gioca(regole, { rnd, attenzione })
    if (p.vinta) { vinte++; prove += p.usate }
  }
  return { volte, vinte, quota: vinte / volte, proveMedie: vinte ? prove / vinte : 0 }
}

/* Il caso ripetibile: due prove uguali devono raccontare la stessa
   storia, o un test rosso non si sa se è un guasto o sfortuna. */
export function caso(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5;  s >>>= 0
    return s / 4294967296
  }
}
