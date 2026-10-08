// Le zone che si potenziano, in movimento (docs/sotterraneo/zone.md): quale zona è sveglia adesso e a che livello, a
// che livello sta ognuna, di che colore è il suo pallino per l'eroe, chi lo dice, e la roba attesa oltre la storia.
// Funzioni pure sull'avventura (motore/avventure.js): girano in Node, e Gioco.vue le passa a ritocca().
import { CAMPAGNA } from '../dati/campagna.js'
import { ORDINE_DELLE_ZONE, POTENZIATE, ANNUNCIO_IN_CODA } from '../dati/zone.js'
import { LIVELLI_ATTESI, POZIONI_ATTESE } from '../dati/storia.js'
import { COSE, chiaveDelPezzo } from '../dati/cose.js'
import { eroeDi } from '../dati/eroi.js'
import { crescitaA } from './crescita.js'
import { robaAttesa } from './storia.js'

const oggetto = v => !!v && typeof v === 'object' && !Array.isArray(v)
const indiceDi = chiave => CAMPAGNA.findIndex(t => t.chiave === chiave)

// Lo stato nell'avventura: `zone: { n, livelli, sentita }`. `n` è il numero del potenziamento di adesso (dal primo,
// che parte da sé a storia finita); `livelli` il livello a cui ogni zona è stata vinta l'ultima volta; `sentita` se
// il minatore ha già raccontato quella di adesso. Un campo storto vale come mancante
export function zoneDi(a) {
  const z = a && oggetto(a.zone) ? a.zone : {}
  const livelli = {}
  if (oggetto(z.livelli)) for (const [k, v] of Object.entries(z.livelli))
    if (indiceDi(k) >= 0 && Number.isFinite(v) && v >= 1) livelli[k] = Math.round(v)
  return { n: Number.isInteger(z.n) && z.n >= 1 ? z.n : 1, livelli, sentita: !!z.sentita }
}

// La zona sveglia adesso, o null finché la storia non è finita (`libera`). Il livello è quello dell'eroe, finché non ci
// si scende: da lì è quello scritto nella sosta (una zona lasciata a metà non cresce mentre si fa la spesa)
export function svegliaDi(a, livelloEroe) {
  if (!a || !a.libera) return null
  const z = zoneDi(a)
  const chiave = ORDINE_DELLE_ZONE[(z.n - 1) % ORDINE_DELLE_ZONE.length]
  const indice = indiceDi(chiave)
  const s = a.sosta
  const giu = s && s.tappa === indice && Number.isFinite(s.potenza) ? s.potenza : null
  return { n: z.n, chiave, indice, livello: giu || Math.max(1, livelloEroe || 1), sentita: z.sentita,
           nome: POTENZIATE[chiave].nome }
}

// Con che potenza si scende nella discesa `k`: quella sveglia al suo livello, una vinta prima al livello di allora, una
// mai potenziata come nella storia (null)
export function potenzaDi(a, k, livelloEroe) {
  const t = CAMPAGNA[k]
  if (!t || !a || !a.libera) return null
  const s = svegliaDi(a, livelloEroe)
  if (s && s.indice === k) return s.livello
  return zoneDi(a).livelli[t.chiave] || null
}

// il livello della discesa `k` per il colore del pallino: la potenza, o quello atteso dalla storia (dati/storia.js)
export const livelloDellaZona = (a, k, livelloEroe) => potenzaDi(a, k, livelloEroe) || LIVELLI_ATTESI[k] || 1

// Vinta una zona potenziata: se era quella sveglia, si segna il suo livello e se ne sveglia un'altra (la dopo nel
// giro, da raccontare). Torna lo stato nuovo, o null se non cambia niente (una zona vinta prima, rifatta)
export function vintaLaZona(a, chiave, potenza) {
  const s = svegliaDi(a, potenza)
  if (!s || s.chiave !== chiave) return null
  const z = zoneDi(a)
  return { n: z.n + 1, livelli: { ...z.livelli, [chiave]: Math.round(potenza) }, sentita: false }
}

// Quello che racconta il minatore della zona sveglia (`[data-annuncio]`)
export const annuncioDi = sveglia => (sveglia ? `${POTENZIATE[sveglia.chiave].annuncio} ${ANNUNCIO_IN_CODA}` : null)

/* ═══════════ i gradini e i colori del pallino ═══════════
   Un gradino è il passo fra due discese di fila della storia: i livelli attesi 1 · 2 · 3 · 5 · 7 · 8 · 10 · 12 (dati/
   storia.js) sono i primi otto, e oltre il 12 uno ogni PASSO_OLTRE livelli. Il colore dice quanti gradini stanno fra
   la zona e l'eroe: due sopra rosso (la guardia non fa scendere), uno sopra arancio, due sotto grigio (qualcuno lo
   dice), il resto verde */
export const PASSO_OLTRE = 2
export function gradinoDi(L) {
  const ultimo = LIVELLI_ATTESI.length - 1
  if (L >= LIVELLI_ATTESI[ultimo]) return ultimo + Math.floor((L - LIVELLI_ATTESI[ultimo]) / PASSO_OLTRE)
  let g = 0
  while (g < ultimo && LIVELLI_ATTESI[g + 1] <= L) g++
  return g
}
export const COLORI = ['grigio', 'verde', 'arancio', 'rosso']
export function coloreDi(livelloZona, livelloEroe) {
  const d = gradinoDi(livelloZona) - gradinoDi(livelloEroe)
  return d >= 2 ? 'rosso' : d === 1 ? 'arancio' : d <= -2 ? 'grigio' : 'verde'
}

/* ═══════════ oltre la storia: con che roba e che livello si arriva ═══════════
   La roba attesa al livello L (L dal 12 in su): quella con cui si esce dalla storia (motore/storia.js, robaAttesa), coi
   pezzi rifatti a un livello sotto L, come li rivende l'armaiolo a tono e li rilasciano i mostri grossi delle zone; le
   pozioni quelle dell'abisso. La crescita: il livello L coi punti dati come li dà il banco */
function aLivelloSempre(k, L) {
  const c = COSE[k]
  if (!c || !c.dove || (c.liv || 1) >= L) return k
  return chiaveDelPezzo(c.base || k, L, c.rarita || 'comune', Object.keys(c.abilita || {}), c.unico || null)
}
export function robaAttesaA(eroe, L, { pozioni = true } = {}) {
  const r = robaAttesa(eroe, CAMPAGNA.length, { pozioni: false })
  const P = Math.max(1, L - 1)
  for (const c of ['mano', 'mancina', 'corpo', 'dito']) if (r[c]) r[c] = aLivelloSempre(r[c], P)
  r.zaino = pozioni ? [...POZIONI_ATTESE[POZIONI_ATTESE.length - 1]] : []
  return r
}
export const crescitaAttesaA = (eroe, L) => crescitaA(eroeDi(eroe), L)
