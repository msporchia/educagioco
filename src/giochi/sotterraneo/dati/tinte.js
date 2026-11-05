// Le tinte del tintore (docs/sotterraneo/tintore.md): una tavolozza di otto colori, un prezzo, e quali pezzi si ritingono.
// La tinta sta nella roba (`roba.tinte = { [chiaveOggetto]: idTinta }`) e segue il pezzo: addosso, in tasca, rimesso.
// Dato puro: il disegno (scena3d/tinge3d.js) la legge da qui, i numeri sono 0xRRGGBB.
import { COSE } from './cose.js'

// quanto costa ritingere un pezzo: «qualcosina, non esorbitante, tipo 20-30 diamantini» (l'utente, 2 novembre 2026)
export const COSTO = 25

// la tavolozza è in comune con la fattoria (src/grafica/persona/tinte.js)
import { TINTE, TINTA_DI, tintaValida } from '../../../grafica/persona/tinte.js'
export { TINTE, TINTA_DI, tintaValida }

// i posti dove un pezzo si ritinge: l'arma, lo scudo (la mancina), l'armatura o la veste, il copricapo. I gioielli no
export const POSTI_TINGIBILI = ['mano', 'mancina', 'corpo', 'testa']
export const sipuoTingere = k => !!(COSE[k] && POSTI_TINGIBILI.includes(COSE[k].dove))

// le tinte di una roba salvata: un id di tinta sparito o un pezzo che non si ritinge si butta; un dato storto è nessuna tinta
export function rileggiTinte(dato) {
  const fuori = {}
  if (!dato || typeof dato !== 'object' || Array.isArray(dato)) return fuori
  for (const k of Object.keys(dato)) if (sipuoTingere(k) && tintaValida(dato[k])) fuori[k] = dato[k]
  return fuori
}

// le tinte dei pezzi che l'eroe ha addosso, per posto: { destra, sinistra, corpo, testa } per il disegno (scena3d/anteprime3d-pura.js)
export const tinteAddosso = roba => {
  const t = (roba && roba.tinte) || {}
  const di = k => (k ? tintaValida(t[k]) : null)
  return { mano: di(roba && roba.mano), mancina: di(roba && roba.mancina), corpo: di(roba && roba.corpo), testa: di(roba && roba.testa) }
}
