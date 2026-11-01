// Le sagome in scena (docs/sotterraneo/sagome-3d.md): dove un mostro o una persona non ha il modello (oltre il tetto dei modelli,
// lontano, un modello che si rompe) si mette la foto del suo modello (dati/sagome-fatte.js), dalla direzione e nella posa che il
// modello avrebbe adesso, su un cartello in piedi. Tutte in UN InstancedMesh (figure.js) con un atlante solo: una chiamata per tutte.
// L'atlante si carica a parte quando il 3D parte; finché non c'è, o per un modello senza foto, il posto resta vuoto.
import { Texture, SRGBColorSpace, NoColorSpace, LinearFilter } from 'three'
import { creaFigure } from './figure.js'
import { CONTORNO_PELLE } from './salda3d.js'
import { ALLUNGA, PIXEL_CELLA } from './costanti.js'
import { POSE_MOSTRO, POSE_PERSONA, cartelloDi, direzioneDi, posaDi } from './sagome-pura.js'

// `#sagome=accanto` nell'indirizzo: chi ha il modello ha anche la sua sagoma una cella e mezza a destra, per confrontarli (le prove)
export const ACCANTO = typeof location !== 'undefined' && /[#&?]sagome=accanto\b/.test(location.hash + location.search) ? 1.5 : 0

let carica = null
const ottieni = () => (carica ||= import('../dati/sagome-fatte.js').catch(() => null))

/**
 * `maschera`: quella delle figure (maschera.js; sopra, `mascheraPiena`). `max`: quante sagome al più nello stesso fotogramma.
 * → { pronta, ha(id), alto(id, k), inizia(), metti(id, p), chiudi(), trova(raggio), via() }
 */
export function creaSagome(scena, { maschera, max = 96 } = {}) {
  let figure = null, chiuso = false, tex = null, norm = null
  const indice = new Map()   // id → { base (il primo pezzo), s (la voce di SAGOME) }
  const c = {}
  ottieni().then(m => {
    if (!m || chiuso) return
    const img = new Image(), imgN = new Image()
    let pronte = 0
    const tutte = () => {
      if (++pronte < 2 || chiuso) return
      const pezzi = []
      for (const [id, s] of Object.entries(m.SAGOME)) {
        indice.set(id, { base: pezzi.length, s })
        for (const f of s.f) pezzi.push([f[0], f[1], Math.abs(f[2]), f[3]])
      }
      tex = new Texture(img); tex.colorSpace = SRGBColorSpace; tex.magFilter = tex.minFilter = LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true
      // le normali del modello, fotografate con lui a metà misura: il cartello prende la luce della scena come il modello
      norm = new Texture(imgN); norm.colorSpace = NoColorSpace; norm.magFilter = norm.minFilter = LinearFilter; norm.generateMipmaps = false; norm.needsUpdate = true
      figure = creaFigure(scena, { tex, norm, larga: m.LARGO, alta: m.ALTO, pezzi, maschera, max, ombra: false, foto: CONTORNO_PELLE })
    }
    img.onload = imgN.onload = tutte
    img.src = m.IMMAGINE; imgN.src = m.NORMALI
  })
  return {
    get pronta() { return !!figure },
    get quante() { return figure ? figure.quante : 0 },
    get mesh() { return figure ? figure.mesh : null },
    /** C'è la foto di questo modello? (finché l'atlante non è arrivato, no) */
    ha: id => indice.has(id),
    /** La scatola a riposo del modello (per la misura, sagome-pura.js scalaDelModello), o null. */
    scatola(id) { const e = indice.get(id); return e ? e.s : null },
    inizia() { if (figure) figure.inizia() },
    /**
     * Una sagoma. `p`: { x, y, z (i piedi), k (la scala del modello in scena), yaw, t (il respiro, con la sua fase), attacco (0..1 o
     * −1), arrivo, haColpo, caduto (0..1), persona, bianco, tinta ([r, g, b] additivo), trasparenza, cosa (per il dito) }. Vero se c'è.
     */
    metti(id, p) {
      const e = figure && indice.get(id)
      if (!e) return false
      const np = p.persona ? POSE_PERSONA : POSE_MOSTRO
      const i = direzioneDi(p.yaw || 0) * np + posaDi(p)
      const f = e.s.f[i]
      if (!f) return false
      cartelloDi(f, p.k, e.s.px, 1 / ALLUNGA, c)
      const o = figure.o()
      o.scala = p.k / e.s.px * PIXEL_CELLA   // un pixel della foto è k/px celle; in alto allungato per la vista di adesso, come gli sprite
      o.specchio = f[2] < 0
      o.bianco = p.bianco || 0
      if (p.tinta) { o.rosso = p.tinta[0]; o.verde = p.tinta[1]; o.blu = p.tinta[2] }
      o.trasparenza = p.trasparenza ?? 1
      o.cosa = p.cosa || null
      return figure.metti(e.base + i, p.x + c.dx, (p.y || 0) + c.y, p.z + c.dz, o) >= 0
    },
    chiudi() { if (figure) figure.chiudi() },
    trova(raggio) { return figure ? figure.trova(raggio) : null },
    via() { chiuso = true; if (figure) figure.via(); if (tex) tex.dispose(); if (norm) norm.dispose() },
  }
}
