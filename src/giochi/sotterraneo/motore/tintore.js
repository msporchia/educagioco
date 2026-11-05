// Il tintore (docs/sotterraneo/tintore.md): chi paga una somma piccola e fissa e si fa ritingere un pezzo. Qui le regole,
// che girano in Node; il foglio è viste/Tintore.vue, il disegno scena3d/tinge3d.js. Lavora su un Corredo (motore/corredo.js).
import { COSE } from '../dati/cose.js'
import { COSTO, TINTA_DI, tintaValida, sipuoTingere } from '../dati/tinte.js'

export { COSTO }

/** I pezzi che si possono ritingere, addosso prima e poi in tasca: [{ k, dove, addosso, tinta }] (una voce per chiave). */
export function pezziDaTingere(corredo) {
  const visti = new Set(), fuori = []
  const metti = (k, addosso) => {
    if (!k || visti.has(k) || !sipuoTingere(k)) return
    visti.add(k)
    fuori.push({ k, dove: COSE[k].dove, addosso, tinta: corredo.tintaDi(k) })
  }
  for (const d of ['mano', 'mancina', 'corpo', 'testa']) metti(corredo[d], true)
  for (const k of corredo.zaino) metti(k, false)
  return fuori
}

/**
 * Ritinge `k` di `id`: paga `COSTO` gemme e il pezzo porta il colore da lì in poi. Torna `{ che: 'tinto', cosa, tinta, gemme }`, o
 * `{ che: 'niente', perche }` (`pezzo`: non si ritinge o non ce l'hai, `tinta`: un colore che non c'è, `uguale`: ce l'ha già,
 * `gemme`: non bastano) senza toccare niente.
 */
export function tingi(corredo, k, id) {
  if (!sipuoTingere(k) || !corredo.possiedo(k)) return { che: 'niente', perche: 'pezzo' }
  if (!tintaValida(id)) return { che: 'niente', perche: 'tinta' }
  if (corredo.tintaDi(k) === id) return { che: 'niente', perche: 'uguale' }
  if (corredo.gemme < COSTO) return { che: 'niente', perche: 'gemme' }
  corredo.gemme -= COSTO
  corredo.tingi(k, id)
  return { che: 'tinto', cosa: k, tinta: id, gemme: corredo.gemme }
}

/** Il pezzo com'era (tinta di serie): si paga lo stesso, è un'altra tintura. */
export function togliLaTinta(corredo, k) {
  if (!sipuoTingere(k) || !corredo.possiedo(k) || !corredo.tintaDi(k)) return { che: 'niente', perche: 'uguale' }
  if (corredo.gemme < COSTO) return { che: 'niente', perche: 'gemme' }
  corredo.gemme -= COSTO
  corredo.tingi(k, null)
  return { che: 'tinto', cosa: k, tinta: null, gemme: corredo.gemme }
}

export const nomeDellaTinta = id => (TINTA_DI[id] ? TINTA_DI[id].nome : 'colore di serie')
