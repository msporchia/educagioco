/* La fila di una macchina: un posto di partenza, gli altri si comprano per macchina fino a sei, il
   prezzo raddoppia (🪙20·40·80·160·320) — vedi docs/fattoria/macchine.md. */

export const POSTI_DI_PARTENZA = 1
export const POSTI_MASSIMI = 6

// Il primo posto in più costa questo, e ognuno dopo il doppio.
export const PRIMO_POSTO = 20
export const RINCARO_DELLA_FILA = 2

// Il prezzo dell'ingrandimento numero i+1, ricavato dai numeri sopra.
export const PREZZI_DELLA_FILA = Array.from(
  { length: POSTI_MASSIMI - POSTI_DI_PARTENZA },
  (_, i) => PRIMO_POSTO * RINCARO_DELLA_FILA ** i)

// Sopra le due ore di esercizi non ci va niente: 🪙720, a dieci secondi la moneta.
const DUE_ORE = 720

// Quanti posti ha una fila ingrandita n volte; un numero storto si legge come il più vicino che abbia senso.
export function postiDellaFila(n = 0) {
  const k = Math.max(0, Math.min(PREZZI_DELLA_FILA.length, Math.floor(n) || 0))
  return POSTI_DI_PARTENZA + k
}

// Quanto costa il prossimo ingrandimento, o null se è già al tetto.
export function prezzoDellaFila(n = 0) {
  const k = Math.max(0, Math.floor(n) || 0)
  return k < PREZZI_DELLA_FILA.length ? PREZZI_DELLA_FILA[k] : null
}

// La curva sale (mai in saldo) e nessun posto costa più di due ore di esercizi.
export function guastiDellaFila() {
  const g = []
  if (POSTI_DI_PARTENZA < 1) g.push('una fila senza nemmeno il posto di chi lavora')
  if (!(POSTI_MASSIMI > POSTI_DI_PARTENZA)) g.push('una fila che non si può allungare')
  PREZZI_DELLA_FILA.forEach((p, i) => {
    if (!(Number.isInteger(p) && p > 0)) g.push(`ingrandimento ${i + 1}: prezzo ${p}`)
    if (i && !(p > PREZZI_DELLA_FILA[i - 1]))
      g.push(`ingrandimento ${i + 1}: 🪙${p} non costa più del precedente` +
             ` (🪙${PREZZI_DELLA_FILA[i - 1]})`)
    if (p > DUE_ORE)
      g.push(`ingrandimento ${i + 1}: 🪙${p} sono più di due ore di esercizi`)
  })
  return g
}
