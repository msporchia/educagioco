/* ═══════════════════════════════════════════════════════════════════
   PROFILO CONDIVISO
   Un solo profilo per bambino, alimentato da tutti i giochi: monete,
   oggetti della cameretta e stato di apprendimento di ogni elemento.
   Le chiavi degli elementi sono con prefisso (`math:` / `en:`) così un
   motore solo serve materie diverse senza confonderle.
   ═══════════════════════════════════════════════════════════════════ */
import { reactive, computed } from 'vue'
import { load, save, flush, remove, detectBackend, backend } from './storage.js'
import { newItem, record as srsRecord, isMastered, strength } from './srs.js'
import { PETS, CIBI, FAME, petDi, ciboDi, sazietaDi } from '../data/pets.js'

export const PLAYERS = ['Leonardo', 'Melody']
const KEY = name => 'profilo:' + name

const blank = () => ({
  v: 3,
  coins: 0,
  owned: [],
  layout: [[], [], []],
  items: {},                       // 'math:7x8' | 'en:butterfly' -> stato
  pets: {},                        // 'watson' -> { adottato, pasto, sat, pasti }
  dispensa: {},                    // '🍗' -> quante porzioni in casa
  settings: { tables: [2, 3, 4, 5], sound: true, music: true },
  totals: { math: 0, en: 0, verbi: 0, td: 0, pasti: 0 },
  best: { math: 0 },
  td: { tappa: 0, libera: false },  // tappe superate della campagna, partita libera sbloccata
})

export const state = reactive({
  player: PLAYERS[0],
  profile: blank(),
  loaded: false,
  storage: 'memoria',
})

/* ---------- caricamento / salvataggio ---------- */
export async function init() {
  state.storage = await detectBackend()
  const last = await load('ultimo-giocatore')
  await selectPlayer(PLAYERS.includes(last) ? last : PLAYERS[0])
  state.loaded = true
}

export async function selectPlayer(name) {
  state.player = name
  const raw = await load(KEY(name))
  const p = { ...blank(), ...(raw && typeof raw === 'object' ? raw : {}) }
  p.settings = { ...blank().settings, ...(p.settings || {}) }
  p.totals = { ...blank().totals, ...(p.totals || {}) }
  p.best = { ...blank().best, ...(p.best || {}) }
  p.td = { ...blank().td, ...(p.td || {}) }
  if (!p.items || typeof p.items !== 'object') p.items = {}
  if (!p.pets || typeof p.pets !== 'object') p.pets = {}
  if (!p.dispensa || typeof p.dispensa !== 'object') p.dispensa = {}
  if (!Array.isArray(p.owned)) p.owned = []
  state.profile = p
  fixLayout()
  save('ultimo-giocatore', name)
  persist()
}

export function persist() { save(KEY(state.player), JSON.parse(JSON.stringify(state.profile))) }
export const flushNow = flush

export async function resetPlayer() {
  state.profile = blank()
  await remove(KEY(state.player))
  persist()
}

/* ---------- elementi ---------- */
export function item(id) {
  const it = state.profile.items[id]
  if (it) return it
  const fresh = newItem()
  state.profile.items[id] = fresh
  return fresh
}

export function answer(id, { correct, ms = 0 }) {
  srsRecord(item(id), { correct, ms })
  persist()
}

export const mastered = (id, now = Date.now()) => isMastered(item(id), now)
export const strengthOf = (id, now = Date.now()) => strength(item(id), now)

export function countMastered(prefix, now = Date.now()) {
  return Object.entries(state.profile.items)
    .filter(([k, v]) => k.startsWith(prefix) && isMastered(v, now)).length
}

/* ---------- monete e livelli ---------- */
export const level = computed(() => {
  const imparati = countMastered('math:') + countMastered('en:') + countMastered('verbo:')
  return 1 + Math.floor(imparati / 12)
})

export function addCoins(n) {
  state.profile.coins = (state.profile.coins || 0) + n
  persist()
  return state.profile.coins
}

export function buy(emoji, cost) {
  if (state.profile.owned.includes(emoji) || state.profile.coins < cost) return false
  state.profile.coins -= cost
  state.profile.owned.push(emoji)
  fixLayout()
  persist()
  return true
}

/* ---------- campagna del tower defense ----------
   `tappa` è quante tappe sono state superate: è anche l'indice della prossima
   da giocare. Vinta l'ultima si apre la partita libera, senza fine. */
export const tdProgresso = () => state.profile.td

export function tdCompleta(indice, quanteTappe) {
  const td = state.profile.td
  td.tappa = Math.max(td.tappa || 0, indice + 1)
  if (td.tappa >= quanteTappe) td.libera = true
  persist()
  return td
}

/* ---------- animali ---------- */
export const haAnimale = id => !!state.profile.pets[id]
export const miei = () => PETS.filter(p => haAnimale(p.id))

/* quanto è sazio adesso: cala da sola col passare delle ore, anche a gioco chiuso */
export const sazieta = (id, now = Date.now()) => sazietaDi(state.profile.pets[id], now)

export const affamati = (now = Date.now()) =>
  miei().filter(p => sazieta(p.id, now) < FAME.affamato)

export function adotta(id) {
  const def = petDi(id)
  if (!def || haAnimale(id) || state.profile.coins < FAME.costo) return false
  const ora = Date.now()
  state.profile.coins -= FAME.costo
  state.profile.pets[id] = { adottato: ora, pasto: ora, sat: FAME.inizio, pasti: 0 }
  persist()
  return true
}

export function compraCibo(e) {
  const c = ciboDi(e)
  if (!c || state.profile.coins < c.costo) return false
  state.profile.coins -= c.costo
  state.profile.dispensa[e] = (state.profile.dispensa[e] || 0) + 1
  persist()
  return true
}

export const inDispensa = e => state.profile.dispensa[e] || 0
export const dispensaPiena = () => CIBI.some(c => inDispensa(c.e) > 0)

/* Dà da mangiare. Torna 'preferito' | 'ok' | 'sazio' | false.
   A ciotola piena il piatto NON viene consumato: sprecare una porzione
   pagata con le monete sarebbe una punizione per una distrazione. */
export function dai(id, e) {
  const p = state.profile.pets[id], c = ciboDi(e), def = petDi(id)
  if (!p || !c || inDispensa(e) <= 0) return false
  const ora = sazieta(id)
  if (ora >= 98) return 'sazio'
  const pref = def.preferito === e
  state.profile.dispensa[e]--
  if (!state.profile.dispensa[e]) delete state.profile.dispensa[e]
  p.sat = Math.min(100, ora + c.sazia * (pref ? FAME.preferito : 1))
  p.pasto = Date.now()
  p.pasti = (p.pasti || 0) + 1
  state.profile.totals.pasti = (state.profile.totals.pasti || 0) + 1
  persist()
  return pref ? 'preferito' : 'ok'
}

/* le mensole devono contenere esattamente gli oggetti posseduti */
export function fixLayout() {
  const p = state.profile
  if (!Array.isArray(p.layout) || p.layout.length !== 3) p.layout = [[], [], []]
  p.layout = p.layout.map(r => (Array.isArray(r) ? r.filter(e => p.owned.includes(e)) : []))
  const placed = new Set(p.layout.flat())
  for (const e of p.owned) {
    if (placed.has(e)) continue
    p.layout.reduce((a, b) => (b.length < a.length ? b : a)).push(e)
    placed.add(e)
  }
}

export function moveItem(fromRow, fromCol, toRow, toIndex) {
  const L = state.profile.layout
  const [e] = L[fromRow].splice(fromCol, 1)
  if (e == null) return
  let idx = toIndex
  if (toRow === fromRow && idx > fromCol) idx--
  L[toRow].splice(Math.max(0, Math.min(idx, L[toRow].length)), 0, e)
  persist()
}

export { backend }
