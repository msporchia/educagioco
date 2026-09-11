/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DI PROVA — un giocatore finto che sa convertire

   Gioca una tappa intera come la giocherebbe chi sa cosa fa: legge la
   ricetta, prende l'ingrediente giusto, lo posa sull'attrezzo che ci
   arriva, compone la dose coi pezzi più grandi che può e conferma. Se
   una tappa non si vince così, è la tappa a essere rotta — e lo dice
   il test, non un bambino.

   `sbadato` sbaglia apposta: prende un distrattore, posa sul primo
   attrezzo che vede, mette un pezzo di troppo — e serve a provare che
   ogni sbaglio ha le sue parole e che dopo si va avanti lo stesso.
   ═══════════════════════════════════════════════════════════════════ */
import { Partita } from './partita.js'
import { scomponi } from './misura.js'

/* un caso ripetibile: lo stesso seme, la stessa partita */
export function caso(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0
    return (s % 100000) / 100000
  }
}

/* una dose fatta bene, dall'inizio alla fine; torna l'esito di `riprendi` */
export function dosaBene(p) {
  const ing = p.daFare[0]
  if (!ing) return null
  const preso = p.prendi(ing.nome)
  if (!preso || !preso.ok) throw new Error(`non prende ${ing.nome}: ${JSON.stringify(preso)}`)
  const str = p.consigliato()
  if (!str) throw new Error(`nessun attrezzo per ${ing.dose.testo}`)
  const posato = p.posa(str.chiave)
  if (!posato || !posato.ok) throw new Error(`non posa su ${str.chiave}: ${JSON.stringify(posato)}`)
  for (const pezzo of scomponi(ing.dose.base, str.pezzi))
    if (!p.metti(pezzo)) throw new Error(`non mette ${pezzo} su ${str.chiave}`)
  const e = p.conferma()
  if (!e || e.tipo !== 'giusto') throw new Error(`dose ${ing.dose.testo} su ${str.chiave}: ${JSON.stringify(e)}`)
  return p.riprendi()
}

/* la tappa intera */
export function gioca(tappa, { seme = 1 } = {}) {
  const p = new Partita(tappa, { rnd: caso(seme) })
  let giri = 0
  while (!p.finita && giri++ < 2000) dosaBene(p)
  if (!p.finita) throw new Error(`la tappa ${tappa.chiave} non finisce`)
  return p
}

/* un giro sbadato su una dose: torna gli esiti raccolti, poi la fa bene */
export function sbadato(p) {
  const esiti = []
  const ing = p.daFare[0]
  const altro = p.ricetta.scaffale.find(s => !p.ricetta.ingredienti.some(i => i.nome === s.nome))
  if (altro) { esiti.push(p.prendi(altro.nome)); p.riprendi() }
  p.prendi(ing.nome)
  const giusto = p.consigliato()
  const sbagliato = p.strumenti.find(s => s.chiave !== giusto.chiave)
  if (sbagliato) {
    const e = p.posa(sbagliato.chiave)
    if (e && e.tipo === 'sbaglio') { esiti.push(e); p.riprendi() }
    else p.riponi()
  }
  p.posa(giusto.chiave)
  p.metti(giusto.pezzi[0])
  for (const pezzo of scomponi(ing.dose.base, giusto.pezzi)) p.metti(pezzo)
  esiti.push(p.conferma()); p.riprendi()
  for (const pezzo of scomponi(ing.dose.base, giusto.pezzi)) p.metti(pezzo)
  p.conferma(); p.riprendi()
  return esiti
}
