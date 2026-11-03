/* Dentro la casa (docs/fattoria3d/casa.md): le regole delle stanze e dei mobili, sulla `Fattoria3d` (i metodi sottili sono in fattoria3d.js).
   In casa si arreda e basta: niente produce, niente si vende. Comprare (una stanza, un mobile) costa monete e conta come esperienza;
   spostare, girare, colorare, cambiare pavimento e pareti, mettere via e rimettere sono gratis. Tutto ciò che non riesce torna
   { ok: false, motivo } e non cambia niente. Lo stato è `stato.interni`: { stanze: [id], mobili: [{ id, tipo, i, j, rot, colore, trama }],
   finiture: { [stanza]: { pavimento, pareti, carta } }, prossimoId }; un mobile messo via ha `i` e `j` a null. */
import { STANZE, STANZA, MOBILI, ARMADIO, POSTO_ARMADIO, MAX_STANZE, PAVIMENTI, PARETI, CARTE, FINITURA_DI_SERIE,
         origine, stanzaDi, confinano, portaFra, PORTA_DI_CASA, soglieDi, misureMobile, ruotabileMobile, tintaInForma, prezzoDellaStanza } from '../dati/interni.js'

export const interniIniziali = () => ({
  stanze: [0],
  mobili: [{ id: 1, tipo: ARMADIO, i: POSTO_ARMADIO.i, j: POSTO_ARMADIO.j, rot: 0, ...tintaInForma(ARMADIO) }],
  finiture: { 0: { ...FINITURA_DI_SERIE } },
  prossimoId: 2,
})

const intero = v => Number.isInteger(v) ? v : null
const finituraInForma = f => ({
  pavimento: PAVIMENTI.some(p => p.id === f?.pavimento) ? f.pavimento : FINITURA_DI_SERIE.pavimento,
  pareti: PARETI.some(p => p.id === f?.pareti) ? f.pareti : FINITURA_DI_SERIE.pareti,
  carta: CARTE.some(p => p.id === f?.carta) ? f.carta : FINITURA_DI_SERIE.carta,
})

/** Rimette in forma `stato.interni` letto (o niente): mai un'eccezione. Un mobile che non c'è più si butta; uno che non sta più dov'era (la
    stanza non è tua, il posto è preso) va messo via, non perso; l'armadio c'è sempre e torna al suo posto se il suo non va. */
export function interniInForma(letto) {
  const s = interniIniziali()
  if (!letto || typeof letto !== 'object') return s
  const stanze = new Set([0])
  for (const id of Array.isArray(letto.stanze) ? letto.stanze : []) if (STANZE[id] && STANZE.some(t => t.id === id)) stanze.add(id)
  s.stanze = [...stanze].sort((a, b) => a - b)
  s.finiture = {}
  for (const id of s.stanze) s.finiture[id] = finituraInForma((letto.finiture || {})[id])
  s.mobili = []
  let max = 1, armadio = null
  for (const m of Array.isArray(letto.mobili) ? letto.mobili : []) {
    if (!m || !MOBILI[m.tipo] || !(intero(m.id) > 0) || s.mobili.some(x => x.id === m.id)) continue
    if (m.tipo === ARMADIO && armadio) continue
    const voce = { id: m.id, tipo: m.tipo, i: intero(m.i), j: intero(m.j), rot: ruotabileMobile(m.tipo) ? (intero(m.rot) || 0) & 3 : 0, ...tintaInForma(m.tipo, m.colore, m.trama) }
    if (voce.i === null || voce.j === null) voce.i = voce.j = null
    else if (!puoStare(s, voce.tipo, voce.i, voce.j, voce.rot, null).ok) voce.i = voce.j = null
    if (m.tipo === ARMADIO) armadio = voce
    s.mobili.push(voce); max = Math.max(max, voce.id)
  }
  if (!armadio) { armadio = { id: ++max, tipo: ARMADIO, i: null, j: null, rot: 0, ...tintaInForma(ARMADIO) }; s.mobili.unshift(armadio) }
  if (armadio.i === null) {                                   // l'armadio non si mette via: se il suo posto non va, il primo libero
    const p = postoLibero(s, ARMADIO, 0, armadio.id) || POSTO_ARMADIO
    armadio.i = p.i; armadio.j = p.j; armadio.rot = p.rot || 0
  }
  s.prossimoId = Math.max(intero(letto.prossimoId) || 0, max + 1)
  return s
}

// ── dove si può mettere ──
/** Le celle di un mobile girato, e le soglie che non si coprono. */
function celle(tipo, i, j, rot) {
  const x = misureMobile(tipo, rot), out = []
  for (let a = 0; a < x.w; a++) for (let b = 0; b < x.d; b++) out.push([i + a, j + b])
  return out
}
/** `tipo` ci sta in (i, j) girato di `rot`? `escluso`: l'id del mobile che si sta spostando (non si scontra con sé). → { ok } | { ok: false, motivo }:
    `fuori` (fuori da una stanza tua o a cavallo di due), `occupato`, `porta` (copre il passaggio davanti a una porta), `muro` (una cosa appesa va sulla parete di fondo). */
export function puoStare(int, tipo, i, j, rot = 0, escluso = null) {
  const m = MOBILI[tipo]; if (!m) return { ok: false, motivo: 'non-esiste' }
  const cs = celle(tipo, i, j, rot), s = stanzaDi(i, j)
  if (!s || !int.stanze.includes(s.id) || cs.some(([a, b]) => stanzaDi(a, b) !== s)) return { ok: false, motivo: 'fuori' }
  if (m.strato === 'muro') {
    if (j !== origine(s).j0) return { ok: false, motivo: 'muro' }
  } else if (cs.some(([a, b]) => soglieDi(s).some(([x, y]) => x === a && y === b))) return { ok: false, motivo: 'porta' }
  for (const o of int.mobili) {
    if (o.id === escluso || o.i === null) continue
    const om = MOBILI[o.tipo]
    const insieme = om.strato === m.strato || (m.strato !== 'muro' && om.strato !== 'muro' && m.strato !== 'tappeto' && om.strato !== 'tappeto')
    if (!insieme) continue                                    // un mobile sta sopra un tappeto; le cose appese non toccano il pavimento
    if (celle(o.tipo, o.i, o.j, o.rot).some(([a, b]) => cs.some(([x, y]) => x === a && y === b))) return { ok: false, motivo: 'occupato' }
  }
  return { ok: true }
}
/** Il primo posto dove `tipo` ci sta, cercando dalla stanza `stanza` (poi nelle altre tue), vicino a (ci, cj) se c'è. */
export function postoLibero(int, tipo, stanza = 0, escluso = null, ci = null, cj = null) {
  const ordine = [stanza, ...int.stanze.filter(x => x !== stanza)].filter(x => int.stanze.includes(x))
  for (const id of ordine) {
    const { i0, j0 } = origine(STANZE[id]), posti = []
    for (const rot of ruotabileMobile(tipo) ? [0, 1] : [0]) for (let j = j0; j < j0 + STANZA.d; j++) for (let i = i0; i < i0 + STANZA.w; i++) posti.push({ i, j, rot })
    if (ci !== null) posti.sort((a, b) => Math.hypot(a.i - ci, a.j - cj) - Math.hypot(b.i - ci, b.j - cj))
    const p = posti.find(p => puoStare(int, tipo, p.i, p.j, p.rot, escluso).ok)
    if (p) return p
  }
  return null
}
/** Si cammina sulle celle delle stanze tue, sulle porte fra due stanze tue e sulla porta di casa, non sui mobili per terra. */
export function calpestabile(int, i, j) {
  const s = stanzaDi(i, j)
  if (s) {
    if (!int.stanze.includes(s.id)) return false
    return !int.mobili.some(o => o.i !== null && MOBILI[o.tipo].strato === 'pavimento' && celle(o.tipo, o.i, o.j, o.rot).some(([a, b]) => a === i && b === j))
  }
  if (i === PORTA_DI_CASA.i && j === PORTA_DI_CASA.j) return true
  for (const a of int.stanze) for (const b of int.stanze) if (a < b && confinano(STANZE[a], STANZE[b])) {
    const p = portaFra(STANZE[a], STANZE[b]); if (p.i === i && p.j === j) return true
  }
  return false
}

// ── le mosse (le chiama la Fattoria3d: `this` è il motore) ──
const int = f => f.s.interni
const mobile = (f, id) => int(f).mobili.find(m => m.id === id) || null

/** Compra una stanza che confina con una tua. Rifiuti: `non-esiste`, `gia-tua`, `non-confina`, `poche-monete` (con `costo`). */
export function compraStanza(f, id) {
  const s = STANZE.find(x => x.id === id), I = int(f)
  if (!s) return { ok: false, motivo: 'non-esiste' }
  if (I.stanze.includes(id)) return { ok: false, motivo: 'gia-tua' }
  if (!I.stanze.some(t => confinano(STANZE[t], s))) return { ok: false, motivo: 'non-confina' }
  const costo = prezzoDellaStanza(I.stanze.length)
  if (costo > f.monete() || !f._spendi(costo)) return { ok: false, motivo: 'poche-monete', costo }
  I.stanze = [...I.stanze, id].sort((a, b) => a - b)
  I.finiture[id] = { ...FINITURA_DI_SERIE }
  f._evento('stanza', { stanza: id, costo })
  return { ok: true, costo }
}
/** Compra un mobile e lo mette lì, col colore e la trama scelti (gratis: il prezzo è quello del mobile). Rifiuti: quelli di `puoStare`,
    `di-serie` (l'armadio non si compra), `poche-monete` (con `costo`). */
export function compraMobile(f, tipo, i, j, rot = 0, colore = null, trama = null) {
  const m = MOBILI[tipo]
  if (!m) return { ok: false, motivo: 'non-esiste' }
  if (m.diSerie) return { ok: false, motivo: 'di-serie' }
  rot = ruotabileMobile(tipo) ? (rot | 0) & 3 : 0
  const p = puoStare(int(f), tipo, i, j, rot, null); if (!p.ok) return p
  if (m.prezzo > f.monete() || !f._spendi(m.prezzo)) return { ok: false, motivo: 'poche-monete', costo: m.prezzo }
  const id = int(f).prossimoId++
  int(f).mobili.push({ id, tipo, i, j, rot, ...tintaInForma(tipo, colore, trama) })
  f._evento('mobile', { tipo, costo: m.prezzo })
  return { ok: true, id, costo: m.prezzo }
}
/** Sposta (o rimette, se era via) un mobile tuo, anche girato. Gratis. */
export function spostaMobile(f, id, i, j, rot = null) {
  const o = mobile(f, id); if (!o) return { ok: false, motivo: 'non-esiste' }
  const r = rot === null ? o.rot : ruotabileMobile(o.tipo) ? (rot | 0) & 3 : 0
  const p = puoStare(int(f), o.tipo, i, j, r, id); if (!p.ok) return p
  o.i = i; o.j = j; o.rot = r
  return { ok: true }
}
/** Gira un mobile di un quarto, sul posto; se girato non ci sta, prova a farlo stare spostandolo appena (sempre nella sua stanza). */
export function giraMobile(f, id) {
  const o = mobile(f, id); if (!o || o.i === null) return { ok: false, motivo: 'non-esiste' }
  if (!ruotabileMobile(o.tipo)) return { ok: false, motivo: 'non-gira' }
  const r = (o.rot + 1) & 3
  for (const [di, dj] of [[0, 0], [-1, 0], [0, -1], [-1, -1], [1, 0], [0, 1], [-2, 0], [0, -2]]) {
    if (puoStare(int(f), o.tipo, o.i + di, o.j + dj, r, id).ok) { o.i += di; o.j += dj; o.rot = r; return { ok: true } }
  }
  return { ok: false, motivo: 'occupato' }
}
/** Il colore e la trama di un mobile tuo: gratis, quante volte si vuole. */
export function tingiMobile(f, id, colore, trama = null) {
  const o = mobile(f, id); if (!o) return { ok: false, motivo: 'non-esiste' }
  Object.assign(o, tintaInForma(o.tipo, colore, trama ?? o.trama))
  return { ok: true }
}
/** Mette via un mobile (resta tuo, si rimette gratis). L'armadio no: è lui che apre il guardaroba. */
export function mettiViaMobile(f, id) {
  const o = mobile(f, id); if (!o) return { ok: false, motivo: 'non-esiste' }
  if (MOBILI[o.tipo].diSerie) return { ok: false, motivo: 'di-serie' }
  o.i = o.j = null
  return { ok: true }
}
/** Il pavimento, il colore e la carta delle pareti di una stanza tua: gratis. */
export function rifiniStanza(f, id, finitura) {
  const I = int(f); if (!I.stanze.includes(id)) return { ok: false, motivo: 'non-esiste' }
  I.finiture[id] = finituraInForma({ ...I.finiture[id], ...finitura })
  return { ok: true }
}

/** Il quadro per il foglio: le stanze (tue, da comprare col prezzo, chiuse), i mobili messi e quelli via. */
export function vistaDegliInterni(f) {
  const I = int(f), prezzo = prezzoDellaStanza(I.stanze.length), tutte = I.stanze.length >= MAX_STANZE
  return {
    monete: f.monete(),
    stanze: STANZE.map(s => {
      const tua = I.stanze.includes(s.id), apribile = !tua && I.stanze.some(t => confinano(STANZE[t], s))
      return { id: s.id, c: s.c, r: s.r, tua, apribile, prezzo: apribile ? prezzo : null, finitura: tua ? { ...I.finiture[s.id] } : null,
               mobili: tua ? I.mobili.filter(m => m.i !== null && stanzaDi(m.i, m.j) === s).length : 0 }
    }),
    tutte,
    via: I.mobili.filter(m => m.i === null).map(m => ({ ...m })),
  }
}
