// Le anteprime 3D della roba, dell'eroe e dei mostri (docs/sotterraneo/anteprime-3d.md), la parte senza three: quale modello per
// quale oggetto (la stessa mappa che veste l'eroe in scena, eroe3d.js), le chiavi della cache e la coda che le disegna una per volta.
// Un oggetto si disegna con la figura dei fogli (roba3d-pura.js, docs/sotterraneo/roba-3d.md); MODELLO_DI è il ripiego quando il
// modulo della sua famiglia non c'è o la figura non si costruisce.
import { COSE, baseDi } from '../dati/cose.js'
import { rangoDellaRarita, RARITA, RARITA_DA_LETTERA } from '../dati/pezzi.js'
import { figuraDi, lookDi, famigliaDi, eUnaCollana, gettone, daGettone } from './roba3d-pura.js'

// il ripiego: quale modello della collezione (eroi3d/collezione.js) per quale oggetto; chi non c'è prende quello della sua famiglia
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

// i consumabili (dati/cose.js, `usa` e niente `dove`) hanno un modello per chiave (roba3d/pozioni.js); i «rarissimi» (l'ampolla della
// vita, l'elisir del toro) brillano come un raro
const consumabileDi = k => { const c = cosaDi(k); return c && c.usa && !c.dove ? baseDi(k) : null }
const raritaDelConsumabile = k => (cosaDi(k) && cosaDi(k).rarissimo ? 'raro' : 'comune')

/**
 * Il pezzo 3D di un oggetto: { figura (dei fogli, o null), id (il ripiego della collezione, o null), rarita, elemento }, o null se
 * non ha né l'una né l'altro. Lo usano l'eroe in scena e le anteprime; roba3d.js lo costruisce.
 */
export function pezzo3dDi(k) {
  const c = cosaDi(k)
  if (!c) return null
  const figura = figuraDi(k)
  const id = c.dove === 'mano' || c.dove === 'mancina' ? modelloDi(k) : null
  if (!figura && !id) return null
  const l = lookDi(k)
  return { figura, id, rarita: l.rarita, elemento: l.elemento }
}

/**
 * Cosa ha in mano e addosso l'eroe 3D: `roba` = { mano, mancina, corpo, collo } (chiavi). L'arco si tiene nella sinistra, il resto
 * nella destra; la sinistra porta lo scudo (o la seconda arma) solo se la mano non è un arco o un'arma a due mani.
 * → { destra, sinistra, collo (pezzi 3D, pezzo3dDi, o null), corpo: { tipo, pregio, figura, rarita, elemento } | null }
 */
export function dotazioneDi(roba = {}) {
  const mano = cosaDi(roba.mano) || {}
  const d = { destra: null, sinistra: null, corpo: null, collo: null }
  const p = roba.mano ? pezzo3dDi(roba.mano) : null
  if (p) { if (mano.famiglia === 'archi') d.sinistra = p; else d.destra = p }
  if (roba.mancina && mano.famiglia !== 'archi' && mano.mani !== 2) {
    d.sinistra = pezzo3dDi(roba.mancina) || { figura: null, id: 'rotella', rarita: 'comune', elemento: 'nessuno' }
  }
  const tipo = baseDi(roba.corpo)
  if (ARMATURE.includes(tipo)) {
    const l = lookDi(roba.corpo)
    d.corpo = { tipo, pregio: pregioDi(roba.corpo), figura: figuraDi(roba.corpo), rarita: l.rarita, elemento: l.elemento }
  }
  // al collo solo le collane (gli anelli si vedono nelle anteprime)
  const collo = roba.collo ? pezzo3dDi(roba.collo) : null
  if (collo && collo.figura && eUnaCollana(collo.figura)) d.collo = collo
  return d
}

// l'armatura nelle chiavi: `<tipo>.<pregio>.<figura>.<lettera della rarità>.<elemento>`
const gettoneCorpo = c => (c ? `${c.tipo}.${c.pregio}.${c.figura || '-'}.${(RARITA[c.rarita] || RARITA.comune).lettera}.${c.elemento || 'nessuno'}` : '-')
function corpoDaGettone(s) {
  const p = String(s || '').split('.')
  if (!ARMATURE.includes(p[0])) return null
  const g = daGettone(`${p[2] || '-'}.-.${p[3] || 'c'}.${p[4] || 'nessuno'}`)
  return { tipo: p[0], pregio: Number(p[1]) || 1, figura: g ? g.figura : null, rarita: g ? g.rarita : 'comune', elemento: g ? g.elemento : 'nessuno' }
}

const eroeValido = e => (EROI.includes(e) ? e : 'cavaliere')

/**
 * La chiave dell'anteprima di una cosa (`{ chiave, dove, … }` come la danno le viste), o null se non ha un modello 3D (pozioni,
 * torce, i gioielli senza figura…): `arma:<gettone>`, `scudo:<gettone>`, `gioiello:<gettone>`, `armatura:<tipo>:<pregio>:<eroe>:<corpo>`
 * (l'armatura sta su chi la porta). Il gettone (roba3d-pura.js) dice figura, ripiego, rarità ed elemento: due pezzi con la stessa
 * figura e la stessa rarità sono la stessa anteprima.
 */
export function chiaveDellaCosa(cosa, eroe = 'cavaliere') {
  const k = cosa && (cosa.chiave || null)
  if (!k) return null
  const c = cosaDi(k)
  if (!c) return null
  if (c.dove === 'mano' || c.dove === 'mancina') { const g = gettone(pezzo3dDi(k)); return g ? `${c.dove === 'mano' ? 'arma' : 'scudo'}:${g}` : null }
  if (c.dove === 'corpo') {
    const d = dotazioneDi({ corpo: k })
    return d.corpo ? `armatura:${d.corpo.tipo}:${d.corpo.pregio}:${eroeValido(eroe)}:${gettoneCorpo(d.corpo)}` : null
  }
  if (c.dove === 'collo' || c.dove === 'dito') {
    const p = pezzo3dDi(k)
    return p && p.figura && famigliaDi(p.figura) === 'gioielli' ? `gioiello:${gettone(p)}` : null
  }
  const u = consumabileDi(k)
  return u ? `consumabile:${u}:${RARITA[raritaDelConsumabile(u)].lettera}` : null
}

/** Il consumabile di una chiave come lo costruisce roba3d.js: { consumabile, rarita, elemento }, o null. */
export function consumabile3dDi(k) {
  const u = consumabileDi(k)
  return u ? { consumabile: u, rarita: raritaDelConsumabile(u), elemento: 'nessuno' } : null
}

/** L'eroe vestito: `eroe:<chi>:<destra>:<sinistra>:<corpo>:<collo>` (gettoni, `-` dove non c'è niente); `modo` 'figura' (intero) o 'busto'. */
export function chiaveDellEroe(eroe, roba = {}, modo = 'figura') {
  const d = dotazioneDi(roba)
  return `${modo === 'busto' ? 'busto' : 'eroe'}:${eroeValido(eroe)}:${gettone(d.destra) || '-'}:${gettone(d.sinistra) || '-'}:${gettoneCorpo(d.corpo)}:${gettone(d.collo) || '-'}`
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
    case 'arma': case 'scudo': case 'gioiello': { const g = daGettone(p[1]); return g ? { tipo: p[0], pezzo: g } : null }
    case 'consumabile': return consumabileDi(p[1]) ? { tipo: 'consumabile', pezzo: { consumabile: p[1], rarita: RARITA_DA_LETTERA[p[2]] || 'comune', elemento: 'nessuno' } } : null
    case 'armatura': {
      if (!ARMATURE.includes(p[1])) return null
      const c = corpoDaGettone(p[4]) || { tipo: p[1], pregio: Number(p[2]) || 1, figura: null, rarita: 'comune', elemento: 'nessuno' }
      return { tipo: 'armatura', armatura: p[1], pregio: Number(p[2]) || 1, eroe: eroeValido(p[3]), corpo: { ...c, tipo: p[1], pregio: Number(p[2]) || 1 } }
    }
    case 'eroe': case 'busto':
      return { tipo: p[0], eroe: eroeValido(p[1]), destra: daGettone(p[2]), sinistra: daGettone(p[3]), corpo: corpoDaGettone(p[4]), collo: daGettone(p[5]) }
    // una persona del mondo di sopra (docs/sotterraneo/persone-3d.md): la chiave del modello; una che non c'è vale null al disegno
    case 'persona': return /^[a-z]+$/.test(p[1] || '') ? { tipo: 'persona', chi: p[1] } : null
    case 'mostro':
      if (p[1] === 'grosso') return p[2] ? { tipo: 'mostro', r: { grosso: p[2] } } : null
      return p[1] ? { tipo: 'mostro', r: { tipo: p[1], grado: p[2] || 'comune', variante: nulla(p[3]) } } : null
    default: return null
  }
}

/** Quanti pixel veri per ogni tipo di anteprima (le viste li mostrano a metà: un telefono ha il doppio dei pixel). */
export const MISURE = { arma: [128, 128], scudo: [128, 128], gioiello: [128, 128], consumabile: [128, 128], armatura: [128, 128], eroe: [150, 176], busto: [96, 96], mostro: [96, 96], persona: [96, 96] }

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
