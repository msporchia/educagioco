// Quanto ha giocato e a cosa: vedi docs/core/sessioni.md.
import { ref } from 'vue'
import { load, save, flush, remove } from './storage.js'

export const MINIMA = 5              // sotto, è un tocco di passaggio, non una partita
export const MAX_SESSIONE = 2 * 3600 // oltre, è un telefono dimenticato acceso
export const GIORNI_TENUTI = 100     // tre mesi: coprono oggi/settimana/mese con margine

const CHIAVE = id => `sessioni:${id}`

// 2026-08-22, in ora locale: è anche l'ordine giusto per confrontarle come stringhe
export function chiaveGiorno(quando) {
  const d = new Date(quando)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const g = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${g}`
}

// Voce: { g: chiave, t: quando, s: secondi }. Ordinati dal più giocato.
export function perGioco(voci, { da = 0, a = Infinity } = {}) {
  const somma = new Map()
  for (const v of voci) {
    if (v.t < da || v.t > a) continue
    somma.set(v.g, (somma.get(v.g) || 0) + v.s)
  }
  return [...somma.entries()]
    .map(([gioco, secondi]) => ({ gioco, secondi, minuti: Math.round(secondi / 60) }))
    .sort((x, y) => y.secondi - x.secondi)
}

// anche i giorni vuoti: saltarli mentirebbe sulla forma della settimana
export function perGiorno(voci, { quanti = 7, oggi = Date.now() } = {}) {
  const fuori = []
  const giorno = 86400000
  for (let i = quanti - 1; i >= 0; i--) {
    const quando = oggi - i * giorno
    const k = chiaveGiorno(quando)
    fuori.push({ giorno: k, quando, secondi: 0, minuti: 0 })
  }
  const per = new Map(fuori.map(d => [d.giorno, d]))
  for (const v of voci) {
    const d = per.get(chiaveGiorno(v.t))
    if (d) d.secondi += v.s
  }
  for (const d of fuori) d.minuti = Math.round(d.secondi / 60)
  return fuori
}

// quanto oggi su quel gioco: lo usano le monete che calano (docs/genitori/varieta.md)
export function oggiDi(voci, gioco, oggi = Date.now()) {
  const k = chiaveGiorno(oggi)
  let s = 0
  for (const v of voci) if (v.g === gioco && chiaveGiorno(v.t) === k) s += v.s
  return s
}

export function potate(voci, { oggi = Date.now(), giorni = GIORNI_TENUTI } = {}) {
  const limite = oggi - giorni * 86400000
  return voci.filter(v => v.t >= limite)
}

// l'ultima copia letta o scritta, per chi deve contare subito (le monete, store/varieta.js)
// `versione` sale a ogni cambio: la home la guarda, perché una Map non è reattiva
const memoria = new Map()
export const versione = ref(0)
export const vociInMemoria = id => memoria.get(id) || null
const metti = (id, voci) => { memoria.set(id, voci); versione.value++ }
// il disco può essere indietro rispetto alla memoria (una sessione appena chiusa si sta ancora scrivendo):
// rileggendolo non si butta quello che la memoria sa già
export const unite = (disco, mem = []) => {
  const c = v => `${v.g}@${v.t}`
  const visti = new Set(disco.map(c))
  return [...disco, ...mem.filter(v => !visti.has(c(v)))]
}

const dalDisco = async id => (await load(CHIAVE(id)))?.voci || []

export async function leggiSessioni(id) {
  if (!id) return []
  const voci = unite(await dalDisco(id), memoria.get(id))
  metti(id, voci)
  return voci
}

export async function scriviSessione(id, { gioco, quando, secondi }) {
  if (!id || !gioco) return false
  const s = Math.round(Math.min(MAX_SESSIONE, secondi))
  if (s < MINIMA) return false
  const voci = potate(unite([...(await dalDisco(id)), { g: gioco, t: quando, s }], memoria.get(id)))
  metti(id, voci)
  save(CHIAVE(id), { voci })
  await flush()
  return true
}

export const scordaSessioni = id => (id ? remove(CHIAVE(id)) : null)

// il cronometro, uno solo: App.vue dice quando si entra/esce da un gioco.
// `orologio` è iniettabile, per provarlo senza aspettare davvero
let aperta = null      // { gioco, id, da }
let orologio = () => Date.now()

export function usaOrologio(f) { orologio = f || (() => Date.now()) }
export const ora = () => orologio()

export function entra(gioco, id) {
  if (aperta) esci()
  if (!gioco || !id) return null
  aperta = { gioco, id, da: orologio() }
  if (!memoria.has(id)) leggiSessioni(id).catch(() => {})   // chi conta le monete la vuole già pronta
  return aperta
}

export function esci() {
  const s = aperta
  aperta = null
  if (!s) return null
  const secondi = (orologio() - s.da) / 1000
  // in memoria subito: la home che si apre adesso non deve aspettare il disco
  const m = memoria.get(s.id)
  const sec = Math.round(Math.min(MAX_SESSIONE, secondi))
  if (m && sec >= MINIMA) metti(s.id, [...m, { g: s.gioco, t: s.da, s: sec }])
  scriviSessione(s.id, { gioco: s.gioco, quando: s.da, secondi }).catch(() => {})
  return { ...s, secondi }
}

export const inCorso = () => aperta
export const secondiInCorso = () =>
  aperta ? Math.min(MAX_SESSIONE, Math.max(0, (orologio() - aperta.da) / 1000)) : 0
