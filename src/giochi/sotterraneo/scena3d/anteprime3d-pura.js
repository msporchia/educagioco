// Le anteprime 3D della roba, dell'eroe e dei mostri (docs/sotterraneo/anteprime-3d.md), la parte senza three: quale modello per
// quale oggetto (la stessa mappa che veste l'eroe in scena, eroe3d.js), le chiavi della cache e la coda che le disegna una per volta.
import { COSE, baseDi } from '../dati/cose.js'
import { rangoDellaRarita } from '../dati/pezzi.js'

// quale modello 3D (eroi3d/collezione.js) per quale oggetto dell'inventario; chi non c'è prende quello della sua famiglia
export const MODELLO_DI = {
  'spada-corta': 'spada-corta', spada: 'spada-lunga', spadone: 'due-mani', sciabola: 'scimitarra', 'spada-del-ladro': 'stocco',
  'pugnale-vampiro': 'pugnale', 'spada-di-ghiaccio': 'lama-ghiaccio',
  accetta: 'accetta', ascia: 'ascia-guerra', scure: 'scure', bipenne: 'bipenne', mannaia: 'ascia-vichinga', 'bipenne-solare': 'ascia-lava',
  'arco-corto': 'arco-corto', 'arco-lungo': 'arco-lungo', balestra: 'balestra',
  verga: 'bacchetta-legno', 'bastone-magico': 'bastone-nodoso', scettro: 'scettro',
  mazza: 'scure', martello: 'ascia-guerra',
  'scudo-legno': 'rotella', 'scudo-borchiato': 'scudo-goccia', 'scudo-ferro': 'scudo-rotondo', 'scudo-crociato': 'scudo-cavaliere',
  'scudo-leone': 'scudo-nanico', 'scudo-teschio': 'scudo-ombra',
}
export const PER_FAMIGLIA = { spade: 'spada-corta', asce: 'accetta', archi: 'arco-corto', bacchette: 'bacchetta-legno' }
// le armature 3D (eroi3d/armature.js `TIPI`): la base dell'oggetto del corpo ha lo stesso nome
export const ARMATURE = ['panciotto', 'corazza', 'manto', 'saio']
export const EROI = ['cavaliere', 'elfa', 'mago', 'nano']

const cosaDi = k => (k ? COSE[k] || null : null)

/** Il modello della collezione per un'arma o uno scudo (la chiave dell'oggetto, anche «spada@7.m.fuoco»), o null. */
export function modelloDi(k) {
  const c = cosaDi(k)
  if (!c || (c.dove !== 'mano' && c.dove !== 'mancina')) return null
  return MODELLO_DI[baseDi(k)] || PER_FAMIGLIA[c.famiglia] || (c.dove === 'mancina' ? 'rotella' : null)
}

/** Il pregio dell'armatura 3D (1..3) dalla rarità: comune 1, magico 2, raro e leggendario 3. */
export function pregioDi(k) {
  const c = cosaDi(k)
  return c ? Math.min(3, 1 + rangoDellaRarita(c.rarita || 'comune')) : 1
}

/**
 * Cosa ha in mano e addosso l'eroe 3D: `roba` = { mano, mancina, corpo } (chiavi). L'arco si tiene nella sinistra, il resto nella
 * destra; la sinistra porta lo scudo (o la seconda arma) solo se la mano non è un arco o un'arma a due mani.
 * → { destra, sinistra (id della collezione o null), corpo: { tipo, pregio } | null }
 */
export function dotazioneDi(roba = {}) {
  const mano = cosaDi(roba.mano) || {}
  const d = { destra: null, sinistra: null, corpo: null }
  const id = roba.mano ? modelloDi(roba.mano) : null
  if (id) { if (mano.famiglia === 'archi') d.sinistra = id; else d.destra = id }
  if (roba.mancina && mano.famiglia !== 'archi' && mano.mani !== 2) d.sinistra = modelloDi(roba.mancina) || 'rotella'
  const tipo = baseDi(roba.corpo)
  if (ARMATURE.includes(tipo)) d.corpo = { tipo, pregio: pregioDi(roba.corpo) }
  return d
}

const eroeValido = e => (EROI.includes(e) ? e : 'cavaliere')

/**
 * La chiave dell'anteprima di una cosa (`{ chiave, dove, … }` come la danno le viste), o null se non ha un modello 3D (anelli,
 * collane, pozioni, torce…): `arma:<id>`, `scudo:<id>`, `armatura:<tipo>:<pregio>:<eroe>` (l'armatura sta su chi la porta).
 */
export function chiaveDellaCosa(cosa, eroe = 'cavaliere') {
  const k = cosa && (cosa.chiave || null)
  if (!k) return null
  const c = cosaDi(k)
  if (!c) return null
  if (c.dove === 'mano') { const id = modelloDi(k); return id ? `arma:${id}` : null }
  if (c.dove === 'mancina') { const id = modelloDi(k); return id ? `scudo:${id}` : null }
  if (c.dove === 'corpo') {
    const tipo = baseDi(k)
    return ARMATURE.includes(tipo) ? `armatura:${tipo}:${pregioDi(k)}:${eroeValido(eroe)}` : null
  }
  return null
}

/** L'eroe vestito: `eroe:<chi>:<destra>:<sinistra>:<corpo.pregio>` (`-` dove non c'è niente); `modo` 'figura' (intero) o 'busto'. */
export function chiaveDellEroe(eroe, roba = {}, modo = 'figura') {
  const d = dotazioneDi(roba)
  const corpo = d.corpo ? `${d.corpo.tipo}.${d.corpo.pregio}` : '-'
  return `${modo === 'busto' ? 'busto' : 'eroe'}:${eroeValido(eroe)}:${d.destra || '-'}:${d.sinistra || '-'}:${corpo}`
}

/** Un mostro dello scontro (viste/campo.js: tipo, grado, variante, grosso): `mostro:<tipo>:<grado>:<variante>` o `mostro:grosso:<chi>`. */
export function chiaveDelMostro(m) {
  if (!m) return null
  if (m.grosso) return `mostro:grosso:${m.grosso}`
  if (!m.tipo) return null
  return `mostro:${m.tipo}:${m.grado || 'comune'}:${m.variante || '-'}`
}

/** Il contrario delle chiavi: { tipo: 'arma'|'scudo'|'armatura'|'eroe'|'busto'|'mostro', … } o null. */
export function leggiChiave(k) {
  const p = String(k || '').split(':')
  const nulla = x => (x === '-' || x === '' || x == null ? null : x)
  switch (p[0]) {
    case 'arma': case 'scudo': return p[1] ? { tipo: p[0], id: p[1] } : null
    case 'armatura': return ARMATURE.includes(p[1]) ? { tipo: 'armatura', armatura: p[1], pregio: Number(p[2]) || 1, eroe: eroeValido(p[3]) } : null
    case 'eroe': case 'busto': {
      const [tipo, pregio] = (nulla(p[4]) || '').split('.')
      return { tipo: p[0], eroe: eroeValido(p[1]), destra: nulla(p[2]), sinistra: nulla(p[3]),
               corpo: ARMATURE.includes(tipo) ? { tipo, pregio: Number(pregio) || 1 } : null }
    }
    case 'mostro':
      if (p[1] === 'grosso') return p[2] ? { tipo: 'mostro', r: { grosso: p[2] } } : null
      return p[1] ? { tipo: 'mostro', r: { tipo: p[1], grado: p[2] || 'comune', variante: nulla(p[3]) } } : null
    default: return null
  }
}

/** Quanti pixel veri per ogni tipo di anteprima (le viste li mostrano a metà: un telefono ha il doppio dei pixel). */
export const MISURE = { arma: [128, 128], scudo: [128, 128], armatura: [128, 128], eroe: [150, 176], busto: [96, 96], mostro: [96, 96] }

/**
 * La coda delle anteprime: `disegna(chiave)` produce l'immagine (testo, o una promessa di testo: la codifica può finire dopo)
 * o null, e costa; si chiama una volta per chiave, quando
 * `pianifica(fn)` lo concede (un fotogramma). In un fotogramma se ne fanno finché non passano `budget` ms (almeno una), così la
 * pagina non si blocca mai. `chiedi` dà una promessa (la stessa per la stessa chiave), `leggi` l'immagine già fatta o null.
 * Un guasto di `disegna` vale null e non si riprova. `vuota()` è chiamata quando la coda finisce.
 */
export function creaCoda(disegna, { pianifica, ora = () => Date.now(), budget = 8, vuota = () => {} } = {}) {
  const fatte = new Map(), attese = new Map(), coda = []
  let gira = false, chiusa = false
  const fine = (k, img) => {
    fatte.set(k, img)
    const a = attese.get(k); attese.delete(k); if (a) a.resolve(img)
  }
  const una = () => {
    const k = coda.shift()
    let img = null
    if (!chiusa) { try { img = disegna(k) || null } catch (e) { img = null } }
    if (img && typeof img.then === 'function') img.then(v => fine(k, chiusa ? null : v || null), () => fine(k, null))
    else fine(k, img)
  }
  const passo = () => {
    gira = false
    const t0 = ora()
    do una(); while (coda.length && ora() - t0 < budget)
    if (coda.length) { gira = true; pianifica(passo) } else vuota()
  }
  return {
    chiedi(k) {
      if (fatte.has(k)) return Promise.resolve(fatte.get(k))
      if (attese.has(k)) return attese.get(k).promessa
      if (chiusa || !k) return Promise.resolve(null)
      let resolve; const promessa = new Promise(r => { resolve = r })
      attese.set(k, { promessa, resolve }); coda.push(k)
      if (!gira) { gira = true; pianifica(passo) }
      return promessa
    },
    leggi: k => (fatte.has(k) ? fatte.get(k) : null),
    pronta: k => fatte.has(k),
    get inCoda() { return coda.length },
    get fatte() { return fatte.size },
    via() {
      chiusa = true
      for (const [, a] of attese) a.resolve(null)
      attese.clear(); coda.length = 0
    },
  }
}
