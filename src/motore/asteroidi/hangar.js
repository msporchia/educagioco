// L'hangar: chi regala cosa, e la nave scelta tradotta in colori per la tela.
// Puro, gira in Node. Vedi docs/asteroidi/hangar.md.
import { TINTE, DISEGNI, STEMMI, DI_SERIE, POSTI_COLORE, BOSS_VOLO_OGNI, CATALOGO_VOLO,
         PACCO_VOLO, regaliDellaTappa, pezzo, tipoDi, idDi } from '../../data/hangar.js'

const TINTA = Object.fromEntries(TINTE.map(t => [t.id, t]))
const CAMPI = ['scafo', 'ali', 'fiamma', 'disegno', 'colDisegno', 'stemma', 'colStemma']

// un colore vecchio (`t:oro`) valeva per tutti i posti: si apre in un pezzo per posto
const apri = l => [...new Set(l.flatMap(p => tipoDi(p) === 't'
  ? POSTI_COLORE.map(c => pezzo(c, idDi(p))).filter(q => !DI_SERIE.includes(q)) : [p]))]

// la forma si mette a posto alla lettura, come in giochi/campagne.js
export function hangarDi(c) {
  const h = c && typeof c === 'object' ? c : {}
  h.presi = apri(Array.isArray(h.presi) ? h.presi : [])
  h.nuovi = apri(Array.isArray(h.nuovi) ? h.nuovi : [])
  if (!h.nave || typeof h.nave !== 'object') h.nave = {}
  return h
}

export const possiede = (h, p) => DI_SERIE.includes(p) || h.presi.includes(p)

// quanti pacchi ha ancora da dare la nave madre di questa tappa: i suoi pezzi che mancano
export const pacchiDi = (h, pos) => regaliDellaTappa(pos).filter(p => !possiede(h, p)).length

function prendi(h, p) {
  if (!p || possiede(h, p)) return null
  h.presi.push(p)
  h.nuovi.push(p)
  return p
}

/* La nave madre di una tappa abbattuta regala il primo dei due pezzi della
   tappa che manca, poi più niente — non si coltivano le tappe facili. */
export const vintaTappa = (h, pos) => prendi(h, regaliDellaTappa(pos).find(p => !possiede(h, p)))

// il volo ha una nave madre ogni `BOSS_VOLO_OGNI` livelli
export const bossNelVolo = livello => livello > 0 && livello % BOSS_VOLO_OGNI === 0

// quanto spesso lascia il pacco la nave madre del volo a questo livello
export const paccoNelVolo = livello =>
  PACCO_VOLO.filter(r => r.da <= livello).at(-1).volte

// il prossimo pezzo che il volo può dare (`CATALOGO_VOLO`: tutto quello che c'è)
export const prossimoDelVolo = h => CATALOGO_VOLO.find(p => !possiede(h, p)) || null

/* Nel volo ogni nave madre abbattuta può lasciare il prossimo pezzo che
   manca, più spesso quanto più è alta: nessun pezzo chiede un livello, e
   chi ha finito le tappe senza rifarle trova lì quelli che non ha preso. */
export function vintoVolo(h, livello, dado = Math.random()) {
  if (dado >= paccoNelVolo(livello)) return null
  return prendi(h, prossimoDelVolo(h))
}

export const visto = h => { h.nuovi = [] }

// una scelta si tiene solo se il pezzo è ancora suo (o di serie)
export function scegli(h, campo, valore) {
  if (!CAMPI.includes(campo)) return false
  if (valore == null) { delete h.nave[campo]; return true }
  const tipo = campo === 'disegno' ? 'd' : campo === 'stemma' ? 's' : campo
  if (!possiede(h, pezzo(tipo, valore))) return false
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
  if (POSTI_COLORE.includes(tipo)) {
    const t = TINTA[id]
    return t ? { tipo: 't', colore: t.c, lucida: !!t.lucida } : null
  }
  if (tipo === 'd') return { tipo, livrea: livrea({ ...nave, disegno: id, colDisegno: nave.colDisegno || 'giallo' }) }
  if (tipo === 's') return { tipo, id, colore: (TINTA[nave.colStemma] || TINTA.giallo).c }
  return null
}

// per il cartello «hai ottenuto»: che genere di pezzo è
const GENERE = { scafo: 'un colore nuovo per lo scafo', ali: 'un colore nuovo per le ali',
                 fiamma: 'un colore nuovo per le fiamme', colDisegno: 'un colore nuovo per i disegni',
                 colStemma: 'un colore nuovo per lo stemma', d: 'un disegno nuovo', s: 'uno stemma nuovo' }
export const genereDi = p => GENERE[tipoDi(p)]
export { tipoDi, idDi }
