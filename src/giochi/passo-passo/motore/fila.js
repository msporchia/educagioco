/* LE MODIFICHE ALLA FILA — quello che fa un tocco (⌫, vedi
   docs/passo-passo/zaino.md). Funzioni pure che tornano sempre
   `{ fila, cursore }` nuovi, senza toccare quelli che ricevono. */
import { apri, conValore, eApri, eFine, FINE, chiusuraDi, aperturaDi } from '../dati/carte.js'

const dentro = (fila, c) => Math.max(0, Math.min(fila.length, c))

/* una freccia (o un salto) dove sta il cursore */
export function mettiCarta(fila, cursore, carta) {
  const c = dentro(fila, cursore)
  const f = fila.slice()
  f.splice(c, 0, carta)
  return { fila: f, cursore: c + 1 }
}

/* una scatola nuova dove sta il cursore, col cursore dentro: la carta
   dopo entra nella scatola. `testa` è la sua testa (`ripeti-N`, `se-N`):
   la N nasce da scegliere, a meno che non la dica un aiuto */
export function mettiScatola(fila, cursore, testa) {
  const c = dentro(fila, cursore)
  const f = fila.slice()
  f.splice(c, 0, testa, FINE)
  return { fila: f, cursore: c + 1, apertura: c }
}
export const mettiCiclo = (fila, cursore, volte = null) => mettiScatola(fila, cursore, apri(volte))

export function togliPrima(fila, cursore) {
  const c = dentro(fila, cursore)
  if (c === 0) return { fila: fila.slice(), cursore: 0 }
  const t = fila[c - 1]
  const f = fila.slice()
  if (eFine(t)) {
    const a = aperturaDi(fila, c - 1)
    const da = a < 0 ? c - 1 : a
    f.splice(da, c - da)
    return { fila: f, cursore: da }
  }
  if (eApri(t)) {
    const z = chiusuraDi(fila, c - 1)
    if (z >= 0) f.splice(z, 1)
    f.splice(c - 1, 1)
    return { fila: f, cursore: c - 1 }
  }
  f.splice(c - 1, 1)
  return { fila: f, cursore: c - 1 }
}

/* il valore di una testa: il numero, il colore, la casa */
export function scegliTesta(fila, i, valore) {
  if (!eApri(fila[i])) return fila.slice()
  const f = fila.slice()
  f[i] = conValore(fila[i], valore)
  return f
}
export const scegliVolte = scegliTesta

/* quello che fa un bambino che tocca proprio la cosa che l'aiuto ha
   acceso. Il gioco non lo chiama mai: solo i test, per pretendere che
   chi segue soltanto gli aiuti arrivi a casa. */
export function seguiConsiglio(fila, cursore, s) {
  if (!s) return { fila, cursore }
  switch (s.che) {
    case 'mossa': return mettiCarta(fila, s.cursore, s.mossa)
    case 'scatola': return mettiScatola(fila, s.cursore, s.testa)
    case 'testa': return { fila: scegliTesta(fila, s.apri, s.valore), cursore }
    case 'togli': return togliPrima(fila, s.cursore)
    default: return { fila, cursore }
  }
}
