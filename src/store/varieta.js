// La varietà a monete, attaccata al profilo e al registro delle sessioni:
// vedi docs/genitori/varieta.md. I conti sono in data/varieta.js (puro).
import { ref, reactive } from 'vue'
import { state, persist, filtraMonete, addCoins } from './profile.js'
import { inCorso, secondiInCorso, vociInMemoria, leggiSessioni, chiaveGiorno, ora } from './sessioni.js'
import { GIOCHI } from '../data/giochi.js'
import { inCasa } from '../data/portata-giochi.js'
import * as V from '../data/varieta.js'

export const scheda = k => GIOCHI.find(g => g.chiave === V.chiaveDelGioco(k)) || null
export const regole = () => V.regoleDi(state.profile.settings.varieta)

// sale quando il registro in memoria è stato riletto: le carte ricontano
export const giro = ref(0)
let inLettura = null
export function ricarica() {
  const id = state.player
  if (!id) return Promise.resolve()
  if (!inLettura) inLettura = leggiSessioni(id)
    .then(() => { giro.value++ }).catch(() => {}).finally(() => { inLettura = null })
  return inLettura
}

export function statoDi(k, oggi = ora()) {
  const id = state.player
  const a = inCorso()
  const chiave = V.chiaveDelGioco(k)
  const inPiu = a && a.id === id && V.chiaveDelGioco(a.gioco) === chiave ? secondiInCorso() : 0
  return V.statoDelGioco({ regole: regole(), gioco: scheda(chiave), voci: vociInMemoria(id) || [],
                           oggi, inCorso: inPiu })
}

// quanto ha giocato davvero oggi, senza togliere il tempo ridato: la riga «Oggi» dei grandi
export const secondiVeri = (k, oggi = ora()) =>
  V.secondiContati({ voci: vociInMemoria(state.player) || [], gioco: V.chiaveDelGioco(k), oggi })

// il gioco aperto adesso, se è di questo bambino
export function giocoAperto() {
  const a = inCorso()
  return a && a.id === state.player ? V.chiaveDelGioco(a.gioco) : null
}

export function altroDaProvare(escluso, oggi = ora()) {
  const candidati = GIOCHI
    .filter(g => g.chiave !== escluso && V.paga(g) && inCasa(g.chiave))
    .map(g => ({ chiave: g.chiave, nome: g.nome, stato: statoDi(g.chiave, oggi) }))
  return V.suggerisci(candidati)
}

// ── la scritta piccola dentro il gioco (components/varieta/Avviso.vue) ──
export const avviso = reactive({ testo: '', k: 0 })
export function dici(testo) { if (testo) { avviso.testo = testo; avviso.k++ } }

// ── il filtro: l'unico posto dove le monete di un gioco cambiano ──
const resti = {}
let zitto = false     // chi usa `incassa` il premio lo scrive da sé
let ultimo = { chiesto: 0, dato: 0, frase: '' }

function filtro(n) {
  const k = giocoAperto()
  if (!k) return n
  const st = statoDi(k)
  if (!st.paga) return n
  const { dato, resto } = V.incasso(n, st.fattore, resti[k] || 0)
  resti[k] = resto
  const frase = premioDetto(k, n, dato)
  ultimo = { chiesto: n, dato, frase }
  if (!zitto && frase && n >= V.AVVISO_DA) dici(frase)
  return dato
}
filtraMonete(filtro)

export function premioDetto(k, chiesto, dato) {
  const chiave = V.chiaveDelGioco(k)
  return V.premioInParole({ chiesto, dato, nome: scheda(chiave)?.nome || chiave,
                            prova: dato === 0 ? altroDaProvare(chiave)?.nome || '' : '' })
}

// Per il cartello di fine tappa: paga e dice com'è andata, senza la scritta volante.
export function incassa(n) {
  ultimo = { chiesto: n, dato: n, frase: '' }
  zitto = true
  try { addCoins(n) } finally { zitto = false }
  return { ...ultimo }
}

// Le monete di una partita: si pagano quando arrivano (`paga`, una cosa fatta
// alla volta), e il cartello di fine dice quante e quanto ha tolto il
// salvadanaio (`nota`). docs/apprendimento/calibrazione.md, «Si paga subito».
export function borsa(k) {
  let chiesto = 0, dato = 0
  return {
    paga(n) {
      if (!(n > 0)) return 0
      const p = incassa(n)
      chiesto += p.chiesto
      dato += p.dato
      return p.dato
    },
    get dato() { return dato },
    get chiesto() { return chiesto },
    nota: () => premioDetto(k, chiesto, dato),
  }
}

// ── le scelte dei grandi, in settings.varieta (per bambino) ──
function scrivi(cambia) {
  const s = state.profile.settings
  const v = { ...(s.varieta || {}) }
  cambia(v)
  s.varieta = v
  persist()
}

export function scegliSoglie({ pieno, meta }) {
  scrivi(v => {
    if (pieno != null) v.pieno = pieno
    if (meta != null) v.meta = meta
  })
}

// come: 'tutti' | 'libero' | { pieno, meta }
export function tettoDelGioco(k, come) {
  scrivi(v => {
    const giochi = { ...(v.giochi || {}) }
    if (come === 'tutti') delete giochi[k]
    else if (come === 'libero') giochi[k] = 'libero'
    else giochi[k] = { pieno: come.pieno, meta: come.meta }
    v.giochi = giochi
  })
}

export function consiglia(k, si) {
  scrivi(v => {
    const c = { ...(v.consigliati || {}) }
    if (si) c[k] = true
    else delete c[k]
    v.consigliati = c
  })
}

export function accendiDormienti(si) { scrivi(v => { v.dormienti = !!si }) }

// «Ridai tempo»: il conto di oggi riparte da zero, il registro resta com'è
export function ridaiTempo(k, oggi = ora()) {
  const g = chiaveGiorno(oggi)
  const giaRidato = (() => {
    const r = regole().ridato
    return r && r.g === g ? { ...(r.s || {}) } : {}
  })()
  const tutto = V.secondiContati({ voci: vociInMemoria(state.player) || [], gioco: k, oggi })
  giaRidato[k] = tutto
  scrivi(v => { v.ridato = { g, s: giaRidato } })
}
