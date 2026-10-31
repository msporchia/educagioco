// Le mosse dei mostri (docs/sotterraneo/mosse.md): un comune ha l'attacco di sempre e basta; un caporale (forte) e un grosso (boss)
// ne hanno due, un super boss tre. La prima è sempre l'attacco di sempre, le altre sono in più: cura, incantesimo, urlo o un
// attacco forte. Dati puri e la regola di scelta, senza three.js: li leggono il motore (motore/scontro.js) e la vista 3D
// (scena3d/mostro3d.js, che li passa alle animazioni dei prototipi). Il progetto e la prova: poc/mostri-3d/MOSSE.md.
import { GROSSI } from './grossi.js'
import { MOSTRI } from './mostri.js'

export const RUOLI = ['comune', 'forte', 'boss', 'superboss']
export const N_MOSSE = { comune: 1, forte: 2, boss: 2, superboss: 3 }

// Com'è ogni tipo: l'icona dell'annuncio e il suo colore (numeri, come li vogliono le animazioni 3D).
export const TIPI = {
  attacco: { icona: 'spada', colore: 0xff5a4a, dice: 'attacca' },
  cura: { icona: 'croce', colore: 0x6ee06a, dice: 'si cura' },
  incantesimo: { icona: 'stella', colore: 0xb27cf2, dice: 'lancia un incantesimo' },
  urlo: { icona: 'urlo', colore: 0xffc83a, dice: 'urla e si rinforza' },
}
// l'attacco forte (o in area) si annuncia con due spade arancioni
export const FORTE = { icona: 'spade', colore: 0xff8a2a, dice: 'colpo forte' }
// quante cure per scontro al più, per ruolo (e la singola mossa ha il suo `max`)
export const MAX_CURE = { comune: 0, forte: 1, boss: 1, superboss: 2 }
// l'elemento di un incantesimo → l'effetto che vola (gli effetti 3D di dati/effetti.js); il fisico è un dardo arcano viola
export const INCANTESIMO_DI = { fuoco: 'palla', gelo: 'scheggia', fulmine: 'fulmine', veleno: 'dardo', sacro: 'dardo', fisico: 'dardo' }
export const COLORE_ELEMENTO = { fisico: 0xb27cf2, fuoco: 0xe8742f, gelo: 0x58b4e6, fulmine: 0xb98af0, veleno: 0x7cc94a, sacro: 0xffe08a }

// ───────── le mosse, scritte a mano ─────────
// `via`: come si muove ('principale' l'attacco del modello; 'carica', 'balzo', 'scatto', 'schianto' quell'attacco più un movimento
// del corpo intero: poc/mostri-3d/mosse-anim.js). `peso`: quanto spesso; `condizione`: quando si può; `max`: quante volte a scontro.
const att = () => ({ id: 'attacco', nome: null, tipo: 'attacco', peso: 4, via: 'principale' })
const forte = (id, nome, via, o = {}) => ({ id, nome, tipo: 'attacco', peso: 2, via, mod: 1.4, attesa: 1.5, ...o })
const cura = (id, nome, o = {}) => ({ id, nome, tipo: 'cura', peso: 6, condizione: 'sotto-meta', quota: 0.12, max: 1, via: 'sulposto', ...o })
const inc = (id, nome, elemento, o = {}) => ({ id, nome, tipo: 'incantesimo', peso: 2, elemento, effetto: INCANTESIMO_DI[elemento], mod: 0.7, ignoraScudo: true, via: 'sulposto', ...o })
const urlo = (id, nome, o = {}) => ({ id, nome, tipo: 'urlo', peso: 2, condizione: 'non-rinforzato', max: 2, piu: 0.25, turni: 3, via: 'sulposto', ...o })

// La seconda mossa di ogni specie quando fa da caporale (o da signore di sopra): una per specie, scelta da com'è fatta
export const DEL_CAPORALE = {
  goblin: forte('pugnalata', 'Pugnalata', 'scatto'),
  scheletro: cura('ricompone', 'Si ricompone', { colore: 0xe8e0c0 }),
  orco: urlo('urlo-guerra', 'Urlo di guerra'),
  gigante: forte('schianto', 'Schianto', 'schianto'),
  ratto: forte('morso-rabbioso', 'Morso rabbioso', 'scatto'),
  pipistrello: urlo('stridio', 'Stridio', { piu: 0.2 }),
  melma: cura('ricompatta', 'Si ricompatta'),
  fantasma: inc('soffio-spettrale', 'Soffio spettrale', 'gelo'),
  vespa: forte('pungiglione', 'Pungiglione', 'scatto'),
  fungo: cura('ricresce', 'Ricresce', { elemento: 'veleno' }),
  lupo: urlo('ululato', 'Ululato', { piu: 0.2 }),
  granchio: forte('tenaglia', 'Tenaglia', 'carica'),
  serpente: inc('sputo-velenoso', 'Sputo velenoso', 'veleno'),
  golem: forte('schianto', 'Schianto', 'schianto'),
  troll: urlo('ruggito', 'Ruggito', { piu: 0.3 }),
  zombie: urlo('gemito', 'Gemito'),
  'scheletro-scudo': cura('ricompone', 'Si ricompone', { colore: 0xe8e0c0 }),
  diavoletto: inc('fiammella', 'Fiammella', 'fuoco'),
  'spirito-fuoco': inc('palla-di-fuoco', 'Palla di fuoco', 'fuoco'),
  'golem-magma': forte('schianto-magma', 'Schianto di magma', 'schianto'),
  ragno: inc('sputo-velenoso', 'Sputo velenoso', 'veleno'),
  pianta: cura('linfa', 'Linfa', { elemento: 'veleno' }),
  'melma-rosa': cura('ricompatta', 'Si ricompatta'),
  'mostro-verde': cura('radici', 'Radici rigeneranti', { elemento: 'veleno' }),
  piranha: forte('morso-famelico', 'Morso famelico', 'scatto'),
  polpo: inc('inchiostro', 'Getto d\'inchiostro', 'fisico'),
  'fantasma-azzurro': inc('soffio-gelido', 'Soffio gelido', 'gelo'),
  tartaruga: inc('getto', 'Getto d\'acqua', 'gelo'),
  cinghiale: forte('carica-testa', 'Carica a testa bassa', 'carica'),
  ent: cura('radici', 'Radici rigeneranti', { elemento: 'veleno' }),
  'golem-muschio': cura('muschio', 'Muschio che ricresce', { elemento: 'veleno' }),
  scorpione: forte('pungiglione', 'Pungiglione', 'scatto'),
  'spirito-elettrico': inc('saetta', 'Saetta', 'fulmine'),
  'golem-lava': forte('schianto-lava', 'Schianto di lava', 'schianto'),
  'melma-viola': cura('ricompatta', 'Si ricompatta'),
  'mostro-viola': urlo('ruggito', 'Ruggito'),
  'pipistrello-occhio': inc('sguardo', 'Sguardo', 'fisico'),
  ombra: inc('dardo-ombra', 'Dardo d\'ombra', 'fisico'),
  'golem-ghiaccio': inc('schegge', 'Schegge di ghiaccio', 'gelo'),
  ghoul: urlo('ringhio', 'Ringhio'),
  'teschio-azzurro': inc('fiamma-azzurra', 'Fiamma azzurra', 'gelo'),
  mummia: cura('bende', 'Si riavvolge'),
  mietitore: forte('falciata', 'Falciata', 'schianto'),
  draghetto: inc('palla-di-fuoco', 'Palla di fuoco', 'fuoco'),
  occhio: inc('raggio', 'Raggio', 'fulmine'),
  'golem-pietra': forte('schianto', 'Schianto', 'schianto'),
  grifone: forte('picchiata', 'Picchiata', 'balzo'),
  drago: inc('palla-di-fuoco', 'Palla di fuoco', 'fuoco'),
  'bestia-cornuta': forte('carica-corna', 'Carica di corna', 'carica'),
  negromante: inc('maledizione', 'Maledizione', 'fisico'),
  'troll-clava': urlo('ruggito', 'Ruggito', { piu: 0.3 }),
  'drago-lava': inc('palla-di-lava', 'Palla di lava', 'fuoco'),
}

// I grossi: le mosse in più, una (boss) o due (super boss: `ruolo` in GROSSI). La seconda del super boss è un colpo più corto e più
// largo (×1,2, aspetta 1,25 turni), la terza la speciale; le cure dei super boss sono del 15%, due volte
const SPAZZA = { mod: 1.2, attesa: 1.25 }
export const DEL_GROSSO = {
  ossuto: [inc('maledizione', 'Maledizione delle ossa', 'fisico')],
  grumo: [urlo('urlo-guerra', 'Urlo di Grumo', { piu: 0.3 })],
  fiammetta: [inc('palla-di-fuoco', 'Palla di fuoco', 'fuoco')],
  zannaverde: [inc('sputo-velenoso', 'Sputo velenoso', 'veleno')],
  gorgo: [inc('getto', 'Getto gelido', 'gelo')],
  minotto: [forte('carica-corna', 'Carica di corna', 'carica')],
  carbonchio: [forte('coda', 'Colpo di coda', 'schianto', SPAZZA), inc('sfera-fuoco', 'Sfera infuocata', 'fuoco')],
  barbamuschio: [cura('radici', 'Radici rigeneranti', { elemento: 'veleno' })],
  piumanera: [forte('picchiata', 'Picchiata', 'balzo')],
  sibilla: [inc('sputo-velenoso', 'Sputo velenoso', 'veleno')],
  brontolava: [inc('palla-di-lava', 'Palla di lava', 'fuoco')],
  brinaldo: [inc('schegge', 'Schegge di ghiaccio', 'gelo')],
  falcenera: [forte('falciata', 'Falciata', 'schianto', SPAZZA), cura('anime', 'Raccoglie le anime', { quota: 0.15, max: 2, elemento: 'sacro' })],
}

// ───────── chi ha quante mosse ─────────
/** Il ruolo di un mostro del piano: il grosso è boss (o super boss, se GROSSI lo dice), il caporale e il signore di sopra forti, gli altri comuni. */
export function ruoloDi(m) {
  if (m && m.grosso) return (GROSSI[m.grosso] && GROSSI[m.grosso].ruolo) || 'boss'
  if (m && (m.caporale || m.signore)) return 'forte'
  return 'comune'
}

const conAspetto = m => {
  const T = TIPI[m.tipo]
  const forteAtt = m.tipo === 'attacco' && (m.mod || 1) > 1.05
  return { mod: 1, attesa: 1, ...m, icona: forteAtt ? FORTE.icona : T.icona, colore: m.colore ?? (forteAtt ? FORTE.colore : T.colore),
           tinta: m.tipo === 'incantesimo' ? COLORE_ELEMENTO[m.elemento || 'fisico'] : (m.colore ?? T.colore) }
}
const ELENCHI = new Map()
/** Le mosse di un mostro del piano, nell'ordine (la prima è l'attacco di sempre). Lo stesso elenco per chi ha la stessa specie e lo stesso ruolo. */
export function mosseDi(m) {
  const ruolo = ruoloDi(m)
  const chiave = ruolo === 'comune' ? 'comune' : m.grosso ? `g:${m.grosso}` : `c:${m.tipo}`
  if (ELENCHI.has(chiave)) return ELENCHI.get(chiave)
  const piu = ruolo === 'comune' ? [] : m.grosso ? DEL_GROSSO[m.grosso] || [] : DEL_CAPORALE[m.tipo] ? [DEL_CAPORALE[m.tipo]] : []
  const lista = [att(), ...piu].slice(0, N_MOSSE[ruolo]).map(conAspetto)
  ELENCHI.set(chiave, lista)
  return lista
}

// ───────── come sceglie ─────────
/** Lo stato delle mosse di un mostro in uno scontro (in `foglio.mosse`, per posto): azzerato a ogni scontro. */
export const statoDelleMosse = () => ({ usate: {}, ultima: null, rinforzo: 0, piu: 0, cure: 0, prossima: null })

/** Il peso di una mossa adesso (0 = non si può). `s`: lo stato delle mosse; `vita`, `vitaMax`: le ossa del mostro; `protetto`: l'eroe ha uno scudo. */
export function pesoMossa(mossa, s, { vita, vitaMax, protetto = false, ruolo = 'forte' }) {
  if (mossa.condizione === 'sotto-meta' && !(vita > 0 && vita < vitaMax * 0.5)) return 0
  if (mossa.condizione === 'non-rinforzato' && s.rinforzo > 0) return 0
  const fatte = s.usate[mossa.id] || 0
  if (mossa.max != null && fatte >= mossa.max) return 0
  if (mossa.tipo === 'cura' && (s.cure >= MAX_CURE[ruolo] || vita >= vitaMax)) return 0
  let w = mossa.peso ?? 1
  if (mossa.tipo === 'incantesimo' && protetto) w *= 2.5   // lo scudo e la parata non lo fermano: è la risposta a chi para sempre
  return w
}

/**
 * Sceglie la mossa. Mai due volte di fila la stessa, tranne l'attacco di sempre (con due mosse il mostro alternerebbe e il suo colpo
 * scenderebbe a metà); se non si può nient'altro, l'attacco. `tiro` ∈ [0,1): con una mossa sola non serve e non si chiede.
 */
export function scegliMossa(mosse, s, opz, tiro) {
  if (mosse.length === 1) return mosse[0]
  let pesi = mosse.map(m => pesoMossa(m, s, opz))
  const ripetibile = m => m.tipo === 'attacco' && (m.mod || 1) <= 1
  const blocca = (m, i) => m.id === s.ultima && !ripetibile(m) && pesi[i] > 0
  if (mosse.some((m, i) => !blocca(m, i) && pesi[i] > 0)) pesi = pesi.map((w, i) => (blocca(mosse[i], i) ? 0 : w))
  const tot = pesi.reduce((a, b) => a + b, 0)
  if (tot <= 0) return mosse[0]
  let r = tiro() * tot
  for (let i = 0; i < mosse.length; i++) { r -= pesi[i]; if (r < 0 && pesi[i] > 0) return mosse[i] }
  return mosse[0]
}

/** Dopo che il mostro ha fatto `mossa`: le volte, l'ultima, il rinforzo che cala di uno a mossa (l'urlo lo rimette). */
export function registra(s, mossa) {
  s.usate[mossa.id] = (s.usate[mossa.id] || 0) + 1
  s.ultima = mossa.id
  if (s.rinforzo > 0) s.rinforzo--
  if (mossa.tipo === 'cura') s.cure++
  if (mossa.tipo === 'urlo') { s.rinforzo = mossa.turni; s.piu = mossa.piu }
  return s
}

/** Il moltiplicatore del colpo di `mossa` adesso: il suo `mod` (forte, incantesimo) e il rinforzo dell'urlo, se c'è. */
export const modDella = (mossa, s) => (mossa ? mossa.mod || 1 : 1) * (s && s.rinforzo > 0 ? 1 + s.piu : 1)
/** Le ossa che una cura ridà: una quota della vita massima, almeno uno, mai oltre il massimo. */
export const curaDella = (mossa, vita, vitaMax) => Math.max(0, Math.min(vitaMax - vita, Math.max(1, Math.round(vitaMax * mossa.quota))))
/** Quello che la vista mostra di una mossa: l'icona, il colore, il nome («Si ricompone»), cosa fa. */
export const vistaDella = mossa => mossa && ({ id: mossa.id, tipo: mossa.tipo, nome: mossa.nome || 'Attacco', icona: mossa.icona,
  colore: '#' + mossa.colore.toString(16).padStart(6, '0'), elemento: mossa.elemento || null, effetto: mossa.effetto || null, attesa: mossa.attesa || 1 })

export function guastiDelleMosse() {
  const g = []
  for (const k of Object.keys(MOSTRI)) if (!DEL_CAPORALE[k]) g.push(`${k}: da caporale non ha la seconda mossa`)
  for (const k of Object.keys(DEL_CAPORALE)) if (!MOSTRI[k]) g.push(`${k}: ha una mossa da caporale ma non è nel bestiario`)
  for (const [k, G] of Object.entries(GROSSI)) {
    const r = G.ruolo || 'boss'
    if (!N_MOSSE[r]) g.push(`${k}: ruolo «${r}» sconosciuto`)
    if ((DEL_GROSSO[k] || []).length !== N_MOSSE[r] - 1) g.push(`${k}: ${r} con ${(DEL_GROSSO[k] || []).length + 1} mosse invece di ${N_MOSSE[r]}`)
  }
  const tutte = [...Object.values(DEL_CAPORALE), ...Object.values(DEL_GROSSO).flat()]
  for (const m of tutte) {
    if (!TIPI[m.tipo]) g.push(`${m.id}: tipo «${m.tipo}» sconosciuto`)
    if (!m.nome) g.push(`${m.id}: senza nome`)
    if (m.tipo === 'incantesimo' && !INCANTESIMO_DI[m.elemento]) g.push(`${m.id}: incantesimo senza elemento`)
    if (m.tipo === 'cura' && !(m.quota > 0 && m.quota <= 0.15)) g.push(`${m.id}: cura del ${Math.round(m.quota * 100)}%, fuori da 1..15%`)
  }
  return g
}
