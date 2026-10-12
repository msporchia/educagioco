// La firma dell'equilibrio: un'impronta di tutto quello che, se cambia, rende
// vecchia la taratura (le regole, le truppe di ogni tappa, il giocatore finto).
// La scrive `npm run tara:arena` in `dati/taratura.js`, e un test la confronta:
// se si ritocca un numero senza ritarare, il test dice di rilanciare.
import { TRUPPE, CASTELLO, CRESCITA, CAMPO, POSTI, MURO, GIOCATORE, DURATA, RIPARA, RIPOSO, COSTRUZIONE, AVVIO, AZIONI, MINIERA_MAX, LIV_MAX } from '../dati/regole.js'
import { CAMPAGNA } from '../dati/campagna.js'
import { PILOTI } from './banco.js'
import { VERSIONE_IA } from './nemico.js'

const fn = (v) => (typeof v === 'function' ? [1, 2, 3, 5, 8, 10].map(x => v(x)) : v)

function impronta(testo) {
  let h = 2166136261
  for (let i = 0; i < testo.length; i++) { h ^= testo.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0).toString(36)
}

export function firmaEquilibrio() {
  const crescita = JSON.stringify(CRESCITA, (k, v) => fn(v))
  const regole = JSON.stringify({ TRUPPE, CASTELLO, CAMPO, POSTI, MURO, GIOCATORE, DURATA, RIPARA, RIPOSO, COSTRUZIONE, AVVIO, MINIERA_MAX, LIV_MAX,
                                  prezzi: Object.fromEntries(Object.entries(AZIONI).map(([k, a]) => [k, a.prezzo])) })
  const tappe = JSON.stringify(CAMPAGNA.map(t => [t.chiave, t.truppe]))
  return impronta(crescita + regole + tappe + JSON.stringify(PILOTI) + VERSIONE_IA)
}
