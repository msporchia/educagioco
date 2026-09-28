/* Il gestore delle tabelline: decide QUALE calcolo chiedere in una tappa
   (`poolTappa`) e cosa chiede il boss (`chiaveDelBoss`). Come
   `store/calcolo.js`, non importa il profilo (riceve `items`), quindi
   gira anche in Node. Il volo infinito pesca da qui e da `store/calcolo.js`
   insieme: vedi `store/volo.js` e docs/asteroidi/scaletta.md. */
import { strength, overdue, weight, activeSet, isMastered, SRS } from './srs.js'
import { CAMPAGNA, chiaveCalcolo, fattoriDi, calcoliTabellina } from '../data/tabelline.js'
import { mareaTabelline } from './marea.js'

const VUOTO = { s: 0, ok: 0, err: 0, last: 0, seen: 0, t: 0 }
/* letto e non creato: chiedere se una casella è forte non deve scriverla
   in archivio, se no il profilo si riempie di calcoli mai chiesti */
export const leggi = (items, k) => (items && items[k]) || VUOTO

export const TUTTE_LE_TABELLE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// quanto è difficile un calcolo, in due strati (la stima poi la misura
// vera del bambino): vedi docs/asteroidi/scaletta.md
const durezza = n => (n === 1 || n === 10) ? 0
                   : (n === 2 || n === 3 || n === 5) ? 1
                   : n > 10 ? 2.5 : 2

export const IN_FONDO = 9        // ×1 e ×10 si introducono per ultimi
export const banale = k => { const [lo, hi] = fattoriDi(k); return lo === 1 || hi === 10 }

export function stima(k) {
  if (banale(k)) return IN_FONDO
  const [lo, hi] = fattoriDi(k)
  // quanti dei due vanno saputi a memoria: è la classe. Dentro la classe
  // ordina la taglia, che sposta poco perché conta molto meno.
  return durezza(lo) + durezza(hi) + (lo * hi) / 200
}

// il tempo medio riportato sulla stessa scala della stima (1 = facile, 4 = difficile)
const daTempo = ms => 1.2 + (ms / 1000) * 0.8

export function ordineDi(items, now = Date.now()) {
  return k => {
    const it = items && items[k]                 // letto e non creato
    const s = stima(k)
    if (!it || !it.t || it.seen < 3) return s    // non si sa ancora niente

    // I banali non sono su questa scala: stanno in fondo per principio, e
    // il cronometro può solo tirarli fuori di lì. Uno che risponde 7×10 in
    // quattro secondi ha un buco vero; se invece va spedito resta in fondo,
    // e non deve risalire solo perché la media con la sentinella lo alza.
    if (banale(k)) return it.t > SRS.slowMs ? daTempo(it.t) : IN_FONDO

    const fiducia = Math.min(1, (it.seen - 2) / 6) // piena dopo otto incontri
    return s * (1 - fiducia) + daTempo(it.t) * fiducia
  }
}

/* ═══════════ le chiavi in gioco ═══════════ */
export const chiaviDelle = tabelle => [...new Set(
  tabelle.flatMap(a => Array.from({ length: 10 }, (_, i) => chiaveCalcolo(a, i + 1))))]

// i falsi: la riga o colonna accanto, il prodotto ±un fattore, ±1 e ±10.
// Il tetto a 200 è quello del cielo (12×12 più un fattore ci sta)
export function distrattoriTabellina(a, b, n, sorte = Math.random) {
  const c = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a * b + a, a * b - a,
             a * b + b, a * b - b, a * b + 1, a * b - 1, a * b + 10, a * b - 10]
  const out = [], visti = new Set([a * b])
  for (const v of c.sort(() => sorte() - 0.5)) {
    if (v > 0 && v <= 200 && !visti.has(v)) { visti.add(v); out.push(v) }
    if (out.length === n) break
  }
  let g = 0
  while (out.length < n && g++ < 300) {
    const v = a * b + Math.floor(sorte() * 21) - 10
    if (v > 0 && !visti.has(v)) { visti.add(v); out.push(v) }
  }
  return out
}

/* a quali tabelline *in gioco* appartiene un calcolo: 6×7 vale sia per la 6
   sia per la 7, e l'insieme attivo gira a turno fra queste per non
   riempirsi solo di 1× e ×10, che sono le più facili di tutte */
export function tabellineDi(k, tabelle) {
  const [lo, hi] = fattoriDi(k)
  const g = []
  if (tabelle.includes(lo)) g.push(lo)
  if (hi !== lo && tabelle.includes(hi)) g.push(hi)
  return g.length ? g : [lo]
}

/* la tabellina del pianeta è dentro il calcolo, da una parte o dall'altra:
   6×7 è del pianeta del 6 e anche del pianeta del 7 */
export const dellaTabellina = (n, k) => !!n && fattoriDi(k).includes(n)

/* quanti calcoli tenere in lavorazione: chi ha dieci tabelline in gioco
   deve vederle tutte, non le due più facili */
export const insiemeDi = tabelle =>
  Math.max(10, Math.min(16, Math.round(tabelle.length * 1.5)))

// il pool di una tappa: il cuore (`CUORE`) tiene sempre almeno sei
// caselle della tabellina nuova in lavorazione, ripescando le già
// imparate quando si assottiglia — vedi docs/asteroidi/scaletta.md
export const CUORE = 6

export function poolTappa(tappa, items, now = Date.now(), quanti = null) {
  const dammi = k => leggi(items, k)
  const ordine = ordineDi(items, now)
  const marea = mareaTabelline(items, now)
  const tabelle = tappa.tabelle
  const tutte = chiaviDelle(tabelle)
  const quante = quanti || insiemeDi(tabelle)
  const scaduti = (lista, max) => lista
    .sort((x, y) => overdue(dammi(y), now, marea(y)) - overdue(dammi(x), now, marea(x)))
    .slice(0, max)

  // il Sole: nessuna tabellina nuova, tutto insieme e senza sconti
  if (!tappa.nuova) {
    const { learning, due } = activeSet(tutte, dammi, ordine, now, quante,
                                        k => tabellineDi(k, tabelle), marea)
    const p = [...new Set([...learning, ...scaduti(due, 4)])]
    return p.length ? p : tutte
  }

  const sue = calcoliTabellina(tappa.nuova)
  const altre = tutte.filter(k => !sue.includes(k))
  const A = activeSet(sue, dammi, ordine, now, Math.max(CUORE, Math.round(quante * 0.6)),
                      null, marea)

  const cuore = [...A.learning]
  if (cuore.length < CUORE) {
    // le già imparate rientrano dalla meno salda: è ripasso della tappa,
    // non ripasso di ieri, e tiene il pool abbastanza largo perché la
    // stessa domanda non debba uscire due volte di fila
    const peso = k => weight(dammi(k), now, { useTime: true, lentezza: marea(k) })
    const tornano = sue.filter(k => !cuore.includes(k)).sort((x, y) => peso(y) - peso(x))
    cuore.push(...tornano.slice(0, CUORE - cuore.length))
  }

  const spazio = Math.max(2, Math.min(quante - CUORE, cuore.length))  // il ripasso non supera mai il cuore
  const B = activeSet(altre, dammi, ordine, now, spazio, k => tabellineDi(k, tabelle), marea)
  const vecchi = [...new Set([...B.learning,
                              ...scaduti([...A.due, ...B.due], spazio)])].slice(0, spazio)

  return [...new Set([...cuore, ...vecchi])]
}

// il boss viene dal pianeta dopo (vedi docs/asteroidi/scaletta.md); non
// chiede mai un calcolo-nulla (×1, o conti che si contano a vista)
export const eNulla = k => {
  const [lo, hi] = fattoriDi(k)
  return lo === 1 || (lo <= 3 && hi <= 3)     // ×1 e i conti che si contano
}

export function chiaveDelBoss(tappa, prossima, items, now = Date.now(),
                              sorte = Math.random, vietata = null, chiavi = null) {
  /* Fra i tre in cima, e a sorte: sempre lo stesso calcolo diventerebbe la
     faccia del boss invece di un assaggio. Mai quella appena chiesta — il
     divieto di ripetersi due volte di fila vale anche per il boss — e per
     questo si passa una riserva: se togliendo quella non resta nessuno,
     si allarga invece di ripetersi. */
  const fraTre = (...liste) => {
    for (const lista of liste) {
      const l = lista.filter(k => k !== vietata)
      if (l.length) return l.slice(0, 3)[Math.floor(sorte() * Math.min(3, l.length))]
    }
    return null
  }
  const dalPiuFacile = l => [...l].sort((x, y) => stima(x) - stima(y))
  const dalPiuTosto = l => [...l].sort((x, y) => stima(y) - stima(x))

  if (prossima && prossima.nuova) {
    // quelli che le tabelline in gioco non coprono già: il boss del pianeta
    // del 6 deve portare 7×7, non 7×2 che si fa da tre pianeti
    const gia = new Set(chiaviDelle(tappa.tabelle))
    const suoi = calcoliTabellina(prossima.nuova).filter(k => !eNulla(k))
    const fuori = suoi.filter(k => !gia.has(k))
    return fraTre(dalPiuFacile(fuori), dalPiuFacile(suoi))
  }

  /* Niente ×1, niente ×10 e niente conti che si contano: sono regole, non
     fatti da sapere, e un boss che le chiede è un boss per finta. Poi la
     più tosta fra quelle che ancora non reggono — e la stima dei banali
     (`IN_FONDO`) qui non si guarda proprio, se no risulterebbero loro i
     calcoli più difficili di tutti. `chiavi` è l'elenco da cui pescare
     quando non è quello della tappa: il volo passa le sue
     (`caselleDelBoss` in `store/volo.js`), che sopra il livello nove
     hanno anche le grandi — e per stima sono loro le più toste. */
  const tutte = (chiavi || chiaviDelle(tappa.tabelle)).filter(k => !eNulla(k))
  const vere = tutte.filter(k => !banale(k))
  const fatti = vere.length ? vere : tutte
  const deboli = fatti.filter(k => !isMastered(leggi(items, k), now))
  return fraTre(dalPiuTosto(deboli), dalPiuTosto(fatti))
}
