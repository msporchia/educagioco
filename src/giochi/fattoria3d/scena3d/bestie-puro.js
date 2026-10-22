// I tre stadi delle bestie (gallina, mucca, pecora), come numeri: niente three, niente DOM, si prova con un test.
// Il disegno (modelli.js `muoviBestie`, `muoviPecore`) legge il profilo e lo applica ai pezzi. Vedi docs/fattoria3d/animali.md, «I tre stadi».
//
//   stadio 0  HA FAME     brullo: smunta, piccola, a testa bassa, niente prodotto
//   stadio 1  AL LAVORO   i semini: cresce in modo continuo con il progresso `p` (0 = appena nutrita, 1 = quasi fatto)
//   stadio 2  PRONTA      tutto maturo: piena, in piedi, il prodotto in vista, uno scintillio e un alone a terra
//
// `pienezza` (f) è il filo unico: 0 a fame, da PIENO_MIN a PIENO_MAX durante il lavoro, 1 da pronta. Quasi ogni misura è una
// interpolazione di f, quindi nessun passaggio salta e nessuno va all'indietro: nutrire riempie, raccogliere svuota.

import { profiloCortile2 } from './bestie-puro-cortile2.js'

export const PIENO_MIN = 0.12                 // f appena nutrita: già un poco più piena di una affamata, si vede che è partita
export const PIENO_MAX = 0.88                 // f un attimo prima di essere pronta

const clamp01 = x => (x > 0 ? (x < 1 ? x : 1) : 0)                 // anche NaN → 0
const lerp = (a, b, t) => a + (b - a) * t
const liscia = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t) }

export const SPECIE = ['gallina', 'mucca', 'pecora', 'anatra', 'maiale', 'capra']      // le ultime tre: il giro G4 (scena3d/modelli-cortile.js)

/** 'fame' | 'lavora' | 'pronta' per una gallina o una mucca: `fine` è l'ora a cui il prodotto è pronto, null se ha fame (come `statoBestia` del motore). */
export function statoDaFine (fine, adesso) { return fine === null || fine === undefined ? 'fame' : fine <= adesso ? 'pronta' : 'lavora' }
/** Lo stesso per una pecora: `t0` null = tosata e affamata, altrimenti l'inizio della ricrescita (pronta dopo `laneMs`). */
export function statoPecora (t0, adesso, laneMs) { return t0 === null || t0 === undefined ? 'fame' : adesso - t0 >= laneMs ? 'pronta' : 'lavora' }

/** Quanto manca, da 0 (appena nutrita) a 1 (pronta): `1 − (fine − ora)/ms`. A fame è 0. */
export function progressoBestia (fine, adesso, ms) {
  if (fine === null || fine === undefined) return 0
  if (!(ms > 0) || fine <= adesso) return 1
  return clamp01(1 - (fine - adesso) / ms)
}
/** Il progresso della lana: `(ora − t0)/laneMs`. Tosata e affamata è 0. */
export function progressoPecora (t0, adesso, laneMs) {
  if (t0 === null || t0 === undefined) return 0
  if (!(laneMs > 0)) return 1
  return clamp01((adesso - t0) / laneMs)
}

/** Lo stadio (0, 1, 2) dallo stato e dal progresso: 'lavora' con progresso pieno conta già come pronta. */
export function stadioBestia (stato, p) {
  if (stato === 'fame') return 0
  if (stato === 'pronta') return 2
  return clamp01(p) >= 1 ? 2 : 1
}

/** Il filo unico: 0 a fame, 1 pronta, in mezzo cresce con `p` da PIENO_MIN a PIENO_MAX. */
export function pienezza (stadio, p) { return stadio <= 0 ? 0 : stadio >= 2 ? 1 : lerp(PIENO_MIN, PIENO_MAX, clamp01(p)) }

// Le misure delle parti del disegno che il profilo deve conoscere (stesse di modelli.js).
const GALLINA = { corpoR: 0.11, corpoY0: 0.17, altezzaCorpo: 0.9, uovoR: 0.045, uovoAlt: 1.05, gambaLen: 0.1 }

/** Il profilo di una specie in uno stadio: un oggetto di soli numeri (si riusa `out`, nessuna allocazione per fotogramma). Le scale sono
    moltiplicatori della misura base del modello; `dono` (uovo, secchio), `alone` e `scintilla` valgono 0 o 1. */
export function profiloBestia (specie, stadio, p, out = {}) {
  const f = pienezza(stadio, p), pronta = stadio >= 2 ? 1 : 0
  out.f = f
  out.alone = pronta; out.scintilla = pronta
  if (specie === 'mucca') {
    out.sx = lerp(0.70, 1.12, f); out.sy = lerp(0.66, 1.15, f); out.sz = lerp(0.92, 1.02, f)   // fame: corpo ridotto del 30%, pronta: tonda
    out.corpoY = lerp(-0.035, 0, f)                  // il ventre si incava: il dorso scende, le zampe si vedono di più
    out.testaY = lerp(-0.10, 0.03, f)                // la testa bassa a fame, alta verso chi guarda da pronta
    out.testaX = lerp(0.8, -0.12, f)                 // inclinazione di base (positiva = giù)
    out.coda = lerp(0, 0.5, f)                       // l'ampiezza del dondolio
    out.lento = lerp(0.5, 1, f)
    out.mammella = liscia(0.05, 1, f)                // rosea: cresce (0 = non si vede)
    out.pallida = lerp(1, 0, liscia(0.25, 0.75, f))  // flaccida e pallida: sparisce quando la rosea la ricopre
    out.goccia = stadio === 1 && p > 0.35 ? 1 : 0
    out.dono = pronta                                // il secchio pieno
  } else if (specie === 'gallina') {
    const G = GALLINA
    out.sx = lerp(0.78, 1.12, f); out.sy = lerp(0.55, 1.02, f); out.sz = lerp(1.0, 1.2, f)
    // l'uovo: niente a fame, cresce durante la cova, ENORME da pronta; la gallina si siede e poi ci sale sopra
    out.uovo = stadio <= 0 ? 0 : stadio >= 2 ? 3.2 : lerp(0.55, 2.3, clamp01((f - PIENO_MIN) / (PIENO_MAX - PIENO_MIN)))
    out.uovoY = G.uovoR * G.uovoAlt * out.uovo
    const alza = liscia(0.5, 1, f) * 0.22
    out.altoZ = -0.075 * liscia(0.1, 0.4, f) + 0.03 * liscia(0.7, 1, f); out.uovoZ = 0.075 * liscia(0.1, 0.4, f) - 0.045 * liscia(0.7, 1, f)   // covando arretra e l'uovo spunta davanti al petto (si vede dall'alto); da pronta gli sta sopra
    out.altoY = lerp(0.115, G.corpoY0, f) + alza - G.corpoY0     // quanto sta più su (o più giù) del corpo di serie
    out.testaY = G.corpoY0 + 0.08 * out.sy - 0.01 * (1 - f)
    out.testaZ = 0.13 * out.sz
    out.testaX = lerp(0.5, -0.4, f)                  // a terra col becco, poi in su, orgogliosa
    out.cresta = lerp(0.5, 1.9, f); out.crestaL = lerp(0.8, 1.2, f)
    out.codaR = lerp(-0.55, -1.35, f)
    const corpoSotto = G.corpoY0 + out.altoY - G.corpoR * G.altezzaCorpo * out.sy
    const dondola = liscia(0.5, 1, f)
    out.gX = lerp(0.035, 0.105, dondola)
    out.gAlt = Math.max(0.03, corpoSotto + 0.02)     // la cima della zampa: sotto il corpo
    out.gLen = lerp(out.gAlt, G.gambaLen, dondola)   // da sollevata penzolano, non toccano terra
    out.gAperta = dondola * 0.5
    out.passo = stadio <= 0 ? 1 : stadio >= 2 ? 0 : lerp(0.6, 0.1, clamp01(p))
    out.lento = lerp(1.25, 1, f)
    out.dono = out.uovo
    out.ondeggia = pronta
  } else if (specie === 'pecora') {
    out.lana = stadio <= 0 ? 0 : 0.22 + 1.08 * f     // la nuvola: dalle prime ciocche a 1,3 volte quella di prima
    out.ricci0 = liscia(0.5, 0.7, f); out.ricci1 = liscia(0.65, 0.85, f); out.ricci2 = liscia(0.8, 1, f)
    out.pelleX = lerp(0.78, 1, f); out.pelleY = lerp(0.72, 1, f); out.pelleZ = lerp(0.85, 1, f)
    out.corpoY = lerp(-0.06, 0, f)
    out.testaX = lerp(0.65, 0, f)
    out.orecchie = lerp(-1.15, 0.5, f)              // l'angolo dell'orecchio destro (l'altro è opposto): giù a fame
    out.lento = lerp(0.6, 1, f)
    out.dono = 0
  } else if (specie === 'anatra') {
    // sull'acqua: a fame piccola e piatta, col becco nell'acqua; al lavoro un uovo verdino galleggia accanto e cresce; pronta col collo dritto, il becco in su e un uovo enorme
    out.sx = lerp(0.78, 1.1, f); out.sy = lerp(0.6, 1.05, f); out.sz = lerp(0.95, 1.12, f)
    out.corpoY = lerp(-0.03, 0, f)                   // affamata sta più a pelo d'acqua
    out.testaY = lerp(-0.03, 0.03, f); out.testaX = lerp(1.0, -0.3, f)
    out.collo = lerp(0.7, 1.2, f)
    out.codaR = lerp(0.3, -0.7, f)                   // la coda a papera: giù a fame, in su da pronta
    out.beccheggio = liscia(0.55, 1, f) * 0.5        // da pronta alza il petto e il becco
    out.uovo = stadio <= 0 ? 0 : stadio >= 2 ? 3 : lerp(0.5, 2.2, clamp01((f - PIENO_MIN) / (PIENO_MAX - PIENO_MIN)))
    out.passo = stadio <= 0 ? 1 : stadio >= 2 ? 0.1 : lerp(0.6, 0.2, clamp01(p))
    out.lento = lerp(1.25, 1, f)
    out.dono = out.uovo
    out.ondeggia = pronta
  } else if (specie === 'maiale') {
    // a fame magro, orecchie giù e muso basso; al lavoro grufola nel fango e un mucchietto di terra cresce; pronto tondo, la coda a ricciolo, la pancetta in vista
    out.sx = lerp(0.74, 1.1, f); out.sy = lerp(0.66, 1.15, f); out.sz = lerp(0.92, 1.04, f)
    out.corpoY = lerp(-0.035, 0, f)
    out.testaY = lerp(-0.10, 0.0, f); out.testaX = lerp(0.8, 0.05, f)
    out.orecchie = lerp(1.15, 0.4, f)                // quanto le orecchie cadono in fuori (0 = dritte)
    out.coda = lerp(0, 1, f)                         // l'ampiezza (e la grandezza) del ricciolo
    out.lento = lerp(0.5, 1, f)
    out.grufola = stadio === 1 ? 1 : 0
    out.mucchio = stadio <= 0 ? 0 : stadio >= 2 ? 1 : lerp(0.2, 0.85, clamp01(p))
    out.dono = pronta                                // la pancetta
  } else if (specie === 'capra') {
    // a fame piccola, orecchie a terra e testa bassa; al lavoro la mammella rosea cresce; pronta tonda, la coda in su, il secchio del latte e qualche saltello
    out.sx = lerp(0.72, 1.06, f); out.sy = lerp(0.68, 1.1, f); out.sz = lerp(0.92, 1.02, f)
    out.corpoY = lerp(-0.03, 0, f)
    out.testaY = lerp(-0.10, 0.03, f); out.testaX = lerp(0.75, -0.18, f)
    out.orecchie = lerp(1.5, 1.0, f)
    out.coda = lerp(0.1, 1, f)
    out.lento = lerp(0.55, 1, f)
    out.mammella = liscia(0.05, 1, f)
    out.pallida = lerp(1, 0, liscia(0.25, 0.75, f))
    out.goccia = stadio === 1 && p > 0.35 ? 1 : 0
    out.dono = pronta                                // il secchio
    out.salto = pronta                               // saltella
  } else if (!profiloCortile2(specie, out, stadio, p, f, pronta)) throw new Error('specie sconosciuta: ' + specie)      // coniglio, alpaca, asino, arnia: bestie-puro-cortile2.js
  return out
}

/** Avvicina `pr` al bersaglio `tg` col tempo (circa 0,4 s per arrivare): ogni campo è un numero, `veloci` sono i campi che scattano (il prodotto
    che compare o sparisce). Nessuna allocazione. `pr` vuoto (primo fotogramma) si copia di colpo. Torna `pr`. */
export function avvicina (pr, tg, dt, veloci) {
  const k = Math.min(1, dt * 7), kv = Math.min(1, dt * 14)
  for (const n in tg) {
    const t = tg[n]
    if (pr[n] === undefined) pr[n] = t
    else pr[n] += (t - pr[n]) * (veloci && veloci[n] ? kv : k)
  }
  return pr
}
