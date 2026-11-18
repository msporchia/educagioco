// A scuola niente amici: stessi nomi di amici/usaAmici.js, la bacheca è vuota (docs/scuola/architettura.md).
import { reactive } from 'vue'

export function usaAmici() {
  return reactive({ amici: [], tappe: 0, qui: 0, davanti: '', sullaTappa: () => [], allaFine: () => [], record: () => [], contro: () => '' })
}
