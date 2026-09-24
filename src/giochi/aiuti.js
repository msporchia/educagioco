/* ═══════════════════════════════════════════════════════════════════
   LA SCALA DEGLI AIUTI — una per i giochi che si sbloccano pensando

   Il Generale, Passo passo e il costruttore hanno lo stesso tasto, 💡,
   e ogni volta che lo premi scendi di un gradino. Qui c'è quello che i
   tre hanno in comune — **quanto costa un gradino, e in che ordine
   vengono** — e niente di quello che un gradino fa: dire una frase,
   accendere una freccia, scrivere un pezzo di programma lo sa ogni gioco
   per conto suo. È puro: gira in Node e si prova in `unita/aiuti`.

   ── PERCHÉ SI PAGA, E IN MONETE ─────────────────────────────────────
   Gli aiuti costavano una stella, quella «da solo», e non funzionava:
   quello che un bambino insegue sono le monete (`CALIBRAZIONE.md`), e
   una stella in meno è un prezzo che non si sente. Il 💡 diventava così
   il modo di finire un livello senza pensarci — si preme, si segue, si
   vince — e il livello era bruciato, perché una soluzione vista è quasi
   sempre banale. Chi invece non ce la fa e vuole capire come si sarebbe
   fatto è il benvenuto: ma paga, e caro.

   ── I GRADINI, E QUANTO COSTANO ─────────────────────────────────────
     ragiona   gratis   fa ragionare: cosa chiede il livello, cosa lo
                        rende difficile, la domanda giusta da farsi. Non
                        dice la risposta, e per questo non costa niente
     indizio   🪙10     una cosa concreta: guarda qui, questo blocco,
                        questa freccia
     pezzo  ┐
     forma  ├ 🪙50 · 🪙100 · 🪙200   scrivono nel programma
     svela  ┘

   Il prezzo di un gradino che scrive lo decide **la sua posizione**, non
   il suo nome: l'ultimo — che è sempre tutta la soluzione — costa 200,
   quello prima 100, tutti gli altri 50. Così una scala con un pezzo
   solo prima della soluzione costa 100 · 200, e una con due pezzi e la
   forma 50 · 50 · 100 · 200. E non lo decide chi scrive il livello: se
   no lo stesso gesto costerebbe dieci monete in un posto e niente in
   quello dopo.

   In tempo di esercizio (una moneta sono dieci secondi) un indizio vale
   un minuto e quaranta, la soluzione intera mezz'ora abbondante — più di
   quanto renda qualunque livello (i premi stanno fra 🪙4 e 🪙30). È
   voluto: comprarsi la strada non deve mai convenire, deve solo essere
   possibile.

   ── L'ORDINE ────────────────────────────────────────────────────────
   La scala sale e non scende mai: prima i gradini gratis, poi gli
   indizi, poi quelli che scrivono, e in fondo la soluzione. Un indizio
   che parla di un pezzo appena scritto si scrive **nella frase del
   pezzo**, non in un gradino dopo — un gradino da dieci dopo uno da
   cinquanta sarebbe una scala che scende (`guastiDellaScala`).

   ── SENZA MONETE, NIENTE ────────────────────────────────────────────
   Il tasto dice il prezzo **prima** di essere premuto, e se le monete
   non bastano lo dice e non dà niente: non c'è credito, e non c'è uno
   sconto per chi è povero, se no il modo più comodo di farsi svelare un
   livello sarebbe spendere tutto altrove prima di entrarci. I gradini
   gratis ci sono sempre. Quelli che costano tanto (dai 50 in su)
   chiedono un secondo tocco: sono il prezzo di un'ora di esercizi in
   due tocchi, e il primo può essere un dito che passava di lì.
   ═══════════════════════════════════════════════════════════════════ */

export const RAGIONA = 'ragiona'
export const INDIZIO = 'indizio'
export const PEZZO = 'pezzo'
export const FORMA = 'forma'
export const SVELA = 'svela'

export const PREZZO_INDIZIO = 10
/* dal primo gradino che scrive all'ultimo: si leggono dalla fine */
export const PREZZI_FINALI = [50, 100, 200]
/* da qui in su un gradino chiede il secondo tocco */
export const CONFERMA_DA = PREZZI_FINALI[0]

const CHE = [RAGIONA, INDIZIO, PEZZO, FORMA, SVELA]
export const scrive = p => !!p && (p.che === PEZZO || p.che === FORMA || p.che === SVELA)

/* ── il prezzo di ogni gradino ──
   Torna una copia della scala in cui ogni gradino sa quanto costa
   (`prezzo`). I gradini che scrivono si contano dalla fine: l'ultimo è
   PREZZI_FINALI[2], il penultimo [1], tutti gli altri [0]. */
export function conIPrezzi(passi = []) {
  const quanti = passi.filter(scrive).length
  let k = 0
  return passi.map(p => {
    if (!scrive(p)) return { ...p, prezzo: p.che === RAGIONA ? 0 : PREZZO_INDIZIO }
    const dallaFine = quanti - 1 - k++
    const i = Math.max(0, PREZZI_FINALI.length - 1 - dallaFine)
    return { ...p, prezzo: PREZZI_FINALI[i] }
  })
}

/* quante monete mancano per comprare un gradino (0: si può) */
export const mancano = (monete, p) => Math.max(0, ((p && p.prezzo) || 0) - (monete || 0))
export const puoi = (monete, p) => mancano(monete, p) === 0
/* un gradino caro vuole il secondo tocco */
export const chiedeConferma = p => !!p && p.prezzo >= CONFERMA_DA

/* ── una scala scritta bene ──
   Serve ai test di ogni gioco: la scala di ogni livello deve cominciare
   gratis, salire senza mai scendere e finire con la soluzione (se ha
   gradini che scrivono). Torna l'elenco dei guasti, vuoto se va bene. */
export function guastiDellaScala(passi = [], dove = 'scala') {
  const guasti = []
  if (!passi.length) return [`${dove}: è vuota`]
  for (const [i, p] of passi.entries())
    if (!CHE.includes(p.che)) guasti.push(`${dove}: il gradino ${i + 1} è «${p.che}», che non esiste`)
  if (passi[0].che !== RAGIONA) guasti.push(`${dove}: il primo gradino non è gratis`)
  const prezzi = conIPrezzi(passi).map(p => p.prezzo)
  for (let i = 1; i < prezzi.length; i++)
    if (prezzi[i] < prezzi[i - 1])
      guasti.push(`${dove}: il gradino ${i + 1} costa meno di quello prima (${prezzi[i]} dopo ${prezzi[i - 1]})`)
  if (passi.some(scrive) && passi[passi.length - 1].che !== SVELA)
    guasti.push(`${dove}: l'ultimo gradino non è la soluzione`)
  if (passi.filter(p => p.che === SVELA).length > 1) guasti.push(`${dove}: la soluzione compare due volte`)
  return guasti
}

/* quanto costa scendere tutta la scala: il numero da tenere a mente
   quando si scrive un livello nuovo (e quello che dice il riassunto) */
export const quantoCostaTutta = passi => conIPrezzi(passi).reduce((n, p) => n + p.prezzo, 0)
