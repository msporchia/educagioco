// L'eroe come modello 3D (in prova): al posto dello sprite, uno dei quattro personaggi di `eroi3d/` (cavaliere, elfa, mago, nano) con
// le armi dell'inventario in mano. `disegnaEroe` (eroe.js) gli passa lo stato (dove sta, dove guarda, se cammina, se assalta, il lampo
// della ferita o della cura, la trasparenza del portale) e lui muove i perni. Spento con `#eroe2d` nell'indirizzo: torna lo sprite.
import { Vector3, Color, Group, Box3 } from 'three'
import { creaEroe, posaMarcia, posaColpo, posaGuardia, CHIAVI } from './eroi3d/eroi.js'
import { equipaggia } from './eroi3d/armi.js'
import { creaDaId } from './eroi3d/collezione.js'
import { vesti, TIPI } from './eroi3d/armature.js'
import { copri } from './eroi3d/copricapi.js'
import { COSE } from '../dati/cose.js'

export const eroe3dAcceso = () => typeof location === 'undefined' || !/[#&?]eroe2d\b/.test(location.hash + location.search)

// quanto è alto il personaggio rispetto allo sprite che sostituisce (le colonne dei sotterranei arrivano più o meno lì)
const ALTEZZA_SPRITE = 0.72
const ROSSO = new Color(1, 0.18, 0.12), VERDE = new Color(0.3, 1, 0.55)
const _v = new Vector3()
// quale modello 3D (eroi3d/collezione.js) per quale oggetto dell'inventario; chi non c'è prende quello della sua famiglia
const MODELLO_DI = {
  'spada-corta': 'spada-corta', spada: 'spada-lunga', spadone: 'due-mani', sciabola: 'scimitarra', 'spada-del-ladro': 'stocco',
  'pugnale-vampiro': 'pugnale', 'spada-di-ghiaccio': 'lama-ghiaccio',
  accetta: 'accetta', ascia: 'ascia-guerra', scure: 'scure', bipenne: 'bipenne', mannaia: 'ascia-vichinga', 'bipenne-solare': 'ascia-lava',
  'arco-corto': 'arco-corto', 'arco-lungo': 'arco-lungo', balestra: 'balestra',
  verga: 'bacchetta-legno', 'bastone-magico': 'bastone-nodoso', scettro: 'scettro',
  mazza: 'scure', martello: 'ascia-guerra',
  'scudo-legno': 'rotella', 'scudo-borchiato': 'scudo-goccia', 'scudo-ferro': 'scudo-rotondo', 'scudo-crociato': 'scudo-cavaliere',
  'scudo-leone': 'scudo-nanico', 'scudo-teschio': 'scudo-ombra',
}
const PER_FAMIGLIA = { spade: 'spada-corta', asce: 'accetta', archi: 'arco-corto', bacchette: 'bacchetta-legno' }

/** Ogni istanza ha i suoi materiali (il lampo cambia l'emissivo di uno solo); torna l'elenco per tingerli. */
function clonaMateriali(radice) {
  const nuovi = new Map(), lista = []
  radice.traverse(o => {
    if (!o.isMesh) return
    const m = o.material
    if (!nuovi.has(m)) { const c = m.clone(); nuovi.set(m, c); lista.push({ m: c, e: c.emissive.clone(), ei: c.emissiveIntensity, tr: c.transparent, op: c.opacity }) }
    o.material = nuovi.get(m)
    o.castShadow = false                                 // l'ombra del cono è per le pareti; l'eroe non ne fa (come lo sprite)
  })
  return lista
}

/** `scena`: dove si aggiunge. Torna `{ aggiorna(...), toglie() }`. */
export function creaEroe3d(scena) {
  const radice = new Group(); radice.visible = false; scena.add(radice)
  let chiave = null, g = null, tinte = [], arma = null, altezza = 1, firma = '', ultimaTinta = ''

  function monta(corsa) {
    if (g) radice.remove(g)
    g = creaEroe(chiave); radice.add(g)
    firma = ''; equipa(corsa)
    // l'altezza vera, cappello compreso: il mago è più alto del cavaliere e non deve sbucare sopra le colonne
    altezza = new Box3().setFromObject(g).getSize(new Vector3()).y || 1
    if (typeof window !== 'undefined') (window.__eroe3dAltezze = window.__eroe3dAltezze || {})[chiave] = altezza
  }

  function equipa(corsa) {
    const f = `${corsa.mano || ''}|${corsa.mancina || ''}|${corsa.corpo || ''}`
    if (f === firma) return
    firma = f
    if (arma) arma(); arma = null
    const mano = COSE[String(corsa.mano || '').split('@')[0]] || {}
    const dotazione = { destra: null, sinistra: null }
    const base = k => String(k || '').split('@')[0]
    const idMano = MODELLO_DI[base(corsa.mano)] || PER_FAMIGLIA[mano.famiglia]
    if (corsa.mano && idMano) {
      const a = creaDaId(idMano)
      // l'arco si tiene nella sinistra, il resto nella destra
      if (mano.famiglia === 'archi') dotazione.sinistra = a; else dotazione.destra = a
    }
    if (corsa.mancina && mano.famiglia !== 'archi' && mano.mani !== 2) dotazione.sinistra = creaDaId(MODELLO_DI[base(corsa.mancina)] || 'rotella')
    const togliArma = equipaggia(g, dotazione)
    // l'armatura che ha addosso: il pezzo giusto per l'oggetto (un oggetto con «@» è uno dei pregiati, il pregio sale)
    const tipo = base(corsa.corpo)
    const togliCorpo = TIPI.includes(tipo) ? vesti(g, tipo, String(corsa.corpo).includes('@') ? 2 : 1) : null
    // lo slot testa non esiste ancora nel gioco: per guardare gli elmi e i cappelli basta `#testa=elmo-cornuto` nell'indirizzo
    const idTesta = (/[#&?]testa=([\w-]+)/.exec(typeof location === 'undefined' ? '' : location.hash + location.search) || [])[1]
    const togliTesta = idTesta ? copri(g, idTesta) : null
    arma = () => { togliArma(); if (togliCorpo) togliCorpo(); if (togliTesta) togliTesta() }
    tinte = clonaMateriali(g)
    ultimaTinta = ''
  }

  return {
    get altezza() { return altezza },
    /** Un passo. `p`: { x, z, trasparenza, dt, t, alto } con `alto` quanto è alto lo sprite che sostituisce (per la scala). */
    aggiorna(e, corsa, { x, z, trasparenza, dt, alto }) {
      const nuova = CHIAVI.includes(corsa.io && corsa.io.sprite) ? corsa.io.sprite : 'cavaliere'
      if (nuova !== chiave) { chiave = nuova; monta(corsa) } else equipa(corsa)
      radice.visible = trasparenza > 0.02
      const k = (alto || 1.4) * ALTEZZA_SPRITE / altezza
      radice.scale.setScalar(k)
      radice.position.set(x, 0, z)
      g.rotation.y = Math.atan2(e.lx, e.lz)
      // le pose: guardia di fondo; se cammina la marcia sulle gambe e sulle braccia; se assalta il colpo
      posaGuardia(g, e.t * 0.12)
      if (e.cammina) posaMarcia(g, e.t * 0.9)
      if (e.assalto) posaColpo(g, Math.min(1, e.assalto.t / Math.max(0.01, e.assalto.picco)))
      if (g.userData.anima) g.userData.anima(e.t * 0.12)
      if (g.userData.animaArmatura) g.userData.animaArmatura(e.t * 0.12)
      // il lampo
      const rosso = Math.min(1, e.colpito * 2), verde = Math.min(1, e.cura * 1.2)
      const tinta = `${rosso.toFixed(2)}|${verde.toFixed(2)}|${trasparenza.toFixed(2)}`
      if (tinta !== ultimaTinta) {
        ultimaTinta = tinta
        for (const t of tinte) {
          t.m.emissive.copy(t.e)
          if (rosso > 0) { t.m.emissive.lerp(ROSSO, rosso); t.m.emissiveIntensity = t.ei + rosso * 0.9 }
          else if (verde > 0) { t.m.emissive.lerp(VERDE, verde * 0.8); t.m.emissiveIntensity = t.ei + verde * 0.7 }
          else t.m.emissiveIntensity = t.ei
          const tr = trasparenza < 1
          t.m.transparent = t.tr || tr; t.m.opacity = tr ? t.op * trasparenza : t.op
        }
      }
      radice.updateMatrixWorld(true)
    },
    /** Dov'è la mano sinistra nel mondo (per la torcia). */
    manoSinistra(fuori) {
      const b = g && g.userData.bracci[0]
      if (!b) return null
      b.localToWorld(_v.set(0, -0.3, 0.04))
      return fuori ? fuori.copy(_v) : _v.clone()
    },
    toglie() { scena.remove(radice) },
  }
}
