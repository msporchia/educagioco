// Le persone del mondo di sopra come modelli 3D (docs/sotterraneo/persone-3d.md): il personaggio di `persone3d/` (dati/persone3d.js).
// Una riserva per modello, riusata come quella dei mostri (mostro3d.js): a ogni fotogramma `inizia`, una `metti` per persona, `chiudi`
// nasconde chi nessuno ha preso. Un modello che si rompe, e chi è lontano, hanno la sagoma del modello (sagome.js, `console.warn`);
// `#persone2d` nell'indirizzo li mette tutti in sagoma.
import { Group } from 'three'
import { creaPersona, CHIAVI } from './persone3d/persone.js'
import { verso } from './tempo.js'
import { daSola, rifai } from './matrici.js'
import { RAPPORTO } from './sagome-pura.js'

export const persone3dAccese = () => typeof location === 'undefined' || !/[#&?]persone2d\b/.test(location.hash + location.search)

// alta RAPPORTO volte il suo posto (dati/altezze.js), come l'eroe e i mostri; la misura è `userData.altezza` del modello (la figura
// senza lancia, canna e zaino)
const GUARDA = 6            // celle: più vicino di così l'eroe, la persona si gira verso di lui (come il saluto di Mondo3d.vue)

/** Dove guarda una persona (il giro attorno a y), smussato nel suo stato `s`: l'eroe quando è vicino, se no la telecamera. Lo usano il
 *  modello e la sua sagoma. `p`: { x, z, eroe: {x, z}, dt } */
export function giraLaPersona(s, p) {
  const dx = p.eroe.x - p.x, dz = p.eroe.z - p.z, d = Math.hypot(dx, dz)
  const meta = d < GUARDA && d > 0.05 ? Math.atan2(dx, dz + d * 0.3) : 0
  let a = meta - (s.yaw3d ?? meta); a = Math.atan2(Math.sin(a), Math.cos(a))
  s.yaw3d = (s.yaw3d ?? meta) + a * verso(p.dt || 0, 5)
  return s.yaw3d
}

/** `scena`: dove si aggiungono. `quanti()`: quanti modelli al più nello stesso fotogramma (i più vicini all'eroe). */
export function creaPersone3d(scena, { quanti = () => 8, ozio = 0 } = {}) {
  const riserve = new Map(), guasti = new Set()
  let usate = 0, prossimoOzio = 0

  function nuova(modello) {
    try {
      const g = creaPersona(modello)
      g.traverse(o => { if (o.isMesh) o.castShadow = false })   // come l'eroe 3D: l'ombra morbida a terra la mette chi disegna
      const radice = daSola(new Group()); radice.visible = false; radice.add(g); scena.add(radice)
      return { modello, g, radice, presa: false, chi: null, alto: g.userData.altezza || 1 }
    } catch (e) { guasti.add(modello); console.warn(`persone 3D: ${modello} non si costruisce, resta la sagoma`, e); return null }
  }
  function prendi(s, modello) {
    if (s.p3d && s.p3d.modello === modello) { s.p3d.presa = true; return s.p3d }
    if (s.p3d) { s.p3d.chi = null; s.p3d = null }
    let lista = riserve.get(modello)
    if (!lista) riserve.set(modello, lista = [])
    let ist = lista.find(i => !i.chi && !i.presa)
    if (!ist) { ist = nuova(modello); if (!ist) return null; lista.push(ist) }
    ist.chi = s; ist.presa = true; s.p3d = ist
    return ist
  }

  return {
    /** Il modello c'è (e non s'è rotto)? */
    ha: modello => !!modello && CHIAVI.includes(modello) && !guasti.has(modello),
    get pieno() { return usate >= quanti() },
    inizia() { usate = 0; for (const l of riserve.values()) for (const i of l) i.presa = false },
    /**
     * Una persona. `s`: il suo stato di disegno (resta suo fra un fotogramma e l'altro). `p`: { x, y, z, alto (il posto, in celle,
     * allungato per la vista), eroe: {x, z}, t, dt, saluta (sta salutando adesso) }. Torna false se resta la sagoma.
     */
    metti(s, modello, p) {
      if (usate >= quanti() || !this.ha(modello)) return false
      const ist = prendi(s, modello)
      if (!ist) return false
      ist.usata = performance.now()
      usate++
      const { g, radice } = ist, u = g.userData
      try {
        radice.scale.setScalar((p.alto || 1.6) * RAPPORTO / ist.alto)
        radice.rotation.set(0, giraLaPersona(s, p), 0)
        const tt = p.t + (s.fase3d ??= Math.random() * 9)
        if (p.saluta && !s.saluta3d) u.saluta(tt)   // il saluto parte quando Mondo3d.vue lo accende, e il modello lo finisce da sé
        s.saluta3d = !!p.saluta
        u.anima(tt)
        radice.position.set(p.x, p.y || 0, p.z)
        radice.visible = true
        rifai(radice)
      } catch (e) {
        guasti.add(modello); radice.visible = false; ist.chi = null; s.p3d = null; usate--
        console.warn(`persone 3D: ${modello} si rompe animando, resta la sagoma`, e)
        return false
      }
      return true
    },
    chiudi() {
      for (const l of riserve.values()) for (const i of l) if (!i.presa) { i.radice.visible = false; if (i.chi) { i.chi.p3d = null; i.chi = null } }
      // `ozio` (s): chi non si vede da tanto si butta, come i mostri di sopra (mostro3d.js); le geometrie che nessun altro usa con lui
      if (ozio && performance.now() > prossimoOzio) {
        prossimoOzio = performance.now() + Math.min(2000, ozio * 500)
        const fino = performance.now() - ozio * 1000, via = [], tenute = new Set()
        for (const [k, l] of riserve) {
          const resta = l.filter(i => i.chi || (i.usata || 0) > fino)
          for (const i of l) if (!resta.includes(i)) via.push(i)
          if (resta.length) riserve.set(k, resta); else riserve.delete(k)
          for (const i of resta) i.g.traverse(o => { if (o.geometry) tenute.add(o.geometry) })
        }
        for (const i of via) {
          scena.remove(i.radice)
          i.g.traverse(o => { if (o.geometry && !tenute.has(o.geometry)) o.geometry.dispose() })
          if (i.g.userData.scheletro) i.g.userData.scheletro.dispose()
        }
      }
    },
    get visibili() { return usate },
    get quante() { let n = 0; for (const l of riserve.values()) n += l.length; return n },
    via() { for (const l of riserve.values()) for (const i of l) scena.remove(i.radice); riserve.clear() },
  }
}
