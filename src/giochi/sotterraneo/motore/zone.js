// Le zone, in movimento (docs/sotterraneo/zone.md): che fascia ha ogni zona per l'eroe di adesso, di che colore è il
// suo pallino, e la roba attesa oltre la storia. Il colore si legge dal livello di FORZA dell'eroe (motore/forza.js,
// docs/sotterraneo/forza.md), non dal livello che ha scritto sulla barra.
// Funzioni pure sull'avventura (motore/avventure.js): girano in Node, e Gioco.vue le passa a ritocca().
import { CAMPAGNA } from '../dati/campagna.js'
import { NASCITA, LARGA, MARGINE, GIRO, voltaDi } from '../dati/zone.js'
import { LIVELLI_ATTESI, POZIONI_ATTESE } from '../dati/storia.js'
import { COSE, CASELLE, chiaveDelPezzo } from '../dati/cose.js'
import { eroeDi } from '../dati/eroi.js'
import { crescitaA } from './crescita.js'
import { robaAttesa } from './storia.js'

const oggetto = v => !!v && typeof v === 'object' && !Array.isArray(v)

/* ═══════════ la fascia di una zona ═══════════
   Nasce a NASCITA[chiave] e ci resta; quando l'eroe la supera di più di MARGINE livelli (sopra la fine della fascia)
   rinasce GIRO livelli più su, sopra la più alta. Dipende da `rinasce`, il livello che non scende mai (rinascitaDi): è la
   più bassa delle sue fasce (NASCITA + GIRO·n) che non è ancora sparita */
export function fasciaDi(chiave, rinasce) {
  const minimo = (rinasce || 1) - (LARGA - 1) - MARGINE
  const da = NASCITA[chiave] + GIRO * Math.ceil((minimo - NASCITA[chiave]) / GIRO)
  return { chiave, da, a: da + LARGA - 1, volta: voltaDi(chiave, da) }
}

// Il colore di una fascia per l'eroe: dentro verde; sotto di poco (fino a MARGINE) arancio, oltre rosso; sopra grigio.
// Il grigio finisce dove la zona rinasce (fasciaDi): una fascia viva non è mai più di MARGINE sotto l'eroe. `forza` è il
// livello di forza dell'eroe (motore/forza.js); chi non lo sa passa il suo livello, che per l'eroe atteso è lo stesso
export const COLORI = ['grigio', 'verde', 'arancio', 'rosso']
export function coloreDellaFascia(da, forza) {
  if (forza < da - MARGINE) return 'rosso'
  if (forza < da) return 'arancio'
  if (forza <= da + LARGA - 1) return 'verde'
  return 'grigio'
}

// Lo stato nell'avventura: `zone: { forza }`. `forza`: il livello di forza più alto mai raggiunto (0 se non c'è: i salvataggi
// di prima), che fa ruotare le zone anche se l'eroe, vendendo l'arma, si indebolisce (rinascitaDi)
export function zoneDi(a) {
  const z = a && oggetto(a.zone) ? a.zone : {}
  return { forza: Number.isFinite(z.forza) && z.forza > 0 ? Math.floor(z.forza) : 0 }
}

// Il livello da cui le zone rinascono: il più alto fra il livello dell'eroe (che non scende mai), il livello di forza più
// alto mai scritto e quello di adesso. Chi è forte fa ruotare le zone prima; chi vende un'arma non le fa tornare indietro
export const rinascitaDi = (a, livelloEroe, forza = 0) => Math.max(livelloEroe || 1, zoneDi(a).forza, forza || 0)

// Cosa scrivere in `zone` quando il livello di forza di adesso supera sia il massimo scritto sia il livello dell'eroe
// (se no non cambierebbe niente: rinascitaDi prende già il più alto): l'oggetto nuovo, o null se non c'è niente da cambiare.
// Si scrive sulla terra di sopra (Gioco.vue)
export function zoneConForza(a, forza, livelloEroe = 1) {
  const z = zoneDi(a)
  if (!(forza > Math.max(z.forza, livelloEroe || 1))) return null
  return { ...(a && oggetto(a.zone) ? a.zone : {}), forza: Math.floor(forza) }
}
// Con che potenza si scende nella discesa `k`: finita la storia l'inizio della sua fascia (almeno 1), o se si è scesi e
// la si è lasciata a metà quella scritta nella sosta (una zona lasciata a metà non cambia mentre si fa la spesa).
// Nella storia null: la discesa è quella di sempre. Le fasce vengono da rinascitaDi(livello dell'eroe, forza)
export function potenzaDi(a, k, livelloEroe, forza = 0) {
  const t = CAMPAGNA[k]
  if (!t || !a || !a.libera) return null
  const s = a.sosta
  if (s && s.tappa === k && Number.isFinite(s.potenza)) return s.potenza
  return Math.max(1, fasciaDi(t.chiave, rinascitaDi(a, livelloEroe, forza)).da)
}

// il livello della discesa `k`: la potenza, o quello atteso dalla storia (dati/storia.js)
export const livelloDellaZona = (a, k, livelloEroe, forza = 0) => potenzaDi(a, k, livelloEroe, forza) || LIVELLI_ATTESI[k] || 1

/* ═══════════ nella storia: i gradini ═══════════
   Un gradino è il passo fra due discese di fila della storia: i livelli attesi 1 · 2 · 3 · 5 · 7 · 8 · 10 · 12 (dati/
   storia.js) sono i primi otto, e oltre il 12 uno ogni PASSO_OLTRE livelli. Il colore dice quanti gradini stanno fra
   la discesa e la forza dell'eroe: due sopra rosso (la guardia non fa scendere), uno sopra arancio, due sotto grigio, il
   resto verde */
export const PASSO_OLTRE = 2
export function gradinoDi(L) {
  const ultimo = LIVELLI_ATTESI.length - 1
  if (L >= LIVELLI_ATTESI[ultimo]) return ultimo + Math.floor((L - LIVELLI_ATTESI[ultimo]) / PASSO_OLTRE)
  let g = 0
  while (g < ultimo && LIVELLI_ATTESI[g + 1] <= L) g++
  return g
}
export function coloreNellaStoria(livelloDiscesa, forza) {
  const d = gradinoDi(livelloDiscesa) - gradinoDi(forza)
  return d >= 2 ? 'rosso' : d === 1 ? 'arancio' : d <= -2 ? 'grigio' : 'verde'
}

// il colore del pallino della discesa `k`: dopo la storia dalla fascia, nella storia dai gradini; sempre dalla FORZA
// dell'eroe (senza, dal suo livello: l'eroe atteso ha le due cose uguali)
export function coloreDi(a, k, livelloEroe, forza = livelloEroe) {
  const p = potenzaDi(a, k, livelloEroe, forza)
  return p ? coloreDellaFascia(p, forza) : coloreNellaStoria(LIVELLI_ATTESI[k] || 1, forza)
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
  for (const c of CASELLE) if (r[c]) r[c] = aLivelloSempre(r[c], P)
  r.zaino = pozioni ? [...POZIONI_ATTESE[POZIONI_ATTESE.length - 1]] : []
  return r
}
export const crescitaAttesaA = (eroe, L) => crescitaA(eroeDi(eroe), L)
