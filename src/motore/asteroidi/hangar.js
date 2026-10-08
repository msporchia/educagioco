// L'hangar: chi regala cosa, e la nave scelta tradotta in colori per la tela.
// Puro, gira in Node. Vedi docs/asteroidi/hangar.md.
import { TINTE, DISEGNI, STEMMI, DI_SERIE, REGALI_PER_TAPPA, BOSS_VOLO_OGNI,
         REGALI_VOLO, regaliDellaTappa, tipoDi, idDi } from '../../data/hangar.js'

const TINTA = Object.fromEntries(TINTE.map(t => [t.id, t]))
const CAMPI = ['scafo', 'ali', 'fiamma', 'disegno', 'colDisegno', 'stemma', 'colStemma']

// la forma si mette a posto alla lettura, come in giochi/campagne.js
export function hangarDi(c) {
  const h = c && typeof c === 'object' ? c : {}
  if (!Array.isArray(h.presi)) h.presi = []
  if (!Array.isArray(h.nuovi)) h.nuovi = []
  if (!h.vinte || typeof h.vinte !== 'object') h.vinte = {}
  if (!Number.isInteger(h.voloMax)) h.voloMax = 0
  if (!h.nave || typeof h.nave !== 'object') h.nave = {}
  return h
}

export const possiede = (h, p) => DI_SERIE.includes(p) || h.presi.includes(p)

// quanti pacchi ha ancora da dare la nave madre di questa tappa
export const pacchiDi = (h, chiave) =>
  Math.max(0, REGALI_PER_TAPPA - (h.vinte[chiave] || 0))

function prendi(h, p) {
  if (!p || possiede(h, p)) return null
  h.presi.push(p)
  h.nuovi.push(p)
  return p
}

/* La nave madre di una tappa abbattuta: i primi due giri regalano i due
   pezzi della tappa, poi più niente — non si coltivano le tappe facili. */
export function vintaTappa(h, chiave, pos) {
  const n = h.vinte[chiave] || 0
  if (n >= REGALI_PER_TAPPA) return null
  h.vinte[chiave] = n + 1
  return prendi(h, regaliDellaTappa(pos)[n])
}

// il volo ha una nave madre ogni `BOSS_VOLO_OGNI` livelli
export const bossNelVolo = livello => livello > 0 && livello % BOSS_VOLO_OGNI === 0

/* Nel volo regala solo chi abbatte una nave madre più in alto di tutte
   quelle di prima, e regala il pezzo più alto che il suo livello può dare:
   rifare i livelli facili non dà niente, i pezzi migliori stanno in alto. */
export function vintoVolo(h, livello) {
  if (livello <= h.voloMax) return null
  h.voloMax = livello
  const alla = REGALI_VOLO.filter(r => r.da <= livello && !possiede(h, r.p))
  return alla.length ? prendi(h, alla[alla.length - 1].p) : null
}

// il prossimo pezzo del volo che si può ancora prendere, e da che livello
export const prossimoDelVolo = h => REGALI_VOLO.find(r => !possiede(h, r.p)) || null

export const visto = h => { h.nuovi = [] }

// una scelta si tiene solo se il pezzo è ancora suo (o di serie)
export function scegli(h, campo, valore) {
  if (!CAMPI.includes(campo)) return false
  if (valore == null) { delete h.nave[campo]; return true }
  const tipo = campo === 'disegno' ? 'd' : campo === 'stemma' ? 's' : 't'
  if (!possiede(h, tipo + ':' + valore)) return false
  h.nave[campo] = valore
  return true
}

/* Quello che la tela sa della nave: colori già decisi, niente pezzi né
   regali. `null` è la nave di serie, quella di sempre. */
export function livrea(nave) {
  if (!nave) return null
  const t = id => (id && TINTA[id]) || null
  const scafo = t(nave.scafo), ali = t(nave.ali), fiamma = t(nave.fiamma)
  const disegno = DISEGNI.includes(nave.disegno) ? nave.disegno : null
  const stemma = STEMMI.includes(nave.stemma) ? nave.stemma : null
  if (!scafo && !ali && !fiamma && !disegno && !stemma) return null
  return {
    scafo: scafo && scafo.c, scafoLucida: !!(scafo && scafo.lucida),
    ali: ali && ali.c, aliLucida: !!(ali && ali.lucida),
    fiamma: fiamma && fiamma.c,
    disegno, colDisegno: (t(nave.colDisegno) || TINTA.giallo).c,
    stemma, colStemma: (t(nave.colStemma) || TINTA.bianco).c,
  }
}

/* Come si mostra un pezzo da solo (nell'hangar, nel pacco): un colore è
   un tondo, un disegno è la nave che lo porta, uno stemma è lo stemma.
   `nave`: la scelta di adesso, perché il disegno si veda sulla nave sua. */
export function aspettoDi(p, nave = {}) {
  const tipo = tipoDi(p), id = idDi(p)
  if (tipo === 't') {
    const t = TINTA[id]
    return t ? { tipo, colore: t.c, lucida: !!t.lucida } : null
  }
  if (tipo === 'd') return { tipo, livrea: livrea({ ...nave, disegno: id, colDisegno: nave.colDisegno || 'giallo' }) }
  if (tipo === 's') return { tipo, id, colore: (TINTA[nave.colStemma] || TINTA.giallo).c }
  return null
}

// per il cartello «hai ottenuto»: che genere di pezzo è
export const genereDi = p => ({ t: 'un colore nuovo', d: 'un disegno nuovo', s: 'uno stemma nuovo' })[tipoDi(p)]
export { tipoDi, idDi }
