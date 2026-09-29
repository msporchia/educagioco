// La discesa sta in uno shallowRef (renderla reattiva in profondità vorrebbe un proxy su ogni cella, a
// sessanta fps): niente di quello che succede là dentro sveglia Vue da sé, solo `tic`. Un computed scritto a
// mano che derivi da un altro computed non si sveglia se l'oggetto resta lo stesso (es. corsa.foglio) —
// occhio(corsa, tic) fa il computed giusto una volta sola, e qui non se ne scrivono più a mano.
import { computed } from 'vue'

// `vuoto`: lista vuota o null, quello che si vede senza una discesa in corso
export function occhio(corsa, tic) {
  return (leggi, vuoto = null) => computed(() => {
    tic.value
    const c = corsa.value
    return c ? leggi(c) : vuoto
  })
}
