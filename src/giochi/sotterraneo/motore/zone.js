// Le zone, in movimento (docs/sotterraneo/zone.md): che fascia ha ogni zona per l'eroe di adesso, di che colore è il
// suo pallino, qual è la zona appena nata che il minatore racconta, e la roba attesa oltre la storia.
// Funzioni pure sull'avventura (motore/avventure.js): girano in Node, e Gioco.vue le passa a ritocca().
import { CAMPAGNA } from '../dati/campagna.js'
import { ORDINE_DELLE_ZONE, NASCITA, LARGA, MARGINE, GIRO, voltaDi, voltoDi, ANNUNCIO_IN_CODA, PRIMA_NOTIZIA }
  from '../dati/zone.js'
import { LIVELLI_ATTESI, POZIONI_ATTESE } from '../dati/storia.js'
import { COSE, chiaveDelPezzo } from '../dati/cose.js'
import { eroeDi } from '../dati/eroi.js'
import { crescitaA } from './crescita.js'
import { robaAttesa } from './storia.js'

const oggetto = v => !!v && typeof v === 'object' && !Array.isArray(v)
const indiceDi = chiave => CAMPAGNA.findIndex(t => t.chiave === chiave)

/* ═══════════ la fascia di una zona ═══════════
   Nasce a NASCITA[chiave] e ci resta; quando l'eroe la supera di più di MARGINE livelli (sopra la fine della fascia)
   rinasce GIRO livelli più su, sopra la più alta. Non serve scriverlo: dipende solo dal livello dell'eroe, che non
   scende mai, quindi è la più bassa delle sue fasce (NASCITA + GIRO·n) che non è ancora sparita */
export function fasciaDi(chiave, livelloEroe) {
  const minimo = (livelloEroe || 1) - (LARGA - 1) - MARGINE
  const da = NASCITA[chiave] + GIRO * Math.ceil((minimo - NASCITA[chiave]) / GIRO)
  return { chiave, da, a: da + LARGA - 1, volta: voltaDi(chiave, da) }
}

// Il colore di una fascia per l'eroe: dentro verde; sotto di poco (fino a MARGINE) arancio, oltre rosso; sopra grigio.
// Il grigio finisce dove la zona rinasce (fasciaDi): una fascia viva non è mai più di MARGINE sotto l'eroe
export const COLORI = ['grigio', 'verde', 'arancio', 'rosso']
export function coloreDellaFascia(da, livelloEroe) {
  if (livelloEroe < da - MARGINE) return 'rosso'
  if (livelloEroe < da) return 'arancio'
  if (livelloEroe <= da + LARGA - 1) return 'verde'
  return 'grigio'
}

// tutte le zone per l'eroe al livello `livelloEroe`, dalla più bassa: { chiave, da, a, volta, colore, nome }
export const disposizioneDi = livelloEroe => ORDINE_DELLE_ZONE
  .map(k => { const f = fasciaDi(k, livelloEroe); return { ...f, colore: coloreDellaFascia(f.da, livelloEroe), nome: voltoDi(k, f.volta).nome } })
  .sort((x, y) => x.da - y.da)

// Lo stato nell'avventura: `zone: { sentita }`, la zona appena nata che il minatore ha già raccontato
// («cantine:20», la chiave e dove comincia la fascia). Un campo storto, o quello di prima ({ n, livelli, sentita: true },
// le zone che si svegliavano), vale come mai sentita
export function zoneDi(a) {
  const z = a && oggetto(a.zone) ? a.zone : {}
  return { sentita: typeof z.sentita === 'string' ? z.sentita : null }
}

// Con che potenza si scende nella discesa `k`: finita la storia l'inizio della sua fascia (almeno 1), o se si è scesi e
// la si è lasciata a metà quella scritta nella sosta (una zona lasciata a metà non cambia mentre si fa la spesa).
// Nella storia null: la discesa è quella di sempre
export function potenzaDi(a, k, livelloEroe) {
  const t = CAMPAGNA[k]
  if (!t || !a || !a.libera) return null
  const s = a.sosta
  if (s && s.tappa === k && Number.isFinite(s.potenza)) return s.potenza
  return Math.max(1, fasciaDi(t.chiave, livelloEroe).da)
}

// il livello della discesa `k`: la potenza, o quello atteso dalla storia (dati/storia.js)
export const livelloDellaZona = (a, k, livelloEroe) => potenzaDi(a, k, livelloEroe) || LIVELLI_ATTESI[k] || 1

/* ═══════════ nella storia: i gradini ═══════════
   Un gradino è il passo fra due discese di fila della storia: i livelli attesi 1 · 2 · 3 · 5 · 7 · 8 · 10 · 12 (dati/
   storia.js) sono i primi otto, e oltre il 12 uno ogni PASSO_OLTRE livelli. Il colore dice quanti gradini stanno fra
   la discesa e l'eroe: due sopra rosso (la guardia non fa scendere), uno sopra arancio, due sotto grigio, il resto verde */
export const PASSO_OLTRE = 2
export function gradinoDi(L) {
  const ultimo = LIVELLI_ATTESI.length - 1
  if (L >= LIVELLI_ATTESI[ultimo]) return ultimo + Math.floor((L - LIVELLI_ATTESI[ultimo]) / PASSO_OLTRE)
  let g = 0
  while (g < ultimo && LIVELLI_ATTESI[g + 1] <= L) g++
  return g
}
export function coloreNellaStoria(livelloDiscesa, livelloEroe) {
  const d = gradinoDi(livelloDiscesa) - gradinoDi(livelloEroe)
  return d >= 2 ? 'rosso' : d === 1 ? 'arancio' : d <= -2 ? 'grigio' : 'verde'
}

// il colore del pallino della discesa `k`: dopo la storia dalla fascia, nella storia dai gradini
export function coloreDi(a, k, livelloEroe) {
  const p = potenzaDi(a, k, livelloEroe)
  return p ? coloreDellaFascia(p, livelloEroe) : coloreNellaStoria(LIVELLI_ATTESI[k] || 1, livelloEroe)
}

// La notizia: la zona nata per ultima (la fascia più alta, sempre rossa), che il minatore racconta finché non l'ha
// detta. null finché la storia non è finita. `prima`: la prima notizia dopo la storia, che dice anche cosa è cambiato
export function notiziaDi(a, livelloEroe) {
  if (!a || !a.libera) return null
  const f = disposizioneDi(livelloEroe).at(-1)
  const id = `${f.chiave}:${f.da}`
  const z = zoneDi(a)
  const volto = voltoDi(f.chiave, f.volta)
  return { id, chiave: f.chiave, indice: indiceDi(f.chiave), da: f.da, a: f.a, nome: volto.nome,
           sentita: z.sentita === id, prima: !z.sentita,
           detto: `${!z.sentita ? PRIMA_NOTIZIA + ' ' : ''}${volto.annuncio} ${ANNUNCIO_IN_CODA}` }
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
