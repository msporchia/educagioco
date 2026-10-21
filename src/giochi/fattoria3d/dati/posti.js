/* I posti delle macchine, la fila della 2D (src/giochi/fattoria/dati/coda.js) tale e quale: ogni macchina parte con un posto e gli
   altri si comprano, macchina per macchina, fino a sei. Il metro è lo stesso (🪙1 = dieci secondi di esercizio), quindi anche i prezzi
   (un test li confronta con la 2D); la spesa conta come esperienza, come ogni acquisto. Vedi docs/fattoria3d/regole.md («I posti delle macchine»). */

export const POSTI_DI_PARTENZA = 1
export const POSTI_MASSIMI = 6

// Il prezzo del secondo, terzo, quarto, quinto e sesto posto: raddoppia (🪙20·40·80·160·320), l'unica curva esponenziale ammessa perché ha un tetto.
export const PREZZI_DEI_POSTI = [20, 40, 80, 160, 320]

// Sopra le due ore di esercizi, in tutto, per una macchina non ci va niente: 🪙720 (i posti ne costano 620).
const DUE_ORE = 720

/** Quanti posti ha una macchina che ne ha comprati `n` in più (un numero storto si legge come il più vicino sensato). */
export function postiDopo(n = 0) {
  const k = Math.max(0, Math.min(PREZZI_DEI_POSTI.length, Math.floor(n) || 0))
  return POSTI_DI_PARTENZA + k
}

/** Quanti posti ha una macchina, dal numero salvato (da 1 a 6; il resto si rimette in forma). */
export function postiInForma(v) {
  const n = Math.floor(v)
  return Number.isFinite(n) ? Math.max(POSTI_DI_PARTENZA, Math.min(POSTI_MASSIMI, n)) : POSTI_DI_PARTENZA
}

/** Quanto costa il prossimo posto per una macchina che ne ha `posti`, o null se è già al tetto. */
export function prezzoDelPosto(posti = POSTI_DI_PARTENZA) {
  const k = postiInForma(posti) - POSTI_DI_PARTENZA
  return k < PREZZI_DEI_POSTI.length ? PREZZI_DEI_POSTI[k] : null
}

/** Quanto costano in tutto i posti di una macchina al tetto. */
export const TOTALE_DEI_POSTI = PREZZI_DEI_POSTI.reduce((a, p) => a + p, 0)

export function guastiDeiPosti() {
  const g = []
  if (POSTI_DI_PARTENZA < 1) g.push('una macchina senza nemmeno un posto')
  if (POSTI_MASSIMI - POSTI_DI_PARTENZA !== PREZZI_DEI_POSTI.length) g.push('i prezzi non sono tanti quanti i posti da comprare')
  PREZZI_DEI_POSTI.forEach((p, i) => {
    if (!(Number.isInteger(p) && p > 0)) g.push(`posto ${POSTI_DI_PARTENZA + i + 1}: prezzo ${p}`)
    if (i && !(p > PREZZI_DEI_POSTI[i - 1])) g.push(`posto ${POSTI_DI_PARTENZA + i + 1}: 🪙${p} non costa più del precedente (🪙${PREZZI_DEI_POSTI[i - 1]})`)
  })
  PREZZI_DEI_POSTI.forEach(p => { if (p > DUE_ORE) g.push(`un posto costa 🪙${p}, più di due ore di esercizi`) })
  if (TOTALE_DEI_POSTI > DUE_ORE) g.push(`i posti di una macchina costano 🪙${TOTALE_DEI_POSTI}, più di due ore di esercizi`)
  return g
}
