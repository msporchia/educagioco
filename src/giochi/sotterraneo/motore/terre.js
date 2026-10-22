// Le terre successive del Sotterraneo 3D (docs/sotterraneo/terre-successive.md): ripulite le tombe del vento, la porta in fondo alla
// landa porta a un'altra terra, la stessa mappa coi mostri più forti. Dove si è sta in `terraOra` dell'avventura (manca: la prima),
// il mondo della prima resta in `mondo` e quelli dopo in `mondi[t]`, con lo stesso contenuto. Funzioni pure: girano in Node
// (unita/sotterraneo-terre); le chiamano Gioco.vue e viste/Mondo3d.vue.
import { MONDO_PERCORSO, TERRE } from '../dati/mondo-aperto.js'
import { rifattiDi } from './rigenera.js'

export const ULTIMA_TERRA = MONDO_PERCORSO.terre      // la quinta: lì la porta resta chiusa
export const CHI_APRE_LA_PORTA = 'tombe'              // il dungeon che, ripulito, apre la porta delle terre

const oggetto = v => !!v && typeof v === 'object' && !Array.isArray(v)
const numero = t => { const n = Math.floor(Number(t)); return Number.isFinite(n) ? Math.max(1, Math.min(ULTIMA_TERRA, n)) : 1 }

// la terra dove sta l'eroe dell'avventura `a`: 1 se manca (i salvataggi di prima) o è storta. Il campo `terra` dell'avventura è
// della terra dipinta del 2D, per questo il numero sta in `terraOra`
export const terraDi = a => numero(oggetto(a) ? a.terraOra : 1)
// il nome, il villaggio e la tinta di una terra (TERRE della scheda)
export const laTerra = t => TERRE[numero(t) - 1]

// il mondo salvato della terra `t` (di difetto quella di adesso), o null se non ci si è mai stati
export function mondoDellaTerra(a, t = terraDi(a)) {
  if (!oggetto(a)) return null
  const n = numero(t)
  if (n === 1) return oggetto(a.mondo) ? a.mondo : null
  return oggetto(a.mondi) && oggetto(a.mondi[n]) ? a.mondi[n] : null
}
// i campi da scrivere nell'avventura per mettere `mondo` nella terra `t`: `mondo` per la prima, `mondi` (le altre tenute) per le dopo
export function conMondo(a, mondo, t = terraDi(a)) {
  const n = numero(t)
  if (n === 1) return { mondo }
  return { mondi: { ...(oggetto(a) && oggetto(a.mondi) ? a.mondi : {}), [n]: mondo } }
}
// fin dove si è arrivati: la terra di adesso e quelle con un mondo salvato
export function terreViste(a) {
  let t = terraDi(a)
  if (oggetto(a) && oggetto(a.mondi)) for (const k of Object.keys(a.mondi)) if (oggetto(a.mondi[k])) t = Math.max(t, numero(k))
  return t
}

// la porta delle terre è aperta nella terra `t` se lì le tombe del vento sono state ripulite, e se dopo c'è un'altra terra
export const apertaLaPorta = (a, t = terraDi(a)) => numero(t) < ULTIMA_TERRA && rifattiDi(mondoDellaTerra(a, t), CHI_APRE_LA_PORTA) > 0

// Passare alla terra `t` (di difetto quella dopo): si va avanti di una dalla porta aperta, o in una già vista. Torna i campi da
// scrivere (`{ terraOra }`) o null se non si può. L'eroe è uno (roba, crescita, zaino, missioni restano dove sono); il mondo della
// terra nuova manca, cioè nebbia, pietre, taglie e dungeon ripuliti cominciano da capo; quello lasciato resta com'era
export function passaTerra(a, t = terraDi(a) + 1) {
  const ora = terraDi(a), n = Math.floor(Number(t))
  if (!Number.isFinite(n) || n < 1 || n > ULTIMA_TERRA || n === ora) return null
  const avanti = n === ora + 1 && apertaLaPorta(a, ora)
  return avanti || n <= terreViste(a) ? { terraOra: n } : null
}

// quello che il mondo di sopra deve sapere della porta: dove si è, se è aperta, dove porta, se questa è l'ultima terra
export function laPorta(a) {
  const ora = terraDi(a), aperta = apertaLaPorta(a, ora)
  return { ora, aperta, ultima: ora >= ULTIMA_TERRA, qui: laTerra(ora), dopo: aperta ? laTerra(ora + 1) : null }
}
