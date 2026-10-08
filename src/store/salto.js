// Il tasto «salta» per provare i giochi: vedi docs/core/comandi.md.
// Si accende da `#admin` ed è del telefono, non di un bambino (come i giudizi):
// chi prova i giochi passa da un profilo di prova all'altro.
import { ref } from 'vue'
import { load, save, flush } from './storage.js'

const CHIAVE = 'tasto-salta'

export const saltoAcceso = ref(false)

// mai il booleano nudo: storage.js scarta un `true` salvato da solo (vedi docs/core/archivio.md)
export async function avviaSalto() {
  const c = await load(CHIAVE)
  saltoAcceso.value = c?.acceso === true
  return saltoAcceso.value
}

export function accendiSalto(si) {
  saltoAcceso.value = !!si
  save(CHIAVE, { acceso: !!si })
  return flush()
}
